"use client";

import { useEffect, useMemo } from "react";
import { TIME_OPTIONS } from "@/lib/saju/time-options";
import { YEAR_MAX, YEAR_MIN } from "@/lib/form";
import type { NormalizedBirth } from "@/lib/validation";

export type BirthValue = Pick<
  NormalizedBirth,
  "gender" | "calendar" | "leap" | "year" | "month" | "day" | "timeIndex"
>;

export const EMPTY_BIRTH: BirthValue = {
  gender: "n",
  calendar: "solar",
  leap: false,
  year: 2000,
  month: 1,
  day: 1,
  timeIndex: -1,
};

interface Props {
  value: BirthValue;
  onChange: (patch: Partial<BirthValue>) => void;
  idPrefix?: string;
}

/** 닉네임을 제외한 생년월일 입력 (보드의 '나' 설정과 참여자 추가에 공용) */
export default function BirthFields({ value, onChange, idPrefix = "bf" }: Props) {
  const lunar = value.calendar === "lunar";
  const maxDay = lunar
    ? 30
    : new Date(value.year, value.month, 0).getDate();

  useEffect(() => {
    if (value.day > maxDay) onChange({ day: maxDay });
  }, [maxDay, value.day, onChange]);

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = YEAR_MAX; y >= YEAR_MIN; y -= 1) list.push(y);
    return list;
  }, []);

  return (
    <div className="birth-fields">
      <div className="field field--tight">
        <span className="field__label">성별</span>
        <div className="segmented segmented--3" role="group" aria-label="성별">
          {(
            [
              { value: "n", label: "선택 안 함" },
              { value: "f", label: "여성" },
              { value: "m", label: "남성" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              className={`segmented__item${value.gender === option.value ? " is-active" : ""}`}
              aria-pressed={value.gender === option.value}
              onClick={() => onChange({ gender: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field field--tight">
        <span className="field__label">달력 기준</span>
        <div className="segmented segmented--2" role="group" aria-label="달력 기준">
          <button
            type="button"
            className={`segmented__item${value.calendar === "solar" ? " is-active" : ""}`}
            aria-pressed={value.calendar === "solar"}
            onClick={() => onChange({ calendar: "solar", leap: false })}
          >
            양력
          </button>
          <button
            type="button"
            className={`segmented__item${value.calendar === "lunar" ? " is-active" : ""}`}
            aria-pressed={value.calendar === "lunar"}
            onClick={() => onChange({ calendar: "lunar" })}
          >
            음력
          </button>
        </div>
        {lunar ? (
          <label className="checkline">
            <input
              type="checkbox"
              checked={value.leap}
              onChange={(event) => onChange({ leap: event.target.checked })}
            />
            <span>윤달에 태어났어요</span>
          </label>
        ) : null}
      </div>

      <div className="field field--tight">
        <span className="field__label">생년월일</span>
        <div className="date-row">
          <div className="select-wrap">
            <select
              className="select"
              aria-label="태어난 해"
              id={`${idPrefix}-year`}
              value={value.year}
              onChange={(event) => onChange({ year: Number(event.target.value) })}
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
              aria-label="태어난 달"
              id={`${idPrefix}-month`}
              value={value.month}
              onChange={(event) => onChange({ month: Number(event.target.value) })}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
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
              aria-label="태어난 날"
              id={`${idPrefix}-day`}
              value={Math.min(value.day, maxDay)}
              onChange={(event) => onChange({ day: Number(event.target.value) })}
            >
              {Array.from({ length: maxDay }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
            <span className="select-suffix">일</span>
          </div>
        </div>
      </div>

      <div className="field field--tight">
        <span className="field__label">
          태어난 시간 <span className="field__opt">모르면 그대로</span>
        </span>
        <div className="select-wrap select-wrap--full">
          <select
            className="select"
            aria-label="태어난 시간"
            id={`${idPrefix}-time`}
            value={value.timeIndex}
            onChange={(event) => onChange({ timeIndex: Number(event.target.value) })}
          >
            <option value={-1}>모름 (시주 없이 계산)</option>
            {TIME_OPTIONS.map((option) => (
              <option key={option.index} value={option.index}>
                {option.label} · {option.range}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
