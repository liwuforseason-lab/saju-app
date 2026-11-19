import { NextResponse } from "next/server";
import { jsonError, readJsonBody, requireUser } from "@/lib/api";
import { confirmCoinOrder } from "@/lib/payments";
import { asString, isRecord } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * POST /api/payments/confirm
 * body: { orderId, paymentKey, amount }
 * 토스 결제창에서 돌아온 결제를 승인하고 코인을 적립합니다.
 */
export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const parsed = await readJsonBody(request, 8_000);
  if (!parsed.ok) return parsed.response;
  if (!isRecord(parsed.body)) {
    return jsonError(400, "invalid_body", "요청을 읽지 못했어요.");
  }

  const orderId = asString(parsed.body.orderId);
  const paymentKey = asString(parsed.body.paymentKey);
  const amount = Number(parsed.body.amount);

  if (!orderId || !paymentKey || !Number.isFinite(amount)) {
    return jsonError(400, "invalid_body", "결제 정보가 부족해요.");
  }

  const result = await confirmCoinOrder({
    orderId,
    paymentKey,
    amount,
    userId: auth.user.id,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.code ?? "payment_failed",
        message: result.message ?? "결제를 마치지 못했어요.",
      },
      { status: result.status },
    );
  }

  return NextResponse.json({
    ok: true,
    already: Boolean(result.already),
    coins: result.coins ?? 0,
    balance: result.balance ?? 0,
  });
}
