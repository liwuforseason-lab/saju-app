"use client";

import { useCallback, useEffect, useState } from "react";
import AuthChip from "@/components/auth/AuthChip";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import FormScreen from "@/components/saju/FormScreen";
import IntroScreen from "@/components/saju/IntroScreen";
import LoadingScreen from "@/components/saju/LoadingScreen";
import ResultScreen from "@/components/saju/ResultScreen";
import {
  DEFAULT_FORM,
  WEEK_LABELS,
  formFromSearchParams,
  pad2,
  type FormState,
} from "@/lib/form";
import type { SajuEngine, SajuResult } from "@/lib/saju/types";

type Step = "intro" | "form" | "loading" | "result";

function SajuFlow() {
  const { show } = useToast();

  const [step, setStep] = useState<Step>("intro");
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [engine, setEngine] = useState<SajuEngine | null>(null);
  const [result, setResult] = useState<SajuResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dateLabel, setDateLabel] = useState("");
  const [sharedLinkHandled, setSharedLinkHandled] = useState(false);
  /** URL 쿼리는 마운트 후에 읽습니다(정적 HTML 에 인트로를 그대로 담기 위해). */
  const [search, setSearch] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    setDateLabel(
      `${now.getFullYear()}.${pad2(now.getMonth() + 1)}.${pad2(now.getDate())} ${
        WEEK_LABELS[now.getDay()]
      }요일`,
    );
  }, []);

  useEffect(() => {
    setSearch(window.location.search.replace(/^\?/, ""));
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const updateForm = useCallback((patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setError(null);
  }, []);

  const runSaju = useCallback(async (nextForm: FormState, fromShareLink = false) => {
    setBusy(true);
    setError(null);
    try {
      const { Saju, computeSaju } = await import("@/lib/saju");
      const computed = computeSaju({
        name: nextForm.name.trim(),
        gender: nextForm.gender,
        calendar: nextForm.calendar,
        leap: nextForm.calendar === "lunar" ? nextForm.leap : false,
        year: nextForm.year,
        month: nextForm.month,
        day: nextForm.day,
        timeIndex: nextForm.timeIndex,
      });
      setEngine(Saju);
      setResult(computed);
      setForm(nextForm);
      setStep("loading");
      if (fromShareLink) show("공유된 사주를 열었어요");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "사주를 계산하지 못했어요. 생년월일을 다시 확인해 주세요.",
      );
      setStep("form");
    } finally {
      setBusy(false);
    }
  }, [show]);

  // 공유 링크(?y=…&m=…&d=…)로 들어오면 자동 계산
  useEffect(() => {
    if (sharedLinkHandled || search === null) return;
    setSharedLinkHandled(true);
    if (!search) return;

    const parsed = formFromSearchParams(new URLSearchParams(search));
    if (!parsed) return;

    setForm(parsed);
    void runSaju(parsed, true);
  }, [search, runSaju, sharedLinkHandled]);

  const onLoadingDone = useCallback(() => setStep("result"), []);

  return (
    <>
      <div className="ambient" aria-hidden="true">
        <span className="ambient__glow ambient__glow--a" />
        <span className="ambient__glow ambient__glow--b" />
        <span className="ambient__star" style={{ "--x": "12%", "--y": "18%", "--s": "2px", "--d": "0s" } as React.CSSProperties} />
        <span className="ambient__star" style={{ "--x": "82%", "--y": "12%", "--s": "3px", "--d": ".7s" } as React.CSSProperties} />
        <span className="ambient__star" style={{ "--x": "70%", "--y": "38%", "--s": "2px", "--d": "1.4s" } as React.CSSProperties} />
        <span className="ambient__star" style={{ "--x": "22%", "--y": "56%", "--s": "2px", "--d": "2.1s" } as React.CSSProperties} />
        <span className="ambient__star" style={{ "--x": "88%", "--y": "66%", "--s": "2px", "--d": "1.1s" } as React.CSSProperties} />
        <span className="ambient__star" style={{ "--x": "8%", "--y": "84%", "--s": "3px", "--d": "2.6s" } as React.CSSProperties} />
      </div>

      <main className="app" id="app">
        <header className="topbar">
          <button
            className="brand"
            type="button"
            id="brandBtn"
            onClick={() => setStep("intro")}
          >
            <span className="brand__mark" aria-hidden="true">
              ✦
            </span>
            <span className="brand__text">운세 한 스푼</span>
          </button>
          <div className="topbar__right">
            <span className="topbar__date">{dateLabel}</span>
            <AuthChip />
          </div>
        </header>

        {step === "intro" ? (
          <IntroScreen onStart={() => setStep("form")} />
        ) : null}

        {step === "form" ? (
          <FormScreen
            form={form}
            onChange={updateForm}
            onSubmit={() => void runSaju(form)}
            onBack={() => setStep("intro")}
            error={error}
            busy={busy}
          />
        ) : null}

        {step === "loading" ? <LoadingScreen onDone={onLoadingDone} /> : null}

        {step === "result" && engine && result ? (
          <ResultScreen
            engine={engine}
            result={result}
            onRestart={() => setStep("form")}
          />
        ) : null}
      </main>
    </>
  );
}

export default function SajuApp() {
  return (
    <ToastProvider>
      <SajuFlow />
    </ToastProvider>
  );
}
