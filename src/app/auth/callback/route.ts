import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  isSupabaseConfigured,
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

/**
 * 카카오 로그인 콜백.
 * Supabase 가 돌려준 code 를 세션(쿠키)으로 교환한 뒤 원래 페이지로 보냅니다.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  if (!isSupabaseConfigured) {
    return NextResponse.redirect(
      new URL("/login?error=not_configured", url.origin),
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
  }

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

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=auth", url.origin));
  }

  return response;
}
