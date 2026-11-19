import type { Metadata } from "next";
import TodayScreen from "@/components/today/TodayScreen";

export const metadata: Metadata = {
  title: "오늘의 운세 — 무료",
  description: "생년월일을 넣으면 오늘의 일진과의 관계로 하루의 흐름·행운의 색·숫자까지 무료로 알려 드려요.",
};

export default function TodayPage() {
  return <TodayScreen />;
}
