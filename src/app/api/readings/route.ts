import { NextResponse } from "next/server";
import { checkResultSize, jsonError, readJsonBody, requireUser } from "@/lib/api";
import { computeSaju } from "@/lib/saju";
import type { ReadingKind } from "@/lib/db-types";
import { asString, isRecord, normalizeBirth, oneOf } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * GET /api/readings?limit=20
 * 로그인 사용자의 저장된 풀이 목록 (RLS 로 본인 것만 조회됩니다)
 */
export async function GET(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const limitRaw = Number(url.searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(limitRaw)
    ? Math.min(50, Math.max(1, Math.floor(limitRaw)))
    : 20;

  const { data, error } = await auth.supabase
    .from("saju_readings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return jsonError(500, "read_failed", "저장된 풀이를 불러오지 못했어요.");
  }

  return NextResponse.json({ readings: data ?? [] });
}

/**
 * POST /api/readings
 * body: { input, result, summary?, title?, kind?, profileId? }
 * - input 은 서버에서 한 번 더 만세력 계산을 돌려 유효한 생년월일인지 검증합니다.
 * - profileId 가 없으면 새 프로필을 만들고, 있으면 소유권을 확인합니다.
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const parsed = await readJsonBody(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  if (!isRecord(body)) {
    return jsonError(400, "invalid_body", "저장할 내용을 읽지 못했어요.");
  }

  const birth = normalizeBirth(body.input);
  if (!birth) {
    return jsonError(400, "invalid_birth", "생년월일을 다시 확인해 주세요.");
  }

  const result = body.result;
  if (!isRecord(result)) {
    return jsonError(400, "invalid_result", "풀이 결과가 비어 있어요.");
  }
  const sizeError = checkResultSize(result);
  if (sizeError) return sizeError;

  try {
    computeSaju({
      name: birth.name,
      gender: birth.gender,
      calendar: birth.calendar,
      leap: birth.leap,
      year: birth.year,
      month: birth.month,
      day: birth.day,
      timeIndex: birth.timeIndex,
    });
  } catch (caught) {
    return jsonError(
      400,
      "invalid_birth",
      caught instanceof Error
        ? caught.message
        : "생년월일을 다시 확인해 주세요.",
    );
  }

  const kind: ReadingKind =
    oneOf(body.kind, ["basic", "compat", "deep", "paid"] as const) ?? "basic";
  const summary = asString(body.summary, 2000) ?? null;
  const title =
    asString(body.title, 80) ?? (birth.name ? `${birth.name} 님의 사주` : "나의 사주");

  // 1) 프로필 확정
  let profileId: string | null = null;
  const requestedProfileId = asString(body.profileId, 64);

  if (requestedProfileId) {
    const { data: owned, error: ownError } = await auth.supabase
      .from("saju_profiles")
      .select("id")
      .eq("id", requestedProfileId)
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (ownError) {
      return jsonError(500, "profile_read_failed", "프로필을 확인하지 못했어요.");
    }
    if (!owned) {
      return jsonError(404, "profile_not_found", "저장된 프로필을 찾지 못했어요.");
    }
    profileId = owned.id as string;
  } else {
    // 같은 생년월일 프로필이 이미 있으면 새로 만들지 않고 재사용합니다.
    const { data: existingProfile } = await auth.supabase
      .from("saju_profiles")
      .select("id")
      .eq("user_id", auth.user.id)
      .eq("calendar", birth.calendar)
      .eq("birth_year", birth.year)
      .eq("birth_month", birth.month)
      .eq("birth_day", birth.day)
      .eq("birth_time_index", birth.timeIndex)
      .eq("gender", birth.gender)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existingProfile?.id) {
      profileId = existingProfile.id as string;
    } else {
      const { data: profile, error: profileError } = await auth.supabase
        .from("saju_profiles")
        .insert({
          user_id: auth.user.id,
          name: birth.name || "나",
          relation: "self",
          gender: birth.gender,
          calendar: birth.calendar,
          is_leap_month: birth.leap,
          birth_year: birth.year,
          birth_month: birth.month,
          birth_day: birth.day,
          birth_time_index: birth.timeIndex,
        })
        .select("*")
        .single();

      if (profileError || !profile) {
        return jsonError(500, "profile_create_failed", "사주 프로필을 저장하지 못했어요.");
      }
      profileId = (profile as { id: string }).id;
    }
  }

  // 2) 풀이 저장
  const { data: reading, error: readingError } = await auth.supabase
    .from("saju_readings")
    .insert({
      user_id: auth.user.id,
      profile_id: profileId,
      kind,
      title,
      summary,
      input: birth,
      result,
      is_paid: false,
    })
    .select("*")
    .single();

  if (readingError || !reading) {
    return jsonError(500, "reading_create_failed", "풀이를 저장하지 못했어요.");
  }

  return NextResponse.json({ reading, profileId }, { status: 201 });
}
