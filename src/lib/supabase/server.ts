import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  isSupabaseConfigured,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from "@/lib/env";

/**
 * 서버 컴포넌트 · Route Handler 에서 쓰는 Supabase 클라이언트.
 * 로그인 세션은 HttpOnly 쿠키(@supabase/ssr)로 관리되며, RLS 정책(auth.uid() = user_id)이
 * 그대로 적용되므로 anon key 만으로도 "내 데이터"만 읽고 쓸 수 있습니다.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured) return null;

  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component 에서는 쿠키를 쓸 수 없습니다(읽기 전용).
          // 세션 갱신은 middleware 에서 처리하므로 여기서는 무시해도 안전합니다.
        }
      },
    },
  });
}

/** 현재 로그인한 사용자. 로그인하지 않았거나 Supabase 미설정이면 null. */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) return null;
  return user ?? null;
}
