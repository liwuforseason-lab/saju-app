"use client";

import { COUPANG_DISCLOSURE, coupangItemUrl } from "@/lib/coupang";
import type { SajuEngine, SajuResult } from "@/lib/saju/types";

interface Props {
  engine: SajuEngine;
  result: SajuResult;
}

export default function ItemsCard({ engine, result }: Props) {
  const o = result.ohaeng;
  const elem = o.missing.length ? o.missing[0] : o.weakest;
  const info = engine.ELEM_INFO[elem];
  const items = engine.LUCKY_ITEMS[elem] ?? [];

  const intro = o.missing.length
    ? `사주에 ${elem} 기운이 없어요. ${elem} 기운을 곁에 두면 부족한 흐름을 채울 수 있어요.`
    : `가장 약한 ${elem} 기운을 채워 주는 아이템이에요. ${info.keyword}의 기운을 일상에 더해 보세요.`;

  return (
    <article className="card card--items reveal">
      <div className="card__head">
        <h3>
          <span>
            {elem}({info.hanja})
          </span>{" "}
          개운템
        </h3>
        <span className="card__sub">부족한 기운 채우기</span>
      </div>
      <p className="body">{intro}</p>

      <div className="items">
        {items.map((item, index) => (
          <a
            className="item"
            key={item.name}
            href={coupangItemUrl(elem, index, item.query, engine.COUPANG_LINK_MAP)}
            target="_blank"
            rel="noopener noreferrer sponsored"
          >
            <span className="item__emoji" aria-hidden="true">
              {item.emoji}
            </span>
            <span className="item__body">
              <span className="item__name">{item.name}</span>
              <span className="item__desc">{item.desc}</span>
            </span>
            <span className="item__cta">쿠팡에서 보기 →</span>
          </a>
        ))}
      </div>

      <p className="disclosure">{COUPANG_DISCLOSURE}</p>
    </article>
  );
}
