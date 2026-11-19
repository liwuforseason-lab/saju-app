"use client";

import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured } from "@/lib/env";

export interface WalletState {
  configured: boolean;
  loading: boolean;
  loggedIn: boolean;
  balance: number;
  /** "saju:19990422-t6-f-sn" 형태의 잠금해제 키 집합 */
  unlocked: Set<string>;
}

const EMPTY: WalletState = {
  configured: isSupabaseConfigured,
  loading: true,
  loggedIn: false,
  balance: 0,
  unlocked: new Set(),
};

let cache: WalletState | null = null;
const listeners = new Set<(state: WalletState) => void>();

function publish(next: WalletState) {
  cache = next;
  listeners.forEach((listener) => listener(next));
}

export function unlockKey(reportType: string, targetKey: string): string {
  return `${reportType}:${targetKey}`;
}

/** 서버에서 지갑 상태를 다시 읽어 옵니다. 결제·잠금해제 후 호출하세요. */
export async function refreshWallet(): Promise<WalletState | null> {
  if (!isSupabaseConfigured) {
    const state = { ...EMPTY, loading: false };
    publish(state);
    return state;
  }

  try {
    const response = await fetch("/api/wallet", { cache: "no-store" });
    if (response.status === 401 || response.status === 503) {
      const state = { ...EMPTY, loading: false, loggedIn: false };
      publish(state);
      return state;
    }
    const data = (await response.json()) as {
      balance?: number;
      unlocks?: { reportType: string; targetKey: string }[];
    };
    const stateValue: WalletState = {
      configured: true,
      loading: false,
      loggedIn: true,
      balance: Number(data.balance ?? 0),
      unlocked: new Set(
        (data.unlocks ?? []).map((row) => unlockKey(row.reportType, row.targetKey)),
      ),
    };
    publish(stateValue);
    return stateValue;
  } catch {
    const state = { ...EMPTY, loading: false };
    publish(state);
    return state;
  }
}

/** 브라우저에서 현재 지갑(코인 잔액·잠금해제 목록)을 구독합니다. */
export function useWallet(): WalletState {
  const [state, setState] = useState<WalletState>(cache ?? EMPTY);

  useEffect(() => {
    listeners.add(setState);
    if (!cache) {
      void refreshWallet();
    }
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return state;
}

/** 리포트 잠금해제. 성공하면 지갑을 새로 읽습니다. */
export function useUnlock() {
  const [busy, setBusy] = useState(false);

  const unlock = useCallback(
    async (
      reportType: string,
      targetKey: string,
    ): Promise<
      | { ok: true; already: boolean; balance: number }
      | { ok: false; error: string; message: string; needed?: number }
    > => {
      setBusy(true);
      try {
        const response = await fetch("/api/unlocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportType, targetKey }),
        });
        const data = (await response.json().catch(() => ({}))) as {
          ok?: boolean;
          already?: boolean;
          balance?: number;
          error?: string;
          message?: string;
          needed?: number;
        };

        if (!response.ok || !data.ok) {
          return {
            ok: false,
            error: data.error ?? "unlock_failed",
            message: data.message ?? "잠금해제에 실패했어요.",
            needed: data.needed,
          };
        }

        await refreshWallet();
        return {
          ok: true,
          already: Boolean(data.already),
          balance: Number(data.balance ?? 0),
        };
      } catch {
        return {
          ok: false,
          error: "network",
          message: "네트워크 오류로 잠금해제를 마치지 못했어요.",
        };
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  return { unlock, busy };
}
