import { NextResponse } from "next/server";
import { jsonError, readJsonBody, requireUser } from "@/lib/api";
import type { ProfileRelation } from "@/lib/db-types";
import { asString, isRecord, normalizeBirth, oneOf } from "@/lib/validation";

export const dynamic = "force-dynamic";

const RELATIONS = ["self", "family", "friend", "other"] as const;

/** PATCH /api/profiles/:id — 이름·관계·메모·생년월일 수정 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const parsed = await readJsonBody(request, 20_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  if (!isRecord(body)) {
    return jsonError(400, "invalid_body", "수정할 내용을 읽지 못했어요.");
  }

  const patch: Record<string, unknown> = {};

  if (body.name !== undefined) {
    patch.name = asString(body.name, 30) ?? "지인";
  }
  if (body.relation !== undefined) {
    const relation = oneOf<ProfileRelation>(body.relation, RELATIONS);
    if (!relation) return jsonError(400, "invalid_relation", "관계 값을 확인해 주세요.");
    patch.relation = relation;
  }
  if (body.memo !== undefined) {
    patch.memo = asString(body.memo, 200);
  }

  if (body.year !== undefined || body.birth_year !== undefined) {
    const birth = normalizeBirth({
      name: body.name ?? "",
      gender: body.gender ?? body.gender_code,
      calendar: body.calendar ?? "solar",
      leap: body.leap ?? body.is_leap_month,
      year: body.year ?? body.birth_year,
      month: body.month ?? body.birth_month,
      day: body.day ?? body.birth_day,
      timeIndex: body.timeIndex ?? body.birth_time_index,
    });
    if (!birth) {
      return jsonError(400, "invalid_birth", "생년월일을 다시 확인해 주세요.");
    }
    patch.calendar = birth.calendar;
    patch.gender = birth.gender;
    patch.is_leap_month = birth.leap;
    patch.birth_year = birth.year;
    patch.birth_month = birth.month;
    patch.birth_day = birth.day;
    patch.birth_time_index = birth.timeIndex;
  }

  if (Object.keys(patch).length === 0) {
    return jsonError(400, "empty_patch", "수정할 항목이 없어요.");
  }

  const { data, error } = await auth.supabase
    .from("saju_profiles")
    .update(patch)
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    return jsonError(500, "update_failed", "프로필을 수정하지 못했어요.");
  }
  if (!data) {
    return jsonError(404, "not_found", "프로필을 찾지 못했어요.");
  }

  return NextResponse.json({ profile: data });
}

/** DELETE /api/profiles/:id — 프로필과 연결된 풀이는 profile_id 만 비워집니다 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const { error, count } = await auth.supabase
    .from("saju_profiles")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", auth.user.id);

  if (error) {
    return jsonError(500, "delete_failed", "프로필을 삭제하지 못했어요.");
  }
  if (!count) {
    return jsonError(404, "not_found", "프로필을 찾지 못했어요.");
  }

  return NextResponse.json({ ok: true, deleted: id });
}
