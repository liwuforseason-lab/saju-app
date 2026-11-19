import "server-only";

import { PAYMENT_MODE, TOSS_SECRET_KEY } from "@/lib/env";
import { packageOf, type CoinPackage } from "@/lib/coins";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CoinOrderRow } from "@/lib/db-types";

export interface CreateOrderResult {
  ok: true;
  order: CoinOrderRow;
  pack: CoinPackage;
  orderName: string;
}

export interface OrderError {
  ok: false;
  status: number;
  code: string;
  message: string;
}

/** 토스 orderId: 영문·숫자·-·_ 6~64자 */
export function newOrderId(): string {
  const stamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `saju-${stamp}-${random}`;
}

/**
 * 코인 충전 주문 생성 (pending).
 * 서비스 롤 키가 없으면 결제 기능을 켤 수 없으므로 안내 문구로 응답합니다.
 */
export async function createCoinOrder(
  userId: string,
  packageId: string,
): Promise<CreateOrderResult | OrderError> {
  const pack = packageOf(packageId);
  if (!pack) {
    return {
      ok: false,
      status: 400,
      code: "unknown_package",
      message: "없는 충전 상품이에요.",
    };
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return {
      ok: false,
      status: 503,
      code: "payments_not_configured",
      message:
        "결제 기능이 아직 설정되지 않았어요. (SUPABASE_SERVICE_ROLE_KEY 필요)",
    };
  }

  const orderId = newOrderId();
  const { data, error } = await admin
    .from("coin_orders")
    .insert({
      user_id: userId,
      order_id: orderId,
      package_id: pack.id,
      amount_krw: pack.priceKrw,
      coins: pack.coins,
      status: "pending",
      mode: PAYMENT_MODE,
    })
    .select("*")
    .single<CoinOrderRow>();

  if (error || !data) {
    return {
      ok: false,
      status: 500,
      code: "order_create_failed",
      message: "주문을 만들지 못했어요. 잠시 후 다시 시도해 주세요.",
    };
  }

  return {
    ok: true,
    order: data,
    pack,
    orderName: `운세 한 스푼 ${pack.label}`,
  };
}

interface TossConfirmResponse {
  paymentKey?: string;
  orderId?: string;
  status?: string;
  totalAmount?: number;
  message?: string;
  code?: string;
}

export interface ConfirmResult {
  ok: boolean;
  status: number;
  code?: string;
  message?: string;
  coins?: number;
  balance?: number;
  already?: boolean;
  order?: CoinOrderRow;
}

/**
 * 결제 승인 + 코인 적립.
 * - live 모드: 토스 승인 API 호출 후 성공하면 코인 적립
 * - test 모드: PG 심사 전 시뮬레이션(승인된 것으로 처리)
 * 어떤 경우에도 금액·주문 소유자는 서버가 다시 검증합니다.
 */
export async function confirmCoinOrder(params: {
  orderId: string;
  paymentKey: string;
  amount: number;
  userId: string;
}): Promise<ConfirmResult> {
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return {
      ok: false,
      status: 503,
      code: "payments_not_configured",
      message: "결제 기능이 아직 설정되지 않았어요.",
    };
  }

  const { data: order, error } = await admin
    .from("coin_orders")
    .select("*")
    .eq("order_id", params.orderId)
    .maybeSingle<CoinOrderRow>();

  if (error || !order) {
    return {
      ok: false,
      status: 404,
      code: "order_not_found",
      message: "주문을 찾지 못했어요.",
    };
  }

  if (order.user_id !== params.userId) {
    return {
      ok: false,
      status: 403,
      code: "order_not_yours",
      message: "내 주문이 아니에요.",
    };
  }

  if (order.amount_krw !== params.amount) {
    await admin
      .from("coin_orders")
      .update({ status: "failed", fail_reason: "amount_mismatch" })
      .eq("id", order.id)
      .eq("status", "pending");
    return {
      ok: false,
      status: 400,
      code: "amount_mismatch",
      message: "결제 금액이 주문과 달라 승인하지 않았어요.",
    };
  }

  if (order.status === "paid") {
    const { data: wallet } = await admin
      .from("coin_wallets")
      .select("balance")
      .eq("user_id", order.user_id)
      .maybeSingle<{ balance: number }>();
    return {
      ok: true,
      status: 200,
      already: true,
      coins: order.coins,
      balance: wallet?.balance ?? 0,
      order,
    };
  }

  if (order.status !== "pending") {
    return {
      ok: false,
      status: 409,
      code: "order_not_pending",
      message: "이미 처리된 주문이에요.",
    };
  }

  /* ------------------------------------------------ 실결제: 토스 승인 API */
  if (order.mode === "live") {
    if (!TOSS_SECRET_KEY) {
      return {
        ok: false,
        status: 503,
        code: "toss_secret_missing",
        message: "실결제 승인 키(TOSS_SECRET_KEY)가 설정되지 않았어요.",
      };
    }

    const authorization = `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString("base64")}`;
    let toss: TossConfirmResponse = {};
    try {
      const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
        method: "POST",
        headers: {
          Authorization: authorization,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentKey: params.paymentKey,
          orderId: params.orderId,
          amount: params.amount,
        }),
        cache: "no-store",
      });
      toss = (await response.json().catch(() => ({}))) as TossConfirmResponse;

      if (!response.ok) {
        await admin
          .from("coin_orders")
          .update({
            status: "failed",
            fail_reason: toss.code ?? `http_${response.status}`,
          })
          .eq("id", order.id)
          .eq("status", "pending");
        return {
          ok: false,
          status: 402,
          code: toss.code ?? "payment_failed",
          message: toss.message ?? "결제 승인에 실패했어요.",
          order,
        };
      }
    } catch {
      return {
        ok: false,
        status: 502,
        code: "toss_unreachable",
        message: "결제사 응답을 받지 못했어요. 잠시 후 다시 확인해 주세요.",
        order,
      };
    }
  }

  /* ------------------------------------------------------------ 코인 적립 */
  const { data: finalized, error: finalizeError } = await admin.rpc(
    "finalize_coin_order",
    {
      p_order_id: params.orderId,
      p_payment_key: params.paymentKey,
      p_paid: true,
    },
  );

  if (finalizeError) {
    return {
      ok: false,
      status: 500,
      code: "credit_failed",
      message: "결제는 승인됐지만 코인 적립에 실패했어요. 고객센터로 알려 주세요.",
      order,
    };
  }

  const result = finalized as {
    ok?: boolean;
    already?: boolean;
    coins?: number;
    balance?: number;
  };

  return {
    ok: true,
    status: 200,
    already: Boolean(result?.already),
    coins: result?.coins ?? order.coins,
    balance: result?.balance ?? 0,
    order,
  };
}
