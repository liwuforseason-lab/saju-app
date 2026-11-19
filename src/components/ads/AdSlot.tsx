"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import {
  ADSENSE_CLIENT,
  ADSENSE_SLOT_RESULT_BOTTOM,
  ADSENSE_SLOT_RESULT_TOP,
  ADFIT_UNIT,
} from "@/lib/env";

type AdVariant = "loading" | "result-top" | "result-bottom";

interface AdSlotProps {
  variant: AdVariant;
}

/**
 * 광고 슬롯.
 * 1) 애드센스: NEXT_PUBLIC_ADSENSE_CLIENT + 슬롯 ID 가 있으면 실제 광고
 * 2) 카카오 애드핏: NEXT_PUBLIC_ADFIT_UNIT 이 있으면 애드핏
 * 3) 아무것도 없으면 기존 디자인의 "광고 영역" 자리 표시
 */
export default function AdSlot({ variant }: AdSlotProps) {
  const insRef = useRef<HTMLModElement | null>(null);

  const adSlot =
    variant === "result-top"
      ? ADSENSE_SLOT_RESULT_TOP
      : variant === "result-bottom"
        ? ADSENSE_SLOT_RESULT_BOTTOM
        : "";
  const useAdsense = Boolean(ADSENSE_CLIENT && adSlot);

  useEffect(() => {
    if (!useAdsense) return;
    const el = insRef.current;
    // StrictMode 재마운트나 재렌더에서 같은 슬롯을 두 번 채우지 않습니다.
    if (!el || el.getAttribute("data-adsbygoogle-status")) return;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
    } catch {
      /* 광고 스크립트가 아직 없으면 다음 렌더에서 재시도됩니다. */
    }
  }, [useAdsense]);

  if (useAdsense) {
    return (
      <div className="ad-slot ad-slot--live" data-ad-slot={variant}>
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: "block", width: "100%" }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={adSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  if (ADFIT_UNIT) {
    return (
      <div className="ad-slot ad-slot--live" data-ad-slot={variant}>
        <ins
          className="kakao_ad_area"
          style={{ display: "none" }}
          data-ad-unit={ADFIT_UNIT}
          data-ad-width="320"
          data-ad-height="100"
        />
        <Script
          src="https://t1.daumcdn.net/kas/static/ba.min.js"
          strategy="afterInteractive"
        />
      </div>
    );
  }

  return (
    <div
      className={`ad-slot${variant === "loading" ? " ad-slot--loading" : ""}`}
      data-ad-slot={variant}
      aria-hidden="true"
    >
      <span className="ad-slot__label">AD</span>
      <span className="ad-slot__placeholder">광고 영역</span>
    </div>
  );
}
