"use client";

import type { SajuResult } from "@/lib/saju/types";

export default function TodayCard({ result }: { result: SajuResult }) {
  const today = result.today;

  return (
    <article className="card card--today reveal">
      <div className="card__head">
        <h3>오늘의 운세</h3>
        <span className="card__sub">
          {today ? `${today.date} · ${today.ganjaHanja}일` : "계산 불가"}
        </span>
      </div>

      {today ? (
        <>
          <div className="today">
            <div className="today__score">
              <strong>{today.score}</strong>
              <span>점</span>
              <em>{today.band.label}</em>
            </div>
            <div className="today__body">
              <p className="today__ganja">
                오늘의 일진 {today.ganja}({today.ganjaHanja}) · {today.sipsin}
              </p>
              <p>
                {today.text} {today.zhiText}
              </p>
            </div>
          </div>
          <div className="lucky-row">
            <div className="lucky">
              <span
                className="lucky__dot"
                style={{ background: today.lucky.color.hex }}
              />
              <b>{today.lucky.color.name}</b>
              <small>행운의 색</small>
            </div>
            <div className="lucky">
              <b className="lucky__big">{today.lucky.number}</b>
              <small>행운의 숫자</small>
            </div>
            <div className="lucky">
              <b>{today.lucky.hour}</b>
              <small>좋은 시간</small>
            </div>
          </div>
        </>
      ) : (
        <p className="body">
          오늘의 일진을 계산하지 못했어요. 잠시 후 다시 확인해 주세요.
        </p>
      )}
    </article>
  );
}
