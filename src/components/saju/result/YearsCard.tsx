"use client";

import type { SajuResult } from "@/lib/saju/types";

export default function YearsCard({ result }: { result: SajuResult }) {
  return (
    <article className="card reveal">
      <div className="card__head">
        <h3>2026 · 2027년 흐름</h3>
        <span className="card__sub">세운(歲運)</span>
      </div>

      <div className="year-list">
        {result.years.map((year) => (
          <div className="year" key={year.year}>
            <div className="year__top">
              <span className="year__num">{year.year}</span>
              <span className="year__ganja">
                {year.ganjaHanja} · {year.animal}의 해 · {year.sipsin}
              </span>
              <span className="year__score">
                {year.score}점 {year.band.label}
              </span>
            </div>
            <p>{year.text}</p>
            <div className="year__zhi">일지와의 관계: {year.zhiNote}</div>
          </div>
        ))}
      </div>
    </article>
  );
}
