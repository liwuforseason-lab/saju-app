"use client";

import type { SajuResult } from "@/lib/saju/types";
import { useGrow } from "./useGrow";

interface Props {
  result: SajuResult;
}

const DEFS = [
  { key: "money", label: "재물운", icon: "💰" },
  { key: "love", label: "연애운", icon: "💗" },
  { key: "work", label: "직업 · 사업운", icon: "💼" },
] as const;

export default function FortuneCard({ result }: Props) {
  const grown = useGrow();

  return (
    <article className="card reveal">
      <div className="card__head">
        <h3>올해의 세 가지 운</h3>
        <span className="card__sub">2026 병오년 기준</span>
      </div>

      <div className="fortune-list">
        {DEFS.map((def) => {
          const fortune = result.fortune[def.key];
          return (
            <div className="fortune" key={def.key}>
              <div className="fortune__top">
                <span className="fortune__name">
                  <span aria-hidden="true">{def.icon}</span>
                  {def.label}
                </span>
                <span className="fortune__score">
                  {fortune.score} <em>{fortune.band.label}</em>
                </span>
              </div>
              <div className="fortune__bar">
                <span
                  data-tone={fortune.band.tone}
                  style={{ width: grown ? `${fortune.score}%` : 0 }}
                />
              </div>
              <p>{fortune.text}</p>
            </div>
          );
        })}
      </div>
    </article>
  );
}
