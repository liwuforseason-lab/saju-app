"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/useAuth";
import { useToast } from "@/components/ui/Toast";
import { birthFromResult } from "@/lib/form";
import type { SajuEngine, SajuResult } from "@/lib/saju/types";

interface Props {
  engine: SajuEngine;
  result: SajuResult;
}

/**
 * 결과 화면의 저장/공유 액션.
 * - 로그인 전: 저장을 누르면 로그인 안내 패널을 열어 줍니다(강제 이동 없음).
 * - Supabase 미설정: 기능 준비 중 안내.
 */
export default function ResultActions({ engine, result }: Props) {
  const { configured, loading, user } = useAuth();
  const { show } = useToast();
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [promptOpen, setPromptOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollToShare = () => {
    const target = document.getElementById("share-card");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      show("공유 버튼이 아래에 있어요");
    }
  };

  const save = async () => {
    setError(null);

    if (!configured) {
      setPromptOpen(true);
      return;
    }

    if (!user) {
      setPromptOpen(true);
      return;
    }

    setStatus("saving");

    try {
      const response = await fetch("/api/readings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: birthFromResult(result),
          result,
          summary: engine.summaryText(result),
          title: result.input.name
            ? `${result.input.name} 님의 사주`
            : "나의 사주",
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        setError(data?.message ?? "저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
        setStatus("idle");
        return;
      }

      setStatus("saved");
      show("내 사주에 저장했어요. 마이페이지에서 다시 볼 수 있어요.");
    } catch {
      setError("네트워크 문제로 저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
      setStatus("idle");
    }
  };

  const label =
    status === "saving" ? "저장 중…" : status === "saved" ? "저장됨 ✓" : "내 사주에 저장";

  return (
    <>
      <div className="result-actions">
        <button
          className="btn btn--line btn--sm"
          type="button"
          onClick={save}
          disabled={status === "saving" || status === "saved" || loading}
        >
          {label}
        </button>
        <button
          className="btn btn--line btn--sm"
          type="button"
          onClick={scrollToShare}
        >
          공유하기
        </button>
      </div>

      {error ? (
        <p className="save-panel" role="alert" style={{ borderColor: "rgba(196,101,90,.3)" }}>
          {error}
        </p>
      ) : null}

      {promptOpen && status !== "saved" ? (
        <div className="save-panel">
          {!configured ? (
            <>
              <strong>로그인 기능은 준비 중이에요</strong>
              <p style={{ margin: "6px 0 0" }}>
                지금은 사주 풀이를 무료로 그대로 보실 수 있어요. 로그인·저장
                기능은 Supabase 연결 후 열립니다.
              </p>
              <div className="save-panel__row">
                <Link href="/login">준비 상황 보기 →</Link>
                <button
                  type="button"
                  className="link"
                  onClick={() => setPromptOpen(false)}
                >
                  닫기
                </button>
              </div>
            </>
          ) : (
            <>
              <strong>카카오로 로그인하면 이 사주를 저장할 수 있어요</strong>
              <p style={{ margin: "6px 0 0" }}>
                저장한 사주는 마이페이지에서 다시 열고, 지인 사주도 함께 보관할 수
                있어요.
              </p>
              <div className="save-panel__row">
                <Link href="/login?next=/">카카오로 로그인 →</Link>
                <button
                  type="button"
                  className="link"
                  onClick={() => setPromptOpen(false)}
                >
                  닫기
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}

      {status === "saved" ? (
        <div className="save-panel">
          <span className="save-ok">
            <span aria-hidden="true">✓</span> 내 사주에 저장했어요
          </span>
          <div className="save-panel__row">
            <Link href="/my">마이페이지에서 보기 →</Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
