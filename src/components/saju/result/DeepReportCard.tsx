"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { unlockKey, useUnlock, useWallet } from "@/components/kid/useWallet";
import { reportTargetKey } from "@/lib/coins";
import { birthFromResult } from "@/lib/form";
import { buildSajuReport } from "@/lib/reports";
import type { SajuEngine, SajuResult } from "@/lib/saju/types";

interface Props {
  engine: SajuEngine;
  result: SajuResult;
}

/** 사주 결과 하단의 '심화 사주 해설' 잠금 카드 (1코인) */
export default function DeepReportCard({ engine, result }: Props) {
  const wallet = useWallet();
  const { unlock, busy } = useUnlock();
  const [unlocked, setUnlocked] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const doc = useMemo(() => buildSajuReport(engine, result), [engine, result]);
  const targetKey = useMemo(() => reportTargetKey(birthFromResult(result)), [result]);
  const isOpen = unlocked || wallet.unlocked.has(unlockKey("saju", targetKey));

  const handleUnlock = useCallback(async () => {
    setMessage(null);
    const outcome = await unlock("saju", targetKey);
    if (outcome.ok) {
      setUnlocked(true);
      setMessage(outcome.already ? "이미 열어 둔 리포트예요." : "잠금이 풀렸어요!");
      return;
    }
    setMessage(outcome.message);
  }, [targetKey, unlock]);

  const nextPath = `/saju?${new URLSearchParams(
    Object.entries({
      n: result.input.name,
      g: result.input.gender,
      cal: result.input.calendar,
      y: String(birthFromResult(result).year),
      m: String(birthFromResult(result).month),
      d: String(birthFromResult(result).day),
      ...(result.hasTime ? { t: String(result.input.timeIndex) } : {}),
    }).map(([key, value]) => [key, String(value)]),
  ).toString()}`;

  return (
    <article className="deep-card reveal">
      <div className="deep-card__head">
        <span className="deep-card__badge">🪙 1코인</span>
        <h3>{doc.title}</h3>
        <p className="deep-card__sub">{doc.subtitle}</p>
      </div>

      <p className="deep-card__headline">{doc.headline}</p>
      <div className="report-chips">
        {doc.chips.map((chip) => (
          <div className="report-chip" key={chip.label}>
            <span>{chip.label}</span>
            <b>{chip.value}</b>
          </div>
        ))}
      </div>

      {doc.previewParagraphs.map((paragraph, index) => (
        <p className="body" key={index}>
          {paragraph}
        </p>
      ))}

      {isOpen ? (
        <div className="deep-card__full">
          {doc.sections.map((section) => (
            <section className="report-block" key={section.heading}>
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
            </section>
          ))}
          <p className="report-closing">{doc.closing}</p>
          <Link className="btn btn--soft btn--full" href="/my" prefetch={false}>
            보관함에서 다시 보기
          </Link>
        </div>
      ) : (
        <div className="locked">
          <div className="locked__head">
            <span className="locked__lock" aria-hidden="true">🔒</span>
            <div>
              <h3>여기부터는 코인으로 열려요</h3>
              <p>전체 {doc.sections.length}개 장 · 990원</p>
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
            <Link
              className="btn btn--primary btn--full"
              href={`/login?next=${encodeURIComponent(nextPath)}`}
              prefetch={false}
            >
              카카오로 로그인하고 열기
              <span className="btn__arrow">→</span>
            </Link>
          ) : wallet.balance < 1 ? (
            <>
              <p className="locked__balance">보유 코인 {wallet.balance}개 · 1개 부족해요</p>
              <Link
                className="btn btn--primary btn--full"
                href={`/charge?next=${encodeURIComponent(nextPath)}`}
                prefetch={false}
              >
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
              {busy ? "여는 중…" : "1코인으로 전체 해설 열기"}
              <span className="btn__arrow">→</span>
            </button>
          )}
          <p className="locked__note">
            보유 코인 {wallet.loggedIn ? `${wallet.balance}개` : "—"} · 한 번 열면 다시 결제하지 않아요
          </p>
        </div>
      )}
    </article>
  );
}
