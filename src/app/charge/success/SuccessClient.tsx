"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import BottomTabs from "@/components/kid/BottomTabs";
import KidFooter from "@/components/kid/KidFooter";
import { refreshWallet } from "@/components/kid/useWallet";

type State =
  | { phase: "working" }
  | { phase: "done"; coins: number; balance: number; already: boolean }
  | { phase: "error"; message: string };

export default function ChargeSuccess() {
  const search = useSearchParams();
  const [state, setState] = useState<State>({ phase: "working" });
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const paymentKey = search?.get("paymentKey") ?? "";
    const orderId = search?.get("orderId") ?? "";
    const amount = Number(search?.get("amount") ?? "0");

    if (!paymentKey || !orderId || !Number.isFinite(amount)) {
      setState({ phase: "error", message: "결제 정보가 없어요. 충전 화면에서 다시 시도해 주세요." });
      return;
    }

    (async () => {
      try {
        const response = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentKey, orderId, amount }),
        });
        const data = (await response.json().catch(() => ({}))) as {
          ok?: boolean;
          coins?: number;
          balance?: number;
          already?: boolean;
          message?: string;
        };
        if (!response.ok || !data.ok) {
          setState({ phase: "error", message: data.message ?? "결제 승인에 실패했어요." });
          return;
        }
        await refreshWallet();
        setState({
          phase: "done",
          coins: data.coins ?? 0,
          balance: data.balance ?? 0,
          already: Boolean(data.already),
        });
      } catch {
        setState({ phase: "error", message: "네트워크 오류로 승인 결과를 확인하지 못했어요." });
      }
    })();
  }, [search]);

  return (
    <>
      <main className="app app--kid">
        <section className="card charge-done" style={{ marginTop: 24 }}>
          {state.phase === "working" ? (
            <>
              <p className="charge-done__emoji" aria-hidden="true">⏳</p>
              <h2>결제를 확인하고 있어요…</h2>
              <p className="body">잠시만 기다려 주세요. 창을 닫지 마세요.</p>
            </>
          ) : state.phase === "done" ? (
            <>
              <p className="charge-done__emoji" aria-hidden="true">🎉</p>
              <h2>{state.coins}코인이 충전됐어요!</h2>
              <p className="body">
                {state.already
                  ? "이미 처리된 주문이에요. 코인은 중복 적립되지 않았습니다."
                  : "결제가 정상 승인되어 코인이 들어왔어요."}{" "}
                현재 보유 코인 <b>{state.balance}개</b>.
              </p>
              <Link className="btn btn--primary btn--full" href="/" prefetch={false}>
                리포트 열러 가기
                <span className="btn__arrow">→</span>
              </Link>
            </>
          ) : (
            <>
              <p className="charge-done__emoji" aria-hidden="true">😢</p>
              <h2>결제를 마치지 못했어요</h2>
              <p className="body">{state.message}</p>
              <Link className="btn btn--primary btn--full" href="/charge" prefetch={false}>
                충전 화면으로 돌아가기
                <span className="btn__arrow">→</span>
              </Link>
            </>
          )}
        </section>
        <KidFooter />
      </main>
      <BottomTabs />
    </>
  );
}
