import { NextResponse } from "next/server";
import { jsonError, readJsonBody, requireUser } from "@/lib/api";
import { createCoinOrder } from "@/lib/payments";
import { isRecord, asString } from "@/lib/validation";
import { PAYMENT_MODE, TOSS_CLIENT_KEY } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/create
 * body: { packageId }
 * 코인 충전 주문을 pending 상태로 만들고 결제창에 넘길 값을 돌려줍니다.
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const parsed = await readJsonBody(request, 8_000);
  if (!parsed.ok) return parsed.response;
  if (!isRecord(parsed.body)) {
    return jsonError(400, "invalid_body", "요청을 읽지 못했어요.");
  }

  const packageId = asString(parsed.body.packageId) ?? "";
  const created = await createCoinOrder(auth.user.id, packageId);
  if (!created.ok) {
    return jsonError(created.status, created.code, created.message);
  }

  return NextResponse.json({
    orderId: created.order.order_id,
    amount: created.order.amount_krw,
    coins: created.order.coins,
    orderName: created.orderName,
    packageId: created.pack.id,
    mode: PAYMENT_MODE,
    clientKey: TOSS_CLIENT_KEY,
  });
}
