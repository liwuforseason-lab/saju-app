"use client";

import Link from "next/link";

interface IntroScreenProps {
  onStart: () => void;
}

export default function IntroScreen({ onStart }: IntroScreenProps) {
  return (
    <section className="screen is-active" id="screen-intro" data-screen="intro">
      <div className="hero">
        <p className="kicker">2026 병오년 · 만세력 사주</p>
        <h1 className="hero__title">
          내 안의
          <br />
          <em>여덟 글자</em>를 읽다
        </h1>
        <p className="hero__sub">
          태어난 순간의 하늘을 60갑자로 풀어
          <br />
          나만의 기운과 올해의 흐름을 알려드려요.
        </p>

        <div className="hero__art">
          <div className="hero__ring" />
          <picture>
            <source srcSet="/assets/hero-mascot.webp" type="image/webp" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/hero-mascot.jpg"
              alt="복주머니를 든 호랑이 도깨비 사주 캐릭터"
              width={640}
              height={640}
              fetchPriority="high"
            />
          </picture>
          <span className="hero__badge hero__badge--a">四柱八字</span>
          <span className="hero__badge hero__badge--b">五行平衡</span>
        </div>

        <button className="btn btn--primary" type="button" id="startBtn" onClick={onStart}>
          내 사주 보러가기 <span className="btn__arrow">→</span>
        </button>
        <p className="hero__note">
          무료 · 30초 · 저장을 누르기 전엔 브라우저에서만 계산해요
        </p>

        <ul className="feature-row">
          <li>
            <span aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <rect x="3.5" y="5" width="17" height="15" rx="3.5" />
                <path d="M8 3v4M16 3v4M3.5 10h17" />
                <circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none" />
              </svg>
            </span>
            <strong>정확한 만세력</strong>
            <small>절기·윤달 반영</small>
          </li>
          <li>
            <span aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="12" cy="5.6" r="2.4" />
                <circle cx="5.6" cy="14.4" r="2.4" />
                <circle cx="18.4" cy="14.4" r="2.4" />
                <circle cx="8.4" cy="20" r="1.5" />
                <circle cx="15.6" cy="20" r="1.5" />
                <path d="M12 8v4M10.4 13l-3.2 0M13.6 13l3.2 0" strokeLinecap="round" opacity=".55" />
              </svg>
            </span>
            <strong>오행 밸런스</strong>
            <small>부족한 기운까지</small>
          </li>
          <li>
            <span aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 3.5l2.3 6.2 6.2 2.3-6.2 2.3L12 20.5l-2.3-6.2L3.5 12l6.2-2.3z" />
              </svg>
            </span>
            <strong>내 사주 저장</strong>
            <small>카카오 로그인</small>
          </li>
        </ul>

        <Link className="hero__board" href="/board">
          <span aria-hidden="true">💞</span>
          <span>
            <b>친구랑 궁합 줄세우기</b>
            <small>내 사주를 가운데 두고 궁합 순위 보기</small>
          </span>
          <span className="hero__board-arrow" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
