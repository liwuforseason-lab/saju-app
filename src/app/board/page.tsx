import type { Metadata } from "next";
import BoardApp from "@/components/board/BoardApp";

export const metadata: Metadata = {
  title: "궁합 줄세우기 — 내 사주 궁합 보드",
  description:
    "내 사주를 가운데 두고 친구·연인·최애와의 궁합을 점수 순으로 줄 세워 보세요. 초대 링크로 친구도 바로 참여할 수 있어요.",
  openGraph: {
    title: "내 궁합 줄세우기",
    description: "내 사주와 친구들의 궁합을 순위로. 초대 링크로 함께 채워요.",
  },
};

export default function BoardPage() {
  return <BoardApp />;
}
