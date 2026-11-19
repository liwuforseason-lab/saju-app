"use client";

import { useState } from "react";
import {
  RELATION_LABEL,
  birthText,
  type BoardPerson,
} from "@/lib/board";

interface Props {
  people: BoardPerson[];
  onDelete: (person: BoardPerson) => void;
  deletingKey: string | null;
  /** 서버에 저장된 남의 항목은 로그인한 사용자만 지울 수 있습니다. */
  canDeletePerson: (person: BoardPerson) => boolean;
}

export default function RankList({ people, onDelete, deletingKey, canDeletePerson }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (people.length === 0) {
    return (
      <div className="empty-state">
        아직 추가한 사람이 없어요.
        <br />
        위에서 닉네임과 생년월일을 넣으면 1위부터 차례로 줄을 세워 드려요.
      </div>
    );
  }

  return (
    <ol className="rank-list">
      {people.map((person, index) => {
        const rank = index + 1;
        const open = expanded === person.key;
        return (
          <li
            className={`rank-item${rank <= 3 ? " rank-item--top" : ""}`}
            key={person.key}
          >
            <div className="rank-item__main">
              <span className={`rank-medal rank-medal--${rank <= 3 ? rank : "base"}`}>
                {rank}
              </span>

              <button
                type="button"
                className="rank-item__info"
                onClick={() => setExpanded(open ? null : person.key)}
                aria-expanded={open}
              >
                <span className="rank-item__row">
                  <b>{person.nickname}</b>
                  <span className="rank-item__score">{person.score}점</span>
                </span>
                <span className="rank-item__tag">{person.tag}</span>
                <span className="rank-item__meta">
                  {RELATION_LABEL[person.relation]} · {birthText(person.birth)} ·{" "}
                  {person.label}
                </span>
              </button>

              {canDeletePerson(person) ? (
                <button
                  type="button"
                  className="rank-item__x"
                  aria-label={`${person.nickname} 삭제`}
                  disabled={deletingKey === person.key}
                  onClick={() => onDelete(person)}
                >
                  {deletingKey === person.key ? "…" : "✕"}
                </button>
              ) : null}
            </div>

            {open ? (
              <div className="rank-item__detail">
                <p>{person.ganText}</p>
                <p>
                  일지로 보는 관계: <strong>{person.zhiText}</strong>
                </p>
                <ul>
                  {person.advice.map((advice) => (
                    <li key={advice}>{advice}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
