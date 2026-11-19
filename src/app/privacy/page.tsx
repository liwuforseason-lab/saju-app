import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "운세 한 스푼이 수집하는 정보와 이용 목적, 보관 기간을 안내합니다.",
};

const CONTACT_EMAIL = (process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "").trim();

export default function PrivacyPage() {
  return (
    <>
      <div className="ambient" aria-hidden="true">
        <span className="ambient__glow ambient__glow--a" />
      </div>

      <main className="page-shell legal">
        <header className="topbar">
          <Link className="brand" href="/">
            <span className="brand__mark" aria-hidden="true">
              ✦
            </span>
            <span className="brand__text">운세 한 스푼</span>
          </Link>
          <Link className="auth-chip" href="/">
            사주 보기
          </Link>
        </header>

        <div className="page-head">
          <h1>개인정보처리방침</h1>
          <p>
            운세 한 스푼(이하 “서비스”)은 이용자의 개인정보를 소중히 다루며, 아래와
            같이 수집·이용합니다.
          </p>
        </div>

        <div className="card">
          <h2>1. 수집하는 정보</h2>
          <ul>
            <li>
              <strong>사주 입력 정보</strong> — 이름(선택), 성별(선택), 양력·음력
              생년월일, 태어난 시간(선택). 풀이 계산에만 사용하며, 저장을 누르기 전에는
              서버로 전송되지 않습니다.
            </li>
            <li>
              <strong>로그인 정보</strong> — 카카오 계정 식별자, 닉네임, 프로필 이미지
              URL(제공 시). 카카오 로그인을 이용한 경우에만 수집합니다.
            </li>
            <li>
              <strong>저장 기록</strong> — 저장한 사주 프로필, 풀이 결과, 궁합 보드
              참여자(닉네임·생년월일), 저장 시각.
            </li>
            <li>
              <strong>자동 수집 정보</strong> — 접속 기기·브라우저 정보, 접속 로그,
              쿠키. 서비스 안정성과 광고 게재에 사용됩니다.
            </li>
          </ul>

          <h2>2. 이용 목적</h2>
          <ul>
            <li>만세력 기반 사주 풀이 결과 제공</li>
            <li>로그인한 이용자의 사주·풀이·궁합 보드 저장 및 조회</li>
            <li>서비스 품질 개선, 오류 분석, 부정 이용 방지</li>
            <li>광고 게재 및 제휴(쿠팡 파트너스) 수익 활동</li>
          </ul>

          <h2>3. 보관 기간</h2>
          <p>
            저장한 프로필·풀이·궁합 보드는 이용자가 직접 삭제하거나 회원 탈퇴를 요청할
            때까지 보관합니다. 로그인 세션 정보는 로그아웃 시 삭제됩니다. 관계 법령에서
            정한 경우 해당 기간 동안 보관할 수 있습니다.
          </p>

          <h2>4. 처리 위탁 및 제3자 제공</h2>
          <ul>
            <li>
              <strong>Supabase</strong> — 회원 인증 및 데이터베이스 저장 (해외 리전
              사용 가능)
            </li>
            <li>
              <strong>Vercel</strong> — 웹사이트 호스팅 및 접속 로그
            </li>
            <li>
              <strong>카카오</strong> — 카카오 로그인 인증
            </li>
            <li>
              <strong>Google AdSense · 카카오 애드핏</strong> — 광고 게재. 광고 사업자는
              쿠키를 이용해 관심 기반 광고를 제공할 수 있습니다.
            </li>
            <li>
              <strong>쿠팡 파트너스</strong> — 제휴 링크 클릭 시 쿠키 기반 추적
            </li>
          </ul>
          <p className="muted">
            서비스는 위 목적 외로 개인정보를 판매하거나 제공하지 않습니다.
          </p>

          <h2>5. 쿠키 및 광고</h2>
          <p>
            서비스는 로그인 유지와 광고 게재를 위해 쿠키를 사용합니다. 브라우저 설정에서
            쿠키 저장을 거부할 수 있으며, 이 경우 로그인 기반 기능 이용이 제한될 수
            있습니다. Google 광고 설정은{" "}
            <a
              href="https://adssettings.google.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google 광고 설정
            </a>
            에서 관리할 수 있습니다.
          </p>

          <h2>6. 이용자의 권리</h2>
          <ul>
            <li>저장한 프로필·풀이 삭제: 마이페이지에서 직접 삭제</li>
            <li>회원 탈퇴 및 전체 데이터 삭제 요청: 아래 문의처로 연락</li>
            <li>개인정보 열람·정정 요청: 아래 문의처로 연락</li>
          </ul>

          <h2>7. 문의처</h2>
          <p>
            {CONTACT_EMAIL ? (
              <>
                이메일: <strong>{CONTACT_EMAIL}</strong>
              </>
            ) : (
              <span className="muted">
                운영자 이메일은 배포 시 <code>NEXT_PUBLIC_CONTACT_EMAIL</code> 환경변수로
                설정해 주세요.
              </span>
            )}
          </p>

          <h2>8. 고지</h2>
          <p className="muted">
            본 서비스의 사주 풀이는 재미와 참고를 위한 것으로, 의료·법률·투자 등 중요한
            판단의 근거로 사용할 수 없습니다. 방침이 변경되면 이 페이지에 게시합니다.
          </p>
          <p className="muted">공고일: 2026년 11월 19일</p>
        </div>

        <SiteFooter />
      </main>
    </>
  );
}
