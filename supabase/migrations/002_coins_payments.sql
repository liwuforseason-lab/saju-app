-- ==========================================================================
--  002 — 코인 지갑 · 결제 주문 · 잠금해제 (토스페이먼츠 연동)
--  Supabase 대시보드 > SQL Editor 에서 이 파일을 실행하세요.
--  여러 번 실행해도 안전합니다(if not exists / create or replace).
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1. 코인 지갑 (사용자당 1행)
-- --------------------------------------------------------------------------
create table if not exists public.coin_wallets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance int not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

drop trigger if exists coin_wallets_updated_at on public.coin_wallets;
create trigger coin_wallets_updated_at
  before update on public.coin_wallets
  for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- 2. 코인 충전 주문
--    status: pending(생성) → paid(승인·적립) / failed / canceled
--    mode:   test(PG 심사 전 시뮬레이션) / live(실결제)
-- --------------------------------------------------------------------------
create table if not exists public.coin_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  order_id text not null unique,
  package_id text not null,
  amount_krw int not null check (amount_krw >= 0),
  coins int not null check (coins > 0),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'canceled')),
  payment_key text,
  mode text not null default 'test' check (mode in ('test', 'live')),
  fail_reason text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists coin_orders_user_idx
  on public.coin_orders (user_id, created_at desc);
create index if not exists coin_orders_status_idx
  on public.coin_orders (status, created_at desc);

-- --------------------------------------------------------------------------
-- 3. 유료 리포트 잠금해제 기록 (같은 리포트는 한 번만 과금)
-- --------------------------------------------------------------------------
create table if not exists public.unlocked_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  report_type text not null,
  target_key text not null,
  coins_spent int not null default 1 check (coins_spent >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, report_type, target_key)
);

create index if not exists unlocked_reports_user_idx
  on public.unlocked_reports (user_id, created_at desc);

-- ==========================================================================
--  Row Level Security
--  지갑·주문·잠금해제는 "내 것만 읽기". 쓰기는 아래 SECURITY DEFINER 함수/서버만.
-- ==========================================================================
alter table public.coin_wallets enable row level security;
alter table public.coin_orders enable row level security;
alter table public.unlocked_reports enable row level security;

drop policy if exists "coin_wallets_select_own" on public.coin_wallets;
create policy "coin_wallets_select_own"
  on public.coin_wallets for select
  using (auth.uid() = user_id);

drop policy if exists "coin_orders_select_own" on public.coin_orders;
create policy "coin_orders_select_own"
  on public.coin_orders for select
  using (auth.uid() = user_id);

drop policy if exists "unlocked_reports_select_own" on public.unlocked_reports;
create policy "unlocked_reports_select_own"
  on public.unlocked_reports for select
  using (auth.uid() = user_id);

-- ==========================================================================
--  함수
-- ==========================================================================

-- (1) 잔액 보장: 없으면 0원 지갑 생성
create or replace function public.coin_wallet_ensure(p_user uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance int;
begin
  insert into public.coin_wallets (user_id, balance)
    values (p_user, 0)
  on conflict (user_id) do nothing;

  select balance into v_balance from public.coin_wallets where user_id = p_user;
  return coalesce(v_balance, 0);
end;
$$;

-- (2) 코인 적립 — 결제 승인 서버(서비스 롤)만 호출
create or replace function public.coin_credit(p_user uuid, p_coins int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance int;
begin
  if p_coins is null or p_coins < 1 then
    raise exception 'invalid_coins' using errcode = '22023';
  end if;

  insert into public.coin_wallets (user_id, balance)
    values (p_user, 0)
  on conflict (user_id) do nothing;

  update public.coin_wallets
    set balance = balance + p_coins, updated_at = now()
    where user_id = p_user
    returning balance into v_balance;

  return v_balance;
end;
$$;

-- (3) 주문 확정 — 결제 승인 결과를 주문에 반영하고 코인을 적립 (서비스 롤 전용)
--     같은 주문이 두 번 확정돼도 코인은 한 번만 적립됩니다.
create or replace function public.finalize_coin_order(
  p_order_id text,
  p_payment_key text,
  p_paid boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.coin_orders;
  v_balance int;
begin
  select * into v_order
    from public.coin_orders
    where order_id = p_order_id
    for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'order_not_found');
  end if;

  if v_order.status = 'paid' then
    select balance into v_balance from public.coin_wallets where user_id = v_order.user_id;
    return jsonb_build_object(
      'ok', true, 'already', true,
      'coins', v_order.coins,
      'balance', coalesce(v_balance, 0)
    );
  end if;

  if not p_paid then
    update public.coin_orders
      set status = 'failed', fail_reason = 'payment_not_approved'
      where id = v_order.id and status = 'pending';
    return jsonb_build_object('ok', false, 'error', 'payment_not_approved');
  end if;

  update public.coin_orders
    set status = 'paid', payment_key = p_payment_key, paid_at = now()
    where id = v_order.id;

  update public.coin_wallets
    set balance = balance + v_order.coins, updated_at = now()
    where user_id = v_order.user_id
    returning balance into v_balance;

  if v_balance is null then
    insert into public.coin_wallets (user_id, balance)
      values (v_order.user_id, v_order.coins)
      returning balance into v_balance;
  end if;

  return jsonb_build_object(
    'ok', true, 'already', false,
    'coins', v_order.coins,
    'balance', v_balance
  );
end;
$$;

-- (4) 리포트 잠금해제 — 로그인 사용자가 자기 코인으로만 결제 (원자적 차감)
create or replace function public.coin_unlock(
  p_report_type text,
  p_target_key text,
  p_coins int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_balance int;
begin
  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'unauthorized');
  end if;

  if p_report_type is null or length(p_report_type) = 0
     or p_target_key is null or length(p_target_key) = 0 then
    return jsonb_build_object('ok', false, 'error', 'invalid_target');
  end if;

  if p_coins is null or p_coins < 1 or p_coins > 50 then
    return jsonb_build_object('ok', false, 'error', 'invalid_coins');
  end if;

  if exists (
    select 1 from public.unlocked_reports
    where user_id = v_user
      and report_type = p_report_type
      and target_key = p_target_key
  ) then
    select balance into v_balance from public.coin_wallets where user_id = v_user;
    return jsonb_build_object(
      'ok', true, 'already', true, 'balance', coalesce(v_balance, 0)
    );
  end if;

  insert into public.coin_wallets (user_id, balance)
    values (v_user, 0)
  on conflict (user_id) do nothing;

  update public.coin_wallets
    set balance = balance - p_coins, updated_at = now()
    where user_id = v_user and balance >= p_coins
    returning balance into v_balance;

  if v_balance is null then
    select balance into v_balance from public.coin_wallets where user_id = v_user;
    return jsonb_build_object(
      'ok', false, 'error', 'insufficient', 'balance', coalesce(v_balance, 0)
    );
  end if;

  insert into public.unlocked_reports (user_id, report_type, target_key, coins_spent)
    values (v_user, p_report_type, p_target_key, p_coins)
  on conflict (user_id, report_type, target_key) do nothing;

  return jsonb_build_object(
    'ok', true, 'already', false, 'balance', v_balance
  );
end;
$$;

-- (5) 사이트 누적 지표 (홈 카운터용 · 집계값만 공개)
create or replace function public.site_stats()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'readings', (select count(*) from public.saju_readings),
    'users', (select count(*) from auth.users),
    'unlocks', (select count(*) from public.unlocked_reports),
    'coins', (select coalesce(sum(coins), 0) from public.coin_orders where status = 'paid')
  );
$$;

-- ==========================================================================
--  실행 권한
--  - coin_credit / finalize_coin_order / coin_wallet_ensure: service_role 전용
--  - coin_unlock: 로그인 사용자(자기 코인만 차감)
--  - site_stats: 누구나(집계값)
-- ==========================================================================
revoke all on function public.coin_credit(uuid, int) from public;
revoke all on function public.coin_credit(uuid, int) from anon, authenticated;
grant execute on function public.coin_credit(uuid, int) to service_role;

revoke all on function public.finalize_coin_order(text, text, boolean) from public;
revoke all on function public.finalize_coin_order(text, text, boolean) from anon, authenticated;
grant execute on function public.finalize_coin_order(text, text, boolean) to service_role;

revoke all on function public.coin_wallet_ensure(uuid) from public;
revoke all on function public.coin_wallet_ensure(uuid) from anon, authenticated;
grant execute on function public.coin_wallet_ensure(uuid) to service_role;

revoke all on function public.coin_unlock(text, text, int) from public;
grant execute on function public.coin_unlock(text, text, int) to authenticated;

revoke all on function public.site_stats() from public;
grant execute on function public.site_stats() to anon, authenticated, service_role;

-- 테이블 권한 (RLS 가 행 단위로 다시 제한합니다)
grant usage on schema public to anon, authenticated;
grant select on public.coin_wallets to authenticated;
grant select on public.coin_orders to authenticated;
grant select on public.unlocked_reports to authenticated;
grant all on public.coin_wallets to service_role;
grant all on public.coin_orders to service_role;
grant all on public.unlocked_reports to service_role;
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
