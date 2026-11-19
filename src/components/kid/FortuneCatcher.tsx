"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { dayKey } from "@/lib/coins";

interface Capsule {
  emoji: string;
  title: string;
  line: string;
  tip: string;
  hex: string;
  number: number;
}

const CAPSULES: Capsule[] = [
  {
    emoji: "🍀",
    title: "행운이 문을 두드려요",
    line: "오늘은 작은 선택이 큰 기회로 이어지는 날이에요. 미뤄 둔 연락 하나를 지금 해 보세요.",
    tip: "먼저 인사한 사람이 오늘의 복을 가져가요.",
    hex: "#7BC47F",
    number: 7,
  },
  {
    emoji: "💰",
    title: "재물의 기운이 들어와요",
    line: "들어오는 돈이 있는 날. 다만 쓸 곳도 같이 보여요. 결제 전에 한 번만 더 생각해 보세요.",
    tip: "지출은 저녁 이후로 미루면 절반은 사라져요.",
    hex: "#F2C14E",
    number: 3,
  },
  {
    emoji: "💗",
    title: "마음이 통하는 하루",
    line: "하고 싶은 말이 있다면 오늘이 기회예요. 상대도 같은 생각을 하고 있을 수 있어요.",
    tip: "짧게, 그리고 먼저 말해 보세요.",
    hex: "#F08CA0",
    number: 2,
  },
  {
    emoji: "🌤️",
    title: "무난하게 흘러가는 날",
    line: "크게 오르지도 내리지도 않는 날이에요. 대신 정리하고 다지기엔 가장 좋은 날이에요.",
    tip: "책상 위 하나만 치워도 기분이 달라져요.",
    hex: "#9CC5E8",
    number: 5,
  },
  {
    emoji: "🔥",
    title: "추진력이 붙는 날",
    line: "미뤄 둔 일을 시작하기 딱 좋아요. 5분만 해 보면 나머지는 따라옵니다.",
    tip: "가장 하기 싫은 일을 1번에 두세요.",
    hex: "#EE8B5A",
    number: 9,
  },
  {
    emoji: "🫧",
    title: "쉬어 가야 하는 날",
    line: "몸이 먼저 신호를 보낼 수 있어요. 무리한 약속은 하나만 줄여도 하루가 편해져요.",
    tip: "물 한 잔, 10분 눕기. 오늘의 운을 지키는 법이에요.",
    hex: "#A7C7E7",
    number: 1,
  },
  {
    emoji: "🎯",
    title: "집중이 잘 되는 날",
    line: "머리가 맑아지는 날이에요. 공부·업무·기획을 몰아서 하면 성과가 커져요.",
    tip: "알림을 30분만 꺼 두세요.",
    hex: "#8E9BF2",
    number: 4,
  },
  {
    emoji: "🍜",
    title: "사람과 먹는 자리가 좋아요",
    line: "함께 밥을 먹으면 이야기가 풀리는 날. 오래 못 본 사람에게 연락해 보세요.",
    tip: "먼저 사는 쪽이 다음에도 좋은 자리를 얻어요.",
    hex: "#F5B971",
    number: 6,
  },
  {
    emoji: "🌱",
    title: "새로 시작하기 좋은 날",
    line: "작은 시작이 오래 가는 날이에요. 오늘 시작한 습관은 일주일을 넘길 힘이 있어요.",
    tip: "완벽하게 말고, 일단 시작만.",
    hex: "#9BCF9A",
    number: 8,
  },
  {
    emoji: "🎈",
    title: "기분 좋은 소식이 와요",
    line: "기다리던 답이나 연락이 올 수 있어요. 휴대폰을 조금 멀리 두면 오히려 잘 와요.",
    tip: "좋은 소식은 나누면 두 배가 돼요.",
    hex: "#F6A5C0",
    number: 3,
  },
  {
    emoji: "🧭",
    title: "방향을 점검하는 날",
    line: "지금 가는 길이 맞는지 한 번 돌아보게 되는 날이에요. 조급함을 내려놓으면 답이 보여요.",
    tip: "종이에 세 줄만 적어 보세요.",
    hex: "#C9B6F2",
    number: 2,
  },
  {
    emoji: "✨",
    title: "복이 두 배로 오는 날",
    line: "오늘은 감사한 일을 하나만 찾아보세요. 그 한 줄이 다음 복을 불러옵니다.",
    tip: "고맙다고 말해 본 사람이 오늘의 주인공이에요.",
    hex: "#FFD166",
    number: 9,
  },
];

function personalSeed(): number {
  try {
    const stored = window.localStorage.getItem("saju-catcher:seed");
    if (stored) return Number(stored) || 0;
    const seed = Math.floor(Math.random() * 100000);
    window.localStorage.setItem("saju-catcher:seed", String(seed));
    return seed;
  } catch {
    return 0;
  }
}

function pickIndex(seed: number): number {
  const today = dayKey();
  let hash = seed;
  for (let index = 0; index < today.length; index += 1) {
    hash = (hash * 31 + today.charCodeAt(index)) % 100003;
  }
  return hash % CAPSULES.length;
}

export default function FortuneCatcher() {
  const [phase, setPhase] = useState<"idle" | "rolling" | "done">("idle");
  const [face, setFace] = useState("🔮");
  const [index, setIndex] = useState(0);
  const [todayDone, setTodayDone] = useState(false);

  const capsule = CAPSULES[index];

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("saju-catcher:today");
      if (saved === dayKey()) {
        setTodayDone(true);
        setPhase("done");
        setIndex(pickIndex(personalSeed()));
      }
    } catch {
      /* 저장소를 쓸 수 없으면 매번 새로 뽑습니다. */
    }
  }, []);

  const draw = useCallback(() => {
    if (phase === "rolling") return;
    setPhase("rolling");

    const target = pickIndex(personalSeed());
    let tick = 0;
    const timer = window.setInterval(() => {
      tick += 1;
      setFace(CAPSULES[(target + tick) % CAPSULES.length].emoji);
    }, 80);

    window.setTimeout(() => {
      window.clearInterval(timer);
      setIndex(target);
      setFace(CAPSULES[target].emoji);
      setPhase("done");
      setTodayDone(true);
      try {
        window.localStorage.setItem("saju-catcher:today", dayKey());
      } catch {
        /* noop */
      }
    }, 1400);
  }, [phase]);

  const label = useMemo(() => {
    if (phase === "rolling") return "뽑는 중…";
    if (phase === "done") return todayDone ? "오늘의 운세 다시 보기" : "결과 확인";
    return "오늘의 무료 운세 뽑기 (FREE)";
  }, [phase, todayDone]);

  return (
    <div className="catcher">
      <div className={`catcher__machine${phase === "rolling" ? " is-rolling" : ""}`}>
        <span className="catcher__ring" aria-hidden="true" />
        <picture>
          <source srcSet="/assets/kid/hero-catcher.webp" type="image/webp" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/kid/hero-catcher.jpg"
            alt="운세를 뽑는 복주머니 기계와 흰 호랑이 캐릭터"
            width={900}
            height={900}
            fetchPriority="high"
          />
        </picture>
        <span className="catcher__badge catcher__badge--a" aria-hidden="true">
          {phase === "rolling" ? face : "四柱"}
        </span>
        <span className="catcher__badge catcher__badge--b" aria-hidden="true">
          FORTUNE
        </span>
      </div>

      <button
        className="btn btn--catcher"
        type="button"
        onClick={phase === "done" && !todayDone ? draw : draw}
        disabled={phase === "rolling"}
        aria-live="polite"
      >
        <span aria-hidden="true">🎰</span> {label}
      </button>

      {phase === "done" ? (
        <div className="catcher__result" style={{ ["--hex" as string]: capsule.hex }}>
          <div className="catcher__result-head">
            <span className="catcher__emoji" aria-hidden="true">
              {capsule.emoji}
            </span>
            <div>
              <p className="catcher__kicker">오늘의 기운</p>
              <h3>{capsule.title}</h3>
            </div>
          </div>
          <p className="catcher__line">{capsule.line}</p>
          <p className="catcher__tip">
            <span aria-hidden="true">💡</span> {capsule.tip}
          </p>
          <div className="catcher__lucky">
            <span>
              행운의 색 <i style={{ background: capsule.hex }} aria-hidden="true" />
            </span>
            <span>
              행운의 숫자 <b>{capsule.number}</b>
            </span>
          </div>
          <div className="catcher__actions">
            <Link className="btn btn--soft btn--sm" href="/today">
              생년월일로 정밀하게
            </Link>
            <Link className="btn btn--soft btn--sm" href="/saju">
              내 사주 전체 보기
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
