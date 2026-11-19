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
