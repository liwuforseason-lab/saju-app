import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * 서비스 롤 키를 쓰는 "서버 전용" 클라이언트.
 * - RLS 를 우회하므로 관리자 작업(정산, 운영 도구)에만 사용합니다.
 * - 이 파일은 server-only 로 보호되어 클라이언트 번들에 절대 포함되지 않습니다.
 * - 일반 사용자 요청 처리에는 lib/supabase/server.ts (anon + 쿠키 세션)를 쓰세요.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
