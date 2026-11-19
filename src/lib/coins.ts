/**
 * 유료 상품(리포트) 카탈로그 · 코인 충전 패키지.
 * 서버(결제·잠금해제 API)와 클라이언트(화면)가 같은 값을 쓰도록 한 곳에 모읍니다.
 * 금액과 코인 수는 반드시 이 파일의 값을 기준으로 검증합니다.
 */

export type ReportType =
  | "saju"
  | "newyear"
  | "love"
  | "gunghap"
  | "daewoon"
  | "yeonwoon";

export type Accent = "peach" | "pink" | "mint" | "blue" | "lavender" | "yellow";

export interface Product {
  type: ReportType;
  /** 카드에 보이는 이름 */
  title: string;
  /** 카드 아래 한 줄 소개 */
  tagline: string;
  coins: number;
  /** 할인 표시용(정가 코인) */
  originalCoins?: number;
  badge?: string;
  image: string;
  accent: Accent;
  emoji: string;
  /** 입력 폼 위에 보여 줄 안내 */
  lead: string;
}

/** 1코인 = 990원 기준 */
export const COIN_PRICE_KRW = 990;

export const PRODUCTS: Product[] = [
  {
    type: "saju",
    title: "990원 사주",
    tagline: "용하다는 소문난 사주 해설",
    coins: 1,
    image: "/assets/kid/saju.webp",
    accent: "peach",
    emoji: "🔮",
    lead: "태어난 여덟 글자로 성격·재물·직업·애정·건강까지 8개 장으로 풀어 드려요.",
  },
  {
    type: "newyear",
    title: "2027 신년운세",
    tagline: "2027년 내 흐름 미리보기",
    coins: 1,
    badge: "NEW",
    image: "/assets/kid/newyear.webp",
    accent: "pink",
    emoji: "🎊",
    lead: "2027 정미년, 재물·일·사랑·건강과 월별 흐름을 미리 짚어 드려요.",
  },
  {
    type: "love",
    title: "연애운",
    tagline: "썸·결혼운·재회운 한 번에",
    coins: 2,
    originalCoins: 3,
    badge: "2코인 특가",
    image: "/assets/kid/love.webp",
    accent: "pink",
    emoji: "💗",
    lead: "이상형부터 결혼운, 재회운까지 — 내 사주에 새겨진 인연의 결을 읽어요.",
  },
  {
    type: "gunghap",
    title: "990원 궁합",
    tagline: "우리 둘, 몇 점일까?",
    coins: 1,
    image: "/assets/kid/gunghap.webp",
    accent: "mint",
    emoji: "💞",
    lead: "두 사람의 생년월일로 기본 케미는 무료, 심화 리포트는 1코인으로 열려요.",
  },
  {
    type: "daewoon",
    title: "990원 대운",
    tagline: "10년 단위 큰 흐름",
    coins: 1,
    image: "/assets/kid/daewoon.webp",
    accent: "blue",
    emoji: "🎡",
    lead: "앞으로 80년을 10년 단위로 나눠, 언제 힘이 실리고 언제 쉬어야 하는지 알려 드려요.",
  },
  {
    type: "yeonwoon",
    title: "990원 연운",
    tagline: "올해 월별 운세",
    coins: 1,
    image: "/assets/kid/yeonwoon.webp",
    accent: "lavender",
    emoji: "🌙",
    lead: "2026년 남은 달과 2027년 초, 달마다의 기회와 주의점을 짚어 드려요.",
  },
];

export const REPORT_COINS: Record<ReportType, number> = PRODUCTS.reduce(
  (acc, product) => {
    acc[product.type] = product.coins;
    return acc;
  },
  {} as Record<ReportType, number>,
);

export function isReportType(value: string): value is ReportType {
  return Object.prototype.hasOwnProperty.call(REPORT_COINS, value);
}

export function productOf(type: string): Product | undefined {
  return PRODUCTS.find((product) => product.type === type);
}

/** 리포트 잠금해제 코인 (서버 검증용) */
export function coinsFor(type: string): number {
  return isReportType(type) ? REPORT_COINS[type] : 0;
}

export interface CoinPackage {
  id: string;
  coins: number;
  priceKrw: number;
  label: string;
  bonus?: string;
  recommended?: boolean;
}

export const COIN_PACKAGES: CoinPackage[] = [
  { id: "coin1", coins: 1, priceKrw: 990, label: "1코인" },
  { id: "coin3", coins: 3, priceKrw: 2700, label: "3코인" },
  {
    id: "coin5",
    coins: 5,
    priceKrw: 4400,
    label: "5코인",
    bonus: "10% 더",
    recommended: true,
  },
  { id: "coin10", coins: 10, priceKrw: 8500, label: "10코인", bonus: "14% 더" },
];

export function packageOf(id: string): CoinPackage | undefined {
  return COIN_PACKAGES.find((pack) => pack.id === id);
}

/** 990 → "990원", 4400 → "4,400원" */
export function won(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

/** 화면 표시용 상품 가격 (코인 × 990원) */
export function productPriceKrw(product: Product): number {
  return product.coins * COIN_PRICE_KRW;
}

/**
 * 리포트 잠금해제 키 — 같은 사주면 같은 키가 나오도록 생년월일시로 만듭니다.
 * 예: 19990422-6-f
 */
export function reportTargetKey(input: {
  year: number;
  month: number;
  day: number;
  timeIndex: number;
  gender: string;
  calendar?: string;
  leap?: boolean;
}): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const cal = input.calendar === "lunar" ? "l" : "s";
  const leap = input.calendar === "lunar" && input.leap ? "y" : "n";
  return [
    `${input.year}${pad(input.month)}${pad(input.day)}`,
    `t${input.timeIndex}`,
    input.gender || "n",
    `${cal}${leap}`,
  ].join("-");
}

/** 오늘 날짜 키 (오늘의 무료 운세 1회 제한) */
export function dayKey(date = new Date()): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
