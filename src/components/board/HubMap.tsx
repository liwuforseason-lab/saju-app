"use client";

import type { BoardPerson } from "@/lib/board";

interface Props {
  meName: string;
  dayGan: string;
  animal: string;
  emoji: string;
  people: BoardPerson[];
}

const MAX_NODES = 8;

export default function HubMap({ meName, dayGan, animal, emoji, people }: Props) {
  const shown = people.slice(0, MAX_NODES);
  const step = shown.length > 0 ? 360 / shown.length : 0;

  const nodes = shown.map((person, index) => {
    const angle = -90 + step * index;
    // 점수가 높을수록 가운데(나)와 가깝게 배치
    const radius = 39 - Math.min(7, Math.max(0, (person.score - 55) / 7));
    const rad = (angle * Math.PI) / 180;
    return {
      person,
      rank: index + 1,
      x: 50 + Math.cos(rad) * radius,
      y: 50 + Math.sin(rad) * radius,
    };
  });

  return (
    <div className="hub-wrap">
      <div className="hub">
        <span className="hub__orbit hub__orbit--1" aria-hidden="true" />
        <span className="hub__orbit hub__orbit--2" aria-hidden="true" />
        <span className="hub__orbit hub__orbit--3" aria-hidden="true" />

        {nodes.length > 0 ? (
          <svg
            className="hub__lines"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {nodes.map((node) => (
              <line
                key={`line-${node.person.key}`}
                x1="50"
                y1="50"
                x2={node.x}
                y2={node.y}
                stroke={node.rank === 1 ? "rgba(198,161,91,.75)" : "rgba(21,27,46,.14)"}
                strokeWidth={node.rank === 1 ? 0.9 : 0.5}
                strokeDasharray={node.rank <= 3 ? undefined : "2 2"}
              />
            ))}
          </svg>
        ) : null}

        <div className="hub__me">
          <span className="hub__me-emoji" aria-hidden="true">
            {emoji}
          </span>
          <b>{meName || "나"}</b>
          <small>
            {dayGan}일간 · {animal}띠
          </small>
        </div>

        {nodes.map((node) => (
          <div
            key={`node-${node.person.key}`}
            className={`hub__node${node.rank <= 3 ? " hub__node--top" : ""}`}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            title={`${node.person.nickname} · ${node.person.score}점 · ${node.person.tag}`}
          >
            <span className="hub__dot" aria-hidden="true">
              {node.rank}
            </span>
            <span className="hub__name">{node.person.nickname}</span>
          </div>
        ))}

        {nodes.length === 0 ? (
          <p className="hub__empty">
            아직 보드가 비어 있어요.
            <br />
            아래에서 친구를 추가하면
            <br />
            나와 가까운 순서로 배치돼요.
          </p>
        ) : null}
      </div>

      <p className="hub__hint">
        가운데가 나 · 가까울수록 궁합이 잘 맞아요
        {people.length > MAX_NODES ? ` (상위 ${MAX_NODES}명 표시)` : ""}
      </p>
    </div>
  );
}
