import type { SajuInput, SajuResult } from "@/lib/saju/types";

export interface FormState {
  name: string;
  gender: SajuInput["gender"];
  calendar: SajuInput["calendar"];
  leap: boolean;
  year: number;
  month: number;
  day: number;
  timeIndex: number;
}

export const YEAR_MIN = 1900;
export const YEAR_MAX = 2035;

export const DEFAULT_FORM: FormState = {
  name: "",
  gender: "n",
  calendar: "solar",
  leap: false,
  year: 2000,
  month: 1,
  day: 1,
  timeIndex: -1,
};

export function pad2(n: number): string {
  return (n < 10 ? "0" : "") + n;
}

export const WEEK_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

/** 결과 상단에 쓰는 날짜 요약: "양력 1999.04.22 · 음력 1999.03.07 · 사시 09~11시" */
export function dateSummary(
  result: SajuResult,
  timeLabel?: { label: string; range: string },
): string {
  const parts = [
    `양력 ${result.solar.year}.${pad2(result.solar.month)}.${pad2(result.solar.day)}`,
  ];
  if (result.lunar) {
    parts.push(
      `음력 ${result.lunar.year}.${pad2(result.lunar.month)}.${pad2(result.lunar.day)}${
        result.lunar.leap ? "(윤)" : ""
      }`,
    );
  }
  if (result.hasTime && timeLabel) {
    parts.push(`${timeLabel.label} ${timeLabel.range}`);
  }
  return parts.join(" · ");
}

/** 결과 → 저장용 생년월일 (엔진 결과의 input 에는 연·월·일이 없어 따로 만듭니다) */
export function birthFromResult(result: SajuResult): {
  name: string;
  gender: SajuInput["gender"];
  calendar: SajuInput["calendar"];
  leap: boolean;
  year: number;
  month: number;
  day: number;
  timeIndex: number;
} {
  const lunarInput = result.input.calendar === "lunar" && result.lunar;
  return {
    name: result.input.name,
    gender: result.input.gender,
    calendar: result.input.calendar,
    leap: result.input.leap,
    year: lunarInput ? result.lunar!.year : result.solar.year,
    month: lunarInput ? result.lunar!.month : result.solar.month,
    day: lunarInput ? result.lunar!.day : result.solar.day,
    timeIndex: result.input.timeIndex,
  };
}

/** 공유 링크용 쿼리스트링 (엔진의 toShareParams 와 동일한 규칙) */
export function shareParams(result: SajuResult, engine: { toShareParams(r: SajuResult): string }): string {
  return engine.toShareParams(result);
}

/** 저장된 풀이(input)를 다시 열 수 있는 링크 쿼리 */
export function shareQueryFromInput(input: {
  name?: string;
  gender?: string;
  calendar?: string;
  leap?: boolean;
  year: number;
  month: number;
  day: number;
  timeIndex?: number;
}): string {
  const q = new URLSearchParams();
  if (input.name) q.set("n", input.name);
  if (input.gender && input.gender !== "n") q.set("g", input.gender);
  q.set("cal", input.calendar === "lunar" ? "lunar" : "solar");
  q.set("y", String(input.year));
  q.set("m", String(input.month));
  q.set("d", String(input.day));
  if (input.calendar === "lunar" && input.leap) q.set("leap", "1");
  if (typeof input.timeIndex === "number" && input.timeIndex >= 0) {
    q.set("t", String(input.timeIndex));
  }
  return q.toString();
}

/** 쿼리스트링 → 폼 상태. y/m/d 가 없으면 null (공유 링크가 아님) */
export function formFromSearchParams(
  params: Pick<URLSearchParams, "get" | "has">,
): FormState | null {
  const y = parseInt(params.get("y") ?? "", 10);
  const m = parseInt(params.get("m") ?? "", 10);
  const d = parseInt(params.get("d") ?? "", 10);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return null;
  }

  const calendar = params.get("cal") === "lunar" ? "lunar" : "solar";
  const genderRaw = params.get("g");
  const gender = genderRaw === "m" ? "m" : genderRaw === "f" ? "f" : "n";
  const timeRaw = params.has("t") ? parseInt(params.get("t") ?? "-1", 10) : -1;

  return {
    name: (params.get("n") ?? "").slice(0, 12),
    gender,
    calendar,
    leap: calendar === "lunar" && params.get("leap") === "1",
    year: Math.min(YEAR_MAX, Math.max(YEAR_MIN, y)),
    month: Math.min(12, Math.max(1, m)),
    day: Math.min(31, Math.max(1, d)),
    timeIndex: Number.isFinite(timeRaw)
      ? Math.max(-1, Math.min(11, timeRaw))
      : -1,
  };
}
