"use client";

import { useEffect, useState } from "react";

/** 막대 그래프가 0 → 목표값으로 자라나는 애니메이션용 상태 */
export function useGrow(delay = 120): boolean {
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setGrown(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return grown;
}
