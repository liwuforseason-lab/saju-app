import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { jsonSize } from "@/lib/validation";

export const NOT_CONFIGURED_MESSAGE =
  "로그인·저장 기능은 Supabase 연결 후 사용할 수 있어요. 사주 풀이는 로그인 없이도 " +
  "그대로 볼 수 있습니다.";

export function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: code, message }, { status });
}

export type AuthContext =
  | { ok: true; supabase: SupabaseClient; user: User }
  | { ok: false; response: NextResponse };

/**
 * API 공통 인증 가드.
 * - Supabase 미설정 → 503 + 안내 문구 (게스트 풀이는 영향 없음)
 * - 로그인 안 됨 → 401
 */
export async function requireUser(): Promise<AuthContext> {
  if (!isSupabaseConfigured) {
    return {
      ok: false,
      response: jsonError(503, "supabase_not_configured", NOT_CONFIGURED_MESSAGE),
    };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      response: jsonError(503, "supabase_not_configured", NOT_CONFIGURED_MESSAGE),
    };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      response: jsonError(
        401,
        "unauthorized",
        "로그인이 필요해요. 카카오로 로그인한 뒤 다시 시도해 주세요.",
      ),
    };
  }

  return { ok: true, supabase, user };
}

/** 요청 JSON 읽기 + 크기 제한 */
export async function readJsonBody(
  request: Request,
  maxBytes = 300_000,
): Promise<{ ok: true; body: unknown } | { ok: false; response: NextResponse }> {
  const text = await request.text();
  if (text.length > maxBytes) {
    return {
      ok: false,
      response: jsonError(413, "payload_too_large", "저장할 데이터가 너무 커요."),
    };
  }
  try {
    return { ok: true, body: JSON.parse(text) as unknown };
  } catch {
    return {
      ok: false,
      response: jsonError(400, "invalid_json", "요청 형식을 읽지 못했어요."),
    };
  }
}

/** 저장 전 result JSON 크기 검사 */
export function checkResultSize(result: unknown): NextResponse | null {
  if (jsonSize(result) > 250_000) {
    return jsonError(413, "result_too_large", "풀이 데이터가 너무 커요.");
  }
  return null;
}
