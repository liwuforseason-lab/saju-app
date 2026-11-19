import { Suspense } from "react";
import type { Metadata } from "next";
import ChargeFail from "./FailClient";

export const metadata: Metadata = {
  title: "결제 실패",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="screen-loading">결제 결과를 확인하고 있어요…</div>}>
      <ChargeFail />
    </Suspense>
  );
}
