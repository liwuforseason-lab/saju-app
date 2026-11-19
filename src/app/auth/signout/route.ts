import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  isSupabaseConfigured,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from "@/lib/env";

export const dynamic = "force-dynamic";

/** 로그아웃: 세션 쿠키를 지우고 홈으로 돌아갑니다. */
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const response = NextResponse.redirect(new URL("/", url.origin), {
    status: 303,
  });

  if (!isSupabaseConfigured) return response;

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

  await supabase.auth.signOut();

  return response;
}
