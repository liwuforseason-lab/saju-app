"use client";

import { useToast } from "@/components/ui/Toast";
import type { SajuEngine, SajuResult } from "@/lib/saju/types";

interface Props {
  engine: SajuEngine;
  result: SajuResult;
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fallback 으로 이동 */
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

export default function ShareCard({ engine, result }: Props) {
  const { show } = useToast();
  const summary = engine.summaryText(result);

  const shareUrl = () =>
    `${window.location.origin}/?${engine.toShareParams(result)}`;

  return (
    <article className="card card--share reveal" id="share-card">
      <div className="card__head">
        <h3>친구에게 보여주기</h3>
        <span className="card__sub">블로그·SNS 공유</span>
      </div>
      <p className="body" style={{ whiteSpace: "pre-line" }}>
        {summary}
      </p>

      <div className="share-actions">
        <button
          className="btn btn--soft"
          type="button"
          onClick={async () => {
            const ok = await copyText(summary);
            show(
              ok
                ? "결과를 복사했어요. 블로그·SNS에 붙여 넣어 보세요!"
                : "복사에 실패했어요. 길게 눌러 선택해 주세요.",
            );
          }}
        >
          결과 복사
        </button>
        <button
          className="btn btn--soft"
          type="button"
          onClick={async () => {
            const url = shareUrl();
            if (navigator.share) {
              try {
                await navigator.share({
                  title: "운세 한 스푼 — 내 사주팔자",
                  text: summary,
                  url,
                });
                return;
              } catch {
                /* 사용자가 취소한 경우 */
              }
            }
            const ok = await copyText(url);
            show(
              ok
                ? "링크를 복사했어요. 어디든 붙여 넣어 공유하세요!"
                : "링크 복사에 실패했어요.",
            );
          }}
        >
          링크 공유
        </button>
      </div>

      <p className="hint">
        복사한 내용을 블로그나 스토리에 붙여 넣으면 그대로 공유돼요. 링크를 열면 같은
        사주가 다시 계산돼요.
      </p>
    </article>
  );
}
