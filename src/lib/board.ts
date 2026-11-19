import type { SajuEngine, SajuResult } from "@/lib/saju/types";
import { TIME_OPTIONS } from "@/lib/saju/time-options";
import type { NormalizedBirth } from "@/lib/validation";

export type BoardRelation = "family" | "friend" | "crush" | "bias" | "other";

export const RELATION_OPTIONS: { value: BoardRelation; label: string; emoji: string }[] = [
  { value: "friend", label: "친구", emoji: "🤝" },
  { value: "crush", label: "썸·연인", emoji: "💗" },
  { value: "family", label: "가족", emoji: "🏠" },
  { value: "bias", label: "최애", emoji: "⭐" },
  { value: "other", label: "기타", emoji: "✦" },
];

export const RELATION_LABEL: Record<BoardRelation, string> = {
  family: "가족",
  friend: "친구",
  crush: "썸·연인",
  bias: "최애",
  other: "기타",
};

/** 궁합 점수 → 한 줄 케미 태그 (랭킹 리스트·방사형 맵에 사용) */
export function chemistryTag(score: number): string {
  if (score >= 90) return "찰떡 소울메이트";
  if (score >= 82) return "서로 채워주는 귀인";
  if (score >= 74) return "불꽃 튀는 티키타카";
  if (score >= 66) return "말 안 해도 통하는 단짝";
  if (score >= 58) return "알수록 가까워지는 사이";
  if (score >= 48) return "다른 매력, 천천히 친해지기";
  return "서로 배울 게 많은 사이";
}

export interface BoardPerson {
  /** 로컬 항목은 local-*, 서버 항목은 DB uuid */
  key: string;
  serverId?: string;
  nickname: string;
  relation: BoardRelation;
  birth: NormalizedBirth;
  score: number;
  label: string;
  tag: string;
  ganText: string;
  zhiText: string;
  advice: string[];
  isMine?: boolean;
}

export interface BoardRow {
  id: string;
  user_id: string;
  share_slug: string;
  title: string;
  owner_name: string;
  owner_gender: "n" | "f" | "m";
  owner_calendar: "solar" | "lunar";
  owner_is_leap_month: boolean;
  owner_birth_year: number;
  owner_birth_month: number;
  owner_birth_day: number;
  owner_birth_time_index: number;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface BoardEntryRow {
  id: string;
  board_id: string;
  user_id: string | null;
  nickname: string;
  relation: BoardRelation;
  gender: "n" | "f" | "m";
  calendar: "solar" | "lunar";
  is_leap_month: boolean;
  birth_year: number;
  birth_month: number;
  birth_day: number;
  birth_time_index: number;
  compat_score: number | null;
  compat_label: string | null;
  compat_tag: string | null;
  created_at: string;
}

export function ownerFromRow(row: BoardRow): NormalizedBirth {
  return {
    name: row.owner_name,
    gender: row.owner_gender,
    calendar: row.owner_calendar,
    leap: row.owner_is_leap_month,
    year: row.owner_birth_year,
    month: row.owner_birth_month,
    day: row.owner_birth_day,
    timeIndex: row.owner_birth_time_index,
  };
}

export function birthFromEntryRow(row: BoardEntryRow): NormalizedBirth {
  return {
    name: row.nickname,
    gender: row.gender,
    calendar: row.calendar,
    leap: row.is_leap_month,
    year: row.birth_year,
    month: row.birth_month,
    day: row.birth_day,
    timeIndex: row.birth_time_index,
  };
}

/** 상대 사주를 계산해 나와의 궁합을 점수화합니다. */
export function buildPerson(
  engine: SajuEngine,
  me: SajuResult,
  input: {
    nickname: string;
    relation: BoardRelation;
    birth: NormalizedBirth;
    key?: string;
    serverId?: string;
    score?: number | null;
    label?: string | null;
  },
): BoardPerson {
  const partner = engine.computeSaju({
    name: input.nickname,
    gender: input.birth.gender,
    calendar: input.birth.calendar,
    leap: input.birth.leap,
    year: input.birth.year,
    month: input.birth.month,
    day: input.birth.day,
    timeIndex: input.birth.timeIndex,
  });
  const compatibility = engine.compatibility(me, partner);
  const score = input.score ?? compatibility.score;

  return {
    key: input.key ?? `local-${crypto.randomUUID()}`,
    serverId: input.serverId,
    nickname: input.nickname,
    relation: input.relation,
    birth: input.birth,
    score,
    label: input.label ?? compatibility.label,
    tag: chemistryTag(score),
    ganText: compatibility.ganText,
    zhiText: compatibility.zhiText,
    advice: compatibility.advice,
  };
}

/** 점수 내림차순 정렬 (동점이면 이름순) */
export function sortByScore(people: BoardPerson[]): BoardPerson[] {
  return [...people].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.nickname.localeCompare(b.nickname, "ko");
  });
}

/* ------------------------------------------------------------------ local */

const STORAGE_PREFIX = "saju-board:";

export interface StoredEntry {
  nickname: string;
  relation: BoardRelation;
  birth: NormalizedBirth;
}

export function ownerStorageKey(owner: NormalizedBirth): string {
  return `${STORAGE_PREFIX}${owner.calendar}-${owner.year}-${owner.month}-${owner.day}-${owner.timeIndex}-${owner.gender}`;
}

export function loadLocalEntries(owner: NormalizedBirth): StoredEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ownerStorageKey(owner));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is StoredEntry => {
      const record = item as Partial<StoredEntry> | null;
      return Boolean(record && record.nickname && record.birth);
    });
  } catch {
    return [];
  }
}

export function saveLocalEntries(
  owner: NormalizedBirth,
  entries: StoredEntry[],
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      ownerStorageKey(owner),
      JSON.stringify(entries.slice(-40)),
    );
  } catch {
    /* 저장 공간이 없으면 조용히 넘어갑니다. */
  }
}

/* --------------------------------------------------------------- display */

export function birthText(birth: NormalizedBirth): string {
  const cal = birth.calendar === "lunar" ? "음력" : "양력";
  const leap = birth.leap ? "(윤)" : "";
  const time =
    birth.timeIndex >= 0
      ? ` · ${TIME_OPTIONS[birth.timeIndex]?.label ?? ""}`
      : "";
  return `${cal} ${birth.year}.${String(birth.month).padStart(2, "0")}.${String(
    birth.day,
  ).padStart(2, "0")}${leap}${time}`;
}
