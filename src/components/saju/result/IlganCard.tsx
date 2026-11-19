"use client";

import type { SajuEngine, SajuResult } from "@/lib/saju/types";

interface Props {
  engine: SajuEngine;
  result: SajuResult;
}

export default function IlganCard({ engine, result }: Props) {
  const info = result.ilgan;
  const element = engine.GAN_ELEM[engine.GAN.indexOf(result.dayGan)];
  const elementInfo = engine.ELEM_INFO[element];

  return (
    <article className="card card--ilgan reveal">
      <div className="ilgan-hero">
        <span className="ilgan-emoji" aria-hidden="true">
          {info.emoji}
        </span>
        <div>
          <p className="kicker">
            나를 대표하는 기운 · {result.dayGan}일간({result.dayGanHanja}) ·{" "}
            {elementInfo.keyword}
          </p>
          <h3>{info.title}</h3>
          <p className="ilgan-oneline">{info.oneLine}</p>
        </div>
      </div>

      <p className="body">{info.desc}</p>

      <div className="tags">
        {info.keyword.map((keyword) => (
          <span key={keyword}>#{keyword}</span>
        ))}
        <span>#{result.strength}</span>
      </div>

      <div className="two-col">
        <div>
          <h4>이런 점이 강해요</h4>
          <ul className="tick-list">
            {info.strong.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4>이런 점은 조심</h4>
          <ul className="dash-list">
            {info.weak.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
