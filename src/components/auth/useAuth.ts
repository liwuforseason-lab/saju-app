"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";

interface AuthState {
  configured: boolean;
  loading: boolean;
  user: User | null;
}

/** 브라우저에서 현재 로그인 상태를 구독합니다. Supabase 미설정이면 configured=false. */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    configured: isSupabaseConfigured,
    loading: isSupabaseConfigured,
    user: null,
  });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setState({ configured: false, loading: false, user: null });
      return;
    }

    let alive = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!alive) return;
      setState({ configured: true, loading: false, user: data.user ?? null });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setState({
        configured: true,
        loading: false,
        user: session?.user ?? null,
      });
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
}

/** 카카오 계정 닉네임(없으면 이름, 그것도 없으면 "회원"). */
export function displayName(user: User | null): string {
  if (!user) return "회원";
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const candidates = [
    meta.nickname,
    meta.name,
    meta.full_name,
    meta.preferred_username,
    typeof meta.user_name === "string" ? meta.user_name : null,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim().slice(0, 12);
  }
  return user.email ? user.email.split("@")[0].slice(0, 12) : "회원";
}
