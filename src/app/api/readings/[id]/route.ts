import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

/** GET /api/readings/:id — 저장된 풀이 하나 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const { data, error } = await auth.supabase
    .from("saju_readings")
    .select("*")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) {
    return jsonError(500, "read_failed", "풀이를 불러오지 못했어요.");
  }
  if (!data) {
    return jsonError(404, "not_found", "풀이를 찾지 못했어요.");
  }

  return NextResponse.json({ reading: data });
}

/** DELETE /api/readings/:id — 내 풀이 삭제 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const { error, count } = await auth.supabase
    .from("saju_readings")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", auth.user.id);

  if (error) {
    return jsonError(500, "delete_failed", "풀이를 삭제하지 못했어요.");
  }
  if (!count) {
    return jsonError(404, "not_found", "삭제할 풀이를 찾지 못했어요.");
  }

  return NextResponse.json({ ok: true, deleted: id });
}
