"use client";

import Link from "next/link";
import type { SajuEngine, SajuResult } from "@/lib/saju/types";

interface Props {
  engine: SajuEngine;
  result: SajuResult;
}

/** 결과 화면에서 바로 궁합 보드로 이어지는 카드 (바이럴 동선) */
export default function BoardCta({ engine, result }: Props) {
  const query = engine.toShareParams(result);

  return (
    <article className="card board-cta reveal">
      <div className="card__head">
        <h3>
          궁합 줄세우기 <span className="card__small">宮合 Ranking</span>
        </h3>
        <span className="card__sub">친구 초대</span>
      </div>
      <p className="body">
        이 사주를 가운데 두고 친구·연인·최애의 궁합을 점수 순으로 줄 세워 보세요.
        초대 링크를 보내면 친구가 직접 자기 순위를 확인할 수 있어요.
      </p>
      <Link className="btn btn--primary btn--full" href={`/board?${query}`}>
        내 궁합 보드 만들기 <span className="btn__arrow">→</span>
      </Link>
    </article>
  );
}
