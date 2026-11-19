"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AuthChip from "@/components/auth/AuthChip";
import BirthFields, { EMPTY_BIRTH, type BirthValue } from "@/components/board/BirthFields";
import BottomTabs from "@/components/kid/BottomTabs";
import CoinBadge from "@/components/kid/CoinBadge";
import KidFooter from "@/components/kid/KidFooter";
import { PRODUCTS, dayKey, productPriceKrw } from "@/lib/coins";
import type { SajuEngine, SajuResult } from "@/lib/saju/types";

const BAND_TIP: Record<string, string[]> = {
  up: [
    "먼저 연락하고 먼저 제안하세요. 오늘은 그쪽이 이깁니다.",
    "미뤄 둔 결정을 오늘 정하면 다음 주가 편해져요.",
    "작게 베푼 것이 크게 돌아오는 날이에요.",
  ],
  mid: [
    "새로 시작하기보다 정리하고 다지면 좋은 날이에요.",
    "욕심을 반만 내려놓으면 하루가 부드러워져요.",
    "약속 시간 10분 먼저 도착해 보세요. 흐름이 달라져요.",
  ],
  down: [
    "말을 한 번만 더 곱씹고 내보내세요.",
    "큰 결제와 큰 결정은 내일로 미루는 게 좋아요.",
    "몸이 먼저 신호를 보내요. 일찍 쉬는 게 최고의 개운법이에요.",
  ],
};

function pad2(value: number): string {
  return value < 10 ? `0${value}` : `${value}`;
}

export default function TodayScreen() {
  const [engine, setEngine] = useState<SajuEngine | null>(null);
  const [name, setName] = useState("");
  const [birth, setBirth] = useState<BirthValue>(EMPTY_BIRTH);
  const [result, setResult] = useState<SajuResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    void import("@/lib/saju").then((module) => setEngine(module.Saju));
  }, []);

  const draw = useCallback(async () => {
    if (!engine) return;
    setBusy(true);
    setError(null);
    try {
      const computed = engine.computeSaju({
        name: name.trim(),
        gender: birth.gender,
        calendar: birth.calendar,
        leap: birth.calendar === "lunar" ? birth.leap : false,
        year: birth.year,
        month: birth.month,
        day: birth.day,
        timeIndex: birth.timeIndex,
      });
      if (!computed.today) throw new Error("오늘의 일진을 계산하지 못했어요.");
      setResult(computed);

      const key = `saju-today:${dayKey()}:${birth.year}${pad2(birth.month)}${pad2(birth.day)}`;
      try {
        const seen = window.localStorage.getItem(key);
        setNote(seen ? "오늘 이미 뽑은 운세예요. 하루에 한 번, 다음 날 새 운세가 와요." : null);
        window.localStorage.setItem(key, "1");
      } catch {
        setNote(null);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "생년월일을 다시 확인해 주세요.");
    } finally {
      setBusy(false);
    }
  }, [birth, engine, name]);

  const today = result?.today ?? null;
  const tips = today ? BAND_TIP[today.band.tone] ?? BAND_TIP.mid : [];
  const tip = tips[(result?.solar.day ?? 1) % tips.length];

  return (
    <>
      <main className="app app--kid">
        <header className="kid-topbar">
          <Link className="kid-back" href="/" prefetch={false} aria-label="홈으로">
            ←
          </Link>
          <Link className="kid-brand kid-brand--small" href="/" prefetch={false}>
            <span className="kid-brand__mark" aria-hidden="true">✦</span>
            <b>오늘의 운세</b>
          </Link>
          <div className="kid-topbar__right">
            <CoinBadge />
            <AuthChip />
          </div>
        </header>

        <section className="today-hero">
          <p className="today-hero__kicker">
            {new Intl.DateTimeFormat("ko-KR", {
              month: "long",
              day: "numeric",
              weekday: "long",
            }).format(new Date())}
          </p>
          <h1>
            오늘 하루,
            <br />
            <em>기운이 어디로 흐를까요?</em>
          </h1>
          <p>생년월일을 넣으면 일진과의 관계로 오늘의 흐름을 짚어 드려요. 무료예요.</p>
        </section>

        {!result ? (
          <section className="card">
            <div className="field field--tight">
              <label className="field__label" htmlFor="today-name">
                이름 (선택)
              </label>
              <input
                className="input"
                id="today-name"
                type="text"
                maxLength={12}
                placeholder="예: 무아"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <BirthFields value={birth} onChange={(patch) => setBirth((prev) => ({ ...prev, ...patch }))} idPrefix="today" />
            {error ? (
              <p className="form__error" role="alert">
                {error}
              </p>
            ) : null}
            <button
              className="btn btn--primary btn--full"
              type="button"
              onClick={() => void draw()}
              disabled={busy || !engine}
            >
              {busy ? "계산 중…" : "오늘의 운세 뽑기 (FREE)"}
              <span className="btn__arrow">→</span>
            </button>
          </section>
        ) : (
          <>
            <section className={`today-card today-card--${today?.band.tone ?? "mid"}`}>
              <div className="today-card__score">
                <strong>{today?.score}</strong>
                <span>점</span>
                <em>{today?.band.label}</em>
              </div>
              <p className="today-card__ganja">
                오늘의 일진 {today?.ganja}({today?.ganjaHanja}) · {today?.sipsin}
              </p>
              <p className="today-card__text">
                {today?.text} {today?.zhiText}
              </p>
              <div className="today-card__lucky">
                <div>
                  <i style={{ background: today?.lucky.color.hex }} aria-hidden="true" />
                  <b>{today?.lucky.color.name}</b>
                  <small>행운의 색</small>
                </div>
                <div>
                  <b>{today?.lucky.number}</b>
                  <small>행운의 숫자</small>
                </div>
                <div>
                  <b>{today?.lucky.hour}</b>
                  <small>좋은 시간</small>
                </div>
              </div>
            </section>

            <section className="card">
              <div className="card__head">
                <h3>오늘의 한마디</h3>
                <span className="card__sub">{result.input.name || "나"}에게</span>
              </div>
              <p className="today-tip">💡 {tip}</p>
              {note ? <p className="hint">{note}</p> : null}
              <div className="report-actions" style={{ marginTop: 12 }}>
                <button
                  className="btn btn--soft btn--sm"
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setNote(null);
                  }}
                >
                  다시 입력하기
                </button>
                <Link className="btn btn--soft btn--sm" href="/saju" prefetch={false}>
                  내 사주 전체 보기
                </Link>
              </div>
            </section>

            <section className="kid-section">
              <div className="kid-section__head">
                <h2>오늘 기운이 좋다면</h2>
                <p>이 흐름을 살릴 수 있는 리포트</p>
              </div>
              <div className="mini-products">
                {PRODUCTS.filter((item) => ["saju", "yeonwoon", "daewoon"].includes(item.type)).map(
                  (item) => (
                    <Link
                      className="mini-product"
                      href={item.type === "saju" ? "/saju" : `/report/${item.type}`}
                      key={item.type}
                      prefetch={false}
                    >
                      <span aria-hidden="true">{item.emoji}</span>
                      <b>{item.title}</b>
                      <small>🪙 {item.coins}</small>
                    </Link>
                  ),
                )}
              </div>
            </section>
          </>
        )}

        <KidFooter />
      </main>
      <BottomTabs />
    </>
  );
}
