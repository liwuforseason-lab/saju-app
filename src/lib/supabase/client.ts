"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isSupabaseConfigured,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from "@/lib/env";

let browserClient: SupabaseClient | null = null;

/**
 * 브라우저(클라이언트 컴포넌트)에서 쓰는 Supabase 클라이언트.
 * anon key 만 사용하며, 세션은 쿠키로 관리되어 서버 컴포넌트와 공유됩니다.
 * 환경변수가 없으면 null 을 돌려주고, 호출부는 "로그인 준비 중" 안내를 보여줍니다.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!browserClient) {
    browserClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return browserClient;
}
