import { NextResponse } from "next/server";
import { jsonError, readJsonBody, requireUser } from "@/lib/api";
import { computeSaju } from "@/lib/saju";
import { asString, isRecord, normalizeBirth, oneOf } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** GET /api/boards — 내가 만든 궁합 보드 목록 */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.supabase
    .from("compatibility_boards")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return jsonError(500, "read_failed", "궁합 보드를 불러오지 못했어요.");
  }

  return NextResponse.json({ boards: data ?? [] });
}

/**
 * POST /api/boards — 내 궁합 보드 만들기
 * body: { input(내 사주), title?, isPublic?, ownerProfileId? }
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const parsed = await readJsonBody(request, 20_000);
  if (!parsed.ok) return parsed.response;
  const body = parsed.body;

  if (!isRecord(body)) {
    return jsonError(400, "invalid_body", "보드 정보를 읽지 못했어요.");
  }

  const owner = normalizeBirth(body.input);
  if (!owner) {
    return jsonError(400, "invalid_birth", "내 생년월일을 다시 확인해 주세요.");
  }

  try {
    computeSaju({
      name: owner.name,
      gender: owner.gender,
      calendar: owner.calendar,
      leap: owner.leap,
      year: owner.year,
      month: owner.month,
      day: owner.day,
      timeIndex: owner.timeIndex,
    });
  } catch (caught) {
    return jsonError(
      400,
      "invalid_birth",
      caught instanceof Error ? caught.message : "생년월일을 다시 확인해 주세요.",
    );
  }

  const title =
    asString(body.title, 60) ??
    (owner.name ? `${owner.name} 님의 궁합 보드` : "내 궁합 보드");
  const isPublic = body.isPublic === false ? false : true;

  // 같은 사주로 이미 만든 보드가 있으면 그대로 돌려줍니다(중복 방지).
  const { data: existing } = await auth.supabase
    .from("compatibility_boards")
    .select("*")
    .eq("user_id", auth.user.id)
    .eq("owner_calendar", owner.calendar)
    .eq("owner_birth_year", owner.year)
    .eq("owner_birth_month", owner.month)
    .eq("owner_birth_day", owner.day)
    .eq("owner_birth_time_index", owner.timeIndex)
    .eq("owner_gender", owner.gender)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ board: existing, reused: true });
  }

  const { data, error } = await auth.supabase
    .from("compatibility_boards")
    .insert({
      user_id: auth.user.id,
      title,
      owner_name: owner.name,
      owner_gender: owner.gender,
      owner_calendar: owner.calendar,
      owner_is_leap_month: owner.leap,
      owner_birth_year: owner.year,
      owner_birth_month: owner.month,
      owner_birth_day: owner.day,
      owner_birth_time_index: owner.timeIndex,
      is_public: isPublic,
    })
    .select("*")
    .single();

  if (error || !data) {
    return jsonError(500, "create_failed", "궁합 보드를 만들지 못했어요.");
  }

  return NextResponse.json({ board: data }, { status: 201 });
}
