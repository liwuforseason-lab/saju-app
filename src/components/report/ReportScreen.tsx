"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthChip from "@/components/auth/AuthChip";
import BirthFields, { EMPTY_BIRTH, type BirthValue } from "@/components/board/BirthFields";
import CoinBadge from "@/components/kid/CoinBadge";
import KidFooter from "@/components/kid/KidFooter";
import BottomTabs from "@/components/kid/BottomTabs";
import { unlockKey, useUnlock, useWallet } from "@/components/kid/useWallet";
import {
  PRODUCTS,
  productOf,
  productPriceKrw,
  reportTargetKey,
  type ReportType,
} from "@/lib/coins";
import { buildReport, type ReportDoc } from "@/lib/reports";
import type { SajuEngine, SajuResult } from "@/lib/saju/types";

interface Props {
  type: ReportType;
}

function pad2(value: number): string {
  return value < 10 ? `0${value}` : `${value}`;
}

function readBirth(params: URLSearchParams, prefix = ""): BirthValue {
  const year = Number(params.get(`${prefix}y`));
  const month = Number(params.get(`${prefix}m`));
  const day = Number(params.get(`${prefix}d`));
  if (!Number.isFinite(year) || year < 1900) return EMPTY_BIRTH;
  const timeRaw = Number(params.get(`${prefix}t`));
  return {
    gender: (params.get(`${prefix}g`) as BirthValue["gender"]) ?? "n",
    calendar: params.get(`${prefix}cal`) === "lunar" ? "lunar" : "solar",
    leap: params.get(`${prefix}leap`) === "1",
    year,
    month: Number.isFinite(month) && month >= 1 ? month : 1,
    day: Number.isFinite(day) && day >= 1 ? day : 1,
    timeIndex: Number.isFinite(timeRaw) ? Math.max(-1, Math.min(11, timeRaw)) : -1,
  };
}

export default function ReportScreen({ type }: Props) {
  const search = useSearchParams();
  const product = productOf(type) ?? PRODUCTS[0];
  const wallet = useWallet();
  const { unlock, busy } = useUnlock();
  const topRef = useRef<HTMLDivElement | null>(null);

  const [engine, setEngine] = useState<SajuEngine | null>(null);
  const [name, setName] = useState("");
  const [birth, setBirth] = useState<BirthValue>(EMPTY_BIRTH);
  const [partnerName, setPartnerName] = useState("");
  const [partnerBirth, setPartnerBirth] = useState<BirthValue>({
    ...EMPTY_BIRTH,
    year: 1997,
  });
  const [result, setResult] = useState<SajuResult | null>(null);
  const [partnerResult, setPartnerResult] = useState<SajuResult | null>(null);
  const [doc, setDoc] = useState<ReportDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyPreview, setBusyPreview] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const autoRan = useRef(false);
  const [paramsReady, setParamsReady] = useState(false);

  useEffect(() => {
    void import("@/lib/saju").then((module) => setEngine(module.Saju));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(search?.toString() ?? "");
    if (params.toString()) {
      setName((params.get("n") ?? "").slice(0, 12));
      setBirth(readBirth(params));
      setPartnerName((params.get("bn") ?? "").slice(0, 12));
      setPartnerBirth({ ...readBirth(params, "b"), year: Number(params.get("by")) || 1997 });
      return;
    }
    // 주소에 정보가 없으면 지난번에 넣은 생년월일을 그대로 씁니다(다시 열 때 편하게).
    try {
      const raw = window.localStorage.getItem("saju-report-form");
      if (!raw) return;
      const saved = JSON.parse(raw) as { name?: string; birth?: BirthValue };
      if (saved?.birth) setBirth({ ...EMPTY_BIRTH, ...saved.birth });
      if (saved?.name) setName(saved.name);
    } catch {
      /* 저장된 값이 없으면 기본값을 씁니다. */
    } finally {
      setParamsReady(true);
    }
  }, [search]);

  const targetKey = useMemo(() => {
    const base = reportTargetKey(birth);
    if (type !== "gunghap") return base;
    return `${base}__${reportTargetKey(partnerBirth)}`;
  }, [birth, partnerBirth, type]);

  const isUnlocked = Boolean(doc && wallet.unlocked.has(unlockKey(type, targetKey))) || justUnlocked;

  const compute = useCallback(async () => {
    if (!engine) return;
    setBusyPreview(true);
    setError(null);
    setMessage(null);
    try {
      const mine = engine.computeSaju({
        name: name.trim(),
        gender: birth.gender,
        calendar: birth.calendar,
        leap: birth.calendar === "lunar" ? birth.leap : false,
        year: birth.year,
        month: birth.month,
        day: birth.day,
        timeIndex: birth.timeIndex,
      });

      let partner: SajuResult | null = null;
      if (type === "gunghap") {
        partner = engine.computeSaju({
          name: partnerName.trim(),
          gender: partnerBirth.gender,
          calendar: partnerBirth.calendar,
          leap: partnerBirth.calendar === "lunar" ? partnerBirth.leap : false,
          year: partnerBirth.year,
          month: partnerBirth.month,
          day: partnerBirth.day,
          timeIndex: partnerBirth.timeIndex,
        });
      }

      const built = buildReport(type, engine, mine, partner ?? undefined);
      if (!built) throw new Error("리포트를 만들지 못했어요.");

      setResult(mine);
      setPartnerResult(partner);
      setDoc(built);
      try {
        window.localStorage.setItem(
          "saju-report-form",
          JSON.stringify({ name: name.trim(), birth }),
        );
      } catch {
        /* 저장소를 쓸 수 없으면 넘어갑니다. */
      }
      window.setTimeout(() => {
        topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "생년월일을 다시 확인해 주세요.",
      );
    } finally {
      setBusyPreview(false);
    }
  }, [birth, engine, name, partnerBirth, partnerName, type]);

  /** 궁합 보드처럼 ?y=… 로 들어온 경우엔 입력값이 반영된 뒤 바로 미리보기를 계산합니다. */
  useEffect(() => {
    if (!paramsReady || autoRan.current || !engine) return;
    const params = new URLSearchParams(search?.toString() ?? "");
    if (!params.get("y")) return;
    autoRan.current = true;
    void compute();
  }, [compute, engine, paramsReady, search]);

  const handleUnlock = useCallback(async () => {
    setMessage(null);
    const outcome = await unlock(type, targetKey);
    if (outcome.ok) {
      setJustUnlocked(true);
      setMessage(outcome.already ? "이미 열어 둔 리포트예요." : "잠금이 풀렸어요! 아래에서 전체 해설을 읽어 보세요.");
      return;
    }
    if (outcome.error === "unauthorized") {
      setMessage("로그인하면 코인으로 열 수 있어요.");
      return;
    }
    setMessage(outcome.message);
  }, [targetKey, type, unlock]);

  const share = useCallback(async () => {
    if (!doc) return;
    const text = `${doc.title}\n${doc.headline}\n\n운세 한 스푼에서 봤어요 🪙`;
    try {
      if (navigator.share) {
        await navigator.share({ title: doc.title, text });
      } else {
        await navigator.clipboard.writeText(text);
        setMessage("결과 요약을 복사했어요.");
      }
    } catch {
      /* 사용자가 공유를 취소한 경우는 조용히 넘어갑니다. */
    }
  }, [doc]);

  const loginHref = `/login?next=${encodeURIComponent(`/report/${type}`)}`;
  const chargeHref = `/charge?next=${encodeURIComponent(`/report/${type}`)}`;

  return (
    <>
      <main className="app app--kid" ref={topRef}>
        <header className="kid-topbar">
          <Link className="kid-back" href="/" prefetch={false} aria-label="홈으로">
            ←
          </Link>
          <Link className="kid-brand kid-brand--small" href="/" prefetch={false}>
            <span className="kid-brand__mark" aria-hidden="true">✦</span>
            <b>운세 한 스푼</b>
          </Link>
          <div className="kid-topbar__right">
            <CoinBadge />
            <AuthChip />
          </div>
        </header>

        <section className={`report-hero report-hero--${product.accent}`}>
          <div className="report-hero__thumb">
            <picture>
              <source srcSet={product.image} type="image/webp" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image.replace(/\.webp$/, ".jpg")}
                alt=""
                width={240}
                height={300}
              />
            </picture>
          </div>
          <div className="report-hero__body">
            <p className="report-hero__kicker">{product.emoji} 유료 리포트</p>
            <h1>{product.title}</h1>
            <p>{product.lead}</p>
            <div className="report-hero__price">
              <span className="coin">
                🪙 <b>{product.coins}</b>
              </span>
              <span>{productPriceKrw(product).toLocaleString("ko-KR")}원</span>
              {product.originalCoins ? (
                <s>{product.originalCoins}코인</s>
              ) : null}
            </div>
          </div>
        </section>

        {!doc ? (
          <section className="card report-form">
            <div className="card__head">
              <h3>생년월일을 알려 주세요</h3>
              <span className="card__sub">무료 미리보기</span>
            </div>
            <p className="body">
              사주는 태어난 해·달·일·시로 계산해요. 모르는 항목은 비워 두어도 괜찮아요.
            </p>

            <div className="field field--tight">
              <label className="field__label" htmlFor="report-name">
                이름 (선택)
              </label>
              <input
                className="input"
                id="report-name"
                type="text"
                maxLength={12}
                placeholder="예: 무아"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <BirthFields value={birth} onChange={(patch) => setBirth((prev) => ({ ...prev, ...patch }))} idPrefix="me" />

            {type === "gunghap" ? (
              <div className="report-partner">
                <h4>상대방</h4>
                <div className="field field--tight">
                  <label className="field__label" htmlFor="partner-name">
                    상대 이름 (선택)
                  </label>
                  <input
                    className="input"
                    id="partner-name"
                    type="text"
                    maxLength={12}
                    placeholder="예: 지우"
                    value={partnerName}
                    onChange={(event) => setPartnerName(event.target.value)}
                  />
                </div>
                <BirthFields
                  value={partnerBirth}
                  onChange={(patch) => setPartnerBirth((prev) => ({ ...prev, ...patch }))}
                  idPrefix="partner"
                />
              </div>
            ) : null}

            {error ? (
              <p className="form__error" role="alert">
                {error}
              </p>
            ) : null}

            <button
              className="btn btn--primary btn--full"
              type="button"
              onClick={() => void compute()}
              disabled={busyPreview || !engine}
            >
              {busyPreview ? "계산 중…" : "무료로 미리보기"}
              <span className="btn__arrow">→</span>
            </button>
          </section>
        ) : (
          <>
            <section className="report-summary">
              <p className="report-summary__kicker">
                {result?.input.name ? `${result.input.name} 님` : "나의"} 리포트
              </p>
              <h2>{doc.headline}</h2>
              <div className="report-chips">
                {doc.chips.map((chip) => (
                  <div className="report-chip" key={chip.label}>
                    <span>{chip.label}</span>
                    <b>{chip.value}</b>
                  </div>
                ))}
              </div>
              {doc.previewParagraphs.map((paragraph, index) => (
                <p className="report-summary__text" key={index}>
                  {paragraph}
                </p>
              ))}
            </section>

            {isUnlocked ? (
              <section className="report-full">
                {doc.sections.map((section) => (
                  <article className="report-block" key={section.heading}>
                    <h3>{section.heading}</h3>
                    {section.paragraphs
                      .filter((paragraph) => paragraph.trim().length > 0)
                      .map((paragraph, index) => (
                        <p key={index}>{paragraph.replace(/\*\*/g, "")}</p>
                      ))}
                    {section.bullets && section.bullets.length ? (
                      <ul>
                        {section.bullets
                          .filter((bullet) => bullet.trim().length > 0)
                          .map((bullet, index) => (
                            <li key={index}>{bullet.replace(/\*\*/g, "")}</li>
                          ))}
                      </ul>
                    ) : null}
                  </article>
                ))}
                <p className="report-closing">{doc.closing}</p>
                <div className="report-actions">
                  <button className="btn btn--soft btn--sm" type="button" onClick={() => void share()}>
                    결과 공유
                  </button>
                  <Link className="btn btn--soft btn--sm" href="/my" prefetch={false}>
                    보관함에서 다시 보기
                  </Link>
                  <button
                    className="btn btn--soft btn--sm"
                    type="button"
                    onClick={() => {
                      setDoc(null);
                      setJustUnlocked(false);
                    }}
                  >
                    다른 사주 보기
                  </button>
                </div>
              </section>
            ) : (
              <section className="locked">
                <div className="locked__head">
                  <span className="locked__lock" aria-hidden="true">🔒</span>
                  <div>
                    <h3>여기부터는 코인으로 열려요</h3>
                    <p>
                      전체 {doc.sections.length}개 장 · {product.coins}코인 (
                      {productPriceKrw(product).toLocaleString("ko-KR")}원)
                    </p>
                  </div>
                </div>

                <ul className="locked__list">
                  {doc.lockedTitles.map((title, index) => (
                    <li key={title}>
                      <span className="locked__num">{index + 1}</span>
                      {title.replace(/^\d+\.\s*/, "")}
                      <span className="locked__dots" aria-hidden="true" />
                      🔒
                    </li>
                  ))}
                </ul>

                {message ? (
                  <p className="locked__message" role="status">
                    {message}
                  </p>
                ) : null}

                {!wallet.loggedIn ? (
                  <Link className="btn btn--primary btn--full" href={loginHref} prefetch={false}>
                    카카오로 로그인하고 열기
                    <span className="btn__arrow">→</span>
                  </Link>
                ) : wallet.balance < product.coins ? (
                  <>
                    <p className="locked__balance">
                      보유 코인 {wallet.balance}개 · {product.coins - wallet.balance}개 부족해요
                    </p>
                    <Link className="btn btn--primary btn--full" href={chargeHref} prefetch={false}>
                      코인 충전하고 열기
                      <span className="btn__arrow">→</span>
                    </Link>
                  </>
                ) : (
                  <button
                    className="btn btn--primary btn--full"
                    type="button"
                    onClick={() => void handleUnlock()}
                    disabled={busy}
                  >
                    {busy ? "여는 중…" : `${product.coins}코인으로 전체 해설 열기`}
                    <span className="btn__arrow">→</span>
                  </button>
                )}

                <p className="locked__note">
                  보유 코인 {wallet.loggedIn ? `${wallet.balance}개` : "—"} · 한 번 열면 다시 결제하지 않아요
                </p>
              </section>
            )}

            <section className="kid-section">
              <div className="kid-section__head">
                <h2>이어서 볼 만한 것</h2>
                <p>코인 하나로 하나씩 열어 보세요</p>
              </div>
              <div className="mini-products">
                {PRODUCTS.filter((item) => item.type !== type)
                  .slice(0, 4)
                  .map((item) => (
                    <Link className="mini-product" href={`/report/${item.type}`} key={item.type} prefetch={false}>
                      <span aria-hidden="true">{item.emoji}</span>
                      <b>{item.title}</b>
                      <small>🪙 {item.coins}</small>
                    </Link>
                  ))}
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
