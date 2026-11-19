import { NextResponse, type NextRequest } from "next/server";
import { KAKAO_REST_API_KEY } from "@/lib/env";

export const dynamic = "force-dynamic";

/** 오픈 리다이렉트 방지: 사이트 내부 경로만 허용 */
function safeNext(next: string | null): string {
  if (!next) return "/";
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

/**
 * 카카오 로그인 시작.
 *
 * Supabase 의 기본 Kakao 프로바이더는 account_email 스코프까지 요청하는데,
 * 이메일 동의항목은 비즈 앱 인증이 있어야 열립니다. 그래서 이 앱은 카카오 OIDC
 * (openid) 로 id_token 을 받아 Supabase 세션으로 교환하는 방식을 씁니다.
 * 자세한 교환은 /api/auth/kakao/callback 에서 처리합니다.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));
  const clientId = KAKAO_REST_API_KEY;

  if (!clientId) {
    return NextResponse.redirect(
      new URL("/login?error=not_configured", url.origin),
    );
  }

  const authorize = new URL("https://kauth.kakao.com/oauth/authorize");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set(
    "redirect_uri",
    `${url.origin}/api/auth/kakao/callback`,
  );
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("scope", "openid profile_nickname profile_image");
  authorize.searchParams.set("state", next);

  return NextResponse.redirect(authorize);
}
