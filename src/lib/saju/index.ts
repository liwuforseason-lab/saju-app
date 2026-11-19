import engine, { KoreanLunarCalendarCtor } from "./saju-engine";
import type { SajuEngine, SajuInput, SajuResult } from "./types";

/**
 * 만세력 엔진 (기존 /workspace/saju-site/js 의 검증된 로직을 그대로 이식).
 * 브라우저·Node 어디서든 같은 결과를 냅니다. (시드 기반이라 공유 링크 재현 가능)
 */
export const Saju = engine as unknown as SajuEngine;

export function computeSaju(input: SajuInput): SajuResult {
  return Saju.computeSaju(input);
}

type LunarCalendarInstance = {
  setLunarDate(
    year: number,
    month: number,
    day: number,
    leap: boolean,
  ): boolean;
};

const LunarCalendarCtor = KoreanLunarCalendarCtor as unknown as new () =>
  | LunarCalendarInstance
  | undefined;

/** 입력한 음력 (연, 월) 에 윤달이 실제로 있는지 확인합니다. */
export function hasLeapMonth(year: number, month: number): boolean {
  try {
    const cal = new LunarCalendarCtor();
    if (!cal) return false;
    return cal.setLunarDate(year, month, 1, true);
  } catch {
    return false;
  }
}

export type * from "./types";
