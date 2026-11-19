import { NextResponse } from "next/server";
import { STATS_SEED_READINGS, STATS_SEED_USERS } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const revalidate = 300;

/**
 * GET /api/stats
 * 홈 화면 누적 이용자 카운터용 공개 집계.
 * 실제 DB 숫자(풀이 저장 수·가입자 수·잠금해제 수) + 시드값.
 */
export async function GET() {
  const supabase = await getSupabaseServerClient();

  let readings = 0;
  let users = 0;
  let unlocks = 0;

  if (supabase) {
    const { data } = await supabase.rpc("site_stats");
    const stats = (data ?? {}) as {
      readings?: number;
      users?: number;
      unlocks?: number;
    };
    readings = Number(stats.readings ?? 0);
    users = Number(stats.users ?? 0);
    unlocks = Number(stats.unlocks ?? 0);
  }

  return NextResponse.json({
    users: STATS_SEED_USERS + users,
    readings: STATS_SEED_READINGS + readings,
    unlocks,
    updatedAt: new Date().toISOString(),
  });
}
