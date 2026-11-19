/** 요청 본문 검증 헬퍼 — API Route Handler 에서 공통으로 사용합니다. */

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asString(value: unknown, maxLength = 200): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

export function asInt(
  value: unknown,
  min: number,
  max: number,
): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n < min || n > max) return null;
  return n;
}

export function asBool(value: unknown): boolean {
  return value === true;
}

export function oneOf<T extends string>(
  value: unknown,
  options: readonly T[],
): T | null {
  return typeof value === "string" && (options as readonly string[]).includes(value)
    ? (value as T)
    : null;
}

export interface NormalizedBirth {
  name: string;
  gender: "n" | "f" | "m";
  calendar: "solar" | "lunar";
  leap: boolean;
  year: number;
  month: number;
  day: number;
  timeIndex: number;
}

/**
 * 사주 입력값(생년월일·시간·달력) 검증.
 * 이름은 선택이며, 없으면 빈 문자열로 둡니다.
 */
export function normalizeBirth(value: unknown): NormalizedBirth | null {
  if (!isRecord(value)) return null;

  const year = asInt(value.year, 1900, 2035);
  const month = asInt(value.month, 1, 12);
  const day = asInt(value.day, 1, 31);
  if (year === null || month === null || day === null) return null;
  if (day > new Date(year, month, 0).getDate()) return null;

  const calendar = oneOf(value.calendar, ["solar", "lunar"] as const) ?? "solar";
  const gender = oneOf(value.gender, ["n", "f", "m"] as const) ?? "n";
  const timeIndex = asInt(value.timeIndex, -1, 11) ?? -1;

  return {
    name: asString(value.name, 30) ?? "",
    gender,
    calendar,
    leap: calendar === "lunar" ? asBool(value.leap) : false,
    year,
    month,
    day,
    timeIndex,
  };
}

/** JSON 직렬화 크기 확인 (서버 저장 용량 보호) */
export function jsonSize(value: unknown): number {
  try {
    return JSON.stringify(value)?.length ?? 0;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}
