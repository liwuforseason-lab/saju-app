import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Supabase 세션 쿠키 자동 갱신.
 * - 환경변수가 없으면 아무 것도 하지 않고 통과합니다(게스트 풀이는 그대로 동작).
 * - Supabase 공식 가이드의 미들웨어 패턴을 그대로 따릅니다.
 */
export async function middleware(request: NextRequest) {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  let response = NextResponse.next({ request });

  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // getUser() 를 호출해야 만료된 토큰이 갱신되어 쿠키에 다시 써집니다.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * 다음 경로는 제외합니다.
     * - _next/static, _next/image, favicon, 이미지/폰트 등 정적 자산
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|ads.txt|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
