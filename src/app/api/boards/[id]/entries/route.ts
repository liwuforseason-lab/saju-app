import { NextResponse } from "next/server";
import { jsonError, readJsonBody, requireUser } from "@/lib/api";
import { chemistryTag, type BoardRelation } from "@/lib/board";
import { Saju, computeSaju } from "@/lib/saju";
import { asString, isRecord, normalizeBirth, oneOf } from "@/lib/validation";

export const dynamic = "force-dynamic";

const RELATIONS = ["family", "friend", "crush", "bias", "other"] as const;

/**
 * POST /api/boards/:id/entries — 보드에 사람 추가
 * body: { nickname, relation?, birth }
 * 궁합 점수는 서버에서 만세력 엔진으로 다시 계산해 저장합니다(클라이언트 조작 방지).
 */
export async function POST(
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
    return jsonError(400, "invalid_body", "추가할 사람의 정보를 읽지 못했어요.");
  }

  const nickname = asString(body.nickname, 20);
  if (!nickname) {
    return jsonError(400, "invalid_nickname", "닉네임을 입력해 주세요.");
  }

  const birth = normalizeBirth(body.birth);
  if (!birth) {
    return jsonError(400, "invalid_birth", "생년월일을 다시 확인해 주세요.");
  }

  const relation: BoardRelation = oneOf(body.relation, RELATIONS) ?? "friend";

  const { data: board, error: boardError } = await auth.supabase
    .from("compatibility_boards")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (boardError) {
    return jsonError(500, "read_failed", "보드를 불러오지 못했어요.");
  }
  if (!board) {
    return jsonError(404, "not_found", "보드를 찾지 못했어요.");
  }

  const owner = board as {
    owner_name: string;
    owner_gender: "n" | "f" | "m";
    owner_calendar: "solar" | "lunar";
    owner_is_leap_month: boolean;
    owner_birth_year: number;
    owner_birth_month: number;
    owner_birth_day: number;
    owner_birth_time_index: number;
    is_public: boolean;
    user_id: string;
  };

  if (!owner.is_public && owner.user_id !== auth.user.id) {
    return jsonError(403, "board_private", "비공개 보드예요.");
  }

  try {
    const me = computeSaju({
      name: owner.owner_name,
      gender: owner.owner_gender,
      calendar: owner.owner_calendar,
      leap: owner.owner_is_leap_month,
      year: owner.owner_birth_year,
      month: owner.owner_birth_month,
      day: owner.owner_birth_day,
      timeIndex: owner.owner_birth_time_index,
    });
    const partner = computeSaju({
      name: nickname,
      gender: birth.gender,
      calendar: birth.calendar,
      leap: birth.leap,
      year: birth.year,
      month: birth.month,
      day: birth.day,
      timeIndex: birth.timeIndex,
    });
    const compat = Saju.compatibility(me, partner);

    const { data, error } = await auth.supabase
      .from("board_entries")
      .insert({
        board_id: id,
        user_id: auth.user.id,
        nickname,
        relation,
        gender: birth.gender,
        calendar: birth.calendar,
        is_leap_month: birth.leap,
        birth_year: birth.year,
        birth_month: birth.month,
        birth_day: birth.day,
        birth_time_index: birth.timeIndex,
        compat_score: compat.score,
        compat_label: compat.label,
        compat_tag: chemistryTag(compat.score),
      })
      .select("*")
      .single();

    if (error || !data) {
      return jsonError(500, "create_failed", "보드에 추가하지 못했어요.");
    }

    return NextResponse.json({ entry: data }, { status: 201 });
  } catch (caught) {
    return jsonError(
      400,
      "invalid_birth",
      caught instanceof Error ? caught.message : "생년월일을 다시 확인해 주세요.",
    );
  }
}
