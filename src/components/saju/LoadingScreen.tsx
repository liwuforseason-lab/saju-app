"use client";

import { useEffect, useRef, useState } from "react";
import AdSlot from "@/components/ads/AdSlot";

const LOADING_STEPS = [
  { text: "생년월일을 절기로 나누는 중…", percent: 22 },
  { text: "천간과 지지, 여덟 글자를 세우는 중…", percent: 46 },
  { text: "오행의 균형을 재는 중…", percent: 68 },
  { text: "2026 병오년의 기운을 읽는 중…", percent: 88 },
  { text: "풀이를 정리하고 있어요", percent: 100 },
];

export default function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [percent, setPercent] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    let alive = true;
    const timers: ReturnType<typeof setTimeout>[] = [];

    let index = 0;
    const tick = () => {
      if (!alive) return;
      if (index >= LOADING_STEPS.length) {
        timers.push(
          setTimeout(() => {
            if (alive && !doneRef.current) {
              doneRef.current = true;
              onDone();
            }
          }, 260),
        );
        return;
      }
      const current = LOADING_STEPS[index];
      setStep(index);
      setPercent(current.percent);
      index += 1;
      timers.push(setTimeout(tick, index === 1 ? 420 : 480));
    };

    timers.push(setTimeout(tick, 220));

    return () => {
      alive = false;
      timers.forEach(clearTimeout);
    };
  }, [onDone]);

  return (
    <section className="screen is-active" id="screen-loading" data-screen="loading">
      <div className="loading">
        <div className="orb" aria-hidden="true">
          <span className="orb__ring orb__ring--1" />
          <span className="orb__ring orb__ring--2" />
          <span className="orb__core">✦</span>
        </div>
        <p className="loading__step">{LOADING_STEPS[step]?.text ?? ""}</p>
        <div className="loading__bar">
          <span style={{ width: `${percent}%` }} />
        </div>
        <p className="loading__hint">여덟 글자를 세우고 오행의 균형을 재고 있어요</p>
        <AdSlot variant="loading" />
      </div>
    </section>
  );
}
