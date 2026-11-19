import { NextResponse } from "next/server";
import { jsonError, readJsonBody, requireUser } from "@/lib/api";
import { asString, isRecord } from "@/lib/validation";
import { coinsFor, isReportType } from "@/lib/coins";

export const dynamic = "force-dynamic";

/**
 * POST /api/unlocks
 * body: { reportType, targetKey }
 * 내 코인으로 리포트를 엽니다. 코인 수는 서버 카탈로그 값만 신뢰합니다.
 * 이미 연 리포트는 코인을 다시 차감하지 않습니다(coin_unlock 함수가 처리).
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const parsed = await readJsonBody(request, 8_000);
  if (!parsed.ok) return parsed.response;
  if (!isRecord(parsed.body)) {
    return jsonError(400, "invalid_body", "요청을 읽지 못했어요.");
  }

  const reportType = asString(parsed.body.reportType);
  const targetKey = asString(parsed.body.targetKey);

  if (!reportType || !isReportType(reportType)) {
    return jsonError(400, "unknown_report", "없는 리포트예요.");
  }
  if (!targetKey || targetKey.length > 80) {
    return jsonError(400, "invalid_target", "리포트 대상을 확인하지 못했어요.");
  }

  const coins = coinsFor(reportType);

  const { data, error } = await auth.supabase.rpc("coin_unlock", {
    p_report_type: reportType,
    p_target_key: targetKey,
    p_coins: coins,
  });

  if (error) {
    return jsonError(500, "unlock_failed", "잠금해제에 실패했어요. 잠시 후 다시 시도해 주세요.");
  }

  const result = data as {
    ok?: boolean;
    already?: boolean;
    error?: string;
    balance?: number;
  };

  if (!result?.ok) {
    if (result?.error === "insufficient") {
      return NextResponse.json(
        {
          error: "insufficient_coins",
          message: "코인이 부족해요. 충전하고 다시 열어 보세요.",
          balance: result.balance ?? 0,
          needed: coins,
        },
        { status: 402 },
      );
    }
    return jsonError(400, "unlock_failed", "잠금해제를 처리하지 못했어요.");
  }

  return NextResponse.json({
    ok: true,
    already: Boolean(result.already),
    balance: result.balance ?? 0,
    reportType,
    targetKey,
  });
}
