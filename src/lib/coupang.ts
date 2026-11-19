import { COUPANG_PARTNER_ID } from "@/lib/env";
import type { Element } from "@/lib/saju/types";

/** 공정거래위원회가 요구하는 쿠팡 파트너스 고지 문구 (수익화 페이지 필수) */
export const COUPANG_DISCLOSURE =
  "이 페이지는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.";

/**
 * 개운템 링크.
 * - 엔진의 COUPANG_LINK_MAP 에 직접 만든 단축 링크가 있으면 그 링크를 우선 사용합니다.
 * - 없으면 쿠팡 검색 링크에 파트너스 추적 ID(lptag)와 subId 를 붙여 만듭니다.
 */
export function coupangItemUrl(
  elem: Element,
  index: number,
  query: string,
  linkMap?: Record<string, string>,
): string {
  const custom = linkMap?.[`${elem}_${index}`];
  if (custom) return custom;

  const params = new URLSearchParams({
    q: query,
    lptag: COUPANG_PARTNER_ID,
    subId: `saju_${elem}_${index + 1}`,
  });
  return `https://www.coupang.com/np/search?${params.toString()}`;
}
