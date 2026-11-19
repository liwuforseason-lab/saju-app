"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/board", label: "궁합보드", icon: "💞" },
  { href: "/today", label: "오늘운세", icon: "🔮" },
  { href: "/my", label: "보관함", icon: "🎁" },
];

export default function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav className="tabbar" aria-label="주요 메뉴">
      <ul className="tabbar__list">
        {TABS.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href}>
              <Link
                className={`tabbar__item${active ? " is-active" : ""}`}
                href={tab.href}
                prefetch={false}
                aria-current={active ? "page" : undefined}
              >
                <span className="tabbar__icon" aria-hidden="true">
                  {tab.icon}
                </span>
                <span className="tabbar__label">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
