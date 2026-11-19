"use client";

import type { SajuEngine, SajuResult } from "@/lib/saju/types";
import { useGrow } from "./useGrow";

interface Props {
  engine: SajuEngine;
  result: SajuResult;
}

export default function OhaengCard({ engine, result }: Props) {
  const grown = useGrow();
  const o = result.ohaeng;
  const strongCount = o.counts[o.strongest];

  const notes: string[] = [];
  if (o.missing.length) {
    notes.push(
      `${o.missing.join(" · ")} 기운이 아예 없어요. ${engine.ELEM_INFO[o.missing[0]].lack}`,
    );
  } else if (strongCount <= 1) {
    notes.push(
      `${o.weakest} 기운이 가장 약해요. ${engine.ELEM_INFO[o.weakest].lack}`,
    );
  }
  if (strongCount >= 3) {
    notes.push(
      `${o.strongest} 기운이 ${strongCount}개로 강한 편이에요. ${engine.ELEM_INFO[o.strongest].excess}`,
    );
  }
  if (!notes.length) {
    notes.push(
      "다섯 기운이 고르게 섞여 있어요. 어떤 상황에서도 균형을 잃지 않는 편안한 사주예요.",
    );
  }

  return (
    <article className="card reveal">
      <div className="card__head">
        <h3>
          오행의 균형 <span className="card__small">五行</span>
        </h3>
        <span className="card__sub">
          {o.total}글자 · 양 {o.yang} 음 {o.yin}
        </span>
      </div>

      <div className="ohaeng">
        {engine.ELEMS.map((elem) => {
          const info = engine.ELEM_INFO[elem];
          const percent = o.percent[elem];
          return (
            <div className="ohaeng-row" key={elem}>
              <span
                className="ohaeng-row__name"
                style={{ "--el": info.color } as React.CSSProperties}
              >
                {elem}
                <small>{info.hanja}</small>
              </span>
              <div className="ohaeng-row__track">
                <span
                  className="ohaeng-row__fill"
                  style={{
                    "--el": info.color,
                    width: grown ? `${percent}%` : 0,
                  } as React.CSSProperties}
                />
              </div>
              <span className="ohaeng-row__val">
                {o.counts[elem]}개 · {percent}%
              </span>
            </div>
          );
        })}
      </div>

      <div className="ohaeng__note">
        {notes.map((note) => (
          /* 문장 안의 오행 이름을 굵게 보여 주기 위해 첫 단어를 분리 */
          <p key={note}>{note}</p>
        ))}
      </div>
    </article>
  );
}
