import { Suspense } from "react";
import type { Metadata } from "next";
import ChargeSuccess from "./SuccessClient";

export const metadata: Metadata = {
  title: "결제 확인",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="screen-loading">결제를 확인하고 있어요…</div>}>
      <ChargeSuccess />
    </Suspense>
  );
}
