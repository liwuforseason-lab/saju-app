/**
 * 만세력 엔진(saju-engine.js)의 입출력 타입.
 * 엔진 자체는 검증된 기존 JS 를 그대로 옮겨 왔고, 이 파일은 경계에서만 타입을 붙입니다.
 */

export type Element = "목" | "화" | "토" | "금" | "수";
export type Gender = "n" | "f" | "m";
export type Calendar = "solar" | "lunar";
export type BandTone = "up" | "mid" | "down";

export interface SajuInput {
  name?: string;
  gender: Gender;
  calendar: Calendar;
  leap: boolean;
  year: number;
  month: number;
  day: number;
  /** 0~11 = 자시~해시, -1 = 모름 */
  timeIndex: number;
}

export interface Band {
  label: string;
  tone: BandTone;
}

export interface Pillar {
  key: "year" | "month" | "day" | "time";
  label: string;
  gan: string;
  zhi: string;
  ganHanja: string;
  zhiHanja: string;
  ganRomaja: string;
  ganElem: Element;
  zhiElem: Element;
  ganYang: boolean;
  zhiYang: boolean;
  ganSipsin: string;
  zhiSipsin: string;
  animal: string;
}

export interface ElementInfo {
  hanja: string;
  color: string;
  soft: string;
  icon: string;
  keyword: string;
  nature: string;
  lack: string;
  excess: string;
}

export interface IlganInfo {
  title: string;
  emoji: string;
  keyword: string[];
  oneLine: string;
  desc: string;
  strong: string[];
  weak: string[];
  money: string;
  love: string;
  work: string;
}

export interface LuckyItem {
  name: string;
  desc: string;
  query: string;
  emoji: string;
}

export interface Ohaeng {
  counts: Record<Element, number>;
  percent: Record<Element, number>;
  total: number;
  strongest: Element;
  weakest: Element;
  missing: Element[];
  yin: number;
  yang: number;
}

export interface YearFortune {
  year: number;
  gan: string;
  zhi: string;
  ganja: string;
  ganjaHanja: string;
  animal: string;
  sipsin: string;
  score: number;
  band: Band;
  text: string;
  zhiNote: string;
}

export interface TodayFortune {
  date: string;
  ganja: string;
  ganjaHanja: string;
  sipsin: string;
  score: number;
  band: Band;
  text: string;
  zhiText: string;
  lucky: {
    color: { name: string; hex: string };
    number: number;
    hour: string;
  };
}

export interface Jieqi {
  prevName: string;
  prevDate: string;
  nextName: string;
  nextDate: string;
}

export interface SajuResult {
  input: {
    name: string;
    gender: Gender;
    timeIndex: number;
    calendar: Calendar;
    leap: boolean;
  };
  solar: { year: number; month: number; day: number };
  lunar: { year: number; month: number; day: number; leap: boolean } | null;
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar | null;
  };
  letters: { gan: string; zhi: string }[];
  dayGan: string;
  dayZhi: string;
  dayGanHanja: string;
  dayZhiHanja: string;
  animal: string;
  ohaeng: Ohaeng;
  ilgan: IlganInfo;
  sipsinCounts: Record<string, number>;
  groupCounts: Record<string, number>;
  strength: "신강" | "중화" | "신약";
  strengthRatio: number;
  strengthText: string;
  hasTime: boolean;
  fortune: {
    money: { score: number; band: Band; text: string };
    love: { score: number; band: Band; text: string };
    work: { score: number; band: Band; text: string };
  };
  years: YearFortune[];
  today: TodayFortune | null;
  jieqi: Jieqi | null;
  boundaryDay: boolean;
}

export interface Compatibility {
  score: number;
  label: string;
  ganText: string;
  zhiText: string;
  zhiType: string;
  complement: number;
  advice: string[];
}

export interface TimeOption {
  index: number;
  label: string;
  hanja: string;
  range: string;
}

export interface SajuEngine {
  ELEMS: Element[];
  ELEM_INFO: Record<Element, ElementInfo>;
  GAN: string[];
  GAN_HANJA: string[];
  ZHI: string[];
  ZHI_HANJA: string[];
  ZHI_ANIMAL: string[];
  ZHI_HOUR_LABEL: string[];
  GAN_ELEM: Element[];
  TIME_OPTIONS: TimeOption[];
  ILGAN_INFO: Record<string, IlganInfo>;
  LUCKY_ITEMS: Record<Element, LuckyItem[]>;
  LUCKY_COLOR: Record<Element, { name: string; hex: string }>;
  COUPANG_PARTNER_ID: string;
  COUPANG_LINK_MAP: Record<string, string>;
  computeSaju(input: SajuInput): SajuResult;
  compatibility(a: SajuResult, b: SajuResult): Compatibility;
  summaryText(result: SajuResult): string;
  toShareParams(result: SajuResult): string;
  sipsinOf(dayGanIndex: number, targetGanIndex: number): string;
  zhiRelation(
    a: string,
    b: string,
  ): { type: string; score: number; text: string };
}
