"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface Props {
  next?: string;
}

/** 카카오 OAuth 시작 버튼. Supabase 미설정이면 안내 페이지로 보냅니다. */
export default function KakaoLoginButton({ next = "/" }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      window.location.href = "/login?error=not_configured";
      return;
    }

    setBusy(true);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo,
        // 카카오 계정 이메일까지 받으려면 카카오 동의항목에서 이메일을 켜고
        // 아래 scopes 주석을 해제하세요. (닉네임만으로도 로그인은 가능합니다)
        // scopes: "account_email",
      },
    });

    if (oauthError) {
      setBusy(false);
      setError(
        "카카오 로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요. " +
          (oauthError.message ? `(${oauthError.message})` : ""),
      );
    }
  };

  return (
    <>
      {error ? (
        <p className="auth-error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="kakao-btn" type="button" onClick={signIn} disabled={busy}>
        <span className="kakao-btn__icon" aria-hidden="true">
          💬
        </span>
        {busy ? "카카오로 이동 중…" : "카카오로 3초 만에 시작하기"}
      </button>
    </>
  );
}
