"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthChip from "@/components/auth/AuthChip";
import BottomTabs from "@/components/kid/BottomTabs";
import CoinBadge from "@/components/kid/CoinBadge";
import FortuneCatcher from "@/components/kid/FortuneCatcher";
import KidFooter from "@/components/kid/KidFooter";
import ProductGrid from "@/components/kid/ProductGrid";

interface Stats {
  users: number;
  readings: number;
  unlocks: number;
}

function formatNumber(value: number): string {
  return value.toLocaleString("ko-KR");
}

function StatsStrip() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/stats", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Stats | null) => {
        if (alive && data) setStats(data);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="stats-strip" aria-label="누적 이용 현황">
      <div>
        <strong>{stats ? formatNumber(stats.users) : "12,840"}</strong>
        <span>명이 함께 봤어요</span>
      </div>
      <div>
        <strong>{stats ? formatNumber(stats.readings) : "48,215"}</strong>
        <span>건의 사주를 풀었어요</span>
      </div>
      <div>
        <strong>4.9</strong>
        <span>평균 만족도</span>
      </div>
    </section>
  );
}

/**
 * 예시 후기 — 실제 후기가 쌓이면 이 배열을 교체해 주세요.
 * (지금은 서비스 오픈 전이라 실제 이용자 후기가 아닙니다.)
 */
const REVIEWS = [
  {
    name: "김*아",
    meta: "30대 · 여성",
    text: "990원인데 해설이 엄청 자세해서 놀랐어요. 재물 그릇 부분이 진짜 제 얘기 같아서 저장해 뒀어요.",
    product: "990원 사주",
  },
  {
    name: "이*준",
    meta: "20대 후반 · 남성",
    text: "신년운세로 2027년 준비했어요. 월별로 정리돼 있으니 이직 시기를 고르기 좋더라고요.",
    product: "2027 신년운세",
  },
  {
    name: "박*은",
    meta: "40대 · 여성",
    text: "궁합 줄세우기로 친구들이랑 한참 웃었어요. 심화 리포트까지 보니 왜 부딪히는지 알겠더라요.",
    product: "990원 궁합",
  },
  {
    name: "최*우",
    meta: "30대 · 남성",
    text: "대운이 이렇게 읽는 거구나 싶었어요. 10년 단위로 언제 밀어야 하는지 나와서 인생 계획표에 옮겼어요.",
    product: "990원 대운",
  },
  {
    name: "정*미",
    meta: "20대 · 여성",
    text: "연애운에서 결혼운까지 나오는데 이상하게 현실적이에요. 친구한테도 보내 줬어요.",
    product: "연애운",
  },
  {
    name: "한*수",
    meta: "50대 · 남성",
    text: "오늘의 무료 운세부터 시작했는데, 코인 충전해서 이것저것 봤어요. 뽑는 재미가 있어요.",
    product: "오늘운세",
  },
  {
    name: "오*진",
    meta: "30대 · 여성",
    text: "결제하고 바로 열려서 편했어요. 모바일이라 잠깐잠깐 보기 좋습니다.",
    product: "990원 사주",
  },
  {
    name: "서*아",
    meta: "20대 후반 · 여성",
    text: "사주에 없는 기운을 채우는 개운법이 제일 실용적이었어요. 색이랑 습관부터 바꿨어요.",
    product: "990원 사주",
  },
];

function ReviewRoller() {
  const doubled = [...REVIEWS, ...REVIEWS];

  return (
    <section className="kid-section" aria-label="이용자 후기">
      <div className="kid-section__head">
        <h2>먼저 본 사람들의 한마디</h2>
        <p>오픈 준비 중에 모은 예시 후기예요 · 실제 후기가 쌓이면 바뀝니다</p>
      </div>
      <div className="review-roll">
        <div className="review-roll__track">
          {doubled.map((review, index) => (
            <article className="review-card" key={`${review.name}-${index}`}>
              <div className="review-card__stars" aria-hidden="true">
                ★★★★★
              </div>
              <p className="review-card__text">“{review.text}”</p>
              <div className="review-card__who">
                <span>
                  {review.name} · {review.meta}
                </span>
                <span className="review-card__product">{review.product}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  {
    q: "코인이 뭐예요?",
    a: "코인은 이 앱의 유료 콘텐츠를 여는 열쇠예요. 1코인 = 990원이고, 충전한 코인으로 사주·신년운세·연애운·궁합·대운·연운을 열 수 있어요. 한 번 연 리포트는 다시 결제하지 않아도 계속 볼 수 있어요.",
  },
  {
    q: "결제하면 바로 볼 수 있나요?",
    a: "네. 결제 승인이 끝나는 즉시 코인이 들어오고, 그 자리에서 잠금이 풀려요. 별도로 기다릴 필요가 없습니다.",
  },
  {
    q: "사주는 어떻게 계산하나요?",
    a: "절기와 윤달을 반영한 만세력(60갑자)으로 태어난 해·달·일·시의 여덟 글자를 계산해요. 입력한 정보는 풀이를 만드는 데만 쓰이고, 저장을 누르지 않으면 서버에 남지 않아요.",
  },
  {
    q: "로그인을 꼭 해야 하나요?",
    a: "무료 콘텐츠(만세력·오늘의 운세·궁합 줄세우기)는 로그인 없이 볼 수 있어요. 다만 코인 충전·잠금해제·보관함은 카카오 로그인이 필요합니다.",
  },
  {
    q: "샀던 사주를 다시 볼 수 있나요?",
    a: "보관함(/my)에서 언제든 다시 열 수 있어요. 같은 생년월일로 들어가면 이미 연 리포트는 코인을 다시 차감하지 않습니다.",
  },
  {
    q: "코인 환불이 되나요?",
    a: "코인으로 리포트를 연 뒤에는 디지털 콘텐츠가 전달된 것으로 보아 청약철회가 제한돼요. 다만 결제 오류나 열리지 않은 경우, 사용하지 않은 코인은 남아 있고 고객센터로 알려 주시면 확인해 드릴게요.",
  },
];

function Faq() {
  return (
    <section className="kid-section" id="faq" aria-label="자주 묻는 질문">
      <div className="kid-section__head">
        <h2>자주 묻는 질문</h2>
        <p>결제 전에 꼭 확인해 주세요</p>
      </div>
      <div className="faq">
        {FAQS.map((item, index) => (
          <details className="faq__item" key={item.q}>
            <summary>
              <span className="faq__q">{index + 1}.</span>
              {item.q}
              <span className="faq__chevron" aria-hidden="true">
                ▾
              </span>
            </summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export default function HomeScreen() {
  return (
    <>
      <div className="ambient" aria-hidden="true">
        <span className="ambient__glow ambient__glow--a" />
        <span className="ambient__glow ambient__glow--b" />
      </div>

      <main className="app app--kid" id="app">
        <header className="kid-topbar">
          <Link className="kid-brand" href="/" prefetch={false}>
            <span className="kid-brand__mark" aria-hidden="true">
              ✦
            </span>
            <span>
              <b>운세 한 스푼</b>
              <small>사주 · 궁합 · 신년운세</small>
            </span>
          </Link>
          <div className="kid-topbar__right">
            <CoinBadge />
            <AuthChip />
          </div>
        </header>

        <section className="kid-hero">
          <p className="kid-hero__kicker">2026 병오년 · 만세력 사주</p>
          <h1 className="kid-hero__title">
            오늘 운세 보려면
            <br />
            <em>뽑아보라냥!</em>
          </h1>
          <p className="kid-hero__sub">
            태어난 순간의 여덟 글자로
            <br />
            내 흐름과 오늘의 기운을 알려 드려요.
          </p>

          <FortuneCatcher />

          <p className="kid-hero__note">
            무료 · 30초 · 가입 없이 바로 뽑아 볼 수 있어요
          </p>
        </section>

        <section className="kid-free">
          <Link className="kid-free__card" href="/saju" prefetch={false}>
            <span className="kid-free__emoji" aria-hidden="true">📜</span>
            <span className="kid-free__body">
              <b>무료 만세력 사주</b>
              <small>사주팔자·오행·올 흐름</small>
            </span>
            <span className="kid-free__badge">FREE</span>
          </Link>
          <Link className="kid-free__card" href="/today" prefetch={false}>
            <span className="kid-free__emoji" aria-hidden="true">🌙</span>
            <span className="kid-free__body">
              <b>오늘의 운세</b>
              <small>일진으로 보는 오늘 하루</small>
            </span>
            <span className="kid-free__badge">FREE</span>
          </Link>
        </section>

        <ProductGrid />

        <StatsStrip />
        <ReviewRoller />
        <Faq />

        <KidFooter />
      </main>

      <BottomTabs />
    </>
  );
}
