"use client";

import type { SajuEngine, SajuResult } from "@/lib/saju/types";

interface Props {
  engine: SajuEngine;
  result: SajuResult;
}

export default function PillarsCard({ engine, result }: Props) {
  const order = ["year", "month", "day", "hour"] as const;

  const hintParts = [
    `일간 ${result.dayGan}(${result.dayGanHanja}) · ${result.animal}띠`,
  ];
  if (result.hasTime && result.pillars.hour) {
    hintParts.push(
      `시주 ${result.pillars.hour.gan}${result.pillars.hour.zhi}(${result.pillars.hour.ganHanja}${result.pillars.hour.zhiHanja})`,
    );
  } else {
    hintParts.push("태어난 시간을 몰라 시주를 제외한 6글자로 풀이했어요");
  }
  if (result.boundaryDay) {
    hintParts.push("태어난 날이 절입일이라 시각에 따라 년주·월주가 달라질 수 있어요");
  }

  return (
    <article className="card card--pillars reveal">
      <div className="card__head">
        <h3>
          사주팔자 <span className="card__small">四柱八字</span>
        </h3>
        {result.jieqi ? (
          <span className="chip chip--ghost">
            {result.jieqi.prevName} ~ {result.jieqi.nextName}
          </span>
        ) : null}
      </div>

      <div className="pillars">
        {order.map((key) => {
          const pillar = result.pillars[key];
          if (!pillar) {
            return (
              <div className="pillar pillar--empty" key={key}>
                <span className="pillar__label">시주</span>
                <div className="pillar__char" style={{ "--el": "#8A8F9C" } as React.CSSProperties}>
                  <b>?</b>
                  <small>時</small>
                </div>
                <span className="pillar__sipsin">모름</span>
              </div>
            );
          }

          return (
            <div
              className={`pillar${key === "day" ? " pillar--day" : ""}`}
              key={key}
            >
              <span className="pillar__label">{pillar.label}</span>
              <div
                className="pillar__char"
                style={
                  { "--el": engine.ELEM_INFO[pillar.ganElem].color } as React.CSSProperties
                }
              >
                <b>{pillar.gan}</b>
                <small>{pillar.ganHanja}</small>
                <span
                  className="char-badge"
                  style={
                    {
                      "--el": engine.ELEM_INFO[pillar.ganElem].color,
                      "--soft": engine.ELEM_INFO[pillar.ganElem].soft,
                    } as React.CSSProperties
                  }
                >
                  {pillar.ganElem}·{pillar.ganYang ? "양" : "음"}
                </span>
              </div>
              <div
                className="pillar__char"
                style={
                  { "--el": engine.ELEM_INFO[pillar.zhiElem].color } as React.CSSProperties
                }
              >
                <b>{pillar.zhi}</b>
                <small>{pillar.zhiHanja}</small>
                <span
                  className="char-badge"
                  style={
                    {
                      "--el": engine.ELEM_INFO[pillar.zhiElem].color,
                      "--soft": engine.ELEM_INFO[pillar.zhiElem].soft,
                    } as React.CSSProperties
                  }
                >
                  {pillar.zhiElem}·{pillar.zhiYang ? "양" : "음"}
                </span>
              </div>
              <span className="pillar__sipsin">
                {key === "day" ? "나 · 일간" : pillar.ganSipsin}
              </span>
            </div>
          );
        })}
      </div>

      <p className="hint">{hintParts.join(" · ")}</p>
    </article>
  );
}
