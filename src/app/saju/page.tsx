import type { Metadata } from "next";
import SajuApp from "@/components/saju/SajuApp";

export const metadata: Metadata = {
  title: "무료 만세력 사주 — 사주팔자·오행·올해 운세",
  description:
    "태어난 순간의 여덟 글자를 만세력으로 풀어 오행 균형, 일간 성향, 올해 운세와 오늘의 운세까지 무료로 확인하세요. 심화 해설은 1코인으로 열 수 있어요.",
};

export default function SajuPage() {
  return <SajuApp />;
}
