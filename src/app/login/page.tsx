import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import KakaoLoginButton from "@/components/auth/KakaoLoginButton";
import SiteFooter from "@/components/SiteFooter";
import { isSupabaseConfigured, SUPABASE_SETUP_HINT } from "@/lib/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "로그인",
  description: "카카오 계정으로 로그인하면 내 사주와 궁합 보드를 저장할 수 있어요.",
};

const ERROR_MESSAGES: Record<string, string> = {
  auth: "로그인에 실패했어요. 카카오 계정으로 다시 시도해 주세요.",
  missing_code: "로그인 응답이 도착하지 않았어요. 다시 시도해 주세요.",
  not_configured:
    "지금은 로그인 기능이 준비 중이에요. 사주 풀이는 로그인 없이도 그대로 볼 수 있어요.",
  access_denied: "카카오 로그인을 취소하셨어요. 다시 시도해 주세요.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const nextPath =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (isSupabaseConfigured) {
    const user = await getCurrentUser();
    if (user) redirect(nextPath);
  }

  const message = error ? ERROR_MESSAGES[error] ?? "로그인 중 문제가 생겼어요." : null;

  return (
    <>
      <div className="ambient" aria-hidden="true">
        <span className="ambient__glow ambient__glow--a" />
        <span className="ambient__glow ambient__glow--b" />
      </div>

      <main className="page-shell">
        <header className="topbar">
          <Link className="brand" href="/">
            <span className="brand__mark" aria-hidden="true">
              ✦
            </span>
            <span className="brand__text">운세 한 스푼</span>
          </Link>
          <Link className="auth-chip" href="/">
            사주 보기
          </Link>
        </header>

        <div className="login-hero">
          <picture>
            <source srcSet="/assets/result-mascot.webp" type="image/webp" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="login-hero__art"
              src="/assets/result-mascot.jpg"
              alt="사주 캐릭터"
              width={132}
              height={132}
            />
          </picture>
          <h1>내 사주, 저장해 둘까요?</h1>
          <p>
            카카오로 로그인하면 내 사주와 지인 사주를 보관하고, 궁합 줄세우기 보드를
            친구들과 함께 채울 수 있어요.
          </p>
        </div>

        {message ? (
          <p className="auth-error" role="alert">
            {message}
          </p>
        ) : null}

        {isSupabaseConfigured ? (
          <>
            <KakaoLoginButton next={nextPath} />
            <ul className="kakao-benefits">
              <li>
                <span aria-hidden="true">✦</span> 내 사주·지인 사주를 저장하고 언제든 다시
                열기
              </li>
              <li>
                <span aria-hidden="true">✦</span> 궁합 보드에 친구를 초대해 순위로 보기
              </li>
              <li>
                <span aria-hidden="true">✦</span> 저장한 풀이는 마이페이지에서 직접 삭제
              </li>
            </ul>
            <p className="auth-footnote">
              로그인 없이도 사주 풀이는 무료로 볼 수 있어요. 로그인은 저장 기능을 쓸 때만
              필요합니다.
              <br />
              계속 진행하면 <Link href="/privacy">개인정보처리방침</Link>에 동의한 것으로
              봅니다.
            </p>
          </>
        ) : (
          <>
            <div className="notice notice--info">
              <p className="notice__title">
                <span className="notice__badge" aria-hidden="true">
                  ✦
                </span>
                로그인 기능은 준비 중이에요
              </p>
              <p>{SUPABASE_SETUP_HINT}</p>
              <p>
                운영자가 Supabase 프로젝트를 연결하면 이 화면에서 바로 카카오 로그인이
                열립니다. 필요한 설정은 아래와 같아요.
              </p>
              <ol>
                <li>
                  Supabase 프로젝트 생성 → <code>supabase/schema.sql</code> 실행
                </li>
                <li>Authentication &gt; Providers &gt; Kakao 활성화 (REST API 키·시크릿 입력)</li>
                <li>
                  Vercel 환경변수에 <code>NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
                  <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> 등록
                </li>
              </ol>
            </div>
            <Link className="btn btn--primary btn--full" href="/">
              사주 보러 가기 <span className="btn__arrow">→</span>
            </Link>
          </>
        )}

        <SiteFooter />
      </main>
    </>
  );
}
