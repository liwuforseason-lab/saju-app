import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import type { UnlockedReportRow } from "@/lib/db-types";

export const dynamic = "force-dynamic";

/**
 * GET /api/wallet
 * 내 코인 잔액 + 잠금해제한 리포트 목록 (RLS 로 내 것만 조회)
 */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const [walletResult, unlockResult] = await Promise.all([
    auth.supabase
      .from("coin_wallets")
      .select("balance")
      .eq("user_id", auth.user.id)
      .maybeSingle<{ balance: number }>(),
    auth.supabase
      .from("unlocked_reports")
      .select("report_type, target_key, coins_spent, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (walletResult.error) {
    return jsonError(500, "wallet_read_failed", "코인 잔액을 불러오지 못했어요.");
  }

  const unlocks = (unlockResult.data ?? []) as Pick<
    UnlockedReportRow,
    "report_type" | "target_key" | "coins_spent" | "created_at"
  >[];

  return NextResponse.json({
    balance: walletResult.data?.balance ?? 0,
    unlocks: unlocks.map((row) => ({
      reportType: row.report_type,
      targetKey: row.target_key,
      coinsSpent: row.coins_spent,
      createdAt: row.created_at,
    })),
  });
}
