"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { TIME_OPTIONS } from "@/lib/saju/time-options";
import { YEAR_MAX, YEAR_MIN, type FormState } from "@/lib/form";

interface FormScreenProps {
  form: FormState;
  onChange: (patch: Partial<FormState>) => void;
  onSubmit: () => void;
  onBack: () => void;
  error: string | null;
  busy: boolean;
}

function daysInMonth(year: number, month: number, lunar: boolean): number {
  if (lunar) return 30;
  return new Date(year, month, 0).getDate();
}

export default function FormScreen({
  form,
  onChange,
  onSubmit,
  onBack,
  error,
  busy,
}: FormScreenProps) {
  const { show } = useToast();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  const lunar = form.calendar === "lunar";
  const maxDay = useMemo(
    () => daysInMonth(form.year, form.month, lunar),
    [form.year, form.month, lunar],
  );

  // 달/달력 기준이 바뀌어 없는 날짜가 되면 자동 보정
  useEffect(() => {
    if (form.day > maxDay && hydrated) onChange({ day: maxDay });
  }, [form.day, maxDay, hydrated, onChange]);

  // 윤달 체크: 실제로 그 달에 윤달이 없으면 해제
  useEffect(() => {
    if (!(form.calendar === "lunar" && form.leap)) return;
    let alive = true;
    import("@/lib/saju")
      .then(({ hasLeapMonth }) => {
        if (!alive) return;
        if (!hasLeapMonth(form.year, form.month)) {
          onChange({ leap: false });
          show("이 달에는 윤달이 없어요. 윤달 선택을 해제했어요.");
        }
      })
      .catch(() => {
        /* 엔진 로드 실패 시 제출 단계에서 다시 검증합니다. */
      });
    return () => {
      alive = false;
    };
  }, [form.calendar, form.leap, form.year, form.month, onChange, show]);

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = YEAR_MAX; y >= YEAR_MIN; y -= 1) list.push(y);
    return list;
  }, []);
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const days = useMemo(
    () => Array.from({ length: maxDay }, (_, i) => i + 1),
    [maxDay],
  );

  const genderOptions: { value: FormState["gender"]; label: string }[] = [
    { value: "n", label: "선택 안 함" },
    { value: "f", label: "여성" },
    { value: "m", label: "남성" },
  ];

  return (
    <section className="screen is-active" id="screen-form" data-screen="form">
      <div className="screen-head">
        <button className="icon-btn" type="button" aria-label="뒤로" onClick={onBack}>
          ←
        </button>
        <div>
          <p className="kicker">STEP 1</p>
          <h2>태어난 순간을 알려주세요</h2>
        </div>
      </div>

      <form
        className="card form"
        id="sajuForm"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="field">
          <label className="field__label" htmlFor="nameInput">
            이름 <span className="field__opt">선택</span>
          </label>
          <input
            className="input"
            type="text"
            id="nameInput"
            maxLength={12}
            placeholder="결과에 이름을 넣어드려요"
            autoComplete="off"
            value={form.name}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </div>

        <div className="field">
          <span className="field__label">
            성별 <span className="field__opt">운세 해석에 사용</span>
          </span>
          <div className="segmented segmented--3" role="group" aria-label="성별">
            {genderOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`segmented__item${form.gender === option.value ? " is-active" : ""}`}
                aria-pressed={form.gender === option.value}
                onClick={() => onChange({ gender: option.value })}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field__label">달력 기준</span>
          <div className="segmented segmented--2" role="group" aria-label="달력 기준">
            <button
              type="button"
              className={`segmented__item${form.calendar === "solar" ? " is-active" : ""}`}
              aria-pressed={form.calendar === "solar"}
              onClick={() => onChange({ calendar: "solar", leap: false })}
            >
              양력
            </button>
            <button
              type="button"
              className={`segmented__item${form.calendar === "lunar" ? " is-active" : ""}`}
              aria-pressed={form.calendar === "lunar"}
              onClick={() => onChange({ calendar: "lunar" })}
            >
              음력
            </button>
          </div>
          {lunar ? (
            <label className="checkline" id="leapWrap">
              <input
                type="checkbox"
                id="leapInput"
                checked={form.leap}
                onChange={(event) => onChange({ leap: event.target.checked })}
              />
              <span>윤달(閏月)에 태어났어요</span>
            </label>
          ) : null}
        </div>

        <div className="field">
          <span className="field__label" id="birthLabel">
            {lunar ? "음력 생년월일" : "생년월일"}
          </span>
          <div className="date-row">
            <div className="select-wrap">
              <select
                className="select"
                id="yearSelect"
                aria-label="태어난 해"
                value={form.year}
                onChange={(event) =>
                  onChange({ year: Number(event.target.value) })
                }
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <span className="select-suffix">년</span>
            </div>
            <div className="select-wrap">
              <select
                className="select"
                id="monthSelect"
                aria-label="태어난 달"
                value={form.month}
                onChange={(event) =>
                  onChange({ month: Number(event.target.value) })
                }
              >
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
              <span className="select-suffix">월</span>
            </div>
            <div className="select-wrap">
              <select
                className="select"
                id="daySelect"
                aria-label="태어난 날"
                value={Math.min(form.day, maxDay)}
                onChange={(event) => onChange({ day: Number(event.target.value) })}
              >
                {days.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
              <span className="select-suffix">일</span>
            </div>
          </div>
          <p className="field__hint" id="dateHint">
            {lunar
              ? `음력은 1900~2035년 · 윤달은 위에서 선택해 주세요. (음력 ${form.month}월은 최대 ${maxDay}일)`
              : "1900년 ~ 2035년까지 계산할 수 있어요."}
          </p>
        </div>

        <div className="field">
          <span className="field__label">
            태어난 시간 <span className="field__opt">모르면 ‘모름’</span>
          </span>
          <div className="time-grid" id="timeGrid" role="group" aria-label="태어난 시간">
            {TIME_OPTIONS.map((option) => {
              const active = form.timeIndex === option.index;
              return (
                <button
                  key={option.index}
                  type="button"
                  className={`time-chip${active ? " is-active" : ""}`}
                  aria-pressed={active}
                  onClick={() => onChange({ timeIndex: option.index })}
                >
                  {option.label}
                  <small>{option.range}</small>
                </button>
              );
            })}
            <button
              type="button"
              className={`time-chip time-chip--unknown${form.timeIndex === -1 ? " is-active" : ""}`}
              aria-pressed={form.timeIndex === -1}
              onClick={() => onChange({ timeIndex: -1 })}
            >
              모름
              <small>시주 없이 풀이</small>
            </button>
          </div>
        </div>

        <button
          className="btn btn--primary btn--full"
          type="submit"
          disabled={busy}
        >
          {busy ? "여덟 글자를 세우는 중…" : "사주 풀어보기"}
          <span className="btn__arrow">→</span>
        </button>
        {error ? (
          <p className="form__error" id="formError" role="alert">
            {error}
          </p>
        ) : null}

        <details className="details">
          <summary>계산 기준 보기</summary>
          <ul>
            <li>
              년주·월주는 <strong>절기(입춘·경칩 등)</strong> 기준, 일주는{" "}
              <strong>자정 00:00</strong>에 바뀌는 기준으로 계산해요.
            </li>
            <li>
              음력은 <strong>한국천문연구원(KARI) 기준 한국 음력</strong>으로 양력
              변환한 뒤 계산해요.
            </li>
            <li>
              자시는 자정 기준(00:00~01:00)으로, 23시 이후 출생은 일주가 하루 달라질
              수 있어요.
            </li>
            <li>태어난 시간을 모르면 시주를 제외한 6글자로 풀이해요.</li>
          </ul>
        </details>
      </form>
    </section>
  );
}
