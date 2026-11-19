"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthChip from "@/components/auth/AuthChip";
import BottomTabs from "@/components/kid/BottomTabs";
import CoinBadge from "@/components/kid/CoinBadge";
import KidFooter from "@/components/kid/KidFooter";
import { refreshWallet, useWallet } from "@/components/kid/useWallet";
import { COIN_PACKAGES, won, type CoinPackage } from "@/lib/coins";
import { isTossConfigured } from "@/lib/env";

interface CreateResponse {
  orderId: string;
  amount: number;
  coins: number;
  orderName: string;
  mode: "test" | "live";
  clientKey: string;
}

export default function ChargeScreen() {
  const search = useSearchParams();
  const wallet = useWallet();
  const [selected, setSelected] = useState<string>(
    COIN_PACKAGES.find((pack) => pack.recommended)?.id ?? COIN_PACKAGES[0].id,
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState<{ coins: number; balance: number } | null>(null);

  const next = search?.get("next") || "/";

  useEffect(() => {
    void refreshWallet();
  }, []);

  const pack = COIN_PACKAGES.find((item) => item.id === selected) ?? COIN_PACKAGES[0];

  const startPayment = useCallback(async (target: CoinPackage) => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: target.id }),
      });
      const data = (await response.json().catch(() => ({}))) as Partial<CreateResponse> & {
        message?: string;
      };

      if (!response.ok || !data.orderId) {
        setMessage(data.message ?? "주문을 만들지 못했어요.");
        return;
      }

      /* ---------------------------------------------- 실결제: 토스 결제창 */
      if (data.mode === "live" && data.clientKey) {
        const { loadTossPayments, ANONYMOUS } = await import("@tosspayments/tosspayments-sdk");
        const tossPayments = await loadTossPayments(data.clientKey);
        const payment = tossPayments.payment({ customerKey: ANONYMOUS });
        await payment.requestPayment({
          method: "CARD",
          amount: { currency: "KRW", value: data.amount ?? target.priceKrw },
          orderId: data.orderId,
          orderName: data.orderName ?? `운세 한 스푼 ${target.label}`,
          successUrl: `${window.location.origin}/charge/success`,
          failUrl: `${window.location.origin}/charge/fail`,
        });
        return;
      }

      /* ------------------------------------- 테스트 결제 모드(심사 전 시뮬레이션) */
      const confirm = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: data.orderId,
          paymentKey: `test_${data.orderId}`,
          amount: data.amount ?? target.priceKrw,
        }),
      });
      const confirmed = (await confirm.json().catch(() => ({}))) as {
        ok?: boolean;
        coins?: number;
        balance?: number;
        message?: string;
      };

      if (!confirm.ok || !confirmed.ok) {
        setMessage(confirmed.message ?? "테스트 결제를 완료하지 못했어요.");
        return;
      }

      setDone({
        coins: confirmed.coins ?? target.coins,
        balance: confirmed.balance ?? 0,
      });
      await refreshWallet();
    } catch (caught) {
      setMessage(
        caught instanceof Error
          ? caught.message
          : "결제를 시작하지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <>
      <main className="app app--kid">
        <header className="kid-topbar">
          <Link className="kid-back" href="/" prefetch={false} aria-label="홈으로">
            ←
          </Link>
          <Link className="kid-brand kid-brand--small" href="/" prefetch={false}>
            <span className="kid-brand__mark" aria-hidden="true">✦</span>
            <b>코인 충전</b>
          </Link>
          <div className="kid-topbar__right">
            <CoinBadge />
            <AuthChip />
          </div>
        </header>

        <section className="wallet-card">
          <p className="wallet-card__label">보유 코인</p>
          {wallet.loggedIn ? (
            <p className="wallet-card__value">
              🪙 <b>{wallet.balance}</b>
              <span>코인</span>
            </p>
          ) : (
            <p className="wallet-card__value wallet-card__value--muted">로그인 후 확인</p>
          )}
          <p className="wallet-card__hint">
            {wallet.loggedIn
              ? "1코인 = 990원 · 충전한 코인은 잠금해제에 써요"
              : "카카오로 로그인하면 코인을 충전하고 바로 쓸 수 있어요"}
          </p>
        </section>

        {done ? (
          <section className="card charge-done">
            <p className="charge-done__emoji" aria-hidden="true">🎉</p>
            <h3>{done.coins}코인이 충전됐어요!</h3>
            <p className="body">
              현재 보유 코인 {done.balance}개. 이제 원하는 리포트를 열어 보세요.
            </p>
            <Link className="btn btn--primary btn--full" href={next} prefetch={false}>
              리포트 열러 가기
              <span className="btn__arrow">→</span>
            </Link>
            <Link className="btn btn--soft btn--full" href="/charge" prefetch={false}>
              코인 더 충전하기
            </Link>
          </section>
        ) : (
          <>
            <section className="charge-grid" aria-label="충전 상품">
              {COIN_PACKAGES.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`charge-pack${selected === item.id ? " is-selected" : ""}`}
                  onClick={() => setSelected(item.id)}
                  aria-pressed={selected === item.id}
                >
                  {item.recommended ? <span className="charge-pack__flag">추천</span> : null}
                  <span className="charge-pack__coins">🪙 {item.coins}</span>
                  <span className="charge-pack__price">{won(item.priceKrw)}</span>
                  {item.bonus ? <span className="charge-pack__bonus">{item.bonus}</span> : null}
                  <span className="charge-pack__unit">
                    1코인 {Math.round(item.priceKrw / item.coins).toLocaleString("ko-KR")}원
                  </span>
                </button>
              ))}
            </section>

            {message ? (
              <p className="form__error" role="alert">
                {message}
              </p>
            ) : null}

            {!wallet.loggedIn ? (
              <>
                <Link
                  className="btn btn--primary btn--full btn--pay"
                  href={`/login?next=${encodeURIComponent("/charge")}`}
                  prefetch={false}
                >
                  카카오로 로그인하고 충전하기
                  <span className="btn__arrow">→</span>
                </Link>
                <p className="charge-testmode">
                  왼쪽 위 <b>코인</b> 배지와 이 화면에서 언제든 충전할 수 있어요. 로그인하면
                  보유 코인이 표시됩니다.
                </p>
              </>
            ) : (
              <>
                <button
                  className="btn btn--primary btn--full btn--pay"
                  type="button"
                  onClick={() => void startPayment(pack)}
                  disabled={busy}
                >
                  {busy ? "결제 중…" : `${won(pack.priceKrw)} 결제하고 ${pack.coins}코인 받기`}
                </button>

                {!isTossConfigured ? (
                  <p className="charge-testmode">
                    지금은 <b>테스트 결제 모드</b>예요. 실제 카드 승인 없이 주문 → 승인 → 코인
                    적립 흐름을 그대로 확인할 수 있어요. 토스페이먼츠 실키를 넣으면 바로
                    실결제로 전환됩니다.
                  </p>
                ) : null}
              </>
            )}

            <ul className="charge-notice">
              <li>결제 수단: 신용·체크카드, 카카오페이 등 (토스페이먼츠 결제창)</li>
              <li>충전한 코인은 잠금해제에만 쓰이며, 현금으로 환급되지 않아요.</li>
              <li>리포트를 연 뒤에는 디지털 콘텐츠 특성상 청약철회가 제한됩니다.</li>
            </ul>
          </>
        )}

        <KidFooter />
      </main>
      <BottomTabs />
    </>
  );
}
