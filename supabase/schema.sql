-- ==========================================================================
--  운세 한 스푼 — Supabase 스키마
--  Supabase 대시보드 > SQL Editor 에 이 파일 전체를 붙여 넣고 실행하세요.
--  (여러 번 실행해도 안전하도록 if not exists / drop policy if exists 사용)
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 0. 공통: updated_at 자동 갱신
-- --------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- --------------------------------------------------------------------------
-- 1. 사주 프로필 (내 사주 · 지인 사주)
-- --------------------------------------------------------------------------
create table if not exists public.saju_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default '나',
  relation text not null default 'self'
    check (relation in ('self', 'family', 'friend', 'other')),
  gender text not null default 'n' check (gender in ('n', 'f', 'm')),
  calendar text not null default 'solar' check (calendar in ('solar', 'lunar')),
  is_leap_month boolean not null default false,
  birth_year int not null check (birth_year between 1900 and 2035),
  birth_month int not null check (birth_month between 1 and 12),
  birth_day int not null check (birth_day between 1 and 31),
  birth_time_index int not null default -1
    check (birth_time_index between -1 and 11),
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists saju_profiles_user_idx
  on public.saju_profiles (user_id, updated_at desc);

drop trigger if exists saju_profiles_updated_at on public.saju_profiles;
create trigger saju_profiles_updated_at
  before update on public.saju_profiles
  for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- 2. 사주 풀이 기록
--    kind: basic(기본) / compat(궁합) / deep(심화) / paid(유료)
--    → 향후 유료·심화 풀이를 같은 테이블에 쌓을 수 있도록 설계
-- --------------------------------------------------------------------------
create table if not exists public.saju_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  profile_id uuid references public.saju_profiles (id) on delete set null,
  kind text not null default 'basic'
    check (kind in ('basic', 'compat', 'deep', 'paid')),
  title text,
  summary text,
  input jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  is_paid boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists saju_readings_user_idx
  on public.saju_readings (user_id, created_at desc);
create index if not exists saju_readings_profile_idx
  on public.saju_readings (profile_id);

-- --------------------------------------------------------------------------
-- 3. 궁합 줄세우기 보드 (내가 가운데 · 친구들이 주변)
--    - 보드 주인의 사주를 함께 저장해, 초대 링크만으로 친구가 내 궁합을
--      계산해 볼 수 있습니다. (is_public = true 인 보드만 공개 조회)
-- --------------------------------------------------------------------------
create table if not exists public.compatibility_boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  share_slug text not null unique
    default substring(replace(gen_random_uuid()::text, '-', '') from 1 for 10),
  title text not null default '내 궁합 보드',
  owner_profile_id uuid references public.saju_profiles (id) on delete set null,
  owner_name text not null default '',
  owner_gender text not null default 'n' check (owner_gender in ('n', 'f', 'm')),
  owner_calendar text not null default 'solar'
    check (owner_calendar in ('solar', 'lunar')),
  owner_is_leap_month boolean not null default false,
  owner_birth_year int not null check (owner_birth_year between 1900 and 2035),
  owner_birth_month int not null check (owner_birth_month between 1 and 12),
  owner_birth_day int not null check (owner_birth_day between 1 and 31),
  owner_birth_time_index int not null default -1
    check (owner_birth_time_index between -1 and 11),
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists compatibility_boards_user_idx
  on public.compatibility_boards (user_id, created_at desc);

drop trigger if exists compatibility_boards_updated_at on public.compatibility_boards;
create trigger compatibility_boards_updated_at
  before update on public.compatibility_boards
  for each row execute function public.set_updated_at();

-- --------------------------------------------------------------------------
-- 4. 보드 참여자 (닉네임 + 생년월일 + 계산된 궁합 점수)
-- --------------------------------------------------------------------------
create table if not exists public.board_entries (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.compatibility_boards (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  nickname text not null,
  relation text not null default 'friend'
    check (relation in ('family', 'friend', 'crush', 'bias', 'other')),
  gender text not null default 'n' check (gender in ('n', 'f', 'm')),
  calendar text not null default 'solar' check (calendar in ('solar', 'lunar')),
  is_leap_month boolean not null default false,
  birth_year int not null check (birth_year between 1900 and 2035),
  birth_month int not null check (birth_month between 1 and 12),
  birth_day int not null check (birth_day between 1 and 31),
  birth_time_index int not null default -1
    check (birth_time_index between -1 and 11),
  compat_score int check (compat_score between 0 and 100),
  compat_label text,
  compat_tag text,
  created_at timestamptz not null default now()
);

create index if not exists board_entries_board_idx
  on public.board_entries (board_id, compat_score desc);
create index if not exists board_entries_user_idx
  on public.board_entries (user_id);

-- ==========================================================================
--  Row Level Security
--  모든 테이블: 본인 데이터만 쓰기/지우기. 읽기는 아래 정책 참고.
-- ==========================================================================
alter table public.saju_profiles enable row level security;
alter table public.saju_readings enable row level security;
alter table public.compatibility_boards enable row level security;
alter table public.board_entries enable row level security;

-- ---------- saju_profiles: 본인만 ----------
drop policy if exists "saju_profiles_select_own" on public.saju_profiles;
create policy "saju_profiles_select_own"
  on public.saju_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "saju_profiles_insert_own" on public.saju_profiles;
create policy "saju_profiles_insert_own"
  on public.saju_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "saju_profiles_update_own" on public.saju_profiles;
create policy "saju_profiles_update_own"
  on public.saju_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "saju_profiles_delete_own" on public.saju_profiles;
create policy "saju_profiles_delete_own"
  on public.saju_profiles for delete
  using (auth.uid() = user_id);

-- ---------- saju_readings: 본인만 ----------
drop policy if exists "saju_readings_select_own" on public.saju_readings;
create policy "saju_readings_select_own"
  on public.saju_readings for select
  using (auth.uid() = user_id);

drop policy if exists "saju_readings_insert_own" on public.saju_readings;
create policy "saju_readings_insert_own"
  on public.saju_readings for insert
  with check (auth.uid() = user_id);

drop policy if exists "saju_readings_update_own" on public.saju_readings;
create policy "saju_readings_update_own"
  on public.saju_readings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "saju_readings_delete_own" on public.saju_readings;
create policy "saju_readings_delete_own"
  on public.saju_readings for delete
  using (auth.uid() = user_id);

-- ---------- compatibility_boards ----------
-- 공개 보드는 초대 링크로 누구나 읽을 수 있고, 수정·삭제는 주인만 가능합니다.
drop policy if exists "boards_select_public_or_own" on public.compatibility_boards;
create policy "boards_select_public_or_own"
  on public.compatibility_boards for select
  using (is_public = true or auth.uid() = user_id);

drop policy if exists "boards_insert_own" on public.compatibility_boards;
create policy "boards_insert_own"
  on public.compatibility_boards for insert
  with check (auth.uid() = user_id);

drop policy if exists "boards_update_own" on public.compatibility_boards;
create policy "boards_update_own"
  on public.compatibility_boards for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "boards_delete_own" on public.compatibility_boards;
create policy "boards_delete_own"
  on public.compatibility_boards for delete
  using (auth.uid() = user_id);

-- ---------- board_entries ----------
-- 공개 보드의 참여자 목록은 누구나 읽을 수 있습니다(초대 링크 화면).
drop policy if exists "board_entries_select_public_or_own" on public.board_entries;
create policy "board_entries_select_public_or_own"
  on public.board_entries for select
  using (
    exists (
      select 1 from public.compatibility_boards b
      where b.id = board_entries.board_id
        and (b.is_public = true or b.user_id = auth.uid())
    )
  );

-- 추가는 로그인 사용자가 공개 보드에 자기 이름으로만 (남의 보드에도 참여 가능)
drop policy if exists "board_entries_insert_participant" on public.board_entries;
create policy "board_entries_insert_participant"
  on public.board_entries for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.compatibility_boards b
      where b.id = board_entries.board_id and b.is_public = true
    )
  );

drop policy if exists "board_entries_update_own_or_owner" on public.board_entries;
create policy "board_entries_update_own_or_owner"
  on public.board_entries for update
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.compatibility_boards b
      where b.id = board_entries.board_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "board_entries_delete_own_or_owner" on public.board_entries;
create policy "board_entries_delete_own_or_owner"
  on public.board_entries for delete
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.compatibility_boards b
      where b.id = board_entries.board_id and b.user_id = auth.uid()
    )
  );

-- ==========================================================================
--  API 롤 권한 (Data API: anon / authenticated)
--  테이블 권한이 없으면 PostgREST 가 42501 permission denied 로 막힙니다.
--  RLS 정책은 그대로 적용되므로 행 단위 접근 제어는 변하지 않습니다.
-- ==========================================================================
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
