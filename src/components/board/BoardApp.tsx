"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdSlot from "@/components/ads/AdSlot";
import AuthChip from "@/components/auth/AuthChip";
import BottomTabs from "@/components/kid/BottomTabs";
import CoinBadge from "@/components/kid/CoinBadge";
import { useAuth } from "@/components/auth/useAuth";
import SiteFooter from "@/components/SiteFooter";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import BirthFields, { EMPTY_BIRTH, type BirthValue } from "./BirthFields";
import HubMap from "./HubMap";
import RankList from "./RankList";
import {
  RELATION_OPTIONS,
  birthFromEntryRow,
  buildPerson,
  loadLocalEntries,
  ownerFromRow,
  saveLocalEntries,
  sortByScore,
  type BoardEntryRow,
  type BoardPerson,
  type BoardRelation,
  type BoardRow,
} from "@/lib/board";
import { formFromSearchParams } from "@/lib/form";
import type { SajuEngine, SajuResult } from "@/lib/saju/types";
import type { NormalizedBirth } from "@/lib/validation";

function BoardScreen() {
  const router = useRouter();
  const { configured, loading: authLoading, user } = useAuth();
  const { show } = useToast();

  const [engine, setEngine] = useState<SajuEngine | null>(null);
  const [me, setMe] = useState<SajuResult | null>(null);
  const [owner, setOwner] = useState<NormalizedBirth | null>(null);
  const [people, setPeople] = useState<BoardPerson[]>([]);
  const [search, setSearch] = useState<string | null>(null);
  const [boardId, setBoardId] = useState<string | null>(null);
  const [boardTitle, setBoardTitle] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [boardError, setBoardError] = useState<string | null>(null);
  const [savingBoard, setSavingBoard] = useState(false);

  const [setupName, setSetupName] = useState("");
  const [setupBirth, setSetupBirth] = useState<BirthValue>(EMPTY_BIRTH);
  const [setupError, setSetupError] = useState<string | null>(null);

  const [addName, setAddName] = useState("");
  const [addRelation, setAddRelation] = useState<BoardRelation>("friend");
  const [addBirth, setAddBirth] = useState<BirthValue>(EMPTY_BIRTH);
  const [adding, setAdding] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [promptSave, setPromptSave] = useState(false);

  /* ---------------------------------------------- 0) URL 쿼리 읽기(마운트 후) */
  useEffect(() => {
    const query = window.location.search.replace(/^\?/, "");
    setSearch(query);
    const id = new URLSearchParams(query).get("b");
    if (id) setBoardId(id);
  }, []);

  /* ------------------------------------------------ 1) 엔진 + URL의 내 사주 */
  useEffect(() => {
    if (search === null) return;
    let alive = true;
    (async () => {
      try {
        const mod = await import("@/lib/saju");
        if (!alive) return;
        setEngine(mod.Saju);

        const parsed = formFromSearchParams(new URLSearchParams(search));
        if (!parsed) return;

        const birth: NormalizedBirth = {
          name: parsed.name,
          gender: parsed.gender,
          calendar: parsed.calendar,
          leap: parsed.leap,
          year: parsed.year,
          month: parsed.month,
          day: parsed.day,
          timeIndex: parsed.timeIndex,
        };

        try {
          const computed = mod.computeSaju(birth);
          if (!alive) return;
          setOwner(birth);
          setMe(computed);
          setSetupName(parsed.name);
          setSetupBirth({
            gender: parsed.gender,
            calendar: parsed.calendar,
            leap: parsed.leap,
            year: parsed.year,
            month: parsed.month,
            day: parsed.day,
            timeIndex: parsed.timeIndex,
          });
        } catch (caught) {
          if (!alive) return;
          setSetupError(
            caught instanceof Error
              ? caught.message
              : "생년월일을 다시 확인해 주세요.",
          );
        }
      } catch {
        if (alive) setBoardError("만세력 엔진을 불러오지 못했어요. 새로고침해 주세요.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [search]);

  /* ------------------------------------------------- 2) 저장된 보드 불러오기 */
  useEffect(() => {
    if (!boardId || !engine) return;
    let alive = true;

    (async () => {
      try {
        const response = await fetch(`/api/boards/${boardId}`, { cache: "no-store" });
        const data = (await response.json()) as {
          board?: BoardRow;
          entries?: BoardEntryRow[];
          isOwner?: boolean;
          message?: string;
        };

        if (!alive) return;

        if (!response.ok || !data.board) {
          setBoardError(
            data.message ?? "보드를 불러오지 못했어요. 링크를 다시 확인해 주세요.",
          );
          return;
        }

        const serverOwner = ownerFromRow(data.board);
        let meResult: SajuResult;
        try {
          meResult = engine.computeSaju(serverOwner);
        } catch {
          setBoardError("보드 주인의 사주를 계산하지 못했어요.");
          return;
        }

        const rows = data.entries ?? [];
        const mapped = rows.map((row) =>
          buildPerson(engine, meResult, {
            nickname: row.nickname,
            relation: row.relation,
            birth: birthFromEntryRow(row),
            key: row.id,
            serverId: row.id,
            score: row.compat_score,
            label: row.compat_label,
          }),
        );

        if (!alive) return;
        setOwner(serverOwner);
        setMe(meResult);
        setBoardTitle(data.board.title ?? "");
        setIsOwner(Boolean(data.isOwner));
        setPeople(sortByScore(mapped));
      } catch {
        if (alive) setBoardError("보드를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
      }
    })();

    return () => {
      alive = false;
    };
  }, [boardId, engine]);

  /* ------------------------------------- 3) 이 브라우저에만 있던 참여자 합치기 */
  useEffect(() => {
    if (!engine || !me || !owner) return;
    const stored = loadLocalEntries(owner);
    if (stored.length === 0) return;

    setPeople((prev) => {
      const seen = new Set(
        prev.map(
          (person) =>
            `${person.nickname}|${person.birth.calendar}|${person.birth.year}-${person.birth.month}-${person.birth.day}`,
        ),
      );

      const restored: BoardPerson[] = [];
      for (const entry of stored) {
        const key = `${entry.nickname}|${entry.birth.calendar}|${entry.birth.year}-${entry.birth.month}-${entry.birth.day}`;
        if (seen.has(key)) continue;
        seen.add(key);
        try {
          restored.push(
            buildPerson(engine, me, {
              nickname: entry.nickname,
              relation: entry.relation,
              birth: entry.birth,
            }),
          );
        } catch {
          /* 계산할 수 없는 예전 기록은 건너뜁니다. */
        }
      }

      return restored.length ? sortByScore([...prev, ...restored]) : prev;
    });
    // 복원은 사주가 확정된 뒤 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, engine, me, owner]);

  const persistLocal = useCallback(
    (next: BoardPerson[]) => {
      if (!owner) return;
      saveLocalEntries(
        owner,
        next
          .filter((person) => !person.serverId)
          .map((person) => ({
            nickname: person.nickname,
            relation: person.relation,
            birth: person.birth,
          })),
      );
    },
    [owner],
  );

  const ranked = useMemo(() => sortByScore(people), [people]);

  /** 1위와의 심화 케미 리포트로 넘길 쿼리 (유료 1코인) */
  const deepReportHref = useMemo(() => {
    if (!owner || ranked.length === 0) return null;
    const top = ranked[0];
    const q = new URLSearchParams();
    q.set("n", owner.name || "나");
    q.set("g", owner.gender);
    q.set("cal", owner.calendar);
    if (owner.calendar === "lunar" && owner.leap) q.set("leap", "1");
    q.set("y", String(owner.year));
    q.set("m", String(owner.month));
    q.set("d", String(owner.day));
    if (owner.timeIndex >= 0) q.set("t", String(owner.timeIndex));
    q.set("bn", top.nickname);
    q.set("bg", top.birth.gender);
    q.set("bcal", top.birth.calendar);
    if (top.birth.calendar === "lunar" && top.birth.leap) q.set("bleap", "1");
    q.set("by", String(top.birth.year));
    q.set("bm", String(top.birth.month));
    q.set("bd", String(top.birth.day));
    if (top.birth.timeIndex >= 0) q.set("bt", String(top.birth.timeIndex));
    return `/report/gunghap?${q.toString()}`;
  }, [owner, ranked]);

  /** 저장 전(로컬) 보드는 이 화면을 연 사람이 주인입니다. */
  const viewerIsOwner = boardId ? isOwner : true;

  /* ------------------------------------------------------- 내 보드 시작하기 */
  const startBoard = () => {
    if (!engine) return;
    const birth: NormalizedBirth = {
      name: setupName.trim(),
      gender: setupBirth.gender,
      calendar: setupBirth.calendar,
      leap: setupBirth.leap,
      year: setupBirth.year,
      month: setupBirth.month,
      day: setupBirth.day,
      timeIndex: setupBirth.timeIndex,
    };
    try {
      const computed = engine.computeSaju(birth);
      setOwner(birth);
      setMe(computed);
      setSetupError(null);

      const q = new URLSearchParams();
      if (birth.name) q.set("n", birth.name);
      if (birth.gender !== "n") q.set("g", birth.gender);
      q.set("cal", birth.calendar);
      q.set("y", String(birth.year));
      q.set("m", String(birth.month));
      q.set("d", String(birth.day));
      if (birth.leap) q.set("leap", "1");
      if (birth.timeIndex >= 0) q.set("t", String(birth.timeIndex));
      const target = `/board?${q.toString()}${boardId ? `&b=${boardId}` : ""}`;
      window.history.replaceState(null, "", target);
      show("내 궁합 보드를 열었어요. 친구를 추가해 보세요!");
    } catch (caught) {
      setSetupError(
        caught instanceof Error ? caught.message : "생년월일을 다시 확인해 주세요.",
      );
    }
  };

  /* ------------------------------------------------------------ 사람 추가 */
  const addPerson = async () => {
    if (!engine || !me || !owner) return;

    const nickname = addName.trim();
    if (!nickname) {
      show("닉네임을 입력해 주세요.");
      return;
    }

    const birth: NormalizedBirth = {
      name: nickname,
      gender: addBirth.gender,
      calendar: addBirth.calendar,
      leap: addBirth.leap,
      year: addBirth.year,
      month: addBirth.month,
      day: addBirth.day,
      timeIndex: addBirth.timeIndex,
    };

    if (
      people.some(
        (person) =>
          person.nickname === nickname &&
          person.birth.year === birth.year &&
          person.birth.month === birth.month &&
          person.birth.day === birth.day,
      )
    ) {
      show("이미 보드에 있는 사람이에요.");
      return;
    }

    let person: BoardPerson;
    try {
      person = buildPerson(engine, me, {
        nickname,
        relation: addRelation,
        birth,
      });
    } catch (caught) {
      show(
        caught instanceof Error
          ? caught.message
          : "생년월일을 다시 확인해 주세요.",
      );
      return;
    }

    setAdding(true);
    try {
      // 로그인 + 저장된 보드라면 서버에 남겨 친구들과 함께 봅니다.
      if (boardId && configured && user) {
        const response = await fetch(`/api/boards/${boardId}/entries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nickname, relation: addRelation, birth }),
        });
        const data = (await response.json().catch(() => null)) as
          | { entry?: BoardEntryRow; message?: string }
          | null;

        if (!response.ok || !data?.entry) {
          show(data?.message ?? "보드에 추가하지 못했어요. 잠시 후 다시 시도해 주세요.");
          return;
        }

        person = buildPerson(engine, me, {
          nickname: data.entry.nickname,
          relation: data.entry.relation,
          birth: birthFromEntryRow(data.entry),
          key: data.entry.id,
          serverId: data.entry.id,
          score: data.entry.compat_score,
          label: data.entry.compat_label,
        });
      }

      const next = sortByScore([...people, person]);
      setPeople(next);
      persistLocal(next);

      const rank = next.findIndex((entry) => entry.key === person.key) + 1;
      show(`${nickname} 님을 ${rank}위에 올렸어요 · ${person.tag}`);

      setAddName("");
      setAddRelation("friend");
      setAddBirth({ ...EMPTY_BIRTH });
    } finally {
      setAdding(false);
    }
  };

  /* -------------------------------------------------------------- 삭제 */
  const deletePerson = async (person: BoardPerson) => {
    if (!window.confirm(`${person.nickname} 님을 보드에서 뺄까요?`)) return;

    setDeletingKey(person.key);
    try {
      if (person.serverId && boardId) {
        const response = await fetch(
          `/api/boards/${boardId}/entries/${person.serverId}`,
          { method: "DELETE" },
        );
        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as
            | { message?: string }
            | null;
          show(data?.message ?? "삭제하지 못했어요.");
          return;
        }
      }
      const next = people.filter((entry) => entry.key !== person.key);
      setPeople(next);
      persistLocal(next);
      show("보드에서 뺐어요.");
    } finally {
      setDeletingKey(null);
    }
  };

  /* ------------------------------------------------------- 보드 저장/공유 */
  const saveBoard = async () => {
    if (!owner) return;

    if (!configured) {
      setPromptSave(true);
      return;
    }
    if (!user) {
      setPromptSave(true);
      return;
    }

    setSavingBoard(true);
    try {
      const response = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: owner }),
      });
      const data = (await response.json().catch(() => null)) as
        | { board?: BoardRow; message?: string }
        | null;

      if (!response.ok || !data?.board) {
        show(data?.message ?? "보드를 저장하지 못했어요.");
        return;
      }

      const newId = data.board.id;
      setBoardId(newId);
      setBoardTitle(data.board.title ?? "");
      setIsOwner(true);

      const q = new URLSearchParams(search ?? "");
      q.set("b", newId);
      router.replace(`/board?${q.toString()}`, { scroll: false });

      // 로컬에만 있던 참여자들을 서버 보드로 옮깁니다.
      const localOnly = people.filter((person) => !person.serverId);
      const uploaded: BoardPerson[] = [];
      for (const person of localOnly) {
        const entryResponse = await fetch(`/api/boards/${newId}/entries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nickname: person.nickname,
            relation: person.relation,
            birth: person.birth,
          }),
        });
        if (!entryResponse.ok) continue;
        const entryData = (await entryResponse.json().catch(() => null)) as
          | { entry?: BoardEntryRow }
          | null;
        if (entryData?.entry) {
          uploaded.push(
            buildPerson(engine!, me!, {
              nickname: entryData.entry.nickname,
              relation: entryData.entry.relation,
              birth: birthFromEntryRow(entryData.entry),
              key: entryData.entry.id,
              serverId: entryData.entry.id,
              score: entryData.entry.compat_score,
              label: entryData.entry.compat_label,
            }),
          );
        }
      }
      if (uploaded.length) {
        setPeople(sortByScore(uploaded));
        saveLocalEntries(owner, []);
      }

      show("보드를 저장했어요. 이제 친구들과 함께 채울 수 있어요.");
    } catch {
      show("보드를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSavingBoard(false);
    }
  };

  const inviteUrl = () => {
    if (!owner) return "";
    const q = new URLSearchParams();
    if (owner.name) q.set("n", owner.name);
    if (owner.gender !== "n") q.set("g", owner.gender);
    q.set("cal", owner.calendar);
    q.set("y", String(owner.year));
    q.set("m", String(owner.month));
    q.set("d", String(owner.day));
    if (owner.leap) q.set("leap", "1");
    if (owner.timeIndex >= 0) q.set("t", String(owner.timeIndex));
    if (boardId) q.set("b", boardId);
    return `${window.location.origin}/board?${q.toString()}`;
  };

  const copyInvite = async () => {
    const url = inviteUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      show("초대 링크를 복사했어요. 친구에게 보내 보세요!");
    } catch {
      show("복사에 실패했어요. 주소창의 링크를 복사해 주세요.");
    }
  };

  const shareInvite = async () => {
    const url = inviteUrl();
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "내 사주 궁합 줄세우기",
          text: "내 사주와 네 궁합, 몇 위인지 확인해 봐!",
          url,
        });
        return;
      } catch {
        /* 취소 */
      }
    }
    void copyInvite();
  };

  /* ---------------------------------------------------------------- 렌더 */
  const emptyBoard = !owner || !me;
  const displayTitle =
    boardTitle ||
    (owner?.name ? `${owner.name} 님의 궁합 보드` : "내 궁합 보드");

  return (
    <>
      <div className="ambient" aria-hidden="true">
        <span className="ambient__glow ambient__glow--a" />
        <span className="ambient__glow ambient__glow--b" />
      </div>

      <main className="page-shell page-shell--with-tabs">
        <header className="topbar">
          <Link className="brand" href="/">
            <span className="brand__mark" aria-hidden="true">
              ✦
            </span>
            <span className="brand__text">운세 한 스푼</span>
          </Link>
          <div className="topbar__right">
            <CoinBadge />
            <AuthChip />
          </div>
        </header>

        <div className="page-head">
          <p className="kicker">궁합 줄세우기</p>
          <h1>{displayTitle}</h1>
          <p>
            {viewerIsOwner
              ? "내 사주를 가운데 두고 친구·연인·최애와의 궁합을 점수 순으로 줄 세워요. 초대 링크를 보내면 친구가 직접 자기 점수를 확인할 수 있어요."
              : "친구의 사주를 가운데 두고, 내 궁합이 몇 위인지 확인해 보세요."}
          </p>
        </div>

        {boardError ? (
          <div className="notice" style={{ borderColor: "rgba(196,101,90,.3)" }}>
            <p className="notice__title">
              <span className="notice__badge" aria-hidden="true">
                !
              </span>
              보드를 열지 못했어요
            </p>
            <p>{boardError}</p>
            <p>
              <Link href="/board">내 보드 새로 만들기 →</Link>
            </p>
          </div>
        ) : null}

        {emptyBoard ? (
          <section className="card board-setup">
            <div className="card__head">
              <h3>내 사주부터 알려주세요</h3>
              <span className="card__sub">보드의 중심</span>
            </div>
            <p className="body">
              보드 한가운데에 내가 서고, 추가한 사람들이 궁합이 잘 맞는 순서대로 내
              주변에 놓여요.
            </p>

            <div className="field field--tight">
              <label className="field__label" htmlFor="board-name">
                내 닉네임 <span className="field__opt">선택</span>
              </label>
              <input
                className="input"
                id="board-name"
                type="text"
                maxLength={12}
                placeholder="보드에 표시할 이름"
                value={setupName}
                onChange={(event) => setSetupName(event.target.value)}
              />
            </div>

            <BirthFields value={setupBirth} onChange={(patch) => setSetupBirth((prev) => ({ ...prev, ...patch }))} idPrefix="setup" />

            {setupError ? (
              <p className="form__error" role="alert">
                {setupError}
              </p>
            ) : null}

            <button className="btn btn--primary btn--full" type="button" onClick={startBoard} disabled={!engine}>
              궁합 보드 열기 <span className="btn__arrow">→</span>
            </button>
            <p className="hint">
              입력한 생년월일은 이 브라우저에서만 계산에 쓰여요. 로그인하고 저장하면
              서버(Supabase)에 보관되고 초대 링크로 친구와 함께 볼 수 있어요.
            </p>
          </section>
        ) : (
          <>
            <section className="card board-hub">
              <div className="card__head">
                <h3>
                  궁합 지도 <span className="card__small">宮合 Map</span>
                </h3>
                <span className="card__sub">{people.length}명 참여</span>
              </div>

              <HubMap
                meName={owner?.name ?? ""}
                dayGan={me.dayGan}
                animal={me.animal}
                emoji={me.ilgan.emoji}
                people={ranked}
              />

              <div className="share-actions board-share">
                <button className="btn btn--soft" type="button" onClick={shareInvite}>
                  초대 링크 공유
                </button>
                <button className="btn btn--soft" type="button" onClick={copyInvite}>
                  링크 복사
                </button>
              </div>

              {!boardId ? (
                <div className="board-save">
                  <p>
                    지금은 이 브라우저에만 저장돼요. 보드를 저장하면 친구가 링크로
                    들어와 자기 점수를 남길 수 있어요.
                  </p>
                  <button
                    className="btn btn--primary btn--sm"
                    type="button"
                    onClick={saveBoard}
                    disabled={savingBoard || authLoading}
                  >
                    {savingBoard ? "저장 중…" : "보드 저장하고 친구 초대하기"}
                  </button>
                </div>
              ) : viewerIsOwner ? (
                <p className="board-saved-note">
                  저장됨 · 초대 링크를 받은 친구는 자기 닉네임과 생년월일을 넣어 순위에
                  참여할 수 있어요.
                </p>
              ) : (
                <p className="board-saved-note">
                  친구의 보드예요. 아래에서 내 생년월일을 넣으면 내 궁합 순위를 바로
                  확인할 수 있어요.
                </p>
              )}

              {promptSave ? (
                <div className="save-panel">
                  {!configured ? (
                    <>
                      <strong>보드 저장은 준비 중이에요</strong>
                      <p style={{ margin: "6px 0 0" }}>
                        지금은 이 브라우저에만 보관돼요. Supabase 연결 후 로그인하면
                        친구들과 함께 쓰는 보드로 저장됩니다.
                      </p>
                    </>
                  ) : (
                    <>
                      <strong>로그인하면 친구들과 함께 쓰는 보드가 돼요</strong>
                      <p style={{ margin: "6px 0 0" }}>
                        초대 링크를 받은 친구도 자기 점수를 남길 수 있어요.
                      </p>
                      <div className="save-panel__row">
                        <Link
            href={`/login?next=${encodeURIComponent(
              "/board" + (search ? `?${search}` : ""),
            )}`}
          >
                          카카오로 로그인 →
                        </Link>
                        <button className="link" type="button" onClick={() => setPromptSave(false)}>
                          닫기
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </section>

            <section className="card board-add">
              <div className="card__head">
                <h3>{viewerIsOwner ? "사람 추가" : "내 점수 확인하기"}</h3>
                <span className="card__sub">닉네임 + 생년월일</span>
              </div>
              <p className="body">
                {viewerIsOwner
                  ? "친구·연인·최애의 닉네임과 생년월일을 넣으면 궁합 점수와 케미 태그가 함께 나와요."
                  : "내 닉네임과 생년월일을 넣으면 이 보드에서 몇 위인지 바로 보여 드려요."}
              </p>

              <div className="field field--tight">
                <label className="field__label" htmlFor="add-name">
                  닉네임
                </label>
                <input
                  className="input"
                  id="add-name"
                  type="text"
                  maxLength={12}
                  placeholder="예: 지우, 우리 엄마, 최우제"
                  value={addName}
                  onChange={(event) => setAddName(event.target.value)}
                />
              </div>

              <div className="field field--tight">
                <span className="field__label">관계</span>
                <div className="chips" role="group" aria-label="관계">
                  {RELATION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`chip-select${addRelation === option.value ? " is-active" : ""}`}
                      aria-pressed={addRelation === option.value}
                      onClick={() => setAddRelation(option.value)}
                    >
                      <span aria-hidden="true">{option.emoji}</span> {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <BirthFields
                value={addBirth}
                onChange={(patch) => setAddBirth((prev) => ({ ...prev, ...patch }))}
                idPrefix="add"
              />

              <button
                className="btn btn--primary btn--full"
                type="button"
                onClick={addPerson}
                disabled={adding}
              >
                {adding ? "궁합 계산 중…" : "보드에 추가하기"}
                <span className="btn__arrow">→</span>
              </button>

              {!configured || !user ? (
                <p className="hint">
                  로그인 없이도 순위는 볼 수 있어요. 로그인하면 이 기록이 보드에 남아
                  친구들과 함께 보입니다.
                </p>
              ) : null}
            </section>

            <section className="board-rank">
              <div className="mypage-section__head">
                <h2>궁합 순위</h2>
                <span>높은 순 · {people.length}명</span>
              </div>
              <RankList
                people={ranked}
                onDelete={deletePerson}
                deletingKey={deletingKey}
                canDeletePerson={(person) => !person.serverId || Boolean(user)}
              />
            </section>

            {deepReportHref ? (
              <section className="kid-section" style={{ marginTop: 18 }}>
                <div className="kid-section__head">
                  <h2>심화 케미 리포트 · 1코인</h2>
                  <p>1위 {ranked[0].nickname} 님과의 관계를 6장으로 풀어 드려요</p>
                </div>
                <Link className="kid-wide-link" href={deepReportHref} prefetch={false}>
                  <span className="kid-wide-link__emoji" aria-hidden="true">💞</span>
                  <span>
                    <b>{ranked[0].nickname} 님과 심화 궁합 보기</b>
                    <small>부딪히는 지점 · 오래 가는 법 · 함께할 때의 흐름</small>
                  </span>
                  <span aria-hidden="true">→</span>
                </Link>
              </section>
            ) : null}

            <AdSlot variant="result-bottom" />
          </>
        )}

        <SiteFooter />
      </main>
      <BottomTabs />
    </>
  );
}

export default function BoardApp() {
  return (
    <ToastProvider>
      <BoardScreen />
    </ToastProvider>
  );
}
