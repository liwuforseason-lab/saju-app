"use client";

import { isSupabaseConfigured } from "@/lib/env";

interface Props {
  next?: string;
}

/**
 * 카카오 OAuth 시작 버튼.
 *
 * Supabase 의 Kakao 프로바이더는 account_email 까지 요청해서, 이메일 동의항목이
 * 없는 일반 앱에서는 카카오가 KOE205(잘못된 요청)로 거절합니다.
 * 그래서 카카오 OIDC 인가 화면으로 직접 보내고(/api/auth/kakao/start),
 * 돌아온 id_token 을 서버에서 Supabase 세션으로 교환합니다.
 */
export default function KakaoLoginButton({ next = "/" }: Props) {
  const start = () => {
    if (!isSupabaseConfigured) {
      window.location.href = "/login?error=not_configured";
      return;
    }
    window.location.href = `/api/auth/kakao/start?next=${encodeURIComponent(next)}`;
  };

  return (
    <button className="kakao-btn" type="button" onClick={start}>
      <span className="kakao-btn__icon" aria-hidden="true">
        💬
      </span>
      카카오로 3초 만에 시작하기
    </button>
  );
}
