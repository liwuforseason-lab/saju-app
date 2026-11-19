import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import {
  RELATION_LABEL,
  type SajuProfileRow,
  type SajuReadingRow,
} from "@/lib/db-types";
import type { BoardRow } from "@/lib/board";
import { isSupabaseConfigured } from "@/lib/env";
import { shareQueryFromInput } from "@/lib/form";
import { getCurrentUser, getSupabaseServerClient } from "@/lib/supabase/server";
import { deleteProfile, deleteReading } from "./actions";

export const metadata: Metadata = {
  title: "마이페이지",
  description: "저장한 사주와 풀이를 다시 보고 관리해요.",
};

export const dynamic = "force-dynamic";

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(value));
  } catch {
    return value.slice(0, 10);
  }
}

function birthLabel(profile: SajuProfileRow): string {
  const cal = profile.calendar === "lunar" ? "음력" : "양력";
  const leap = profile.is_leap_month ? "(윤)" : "";
  return `${cal} ${profile.birth_year}.${String(profile.birth_month).padStart(2, "0")}.${String(
    profile.birth_day,
  ).padStart(2, "0")}${leap}`;
}

export default async function MyPage() {
  if (!isSupabaseConfigured) {
    return (
      <>
        <div className="ambient" aria-hidden="true">
          <span className="ambient__glow ambient__glow--a" />
        </div>
        <main className="page-shell">
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
            <h1>마이페이지</h1>
            <p>저장한 사주와 풀이를 다시 보고 관리하는 곳이에요.</p>
          </div>

          <div className="notice notice--info">
            <p className="notice__title">
              <span className="notice__badge" aria-hidden="true">
                ✦
              </span>
              저장 기능은 준비 중이에요
            </p>
            <p>
              Supabase 연결이 끝나면 카카오 로그인과 함께 내 사주·지인 사주·궁합 보드가
              이 화면에 모입니다. 그때까지는 사주 풀이를 무료로 그대로 보실 수 있어요.
            </p>
          </div>

          <Link className="btn btn--primary btn--full" href="/">
            사주 보러 가기 <span className="btn__arrow">→</span>
          </Link>
          <SiteFooter />
        </main>
      </>
    );
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/my");

  const supabase = await getSupabaseServerClient();
  const [{ data: profiles }, { data: readings }, { data: boards }] =
    await Promise.all([
      supabase!
        .from("saju_profiles")
        .select("*")
        .order("updated_at", { ascending: false }),
      supabase!
        .from("saju_readings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase!
        .from("compatibility_boards")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const profileRows = (profiles ?? []) as SajuProfileRow[];
  const readingRows = (readings ?? []) as SajuReadingRow[];
  const boardRows = (boards ?? []) as BoardRow[];
  const profileById = new Map(profileRows.map((p) => [p.id, p]));

  return (
    <>
      <div className="ambient" aria-hidden="true">
        <span className="ambient__glow ambient__glow--a" />
        <span className="ambient__glow ambient__glow--b" />
      </div>

      <main className="page-shell">
        <header className="topbar">
          <Link className="brand" href="/">
            <span className="brand__mark" aria-hidden="true">
              ✦
            </span>
            <span className="brand__text">운세 한 스푼</span>
          </Link>
          <div className="topbar__right">
            <Link className="auth-chip" href="/">
              사주 보기
            </Link>
            <form action="/auth/signout" method="post">
              <button className="auth-chip" type="submit">
                로그아웃
              </button>
            </form>
          </div>
        </header>

        <div className="page-head">
          <h1>내 사주 보관함</h1>
          <p>
            저장한 풀이는 언제든 다시 열 수 있어요. 필요 없는 기록은 바로 지울 수
            있습니다.
          </p>
        </div>

        <section className="mypage-section">
          <div className="mypage-section__head">
            <h2>사주 프로필</h2>
            <span>{profileRows.length}명</span>
          </div>

          {profileRows.length ? (
            <ul className="profile-grid">
              {profileRows.map((profile) => (
                <li className="profile-pill" key={profile.id}>
                  <b>{profile.name}</b>
                  <span>{birthLabel(profile)}</span>
                  <span className="profile-pill__rel">
                    {RELATION_LABEL[profile.relation]}
                  </span>
                  <form action={deleteProfile}>
                    <input type="hidden" name="id" value={profile.id} />
                    <button
                      className="profile-pill__x"
                      type="submit"
                      aria-label={`${profile.name} 프로필 삭제`}
                    >
                      ✕
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              아직 저장한 프로필이 없어요.
              <br />
              <Link href="/">사주를 보고 “내 사주에 저장”을 눌러 보세요.</Link>
            </div>
          )}
        </section>

        <section className="mypage-section">
          <div className="mypage-section__head">
            <h2>저장한 풀이</h2>
            <span>{readingRows.length}개</span>
          </div>

          {readingRows.length ? (
            <ul className="saved-list">
              {readingRows.map((reading) => {
                const profile = reading.profile_id
                  ? profileById.get(reading.profile_id)
                  : undefined;
                const query = shareQueryFromInput(
                  reading.input as {
                    name?: string;
                    gender?: string;
                    calendar?: string;
                    leap?: boolean;
                    year: number;
                    month: number;
                    day: number;
                    timeIndex?: number;
                  },
                );

                return (
                  <li className="saved-item" key={reading.id}>
                    <div className="saved-item__top">
                      <span className="saved-item__title">
                        {reading.title ?? "나의 사주"}
                      </span>
                      <span className="saved-item__date">
                        {formatDate(reading.created_at)}
                      </span>
                    </div>
                    {profile ? (
                      <span className="saved-item__meta">
                        {profile.name} · {birthLabel(profile)}
                      </span>
                    ) : null}
                    {reading.summary ? (
                      <p
                        className="saved-item__summary"
                        style={{ margin: 0 }}
                      >
                        {reading.summary.split("\n").slice(0, 3).join("\n")}
                      </p>
                    ) : null}
                    <div className="saved-item__actions">
                      <Link href={`/?${query}`}>다시 보기 →</Link>
                      <form action={deleteReading}>
                        <input type="hidden" name="id" value={reading.id} />
                        <button className="btn--danger" type="submit">
                          삭제
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="empty-state">
              아직 저장한 풀이가 없어요.
              <br />
              <Link href="/">사주를 보러 가기 →</Link>
            </div>
          )}
        </section>

        <section className="mypage-section">
          <div className="mypage-section__head">
            <h2>궁합 줄세우기</h2>
            <span>{boardRows.length}개</span>
          </div>

          {boardRows.length ? (
            <ul className="saved-list">
              {boardRows.map((board) => {
                const query = shareQueryFromInput({
                  name: board.owner_name,
                  gender: board.owner_gender,
                  calendar: board.owner_calendar,
                  leap: board.owner_is_leap_month,
                  year: board.owner_birth_year,
                  month: board.owner_birth_month,
                  day: board.owner_birth_day,
                  timeIndex: board.owner_birth_time_index,
                });
                return (
                  <li className="saved-item" key={board.id}>
                    <div className="saved-item__top">
                      <span className="saved-item__title">{board.title}</span>
                      <span className="saved-item__date">
                        {formatDate(board.created_at)}
                      </span>
                    </div>
                    <span className="saved-item__meta">
                      {board.owner_name || "나"} ·{" "}
                      {board.is_public ? "공개" : "비공개"} · 초대 코드{" "}
                      {board.share_slug}
                    </span>
                    <div className="saved-item__actions">
                      <Link href={`/board?${query}&b=${board.id}`}>
                        보드 열기 →
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="empty-state">
              내 사주를 가운데 두고 친구·연인·최애와의 궁합을 순위로 볼 수 있어요.
              <br />
              <Link href="/board">궁합 보드 만들기 →</Link>
            </div>
          )}
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
