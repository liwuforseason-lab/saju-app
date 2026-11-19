"use client";

import Link from "next/link";
import { useWallet } from "./useWallet";

/** 상단 코인 잔액 배지. 로그인 전에는 '로그인'으로 보입니다. */
export default function CoinBadge() {
  const wallet = useWallet();

  if (wallet.loading) {
    return <span className="coin-badge coin-badge--muted">코인 …</span>;
  }

  if (!wallet.loggedIn) {
    return (
      <Link className="coin-badge coin-badge--login" href="/charge" prefetch={false}>
        <span aria-hidden="true">🪙</span> 코인
      </Link>
    );
  }

  return (
    <Link className="coin-badge" href="/charge" prefetch={false} aria-label={`보유 코인 ${wallet.balance}개, 충전하기`}>
      <span aria-hidden="true">🪙</span>
      <b>{wallet.balance}</b>
      <span className="coin-badge__plus" aria-hidden="true">
        +
      </span>
    </Link>
  );
}
