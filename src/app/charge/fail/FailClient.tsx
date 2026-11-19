"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import BottomTabs from "@/components/kid/BottomTabs";
import KidFooter from "@/components/kid/KidFooter";

const MESSAGES: Record<string, string> = {
  PAY_PROCESS_CANCELED: "결제를 취소하셨어요. 코인은 충전되지 않았습니다.",
  PAY_PROCESS_ABORTED: "결제가 중단됐어요. 다시 시도해 주세요.",
  REJECT_CARD_COMPANY: "카드사에서 결제를 거절했어요. 다른 결제 수단으로 시도해 주세요.",
};

export default function ChargeFail() {
  const search = useSearchParams();
  const code = search?.get("code") ?? "";
  const message = search?.get("message") ?? "";
  const orderId = search?.get("orderId") ?? "";

  return (
    <>
      <main className="app app--kid">
        <section className="card charge-done" style={{ marginTop: 24 }}>
          <p className="charge-done__emoji" aria-hidden="true">😢</p>
          <h2>결제가 끝나지 않았어요</h2>
          <p className="body">
            {MESSAGES[code] ?? message ?? "결제를 완료하지 못했어요."}
          </p>
          {orderId ? <p className="charge-fail__order">주문번호 {orderId}</p> : null}
          <Link className="btn btn--primary btn--full" href="/charge" prefetch={false}>
            다시 충전하기
            <span className="btn__arrow">→</span>
          </Link>
          <Link className="btn btn--soft btn--full" href="/" prefetch={false}>
            홈으로
          </Link>
        </section>
        <KidFooter />
      </main>
      <BottomTabs />
    </>
  );
}
