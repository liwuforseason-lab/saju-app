import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="foot">
      <p className="foot__brand">✦ 운세 한 스푼</p>
      <p>
        만세력(절기·음양력) 기준 사주 풀이 · 재미로 보는 운세입니다.
        <br />
        중요한 결정은 스스로의 판단으로 해 주세요.
      </p>
      <p className="foot__links">
        <Link href="/">사주 보기</Link>
        <span>·</span>
        <Link href="/board">궁합 줄세우기</Link>
        <span>·</span>
        <Link href="/privacy">개인정보처리방침</Link>
      </p>
    </footer>
  );
}
