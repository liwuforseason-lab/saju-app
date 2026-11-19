import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/boards/:id/entries/:entryId
 * 보드 주인은 어떤 참여자든, 참여자는 자기 항목만 삭제할 수 있습니다(RLS).
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; entryId: string }> },
) {
  if (!isSupabaseConfigured) {
    return jsonError(503, "supabase_not_configured", "저장 기능을 준비 중이에요.");
  }

  const { id, entryId } = await params;
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
    .from("board_entries")
    .delete({ count: "exact" })
    .eq("id", entryId)
    .eq("board_id", id);

  if (error) {
    return jsonError(500, "delete_failed", "참여자를 삭제하지 못했어요.");
  }
  if (!count) {
    return jsonError(404, "not_found", "삭제할 참여자를 찾지 못했어요.");
  }

  return NextResponse.json({ ok: true, deleted: entryId });
}
