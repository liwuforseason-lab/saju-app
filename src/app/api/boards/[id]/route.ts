import { NextResponse } from "next/server";
import { jsonError, readJsonBody } from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { asString, isRecord } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * GET /api/boards/:id — 초대 링크로 여는 보드 화면.
 * 공개(is_public) 보드는 로그인 없이도 읽을 수 있습니다(RLS 정책).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseConfigured) {
    return jsonError(
      503,
      "supabase_not_configured",
      "궁합 보드 저장 기능은 Supabase 연결 후 사용할 수 있어요.",
    );
  }

  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return jsonError(503, "supabase_not_configured", "저장 기능을 준비 중이에요.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: board, error } = await supabase
    .from("compatibility_boards")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return jsonError(500, "read_failed", "보드를 불러오지 못했어요.");
  }
  if (!board) {
    return jsonError(404, "not_found", "보드를 찾지 못했어요. 링크를 다시 확인해 주세요.");
  }

  const { data: entries, error: entriesError } = await supabase
    .from("board_entries")
    .select("*")
    .eq("board_id", id)
    .order("compat_score", { ascending: false })
    .order("created_at", { ascending: true });

  if (entriesError) {
    return jsonError(500, "read_failed", "참여자 목록을 불러오지 못했어요.");
  }

  const row = board as { user_id: string };

  return NextResponse.json({
    board,
    entries: entries ?? [],
    isOwner: Boolean(user && user.id === row.user_id),
    viewerId: user?.id ?? null,
  });
}

/**
 * PATCH /api/boards/:id — 제목·공개 여부 수정 (주인만)
 * 내 사주(owner_*)는 바꿀 수 없습니다. 점수가 어긋나지 않게 하기 위함입니다.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseConfigured) {
    return jsonError(503, "supabase_not_configured", "저장 기능을 준비 중이에요.");
  }

  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return jsonError(503, "supabase_not_configured", "저장 기능을 준비 중이에요.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return jsonError(401, "unauthorized", "로그인이 필요해요.");
  }

  const parsed = await readJsonBody(request, 10_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;
  if (!isRecord(body)) {
    return jsonError(400, "invalid_body", "수정할 내용을 읽지 못했어요.");
  }

  const patch: Record<string, unknown> = {};
  if (body.title !== undefined) {
    patch.title = asString(body.title, 60) ?? "내 궁합 보드";
  }
  if (body.isPublic !== undefined) {
    patch.is_public = body.isPublic !== false;
  }
  if (Object.keys(patch).length === 0) {
    return jsonError(400, "empty_patch", "수정할 항목이 없어요.");
  }

  const { data, error } = await supabase
    .from("compatibility_boards")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    return jsonError(500, "update_failed", "보드를 수정하지 못했어요.");
  }
  if (!data) {
    return jsonError(404, "not_found", "내 보드를 찾지 못했어요.");
  }

  return NextResponse.json({ board: data });
}

/** DELETE /api/boards/:id — 보드 삭제 (주인만, 참여자도 함께 삭제) */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseConfigured) {
    return jsonError(503, "supabase_not_configured", "저장 기능을 준비 중이에요.");
  }

  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return jsonError(503, "supabase_not_configured", "저장 기능을 준비 중이에요.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return jsonError(401, "unauthorized", "로그인이 필요해요.");
  }

  const { error, count } = await supabase
    .from("compatibility_boards")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return jsonError(500, "delete_failed", "보드를 삭제하지 못했어요.");
  }
  if (!count) {
    return jsonError(404, "not_found", "내 보드를 찾지 못했어요.");
  }

  return NextResponse.json({ ok: true, deleted: id });
}
