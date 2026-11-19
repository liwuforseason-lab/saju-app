import { Suspense } from "react";
import type { Metadata } from "next";
import ChargeScreen from "@/components/charge/ChargeScreen";

export const metadata: Metadata = {
  title: "코인 충전 — 990원부터",
  description: "코인을 충전해 사주·신년운세·연애운·궁합·대운·연운 리포트를 열어 보세요.",
};

export default function ChargePage() {
  return (
    <Suspense fallback={<div className="screen-loading">충전 화면을 준비하고 있어요…</div>}>
      <ChargeScreen />
    </Suspense>
  );
}
