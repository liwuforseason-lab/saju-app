"use client";

import { useMemo, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { YEAR_MAX, YEAR_MIN } from "@/lib/form";
import type { Compatibility, SajuEngine, SajuResult } from "@/lib/saju/types";

interface Props {
  engine: SajuEngine;
  result: SajuResult;
}

export default function GunghapCard({ engine, result }: Props) {
  const { show } = useToast();
  const [year, setYear] = useState(2000);
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);
  const [outcome, setOutcome] = useState<{
    compatibility: Compatibility;
    partner: SajuResult;
  } | null>(null);

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = YEAR_MAX; y >= YEAR_MIN; y -= 1) list.push(y);
    return list;
  }, []);

  const maxDay = new Date(year, month, 0).getDate();
  const safeDay = Math.min(day, maxDay);

  const run = () => {
    try {
      const partner = engine.computeSaju({
        name: "",
        gender: "n",
        calendar: "solar",
        leap: false,
        year,
        month,
        day: safeDay,
        timeIndex: -1,
      });
      setOutcome({ compatibility: engine.compatibility(result, partner), partner });
    } catch (error) {
      show(
        error instanceof Error
          ? error.message
          : "궁합을 계산하지 못했어요. 생년월일을 확인해 주세요.",
      );
    }
  };

  const me = result.input.name || "나";

  return (
    <article className="card reveal" id="gunghapCard">
      <div className="card__head">
        <h3>
          궁합 보기 <span className="card__small">宮合</span>
        </h3>
        <span className="card__sub">상대의 기운과 맞춰보기</span>
      </div>
      <p className="body">
        상대방의 생년월일을 넣으면 두 사람의 일간·일지가 어떻게 만나는지
        풀어드려요.
      </p>

      <div className="date-row date-row--compact">
        <div className="select-wrap">
          <select
            className="select"
            aria-label="상대 태어난 해"
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
          >
            {years.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <span className="select-suffix">년</span>
        </div>
        <div className="select-wrap">
          <select
            className="select"
            aria-label="상대 태어난 달"
            value={month}
            onChange={(event) => setMonth(Number(event.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <span className="select-suffix">월</span>
        </div>
        <div className="select-wrap">
          <select
            className="select"
            aria-label="상대 태어난 날"
            value={safeDay}
            onChange={(event) => setDay(Number(event.target.value))}
          >
            {Array.from({ length: maxDay }, (_, i) => i + 1).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <span className="select-suffix">일</span>
        </div>
      </div>

      <button className="btn btn--soft btn--full" type="button" onClick={run}>
        궁합 보기
      </button>

      {outcome ? (
        <div className="gunghap-result">
          <div className="gunghap-score">
            <span className="gunghap-score__num">
              {outcome.compatibility.score}
            </span>
            <div>
              <div className="gunghap-score__label">
                {outcome.compatibility.label}
              </div>
              <div className="gunghap-score__sub">
                {me} {result.dayGan}({result.dayGanHanja}) · 상대{" "}
                {outcome.partner.dayGan}({outcome.partner.dayGanHanja})
              </div>
            </div>
          </div>
          <p>{outcome.compatibility.ganText}</p>
          <p>
            일지로 보는 관계: <strong>{outcome.compatibility.zhiText}</strong>
          </p>
          <ul>
            {outcome.compatibility.advice.map((advice) => (
              <li key={advice}>{advice}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
