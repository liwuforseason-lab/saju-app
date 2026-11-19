import { NextResponse } from "next/server";
import { jsonError, readJsonBody, requireUser } from "@/lib/api";
import type { ProfileRelation } from "@/lib/db-types";
import { asString, isRecord, normalizeBirth, oneOf } from "@/lib/validation";

export const dynamic = "force-dynamic";

const RELATIONS = ["self", "family", "friend", "other"] as const;

/** GET /api/profiles — 내 사주·지인 사주 목록 */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.supabase
    .from("saju_profiles")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    return jsonError(500, "read_failed", "사주 프로필을 불러오지 못했어요.");
  }

  return NextResponse.json({ profiles: data ?? [] });
}

/** POST /api/profiles — 새 프로필 추가 (내 사주/지인 사주) */
export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const parsed = await readJsonBody(request, 20_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  if (!isRecord(body)) {
    return jsonError(400, "invalid_body", "프로필 내용을 읽지 못했어요.");
  }

  const birth = normalizeBirth(body);
  if (!birth) {
    return jsonError(400, "invalid_birth", "생년월일을 다시 확인해 주세요.");
  }

  const relation: ProfileRelation =
    oneOf(body.relation, RELATIONS) ?? "self";
  const memo = asString(body.memo, 200);

  const { data, error } = await auth.supabase
    .from("saju_profiles")
    .insert({
      user_id: auth.user.id,
      name: birth.name || (relation === "self" ? "나" : "지인"),
      relation,
      gender: birth.gender,
      calendar: birth.calendar,
      is_leap_month: birth.leap,
      birth_year: birth.year,
      birth_month: birth.month,
      birth_day: birth.day,
      birth_time_index: birth.timeIndex,
      memo,
    })
    .select("*")
    .single();

  if (error || !data) {
    return jsonError(500, "create_failed", "프로필을 저장하지 못했어요.");
  }

  return NextResponse.json({ profile: data }, { status: 201 });
}
