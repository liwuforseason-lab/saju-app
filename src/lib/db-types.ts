/** DB 테이블 행 타입 (supabase/schema.sql 과 1:1 대응) */

export type ProfileRelation = "self" | "family" | "friend" | "other";
export type ReadingKind = "basic" | "compat" | "deep" | "paid";

export interface SajuProfileRow {
  id: string;
  user_id: string;
  name: string;
  relation: ProfileRelation;
  gender: "n" | "f" | "m";
  calendar: "solar" | "lunar";
  is_leap_month: boolean;
  birth_year: number;
  birth_month: number;
  birth_day: number;
  birth_time_index: number;
  birth_time_label: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface SajuReadingRow {
  id: string;
  user_id: string;
  profile_id: string | null;
  kind: ReadingKind;
  title: string | null;
  summary: string | null;
  input: Record<string, unknown>;
  result: Record<string, unknown>;
  is_paid: boolean;
  created_at: string;
}

export const RELATION_LABEL: Record<ProfileRelation, string> = {
  self: "나",
  family: "가족",
  friend: "지인",
  other: "기타",
};

/* ------------------------------------------------------------------ 결제·코인 */
/** supabase/migrations/002_coins_payments.sql 대응 */

export interface CoinWalletRow {
  user_id: string;
  balance: number;
  updated_at: string;
}

export type CoinOrderStatus = "pending" | "paid" | "failed" | "canceled";

export interface CoinOrderRow {
  id: string;
  user_id: string;
  order_id: string;
  package_id: string;
  amount_krw: number;
  coins: number;
  status: CoinOrderStatus;
  payment_key: string | null;
  mode: "test" | "live";
  fail_reason: string | null;
  created_at: string;
  paid_at: string | null;
}

export interface UnlockedReportRow {
  id: string;
  user_id: string;
  report_type: string;
  target_key: string;
  coins_spent: number;
  created_at: string;
}
