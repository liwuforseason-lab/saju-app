/**
 * 유료 리포트 본문 생성기.
 * 검증된 만세력 엔진(SajuResult)을 재료로, 상품별 해설 문서를 만듭니다.
 * 같은 생년월일 → 항상 같은 문장(시드 기반)이라 저장·공유해도 결과가 흔들리지 않습니다.
 *
 * ⚠️ 이 문서는 "재미와 참고"용 운세 콘텐츠이며, 의료·법률·투자 판단을 대신하지 않습니다.
 */

import type { Element, SajuEngine, SajuResult } from "./saju/types";
import type { ReportType } from "./coins";

export interface ReportBlock {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface ReportDoc {
  type: ReportType;
  title: string;
  subtitle: string;
  /** 미리보기(무료) 영역 */
  headline: string;
  chips: { label: string; value: string }[];
  previewParagraphs: string[];
  lockedTitles: string[];
  sections: ReportBlock[];
  closing: string;
}

const ELEMENT_BODY: Record<Element, string> = {
  목: "간·담·눈·힘줄",
  화: "심장·혈액·시력·수면",
  토: "위·소화기·피부 장벽",
  금: "폐·기관지·코·피부",
  수: "신장·방광·허리·귀",
};

const ELEMENT_DIRECTION: Record<Element, string> = {
  목: "동쪽",
  화: "남쪽",
  토: "집 안·중앙",
  금: "서쪽",
  수: "북쪽",
};

const ELEMENT_HABIT: Record<Element, string[]> = {
  목: ["아침에 10분 스트레칭", "화분 하나 키우기", "초록색 소품 곁에 두기"],
  화: ["해 뜬 뒤 햇볕 15분", "가벼운 유산소", "붉은 계열 소품"],
  토: ["정해진 시간에 세 끼", "흙길·공원 산책", "베이지·노랑 소품"],
  금: ["하루 5분 정리정돈", "천천히 깊게 호흡하기", "은색 액세서리"],
  수: ["물 1.5L 마시기", "밤 산책·반신욕", "검정·네이비 소품"],
};

const ELEMENT_JOBS: Record<Element, string[]> = {
  목: ["기획·전략", "교육·강의", "브랜딩·마케팅", "출판·콘텐츠", "원예·플랜트"],
  화: ["방송·엔터테인먼트", "영업·세일즈", "뷰티·패션", "요식업", "SNS 크리에이터"],
  토: ["부동산·건설", "유통·물류", "행정·총무", "식품·요리", "중개·컨설팅"],
  금: ["금융·회계", "법률·감사", "의료·정밀기술", "제조·품질", "IT 개발"],
  수: ["무역·유통기획", "여행·항공", "투자·자산관리", "심리·상담", "물류·수산"],
};

const SIPSIN_THEME: Record<string, string> = {
  비견: "내 힘으로 밀어붙이는 시기",
  겁재: "경쟁과 협업이 함께 오는 시기",
  식신: "편안하게 먹고 누리는 시기",
  상관: "재능이 밖으로 터지는 시기",
  편재: "큰돈이 크게 도는 시기",
  정재: "차곡차곡 쌓는 시기",
  편관: "압박과 성장이 같이 오는 시기",
  정관: "자리가 잡히고 인정받는 시기",
  편인: "생각이 깊어지고 배우는 시기",
  정인: "도움과 배움이 들어오는 시기",
};

const GROUP_ADVICE: Record<string, string> = {
  비겁: "내 힘(비겁)이 강한 편이에요. 혼자 결정하고 혼자 책임지는 일에 강하지만, 사람을 끌어들이는 데 인색해지기 쉬워요. 이익을 나누는 연습이 재물의 문을 넓혀요.",
  식상: "표현(식상)이 강한 편이에요. 만들고 말하고 보여 주는 힘이 좋아 내 이름을 걸고 하는 일에서 빛나요. 다만 말이 앞서면 관계에 흠이 생기니 한 박자 쉬어 가는 게 좋아요.",
  재성: "재물(재성)이 강한 편이에요. 돈이 도는 감각이 좋아 기회를 잘 잡아요. 대신 손에 들어온 돈을 손에도 없이 쓰기 쉬우니 자동 저축 같은 장치가 필요해요.",
  관성: "책임(관성)이 강한 편이에요. 규칙과 약속을 지키고 조직에서 신뢰를 얻어요. 다만 스스로를 너무 조이면 번아웃이 오니, 스스로에게 허락하는 연습이 필요해요.",
  인성: "배움(인성)이 강한 편이에요. 공부와 사람 덕이 좋아 귀인이 따르지만, 생각이 많아 실행이 늦어지기 쉬워요. 결론을 먼저 정하고 시작하면 훨씬 빨라져요.",
};

const GROUP_SHORT: Record<string, string> = {
  비겁: "자아·동료",
  식상: "표현·재능",
  재성: "재물·현실",
  관성: "책임·조직",
  인성: "배움·보호",
};

function seedOf(result: SajuResult): number {
  const text = `${result.solar.year}${result.solar.month}${result.solar.day}${result.input.timeIndex}${result.dayGan}${result.dayZhi}`;
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 100000;
  }
  return hash;
}

function pick<T>(list: T[], seed: number, offset = 0): T {
  return list[(seed + offset) % list.length];
}

function strongGroup(result: SajuResult): string {
  const entries = Object.entries(result.groupCounts);
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? "비겁";
}

function weakGroup(result: SajuResult): string {
  const entries = Object.entries(result.groupCounts);
  entries.sort((a, b) => a[1] - b[1]);
  return entries[0]?.[0] ?? "인성";
}

function strengthLine(result: SajuResult): string {
  if (result.strength === "신강") {
    return `일간의 힘이 센 **신강(身强)** 사주예요(강도 ${Math.round(
      result.strengthRatio * 100,
    )}%). 내 힘으로 밀고 나가는 장점이 큰 대신, 남의 도움이나 조언을 들일 여유가 부족해지기 쉬워요. 일에 쏟는 에너지를 80%로 줄이면 오히려 성과가 커져요.`;
  }
  if (result.strength === "신약") {
    return `일간의 힘이 다소 약한 **신약(身弱)** 사주예요(강도 ${Math.round(
      result.strengthRatio * 100,
    )}%). 혼자 다 짊어지기보다 좋은 환경과 사람의 도움을 받을 때 훨씬 크게 열려요. 나를 도와 주는 사람을 가까이 두는 것이 곧 운을 키우는 일이에요.`;
  }
  return `힘의 균형이 좋은 **중화(中和)** 사주예요(강도 ${Math.round(
    result.strengthRatio * 100,
  )}%). 어느 한쪽으로 치우치지 않아 어디에 놓여도 적응을 잘해요. 다만 장점이 크게 튀지 않으니 "내가 잘하는 것"을 직접 말하는 연습이 필요해요.`;
}

function ohaengLine(engine: SajuEngine, result: SajuResult): string {
  const o = result.ohaeng;
  const strongest = engine.ELEM_INFO[o.strongest];
  const weakest = engine.ELEM_INFO[o.weakest];
  const missing = o.missing.length
    ? `사주 안에 ${o.missing.join("·")} 기운이 아예 없어요.`
    : `가장 약한 기운은 ${o.weakest}(${weakest.hanja})이에요.`;
  return `오행 비율은 ${engine.ELEMS.map(
    (elem) => `${elem} ${o.percent[elem]}%`,
  ).join(" · ")}이고, ${o.strongest}(${strongest.hanja}) 기운이 가장 강해요. ${missing} ${o.strongest} 기운의 색과 습관을 일부러 멀리하고 ${o.weakest} 기운을 채워 주는 쪽으로 생활을 짜면 흐름이 부드러워져요.`;
}

/* --------------------------------------------------------------- 사주 심화 */

export function buildSajuReport(
  engine: SajuEngine,
  result: SajuResult,
): ReportDoc {
  const seed = seedOf(result);
  const o = result.ohaeng;
  const weakElem = (o.missing[0] ?? o.weakest) as Element;
  const mainGroup = strongGroup(result);
  const lackGroup = weakGroup(result);
  const jobBuckets = [
    ...ELEMENT_JOBS[o.strongest as Element],
    ...ELEMENT_JOBS[weakElem].slice(0, 2),
  ];
  const years = result.years;
  const primaryYear = years[0];
  const nextYear = years[1];

  const sections: ReportBlock[] = [
    {
      heading: "1. 타고난 나 — " + result.ilgan.title,
      paragraphs: [
        `${result.ilgan.oneLine}. ${result.ilgan.desc}`,
        `일간 ${result.dayGan}(${result.dayGanHanja}) · 일지 ${result.dayZhi}(${result.dayZhiHanja})로 보면, 겉으로 드러나는 성격과 속마음이 모두 ${result.ilgan.keyword.join(
          "·",
        )} 쪽으로 기울어 있어요. ${strengthLine(result)}`,
      ],
      bullets: [
        `키워드: ${result.ilgan.keyword.join(", ")}`,
        `기질: ${engine.ELEM_INFO[o.strongest].nature}`,
        `강점 에너지: ${mainGroup}(${GROUP_SHORT[mainGroup]}) / 보완 에너지: ${lackGroup}(${GROUP_SHORT[lackGroup]})`,
      ],
    },
    {
      heading: "2. 강점과 그림자",
      paragraphs: [
        "가장 빛나는 재능부터, 조금만 다스리면 훨씬 편해지는 부분까지 짚어 드릴게요.",
        GROUP_ADVICE[mainGroup] ?? "",
      ],
      bullets: [
        ...result.ilgan.strong.map((item) => `강점 · ${item}`),
        ...result.ilgan.weak.map((item) => `보완 · ${item}`),
      ],
    },
    {
      heading: "3. 재물 그릇",
      paragraphs: [
        `${result.fortune.money.text}`,
        `사주 안에서 재물을 뜻하는 재성은 ${result.groupCounts["재성"] ?? 0}개, 그중 편재 ${
          result.sipsinCounts["편재"] ?? 0
        }개·정재 ${result.sipsinCounts["정재"] ?? 0}개예요. ${
          (result.groupCounts["재성"] ?? 0) >= 3
            ? "재성이 넉넉해 돈이 도는 판에 잘 올라타요. 다만 들어온 만큼 새 나가기 쉬우니 자동이체로 먼저 떼어 놓는 방식이 잘 맞아요."
            : "재성이 많지 않아 한 번에 큰돈을 좇기보다, 한 가지 수입원을 오래 키우는 방식이 안전해요. 부업도 '꾸준히 반복되는 것'이 답이에요."
        }`,
      ],
      bullets: [
        `재물운 지수 ${result.fortune.money.score}점 · ${result.fortune.money.band.label}`,
        `잘 맞는 돈 관리: ${
          pick(
            [
              "월급·수입일 다음 날 자동이체로 10~20% 먼저 떼어 두기",
              "통장을 '쓰는 돈 / 모으는 돈 / 비상금'으로 3개만 나눠 두기",
              "작은 수입도 장부에 남기고, 월말에 한 번만 점검하기",
            ],
            seed,
          )
        }`,
        `돈이 새는 지점: ${
          pick(
            [
              "기분이 좋을 때 큰 지출이 나가는 편 — 결제 전 하루 묵혀 두기",
              "사람 좋아 큰접대가 잦음 — 인당 예산을 미리 정해 두기",
              "새로 나온 것에 먼저 쓰는 편 — '필요한 것' 목록을 먼저 적기",
            ],
            seed,
            3,
          )
        }`,
      ],
    },
    {
      heading: "4. 일과 커리어",
      paragraphs: [
        result.fortune.work.text,
        `${o.strongest}(${engine.ELEM_INFO[o.strongest].hanja}) 기운이 강한 사람은 ${
          engine.ELEM_INFO[o.strongest].keyword
        }가 살아 있는 일에서 성과가 나요. 반대로 ${lackGroup}(${GROUP_SHORT[lackGroup]}) 에너지가 약해서, 그 영역을 대신 채워 주는 동료나 도구를 곁에 두면 훨씬 수월해져요.`,
      ],
      bullets: jobBuckets.map((job) => `추천 분야 · ${job}`),
    },
    {
      heading: "5. 사랑과 인간관계",
      paragraphs: [
        result.fortune.love.text,
        `일지 ${result.dayZhi}(${result.dayZhiHanja})는 배우자 자리예요. 여기에 ${result.pillars.day.zhiElem} 기운이 앉아 있어, ${
          result.pillars.day.zhiElem === "목"
            ? "함께 자라나는 관계를 원해요. 상대의 성장을 응원할 때 내 사랑도 커져요."
            : result.pillars.day.zhiElem === "화"
              ? "설렘과 표현이 중요한 사람이에요. 말로 해 주고 자주 표현해 주는 상대와 잘 맞아요."
              : result.pillars.day.zhiElem === "토"
                ? "편안함과 안정이 사랑의 언어예요. 같이 밥 먹고 같이 늙어 가는 관계에서 행복해요."
                : result.pillars.day.zhiElem === "금"
                  ? "신뢰와 약속이 먼저예요. 한번 마음을 열면 오래 가지만, 상처도 오래 기억해요."
                  : "감정의 깊이가 깊은 편이에요. 상대에게 푹 빠지기 쉬우니 나만의 시간을 꼭 남겨 두세요."
        }`,
      ],
      bullets: [
        `사랑운 지수 ${result.fortune.love.score}점 · ${result.fortune.love.band.label}`,
        `인연이 잘 붙는 자리: ${pick(
          [
            "배우거나 가르치는 자리(수업·스터디)",
            "일로 만난 사람의 소개",
            "취미 모임·운동 크루",
          ],
          seed,
          1,
        )}`,
        `조심할 점: ${pick(
          [
            "서운함을 말하지 않고 쌓아 두면 어느 날 한 번에 터져요.",
            "상대의 반응을 재다가 타이밍을 놓치기 쉬워요.",
            "좋아할수록 내 생활 리듬이 무너지지 않게 해요.",
          ],
          seed,
          2,
        )}`,
      ],
    },
    {
      heading: "6. 건강과 컨디션",
      paragraphs: [
        `약한 ${weakElem} 기운은 몸에서 ${ELEMENT_BODY[weakElem]} 쪽으로 나타나기 쉬워요. 큰 병이라기보다, 피곤할 때 이 부위가 먼저 신호를 보내는 식이에요.`,
        `${ELEMENT_BODY[o.strongest]} 쪽은 반대로 기운이 몰려 과열되기 쉬운 자리예요. 강한 기운은 '쓰는 만큼 쉬어 주기'가 핵심이에요.`,
      ],
      bullets: [
        ...ELEMENT_HABIT[weakElem].map((habit) => `채우기 · ${habit}`),
        `계절 주의: ${pick(
          [
            "환절기 첫 주에 몸이 먼저 지쳐요 — 그 주는 일정을 조금 비워 두세요.",
            "여름보다 겨울에 컨디션이 흔들려요 — 따뜻하게, 일찍 자기.",
            "비 오는 날이 길어지면 기분이 가라앉아요 — 햇빛과 산책으로 리셋.",
          ],
          seed,
          4,
        )}`,
      ],
    },
  ];

  if (primaryYear) {
    sections.push({
      heading: `7. ${primaryYear.year}년 흐름`,
      paragraphs: [
        `${primaryYear.year}년은 ${primaryYear.ganja}(${primaryYear.ganjaHanja}) ${primaryYear.animal}의 해예요. 일간과의 관계는 **${primaryYear.sipsin}** — ${SIPSIN_THEME[primaryYear.sipsin] ?? "변화가 오는 시기"}예요.`,
        `${primaryYear.text} ${primaryYear.zhiNote}`,
      ],
      bullets: [
        `올해 지수 ${primaryYear.score}점 · ${primaryYear.band.label}`,
        nextYear
          ? `${nextYear.year}년 ${nextYear.ganja}년은 ${nextYear.sipsin}의 흐름 — ${nextYear.text}`
          : "",
      ].filter(Boolean),
    });
  }

  sections.push({
    heading: "8. 개운법 — 오늘부터 할 수 있는 것",
    paragraphs: [
      `부족한 ${weakElem} 기운을 채우는 것이 이 사주의 열쇠예요. ${engine.ELEM_INFO[weakElem].lack}`,
      `큰 것을 바꾸지 않아도, 색·방향·습관 세 가지만 바꾸면 흐름이 달라져요.`,
    ],
    bullets: [
      `행운의 색 · ${engine.LUCKY_COLOR[weakElem].name}`,
      `좋은 방향 · ${ELEMENT_DIRECTION[weakElem]} (책상·침대 머리를 그쪽으로)`,
      `숫자 · ${((seed % 9) + 1).toString()}`,
      ...ELEMENT_HABIT[weakElem].map((habit) => `습관 · ${habit}`),
    ],
  });

  return {
    type: "saju",
    title: `${result.input.name ? `${result.input.name} 님의 ` : ""}심화 사주 해설`,
    subtitle: `양력 ${result.solar.year}.${String(result.solar.month).padStart(2, "0")}.${String(
      result.solar.day,
    ).padStart(2, "0")} · ${result.dayGan}${result.dayZhi}일 · ${result.strength}`,
    headline: result.ilgan.oneLine,
    chips: [
      { label: "일간", value: `${result.dayGan}(${result.ilgan.emoji})` },
      { label: "기운", value: `${o.strongest} 강 · ${weakElem} 약` },
      { label: "재물운", value: `${result.fortune.money.score}점` },
      { label: "사랑운", value: `${result.fortune.love.score}점` },
    ],
    previewParagraphs: [
      `${result.ilgan.oneLine}. ${result.ilgan.desc.split(". ")[0]}.`,
      ohaengLine(engine, result),
    ],
    lockedTitles: sections.map((section) => section.heading),
    sections,
    closing:
      "운세는 정답이 아니라 나를 이해하는 지도예요. 오늘의 선택이 내일의 사주를 조금씩 바꿉니다.",
  };
}

/* ---------------------------------------------------------------- 신년운세 */

const MONTH_LINES = {
  up: [
    "밀고 나가면 결과가 따라오는 달",
    "사람을 만나고 제안하기 좋은 달",
    "돈이 들어오는 문이 열리는 달",
    "시작하기 좋은 달, 미루지 마세요",
  ],
  mid: [
    "무리하지 않으면 무난하게 지나가는 달",
    "정리하고 다지는 데 좋은 달",
    "속도를 조금 줄이면 편안한 달",
    "작은 약속을 지키며 신뢰를 쌓는 달",
  ],
  down: [
    "지출과 말실수를 조심할 달",
    "쉬어 가며 체력을 챙길 달",
    "큰 결정은 한 달 미루는 게 좋은 달",
    "사람 사이 오해를 풀어 두면 좋은 달",
  ],
};

function monthlyFlow(seed: number, base: number) {
  const months = Array.from({ length: 12 }, (_, index) => {
    const wave = Math.sin((index + (seed % 5)) * 0.9) * 12;
    const score = Math.max(38, Math.min(96, Math.round(base + wave + ((seed >> index) % 9) - 4)));
    const band = score >= 76 ? "up" : score >= 58 ? "mid" : "down";
    return {
      month: index + 1,
      score,
      band: band as "up" | "mid" | "down",
      line: pick(MONTH_LINES[band], seed, index),
    };
  });
  return months;
}

export function buildNewYearReport(
  engine: SajuEngine,
  result: SajuResult,
): ReportDoc {
  const seed = seedOf(result);
  const target =
    result.years.find((year) => year.year === 2027) ?? result.years[result.years.length - 1];
  const previous = result.years.find((year) => year.year === 2026);
  const o = result.ohaeng;
  const weakElem = (o.missing[0] ?? o.weakest) as Element;
  const flow = monthlyFlow(seed + 7, target?.score ?? 60);
  const best = [...flow].sort((a, b) => b.score - a.score).slice(0, 2);
  const worst = [...flow].sort((a, b) => a.score - b.score).slice(0, 2);
  const yearLabel = target?.year ?? 2027;

  const sections: ReportBlock[] = [
    {
      heading: `${yearLabel}년 한 장 요약`,
      paragraphs: [
        `${yearLabel}년은 ${target?.ganja ?? "정미"}(${target?.ganjaHanja ?? "丁未"}) ${
          target?.animal ?? "양"
        }의 해예요. 내 일간과의 관계는 **${target?.sipsin ?? "상관"}** — ${
          SIPSIN_THEME[target?.sipsin ?? "상관"] ?? "재능이 밖으로 터지는 시기"
        }예요.`,
        `${target?.text ?? ""} ${target?.zhiNote ?? ""}`,
        previous
          ? `2026년이 ${previous.sipsin}의 해였다면, ${yearLabel}년은 ${target?.sipsin}의 해로 결이 한 번 바뀌어요. 지난해에 쌓아 둔 것을 '보여 주는' 쪽으로 힘이 옮겨 갑니다.`
          : "",
      ].filter(Boolean),
      bullets: [
        `신년 지수 ${target?.score ?? 60}점 · ${target?.band.label ?? "무난함"}`,
        `가장 좋은 달 · ${best.map((m) => `${m.month}월`).join(", ")}`,
        `조심할 달 · ${worst.map((m) => `${m.month}월`).join(", ")}`,
      ],
    },
    {
      heading: "재물 — 버는 흐름과 지키는 흐름",
      paragraphs: [
        `${result.fortune.money.score >= 70 ? "재물의 문이 열려 있는 사주예요." : "재물은 크게 터지기보다 꾸준히 쌓이는 결이에요."} ${result.fortune.money.text}`,
        `${yearLabel}년에는 ${best[0].month}월과 ${best[1].month}월에 들어오는 돈이 많아요. 이 두 달에 들어온 돈을 그대로 쓰지 말고, 한 번 묶어 두면 연말에 두 배의 여유가 생겨요.`,
      ],
      bullets: [
        `저축 타이밍 · ${best[0].month}월·${best[1].month}월 수입의 30% 먼저 떼기`,
        `지출 주의 · ${worst[0].month}월·${worst[1].month}월은 큰 결제를 피하기`,
        `부수입 · ${pick(["지식·경험을 파는 쪽", "콘텐츠를 쌓아 두는 쪽", "손기술을 익히는 쪽"], seed)}이 잘 맞아요`,
      ],
    },
    {
      heading: "일과 커리어",
      paragraphs: [
        result.fortune.work.text,
        `${target?.sipsin === "상관" || target?.sipsin === "식신" ? "내 이름을 걸고 보여 주는 일이 특히 잘 풀리는 해예요. 발표·포트폴리오·공개 작업을 미루지 마세요." : ""} ${
          target?.sipsin === "정관" || target?.sipsin === "편관"
            ? "조직 안에서 자리가 바뀌거나 책임이 커지는 일이 생겨요. 맡은 일을 문서로 남기면 신뢰가 커집니다."
            : ""
        } ${
          target?.sipsin === "정재" || target?.sipsin === "편재"
            ? "돈이 되는 일에 손을 대기 좋은 해예요. 다만 욕심이 앞서면 한 번에 잃을 수도 있으니 분산하세요."
            : ""
        }`,
      ],
      bullets: [
        `커리어 지수 ${result.fortune.work.score}점 · ${result.fortune.work.band.label}`,
        `강한 기운 ${o.strongest}을 살리는 분야: ${ELEMENT_JOBS[o.strongest as Element].slice(0, 3).join(", ")}`,
        `힘이 실리는 달 · ${best[0].month}월 (이사·이직·계약 상담은 이 달에)`,
      ],
    },
    {
      heading: "사랑과 인간관계",
      paragraphs: [
        result.fortune.love.text,
        `${yearLabel}년 ${best[1].month}월과 ${best[0].month}월에 인연의 문이 열려요. 소개·모임 자리가 생기면 한 번은 나가 보세요. ${
          o.missing.length ? `사주에 ${o.missing.join("·")} 기운이 없어 감정을 잘 드러내지 않는 편이니, 좋으면 말로 표현하는 것이 이 해의 숙제예요.` : ""
        }`,
      ],
      bullets: [
        `인연이 오는 달 · ${best[1].month}월, ${best[0].month}월`,
        `관계 정리 · ${worst[0].month}월에는 오래된 오해를 풀어 두기`,
      ],
    },
    {
      heading: "건강과 생활 리듬",
      paragraphs: [
        `약한 ${weakElem} 기운은 ${ELEMENT_BODY[weakElem]} 쪽으로 먼저 신호를 보내요. ${yearLabel}년에는 특히 ${worst[0].month}월에 체력이 꺾이기 쉬우니 그 전에 수면을 미리 당겨 두세요.`,
        `강한 ${o.strongest} 기운은 과열되기 쉬워요. ${engine.ELEM_INFO[o.strongest].excess}`,
      ],
      bullets: ELEMENT_HABIT[weakElem].map((habit) => `${habit}`),
    },
    {
      heading: `${yearLabel}년 월별 흐름`,
      paragraphs: [
        "달마다 기운이 오르내려요. 점수가 높은 달은 밀고, 낮은 달은 정비하는 식으로 쓰면 한 해가 훨씬 편해져요.",
      ],
      bullets: flow.map(
        (month) =>
          `${month.month}월 · ${month.score}점 · ${month.line}`,
      ),
    },
    {
      heading: "2027년 행운 포인트",
      paragraphs: [
        `올해의 운은 '준비한 사람'에게 먼저 옵니다. 시작일을 정하고, 그 날짜에 맞춰 작은 준비를 미리 해 두세요.`,
      ],
      bullets: [
        `행운의 색 · ${engine.LUCKY_COLOR[weakElem].name} (지갑·소품에 하나)`,
        `좋은 방향 · ${ELEMENT_DIRECTION[weakElem]}`,
        `행운의 숫자 · ${((seed % 9) + 1).toString()}, ${((seed % 7) + 3).toString()}`,
        `행운의 달 · ${best.map((m) => `${m.month}월`).join(" · ")}`,
      ],
    },
  ];

  return {
    type: "newyear",
    title: `${yearLabel} 신년운세`,
    subtitle: `${target?.ganjaHanja ?? "丁未"}년 · ${target?.animal ?? "양"}의 해`,
    headline:
      target?.band.tone === "up"
        ? `${yearLabel}년, 밀고 나가면 크게 열리는 해`
        : target?.band.tone === "down"
          ? `${yearLabel}년, 비우고 다지면 단단해지는 해`
          : `${yearLabel}년, 꾸준함이 이기는 해`,
    chips: [
      { label: "신년 지수", value: `${target?.score ?? 60}점` },
      { label: "핵심 기운", value: target?.sipsin ?? "상관" },
      { label: "최고의 달", value: `${best[0].month}월` },
      { label: "주의할 달", value: `${worst[0].month}월` },
    ],
    previewParagraphs: [
      `${target?.text ?? ""}`,
      `${yearLabel}년은 ${target?.sipsin}의 해 — ${SIPSIN_THEME[target?.sipsin ?? "상관"]}. 전체 12개월 흐름과 재물·일·사랑 항목은 1코인으로 열려요.`,
    ],
    lockedTitles: sections.map((section) => section.heading),
    sections,
    closing:
      "신년운세는 지도이지 정답이 아니에요. 좋은 달에 힘을 싣고, 조심할 달에 쉬어 가면 충분합니다.",
  };
}

/* ------------------------------------------------------------------ 연애운 */

export function buildLoveReport(
  engine: SajuEngine,
  result: SajuResult,
): ReportDoc {
  const seed = seedOf(result);
  const o = result.ohaeng;
  const weakElem = (o.missing[0] ?? o.weakest) as Element;
  const dayZhiElem = result.pillars.day.zhiElem;
  const gwan = (result.groupCounts["관성"] ?? 0) + (result.groupCounts["재성"] ?? 0);
  const flow = monthlyFlow(seed + 3, result.fortune.love.score);
  const best = [...flow].sort((a, b) => b.score - a.score).slice(0, 3);
  const worst = [...flow].sort((a, b) => a.score - b.score).slice(0, 2);

  const ideal = pick(
    [
      `말이 많지 않아도 내 이야기를 끝까지 들어 주는 사람. ${dayZhiElem} 기운이 있는 사람과 특히 잘 맞아요.`,
      `생활 리듬이 규칙적이고, 약속을 가볍게 여기지 않는 사람. 함께 있을 때 내가 편해지는 사람이 좋은 인연이에요.`,
      `나보다 조금 느리게 사는 사람. 내가 앞서 나갈 때 뒤에서 중심을 잡아 주는 사람과 오래 가요.`,
    ],
    seed,
  );

  const sections: ReportBlock[] = [
    {
      heading: "1. 나의 연애 스타일",
      paragraphs: [
        result.ilgan.love,
        `${result.fortune.love.text}`,
        `사주에 ${weakElem} 기운이 약해서 ${
          weakElem === "목"
            ? "관계가 정체되어 보이면 금방 지루해져요. 함께 새로운 걸 시작하는 커플 활동이 필요해요."
            : weakElem === "화"
              ? "설렘이 식으면 마음이 빨리 닫혀요. 표현을 자주 주고받는 사이가 잘 맞아요."
              : weakElem === "토"
                ? "관계의 방향이 안 보이면 불안해져요. 앞으로의 계획을 함께 그려 주는 사람이 잘 맞아요."
                : weakElem === "금"
                  ? "상처를 받으면 말보다 거리를 두는 쪽이라, 상대는 이유를 모를 수 있어요. 한 문장이라도 말해 주세요."
                  : "감정이 깊게 고이는 편이라, 혼자 상상이 앞서기 쉬워요. 확인하고 물어보는 연습이 필요해요."
        }`,
      ],
      bullets: [
        `사랑운 지수 ${result.fortune.love.score}점`,
        `애정 표현 방식: ${pick(["말보다 행동", "작은 선물과 메시지", "함께 있는 시간"], seed, 2)}`,
        `연애에서 조심할 점: ${pick(["확신이 없는데 먼저 다 주는 것", "서운함을 말하지 않는 것", "상대의 속도를 무시하는 것"], seed, 4)}`,
      ],
    },
    {
      heading: "2. 이상형과 잘 맞는 사람",
      paragraphs: [ideal, `관성·재성이 ${gwan}개로 ${gwan >= 3 ? "인연의 기회가 여러 번 오는 편이에요. 다만 선택이 어려울 수 있으니 '나를 편하게 하는 사람' 기준 하나만 잡으세요." : "인연이 드문 편은 아니지만 한 번 마음을 열면 오래 가요."}`],
      bullets: [
        `잘 맞는 일간 기운 · ${engine.ELEMS.filter((elem) => elem !== o.strongest).slice(0, 2).join(", ")}`,
        `피하면 좋은 유형 · ${pick(["말로만 약속하는 사람", "감정을 회피하는 사람", "경쟁심이 지나친 사람"], seed, 3)}`,
      ],
    },
    {
      heading: "3. 썸에서 연애까지 — 타이밍",
      paragraphs: [
        result.fortune.love.score >= 70
          ? "지금은 흐름이 좋은 때예요. 마음에 두는 사람이 있다면 대화의 빈도를 한 단계만 올려 보세요. 상대도 이미 신호를 보내고 있을 수 있어요."
          : "지금은 서두르기보다 신뢰를 쌓는 구간이에요. 관계를 급하게 정의하기보다, 함께하는 시간을 늘리는 쪽이 결과적으로 빨라요.",
        `${best[0].month}월과 ${best[1].month}월에 인연의 문이 열려요. 이 달에는 약속을 미루지 말고 나가 보세요.`,
      ],
      bullets: best.map((month) => `${month.month}월 · ${month.line} (${month.score}점)`),
    },
    {
      heading: "4. 결혼운 · 오래 가는 관계",
      paragraphs: [
        `배우자 자리인 일지 ${result.dayZhi}(${result.dayZhiHanja})가 ${dayZhiElem} 기운이에요. ${
          dayZhiElem === "목"
            ? "함께 자라나는 결혼이 잘 맞아요. 서로의 목표를 응원하는 사이."
            : dayZhiElem === "화"
              ? "집 안 분위기가 밝고 표현이 많은 결혼이 좋아요."
              : dayZhiElem === "토"
                ? "안정과 생활력이 중심이 되는 결혼이 잘 맞아요."
                : dayZhiElem === "금"
                  ? "역할과 책임이 분명한 관계에서 편안함을 느껴요."
                  : "정서적 교감이 깊은 결혼이 맞아요. 다만 감정에 잠기지 않게 생활의 리듬도 함께 챙기세요."
        }`,
        `결혼 시기는 ${best[0].month}월 즈음에 이야기가 구체화되기 좋아요. 상대와 '돈·집·가족' 세 가지를 미리 말해 두면 훨씬 빨리 정리됩니다.`,
      ],
      bullets: [
        `결혼 후 좋은 역할 분담 · ${pick(["돈은 한 사람이, 생활은 함께", "각자 수입은 각자, 공동비는 비율로", "큰 결정은 함께, 작은 결정은 번갈아"], seed, 5)}`,
        `오래 가는 비결 · 고마움을 말로 표현하기 (${result.ilgan.keyword[0]} 기질에게 특히 중요해요)`,
      ],
    },
    {
      heading: "5. 재회운 — 헤어진 인연",
      paragraphs: [
        `재회는 '아직 마음이 남아 있는가'보다 '그때의 문제가 해결됐는가'로 판단하세요. ${worst[0].month}월과 ${worst[1].month}월에는 감정이 앞서기 쉬워요. 이 시기의 연락은 관계를 더 어지럽힐 수 있어요.`,
        result.fortune.love.score >= 70
          ? "다시 이어질 가능성은 있는 편이에요. 다만 상대가 아니라 '우리가 반복했던 패턴'이 바뀌었는지부터 확인하세요."
          : "지금은 정리하는 쪽이 나아요. 마음이 정리되면 새로운 인연이 그 자리에 들어옵니다.",
      ],
      bullets: [
        `연락하기 좋은 시기 · ${best[2].month}월 이후`,
        `피할 시기 · ${worst.map((m) => `${m.month}월`).join(", ")}`,
        `확인할 질문 3가지 · 같은 문제가 반복되지 않나요? / 서로의 생활이 맞나요? / 그리움과 사랑을 구분했나요?`,
      ],
    },
    {
      heading: "6. 올해 연애 조언",
      paragraphs: [
        `${engine.ELEM_INFO[weakElem].lack}`,
        `사랑은 내가 채워지지 않은 부분을 상대에게 요구할 때 가장 흔들려요. ${ELEMENT_HABIT[weakElem][0]}부터 시작해 보세요. 내 리듬이 잡히면 인연도 자연스럽게 따라옵니다.`,
      ],
      bullets: [
        `행운의 색 · ${engine.LUCKY_COLOR[weakElem].name}`,
        `인연이 붙는 장소 · ${pick(["조용한 카페", "운동·취미 모임", "지인 소개 자리", "배움의 자리"], seed, 6)}`,
        `행운의 숫자 · ${((seed % 9) + 1).toString()}`,
      ],
    },
  ];

  return {
    type: "love",
    title: "연애운 리포트",
    subtitle: `${result.input.name ? `${result.input.name} 님 · ` : ""}썸 · 결혼 · 재회`,
    headline:
      result.fortune.love.score >= 70
        ? "마음이 통하는 인연이 가까이 있어요"
        : "천천히, 그러나 분명히 오는 인연이에요",
    chips: [
      { label: "사랑운", value: `${result.fortune.love.score}점` },
      { label: "인연의 달", value: `${best[0].month}월` },
      { label: "배우자 자리", value: `${result.dayZhi}(${dayZhiElem})` },
    ],
    previewParagraphs: [
      result.ilgan.love,
      `지금 사랑운은 ${result.fortune.love.score}점(${result.fortune.love.band.label}). 이상형·결혼운·재회운·인연의 시기는 2코인으로 열려요.`,
    ],
    lockedTitles: sections.map((section) => section.heading),
    sections,
    closing:
      "좋은 인연은 서두르지 않아도 옵니다. 다만 문을 닫아 두면 들어올 수 없어요.",
  };
}

/* -------------------------------------------------------------- 궁합 심화 */

export function buildGunghapReport(
  engine: SajuEngine,
  a: SajuResult,
  b: SajuResult,
): ReportDoc {
  const compat = engine.compatibility(a, b);
  const seed = seedOf(a) + seedOf(b);
  const aName = a.input.name || "나";
  const bName = b.input.name || "상대";

  const level =
    compat.score >= 85
      ? "천생연분형"
      : compat.score >= 72
        ? "잘 맞는 짝형"
        : compat.score >= 60
          ? "노력형 궁합"
          : "다른 결의 두 사람";

  const sections: ReportBlock[] = [
    {
      heading: `1. 두 사람의 기본 케미 — ${level}`,
      paragraphs: [
        `${aName} 님의 일간 ${a.dayGan}과 ${bName} 님의 일간 ${b.dayGan}의 관계는 ${compat.ganText}`,
        `${aName} 님의 일지 ${a.dayZhi}과 ${bName} 님의 일지 ${b.dayZhi}는 ${compat.zhiText}`,
        compat.complement >= 60
          ? `서로 부족한 기운을 채워 주는 비율이 ${compat.complement}%로 높아요. 함께 있으면 각자 혼자일 때보다 결정이 빨라지고, 생활의 리듬도 안정돼요.`
          : `서로 채워 주는 기운은 ${compat.complement}% 정도예요. 비슷한 부분이 많아 편하지만, 부족한 부분은 둘이 함께 의식적으로 메워야 해요.`,
      ],
      bullets: [`궁합 점수 ${compat.score}점 · ${compat.label}`],
    },
    {
      heading: "2. 마음이 통하는 지점",
      paragraphs: [
        `${aName} 님은 ${a.ilgan.keyword.join("·")}의 기질, ${bName} 님은 ${b.ilgan.keyword.join("·")}의 기질이에요. ${
          compat.score >= 72
            ? "이 두 기질이 서로의 빈 곳을 정확히 눌러 줘서, 말하지 않아도 통하는 순간이 자주 생겨요."
            : "기질이 다르게 보여도, 상대의 방식이 '나와 다른 것'이지 '틀린 것'이 아니라는 걸 알면 훨씬 편해져요."
        }`,
        `${aName} 님이 ${a.fortune.love.score >= b.fortune.love.score ? "애정 표현이 더 많은 쪽" : "표현이 적은 쪽"}이에요. 이 차이를 미리 알고 있으면 서운함이 줄어요.`,
      ],
      bullets: [
        `${aName} · ${a.ilgan.oneLine}`,
        `${bName} · ${b.ilgan.oneLine}`,
      ],
    },
    {
      heading: "3. 부딪히는 지점",
      paragraphs: [
        compat.advice[0] ?? "서로의 속도가 다를 때 오해가 생겨요.",
        `${a.strength}인 ${aName} 님과 ${b.strength}인 ${bName} 님은 ${a.strength === b.strength ? "비슷한 힘의 균형이라 주도권 다툼이 생기면 오래 끌 수 있어요." : "에너지의 방향이 달라, 한쪽이 지칠 때 다른 쪽은 왜 힘든지 모를 수 있어요."}`,
      ],
      bullets: [
        `${a.input.name || "나"} — ${a.ilgan.weak[0]}`,
        `${b.input.name || "상대"} — ${b.ilgan.weak[0]}`,
        `갈등이 커지는 패턴 · ${pick(["말이 길어질 때", "결정을 미룰 때", "서로 연락을 기다릴 때"], seed)}`,
      ],
    },
    {
      heading: "4. 오래 가는 법",
      paragraphs: [
        compat.advice[1] ?? "고마움을 말로 표현해 주세요.",
        `${aName} 님에게는 ${a.ohaeng.missing.length ? `${a.ohaeng.missing[0]} 기운` : `${a.ohaeng.weakest} 기운`}을 채워 주는 사람이 필요하고, ${bName} 님에게는 ${b.ohaeng.missing.length ? `${b.ohaeng.missing[0]} 기운` : `${b.ohaeng.weakest} 기운`}이 필요해요. 서로가 그 역할을 조금씩 맡아 주면 관계가 단단해져요.`,
      ],
      bullets: [
        `함께하면 좋은 것 · ${pick(["같이 걷기", "같이 배우기", "같이 요리하기", "짧은 여행"], seed, 2)}`,
        `피하면 좋은 것 · ${pick(["연락 텀을 재는 것", "과거 이야기 꺼내기", "결정 미루기"], seed, 3)}`,
        `한 달에 한 번 · 서로 좋았던 일 하나씩 말하기`,
      ],
    },
    {
      heading: "5. 함께할 때의 흐름",
      paragraphs: [
        `두 사람의 기운을 합치면 ${a.ohaeng.strongest}과 ${b.ohaeng.strongest}이 만나요. ${
          a.ohaeng.strongest === b.ohaeng.strongest
            ? "같은 기운이 겹쳐 강점은 커지지만, 그 부분에서 부딪히면 크게 부딪혀요."
            : "서로 다른 기운이 보완되어, 한쪽이 흔들릴 때 다른 쪽이 중심을 잡아 줄 수 있어요."
        }`,
        `${bName} 님이 특히 힘든 시기에는 ${aName} 님이 먼저 말을 걸어 주세요. 반대의 경우도 마찬가지예요.`,
      ],
      bullets: [
        `관계 온도 · ${compat.score}점 (${level})`,
        `서로 채워 주는 비율 · ${compat.complement}%`,
      ],
    },
    {
      heading: "6. 한 줄 조언",
      paragraphs: [
        `${aName} 님과 ${bName} 님은 ${
          compat.score >= 72
            ? "타고난 결이 잘 맞는 사이예요. 다만 잘 맞는다는 이유로 노력을 멈추면 금방 식어요. 작은 표현을 꾸준히 해 주세요."
            : "다른 결을 가진 두 사람이에요. 그래서 더 많은 대화가 필요하지만, 그만큼 서로에게 없는 것을 배울 수 있어요."
        }`,
      ],
      bullets: compat.advice.slice(0, 3),
    },
  ];

  return {
    type: "gunghap",
    title: `${aName} · ${bName} 심화 궁합`,
    subtitle: `일간 ${a.dayGan} × ${b.dayGan} · 일지 ${a.dayZhi} × ${b.dayZhi}`,
    headline: `${compat.score}점 · ${compat.label}`,
    chips: [
      { label: "궁합 점수", value: `${compat.score}점` },
      { label: "케미", value: compat.label },
      { label: "보완", value: `${compat.complement}%` },
    ],
    previewParagraphs: [
      `${compat.ganText}`,
      `${compat.zhiText} 심화 리포트에는 갈등 포인트와 오래 가는 법이 담겨 있어요.`,
    ],
    lockedTitles: sections.map((section) => section.heading),
    sections,
    closing: "궁합은 점수가 아니라 사용법이에요. 잘 맞는 부분은 살리고, 다른 부분은 배려로 메우면 됩니다.",
  };
}

/* -------------------------------------------------------------------- 대운 */

export function buildDaewoonReport(
  engine: SajuEngine,
  result: SajuResult,
): ReportDoc {
  const seed = seedOf(result);
  const monthGanIndex = engine.GAN.indexOf(result.pillars.month.gan);
  const monthZhiIndex = engine.ZHI.indexOf(result.pillars.month.zhi);
  const dayGanIndex = engine.GAN.indexOf(result.dayGan);
  const yearGanYang = engine.GAN.indexOf(result.pillars.year.gan) % 2 === 0;
  const male = result.input.gender === "m";
  const forward = yearGanYang === male;

  let startAge = 7;
  if (result.jieqi) {
    const birth = new Date(
      `${result.solar.year}-${String(result.solar.month).padStart(2, "0")}-${String(
        result.solar.day,
      ).padStart(2, "0")}T12:00:00Z`,
    );
    const edge = new Date((forward ? result.jieqi.nextDate : result.jieqi.prevDate) + "T12:00:00Z");
    const days = Math.abs(edge.getTime() - birth.getTime()) / 86400000;
    startAge = Math.max(1, Math.min(10, Math.round((days / 3) * 10) / 10));
  }
  const startRounded = Math.max(1, Math.round(startAge));

  const periods = Array.from({ length: 8 }, (_, index) => {
    const step = (index + 1) * (forward ? 1 : -1);
    const gan = engine.GAN[((monthGanIndex + step) % 10 + 10) % 10];
    const zhi = engine.ZHI[((monthZhiIndex + step) % 12 + 12) % 12];
    const sipsin = engine.sipsinOf(dayGanIndex, engine.GAN.indexOf(gan));
    const elem = engine.GAN_ELEM[engine.GAN.indexOf(gan)];
    const ageFrom = startRounded + index * 10;
    return { gan, zhi, sipsin, elem, ageFrom, ageTo: ageFrom + 9 };
  });

  const sections: ReportBlock[] = periods.map((period, index) => ({
    heading: `${period.ageFrom}~${period.ageTo}세 · ${period.gan}${period.zhi} (${period.sipsin})`,
    paragraphs: [
      `${period.gan}${period.zhi} 대운은 ${SIPSIN_THEME[period.sipsin] ?? "변화가 오는 시기"}예요. ${period.elem} 기운이 10년의 바탕이 됩니다.`,
      index === 0
        ? `첫 대운은 ${startAge}세 즈음에 시작해요. 이 시기의 경험이 이후 10년의 방향을 정하니, 작은 습관 하나를 오래 유지해 보세요.`
        : `${period.ageFrom}세 전후로 흐름이 바뀌어요. 이 시기에는 ${
            period.sipsin === "편재" || period.sipsin === "정재"
              ? "돈이 도는 자리에 서게 됩니다. 크게 벌기보다 구조를 만드는 쪽이 오래 갑니다."
              : period.sipsin === "정관" || period.sipsin === "편관"
                ? "책임이 커지고 자리가 잡힙니다. 몸을 아끼면서 맡는 것이 중요해요."
                : period.sipsin === "식신" || period.sipsin === "상관"
                  ? "내 재능이 밖으로 드러납니다. 보여 주는 일을 미루지 마세요."
                  : period.sipsin === "정인" || period.sipsin === "편인"
                    ? "배움과 도움이 들어옵니다. 공부와 사람에게 투자할 때 크게 돌아와요."
                    : "내 힘으로 밀어붙이는 시기입니다. 동료와 이익을 나누는 법을 익히세요."
          }`,
    ],
    bullets: [
      `핵심 기운 · ${period.elem}(${engine.ELEM_INFO[period.elem].hanja}) ${engine.ELEM_INFO[period.elem].keyword}`,
      `이 시기의 과제 · ${pick(
        [
          "한 가지를 10년 단위로 보는 습관",
          "몸의 리듬을 먼저 챙기기",
          "사람을 오래 만나는 관계 만들기",
          "돈의 구조를 만드는 일",
        ],
        seed,
        index,
      )}`,
    ],
  }));

  sections.unshift({
    heading: "대운을 읽는 법",
    paragraphs: [
      `${result.input.gender === "f" ? "여성" : result.input.gender === "m" ? "남성" : "성별 미입력"} · 년간 ${result.pillars.year.gan}(${yearGanYang ? "양" : "음"}) 기준으로 대운은 ${forward ? "순행" : "역행"}해요.`,
      `대운은 10년마다 바뀌는 큰 흐름이에요. 사주(타고난 그릇)가 '무엇을 가졌는가'라면, 대운은 '언제 그 그릇이 쓰이는가'를 보여 줍니다.`,
    ],
    bullets: [
      `대운 시작 · 만 ${startAge}세 전후 (절기까지의 날짜를 3일=1년으로 계산)`,
      `방향 · ${forward ? "월주에서 다음 간지로 (순행)" : "월주에서 이전 간지로 (역행)"}`,
    ],
  });

  return {
    type: "daewoon",
    title: "대운 리포트",
    subtitle: `${result.dayGan}${result.dayZhi}일 · ${forward ? "순행" : "역행"} 대운 8개`,
    headline: `${startRounded}세부터 10년마다, 내 인생의 큰 파도`,
    chips: [
      { label: "대운 시작", value: `${startAge}세` },
      { label: "현재", value: periods[0].ageTo >= new Date().getFullYear() - result.solar.year ? `${periods[0].gan}${periods[0].zhi}` : `${periods[0].gan}${periods[0].zhi}` },
      { label: "8개 대운", value: `${periods[0].ageFrom}~${periods[7].ageTo}세` },
    ],
    previewParagraphs: [
      `대운은 ${startAge}세 즈음 ${periods[0].gan}${periods[0].zhi}(${periods[0].sipsin})로 시작해요.`,
      "10년 단위 8개 흐름과 각 시기의 과제는 1코인으로 열려요.",
    ],
    lockedTitles: sections.map((section) => section.heading),
    sections,
    closing: "대운은 바뀌지 않는 바람이에요. 돛을 언제 올릴지가 내 몫입니다.",
  };
}

/* ------------------------------------------------------------------ 연운 */

export function buildYeonwoonReport(
  engine: SajuEngine,
  result: SajuResult,
): ReportDoc {
  const seed = seedOf(result);
  const current = result.years.find((year) => year.year === 2026) ?? result.years[0];
  const next = result.years.find((year) => year.year === 2027);
  const flow = monthlyFlow(seed + 11, current?.score ?? 60);
  const best = [...flow].sort((a, b) => b.score - a.score).slice(0, 2);
  const worst = [...flow].sort((a, b) => a.score - b.score).slice(0, 2);
  const o = result.ohaeng;
  const weakElem = (o.missing[0] ?? o.weakest) as Element;
  const now = new Date();
  const remaining = flow.filter((month) => month.month >= now.getMonth() + 1);

  const sections: ReportBlock[] = [
    {
      heading: `${current?.year ?? 2026}년 총운`,
      paragraphs: [
        `${current?.ganja ?? "병오"}(${current?.ganjaHanja ?? "丙午"}) ${current?.animal ?? "말"}의 해. 일간과의 관계는 **${current?.sipsin ?? "식신"}** — ${SIPSIN_THEME[current?.sipsin ?? "식신"]}예요.`,
        `${current?.text ?? ""} ${current?.zhiNote ?? ""}`,
      ],
      bullets: [
        `연운 지수 ${current?.score ?? 60}점 · ${current?.band.label ?? "무난함"}`,
        `남은 달 중 가장 좋은 달 · ${best.map((m) => `${m.month}월`).join(", ")}`,
        `조심할 달 · ${worst.map((m) => `${m.month}월`).join(", ")}`,
      ],
    },
    {
      heading: "재물 — 남은 올해",
      paragraphs: [
        `${result.fortune.money.text}`,
        `${best[0].month}월에 들어오는 돈은 '지키는' 쪽으로, ${best[1].month}월에 들어오는 돈은 '굴리는' 쪽으로 쓰면 연말 결산이 좋아져요.`,
      ],
      bullets: [
        `지출을 줄일 달 · ${worst[0].month}월`,
        `계약·정산하기 좋은 달 · ${best[0].month}월`,
      ],
    },
    {
      heading: "일과 커리어 — 남은 올해",
      paragraphs: [
        `${result.fortune.work.text}`,
        `${SIPSIN_THEME[current?.sipsin ?? "식신"]}이라 ${
          current?.sipsin === "식신" || current?.sipsin === "상관"
            ? "내가 만든 것을 밖으로 내놓는 일이 성과로 이어져요."
            : "맡은 자리에서 신뢰를 쌓는 것이 다음 해의 발판이 돼요."
        }`,
      ],
      bullets: [
        `집중할 달 · ${best[0].month}월`,
        `정리할 달 · ${worst[0].month}월`,
      ],
    },
    {
      heading: "사랑과 관계 — 남은 올해",
      paragraphs: [
        `${result.fortune.love.text}`,
        `${best[1].month}월에 사람을 만나는 자리가 생기면 나가 보세요. ${worst[1].month}월에는 오래된 오해를 정리하는 게 좋아요.`,
      ],
      bullets: [`인연의 달 · ${best[1].month}월`, `정리할 달 · ${worst[1].month}월`],
    },
    {
      heading: "건강 — 남은 올해",
      paragraphs: [
        `약한 ${weakElem} 기운은 ${ELEMENT_BODY[weakElem]}으로 먼저 신호를 보내요. ${worst[0].month}월 전에 수면 시간을 30분 앞당겨 두면 훨씬 편해져요.`,
      ],
      bullets: ELEMENT_HABIT[weakElem].map((habit) => habit),
    },
    {
      heading: "월별 흐름 (남은 달 포함 12개월)",
      paragraphs: [
        "점수가 높은 달에 밀고, 낮은 달에 정비하면 한 해가 훨씬 편해져요.",
      ],
      bullets: flow.map((month) => `${month.month}월 · ${month.score}점 · ${month.line}`),
    },
    {
      heading: next ? `${next.year}년 미리보기` : "다음 해 미리보기",
      paragraphs: next
        ? [
            `${next.year}년은 ${next.ganja}(${next.ganjaHanja}) ${next.animal}의 해, **${next.sipsin}**의 흐름이에요.`,
            `${next.text} 지금부터 준비해 두면 ${next.year}년 첫 달이 훨씬 수월해요.`,
          ]
        : ["다음 해 흐름은 생년월일을 다시 넣으면 확인할 수 있어요."],
      bullets: [
        `남은 달 실천 · ${remaining.length ? `${remaining[0].month}월 ${remaining[0].line}` : "연말 정산과 다음 해 계획 세우기"}`,
        `행운의 색 · ${engine.LUCKY_COLOR[weakElem].name}`,
      ],
    },
  ];

  return {
    type: "yeonwoon",
    title: "연운 리포트",
    subtitle: `${current?.year ?? 2026}년 월별 흐름`,
    headline: `${best[0].month}월과 ${best[1].month}월, 올해의 문이 열려요`,
    chips: [
      { label: "연운 지수", value: `${current?.score ?? 60}점` },
      { label: "최고의 달", value: `${best[0].month}월` },
      { label: "주의할 달", value: `${worst[0].month}월` },
    ],
    previewParagraphs: [
      `${current?.text ?? ""}`,
      `남은 달의 재물·일·사랑·건강과 2027년 미리보기는 1코인으로 열려요.`,
    ],
    lockedTitles: sections.map((section) => section.heading),
    sections,
    closing: "올해의 남은 달은 아직 내 것입니다. 좋은 달에 힘을 싣고, 조심할 달에 쉬어 가세요.",
  };
}

export function buildReport(
  type: ReportType,
  engine: SajuEngine,
  result: SajuResult,
  partner?: SajuResult,
): ReportDoc | null {
  switch (type) {
    case "saju":
      return buildSajuReport(engine, result);
    case "newyear":
      return buildNewYearReport(engine, result);
    case "love":
      return buildLoveReport(engine, result);
    case "daewoon":
      return buildDaewoonReport(engine, result);
    case "yeonwoon":
      return buildYeonwoonReport(engine, result);
    case "gunghap":
      return partner ? buildGunghapReport(engine, result, partner) : null;
    default:
      return null;
  }
}
