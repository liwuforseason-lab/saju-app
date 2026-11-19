"use client";

import { useEffect, useRef } from "react";
import AdSlot from "@/components/ads/AdSlot";
import SiteFooter from "@/components/SiteFooter";
import BottomTabs from "@/components/kid/BottomTabs";
import { dateSummary } from "@/lib/form";
import type { SajuEngine, SajuResult } from "@/lib/saju/types";
import PillarsCard from "./result/PillarsCard";
import OhaengCard from "./result/OhaengCard";
import IlganCard from "./result/IlganCard";
import FortuneCard from "./result/FortuneCard";
import YearsCard from "./result/YearsCard";
import TodayCard from "./result/TodayCard";
import DeepReportCard from "./result/DeepReportCard";
import ItemsCard from "./result/ItemsCard";
import GunghapCard from "./result/GunghapCard";
import BoardCta from "./result/BoardCta";
import ShareCard from "./result/ShareCard";
import ResultActions from "./result/ResultActions";

interface Props {
  engine: SajuEngine;
  result: SajuResult;
  onRestart: () => void;
}

export default function ResultScreen({ engine, result, onRestart }: Props) {
  const rootRef = useRef<HTMLElement | null>(null);

  // 카드가 스크롤에 맞춰 나타나는 모션 (기존 사이트와 동일한 효과)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const cards = Array.from(root.querySelectorAll<HTMLElement>(".reveal"));
    cards.slice(0, 2).forEach((card) => card.classList.add("is-visible"));

    if (!("IntersectionObserver" in window)) {
      cards.forEach((card) => card.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 },
    );

    cards.forEach((card) => observer.observe(card));

    const safety = setTimeout(() => {
      cards.forEach((card) => card.classList.add("is-visible"));
    }, 2800);

    return () => {
      observer.disconnect();
      clearTimeout(safety);
    };
  }, []);

  const scrollToShare = () => {
    document
      .getElementById("share-card")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const timeLabel =
    result.hasTime && result.input.timeIndex >= 0
      ? engine.TIME_OPTIONS[result.input.timeIndex]
      : undefined;

  const title = result.input.name
    ? `${result.input.name} 님의 사주`
    : "나의 사주";

  return (
    <section
      className="screen is-active"
      id="screen-result"
      data-screen="result"
      ref={rootRef}
    >
      <div className="screen-head screen-head--result">
        <button className="icon-btn" type="button" aria-label="다시 하기" onClick={onRestart}>
          ←
        </button>
        <div>
          <p className="kicker">{dateSummary(result, timeLabel)}</p>
          <h2>{title}</h2>
        </div>
        <button
          className="icon-btn"
          type="button"
          aria-label="결과 공유"
          onClick={scrollToShare}
        >
          ↗
        </button>
      </div>

      <ResultActions engine={engine} result={result} />

      <PillarsCard engine={engine} result={result} />
      <OhaengCard engine={engine} result={result} />

      <AdSlot variant="result-top" />

      <IlganCard engine={engine} result={result} />
      <FortuneCard result={result} />
      <YearsCard result={result} />

      <DeepReportCard engine={engine} result={result} />

      <TodayCard result={result} />
      <ItemsCard engine={engine} result={result} />
      <GunghapCard engine={engine} result={result} />
      <BoardCta engine={engine} result={result} />
      <ShareCard engine={engine} result={result} />

      <AdSlot variant="result-bottom" />

      <div className="signoff reveal">
        <picture>
          <source srcSet="/assets/result-mascot.webp" type="image/webp" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/result-mascot.jpg"
            alt="수정 구슬을 들여다보는 토끼 캐릭터"
            width={104}
            height={104}
            loading="lazy"
          />
        </picture>
        <p>오늘도 좋은 기운이 함께하길 바랄게요.</p>
      </div>

      <SiteFooter />
      <BottomTabs />
    </section>
  );
}
