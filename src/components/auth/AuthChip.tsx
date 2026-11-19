"use client";

import Link from "next/link";
import { displayName, useAuth } from "@/components/auth/useAuth";

/** 상단 바의 로그인 / 마이페이지 칩. Supabase 미설정이어도 눌러서 안내를 볼 수 있습니다. */
export default function AuthChip() {
  const { configured, loading, user } = useAuth();

  if (loading) {
    return <span className="auth-chip auth-chip--muted">…</span>;
  }

  if (!configured) {
    return (
      <Link className="auth-chip" href="/login" prefetch={false}>
        로그인
      </Link>
    );
  }

  if (!user) {
    return (
      <Link className="auth-chip" href="/login" prefetch={false}>
        로그인
      </Link>
    );
  }

  return (
    <Link className="auth-chip auth-chip--user" href="/my" prefetch={false}>
      <span className="auth-chip__dot" aria-hidden="true" />
      {displayName(user)}
    </Link>
  );
}
