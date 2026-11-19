import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  isSupabaseConfigured,
  KAKAO_CLIENT_SECRET,
  KAKAO_REST_API_KEY,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from "@/lib/env";

export const dynamic = "force-dynamic";

/** 오픈 리다이렉트 방지: 사이트 내부 경로만 허용 */
function safeNext(next: string | null): string {
  if (!next) return "/";
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

interface KakaoTokenResponse {
  id_token?: string;
  error?: string;
  error_description?: string;
}

/** 카카오 인가 코드를 id_token 으로 교환합니다. 실패하면 null. */
async function exchangeCodeForIdToken(
  code: string,
  origin: string,
): Promise<string | null> {
  try {
    const res = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: KAKAO_REST_API_KEY,
        client_secret: KAKAO_CLIENT_SECRET,
        redirect_uri: `${origin}/api/auth/kakao/callback`,
        code,
      }),
      cache: "no-store",
    });
    const json = (await res.json()) as KakaoTokenResponse;
    if (!res.ok || !json.id_token) return null;
    return json.id_token;
  } catch {
    return null;
  }
}

/**
 * 카카오 로그인 콜백 (OIDC).
 * 1) 카카오에서 인가 코드를 id_token 으로 교환합니다.
 * 2) id_token 을 Supabase 세션으로 교환해 쿠키에 저장합니다.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const errorParam = url.searchParams.get("error");
  const next = safeNext(url.searchParams.get("state"));

  if (errorParam) {
    return NextResponse.redirect(
      new URL("/login?error=access_denied", url.origin),
    );
  }

  if (!isSupabaseConfigured || !KAKAO_REST_API_KEY || !KAKAO_CLIENT_SECRET) {
    return NextResponse.redirect(
      new URL("/login?error=not_configured", url.origin),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_code", url.origin),
    );
  }

  // 1) 인가 코드 → 카카오 토큰(id_token)
  const idToken = await exchangeCodeForIdToken(code, url.origin);
  if (!idToken) {
    return NextResponse.redirect(new URL("/login?error=auth", url.origin));
  }

  // 2) id_token → Supabase 세션 (쿠키 저장)
  const response = NextResponse.redirect(new URL(next, url.origin));

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.signInWithIdToken({
    provider: "kakao",
    token: idToken,
  });

  if (error) {
    return NextResponse.redirect(new URL("/login?error=auth", url.origin));
  }

  return response;
}
