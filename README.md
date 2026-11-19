# 운세 한 스푼 — Next.js + Supabase 사주 앱 (코인 결제 · 사주아이 스타일)

무아 님의 부업용 사주 사이트를 **Next.js(App Router) + Supabase(카카오 로그인·Postgres) + Vercel 배포 가능 구조**로 옮긴 프로젝트입니다.
기존 `/workspace/saju-site/` 의 디자인·마스코트·검증된 만세력 엔진을 그대로 가져와, 로그인·저장·궁합 줄세우기 기능을 더했습니다.

- 프런트: Next.js 15 (App Router) · React 19 · TypeScript · 모바일 퍼스트(최대 480px 카드 레이아웃)
- 백엔드: Supabase Auth(카카오 OAuth) + Postgres(RLS) · Route Handler API
- 수익화: **코인 충전 · 유료 리포트(토스페이먼츠)** · 쿠팡 파트너스(AF6829761) 개운템 · 애드센스/카카오 애드핏 슬롯

---

## 1. 지금 바로 되는 것 (환경변수 없이)

```bash
npm install
npm run dev     # http://localhost:3000
```

- 사주 입력 → 만세력 계산 → 결과(사주팔자·오행·일간·2026/2027·오늘의 운세·개운템·궁합·공유) 전부 동작
- `/board` 궁합 줄세우기: 내 사주를 가운데 두고 친구를 추가하면 점수 순 랭킹 + 방사형 지도 표시
  (로그인 전에는 브라우저 localStorage 에 저장되어 새로고침해도 유지)
- 로그인·저장 버튼을 누르면 "Supabase 연결 후 사용할 수 있어요" 안내가 뜨고, 게스트 풀이는 그대로 동작
- API 는 `503 { error: "supabase_not_configured" }` 로 안전하게 응답

---

## 2. 폴더 구조

```
saju-app/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx               # 메타데이터·폰트·전역 스타일·애드센스 스크립트
│  │  ├─ globals.css              # 기존 styles.css + 앱 확장 스타일
│  │  ├─ page.tsx                 # 메인(사주 풀이) — Suspense + SajuApp
│  │  ├─ board/page.tsx           # 궁합 줄세우기 보드
│  │  ├─ login/page.tsx           # 카카오 로그인 / 미설정 안내
│  │  ├─ my/page.tsx              # 마이페이지(저장한 사주·풀이·삭제)
│  │  ├─ my/actions.ts            # 삭제 Server Action
│  │  ├─ privacy/page.tsx         # 개인정보처리방침(광고 심사 대비)
│  │  ├─ robots.ts / sitemap.ts
│  │  ├─ auth/callback/route.ts   # 카카오 OAuth code → 세션 쿠키 교환
│  │  ├─ auth/signout/route.ts    # 로그아웃
│  │  └─ api/
│  │     ├─ readings/route.ts             # GET 목록 · POST 저장
│  │     ├─ readings/[id]/route.ts        # GET 단건 · DELETE
│  │     ├─ profiles/route.ts             # GET 목록 · POST 추가
│  │     ├─ profiles/[id]/route.ts        # PATCH · DELETE
│  │     ├─ boards/route.ts               # GET 내 보드 · POST 생성(중복 재사용)
│  │     ├─ boards/[id]/route.ts          # GET 공개 보드 · PATCH · DELETE
│  │     ├─ boards/[id]/entries/route.ts  # POST 참여자 추가(서버에서 점수 재계산)
│  │     └─ boards/[id]/entries/[entryId]/route.ts  # DELETE 참여자
│  ├─ components/
│  │  ├─ saju/                    # SajuApp, Intro/Form/Loading/Result 화면
│  │  │  └─ result/               # 카드별 컴포넌트 + 저장/공유 액션
│  │  ├─ board/                   # BoardApp, HubMap(방사형), RankList, BirthFields
│  │  ├─ auth/                    # AuthChip, KakaoLoginButton, useAuth
│  │  ├─ ads/AdSlot.tsx           # 애드센스 · 애드핏 · 자리 표시
│  │  ├─ ui/Toast.tsx
│  │  └─ SiteFooter.tsx
│  ├─ lib/
│  │  ├─ saju/                    # lunar.js, korean-lunar-calendar, saju-engine(ESM 화)
│  │  ├─ supabase/                # client(브라우저) · server(쿠키 세션) · admin(서버 전용)
│  │  ├─ env.ts                   # 환경변수·설정 여부 판별
│  │  ├─ api.ts                   # requireUser·JSON 오류·크기 제한
│  │  ├─ validation.ts            # 생년월일 등 입력 검증
│  │  ├─ form.ts                  # 폼 상태·공유 파라미터 변환
│  │  ├─ board.ts                 # 궁합 태그·정렬·localStorage
│  │  ├─ coupang.ts               # 제휴 링크 + 공정위 고지 문구
│  │  └─ db-types.ts
│  └─ middleware.ts               # Supabase 세션 쿠키 갱신(미설정 시 통과)
├─ public/assets/                 # hero/result 마스코트 (jpg·webp)
├─ supabase/schema.sql            # 테이블 4개 + RLS 정책
├─ .env.example
└─ README.md
```

---

## 3. Supabase 연결 (로그인·저장 켜기)

1. **프로젝트 생성** → SQL Editor 에 `supabase/schema.sql` 전체 실행
   (`saju_profiles`, `saju_readings`, `compatibility_boards`, `board_entries` + RLS)
2. **Authentication → Providers → Kakao** 활성화
   - Kakao REST API 키 → `Client ID`
   - Kakao **Client Secret** → `Client Secret` (카카오 디벨로퍼스에서 "사용함"으로 설정)
   - Supabase 가 보여 주는 **Callback URL**(`https://<project-ref>.supabase.co/auth/v1/callback`)을 카카오에 등록
3. **Authentication → URL Configuration**
   - Site URL: `https://내도메인`
   - Redirect URLs: `https://내도메인/auth/callback`, `http://localhost:3000/auth/callback`
4. `.env.local` 작성 (`.env.example` 복사)

```bash
cp .env.example .env.local
```

| 변수 | 필수 | 설명 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | anon(publishable) key — 브라우저 노출 OK |
| `SUPABASE_SERVICE_ROLE_KEY` | 선택 | 서버 전용(관리자 작업). **절대 `NEXT_PUBLIC_` 금지** |
| `NEXT_PUBLIC_SITE_URL` | 권장 | 공유 링크·OG·sitemap 기준 주소 |
| `NEXT_PUBLIC_ADSENSE_CLIENT` 등 | 선택 | 애드센스 승인 후 |
| `NEXT_PUBLIC_ADFIT_UNIT` | 선택 | 카카오 애드핏 사용 시 |
| `NEXT_PUBLIC_COUPANG_PARTNER_ID` | 선택 | 기본값 `AF6829761` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | 선택 | 개인정보처리방침 문의 이메일 |

> `SUPABASE_SERVICE_ROLE_KEY` 는 `src/lib/supabase/admin.ts`(server-only)에서만 읽습니다.
> 실제 요청 처리는 anon key + 쿠키 세션 + RLS 로 하므로, 일반 기능에는 서비스 롤 키가 필요 없습니다.

### 카카오 디벨로퍼스 체크리스트

- [ ] 애플리케이션 → 플랫폼 → Web 도메인 등록(`https://내도메인`, `http://localhost:3000`)
- [ ] 카카오 로그인 → 활성화 ON, **OpenID Connect 사용 설정 ON**
- [ ] Redirect URI 두 개 등록
      - `https://<project-ref>.supabase.co/auth/v1/callback` (Supabase 기본 OAuth용, 보관)
      - `https://내도메인/api/auth/kakao/callback` (**이 앱이 실제로 쓰는 OIDC 콜백**)
- [ ] 동의항목: 닉네임(필수), 프로필 사진(선택)
- [ ] Client Secret 사용함 → Vercel 환경변수 `KAKAO_CLIENT_SECRET`, REST API 키 → `KAKAO_REST_API_KEY`

> **왜 Supabase 기본 Kakao 프로바이더가 아니라 OIDC 인가 코드 방식인가**
> Supabase 의 Kakao 프로바이더는 `account_email` 스코프를 항상 함께 요청합니다.
> 이메일 동의항목은 «비즈 앱» 인증이 있어야 열리므로 일반 앱에서는
> 카카오가 `KOE205(잘못된 요청)` 로 인가 요청 자체를 거절합니다.
> 그래서 이 앱은 카카오에 `openid profile_nickname profile_image` 만 요청해 id_token 을 받고,
> 서버(`/api/auth/kakao/callback`)에서 `supabase.auth.signInWithIdToken({ provider: "kakao" })`
> 으로 세션을 만듭니다. Supabase Kakao 프로바이더는 켜 둔 상태여야 하며
> (`Allow users without an email` ON), 이메일 없이 가입됩니다.

---

## 4. Vercel 배포

1. GitHub 에 이 폴더를 푸시 → Vercel 에서 Import
2. Framework: **Next.js** (빌드 `npm run build`, 출력 자동)
3. Environment Variables 에 위 표의 값 등록 (Production·Preview 모두)
4. 배포 후 Supabase URL Configuration 의 Site URL / Redirect URL 을 실제 도메인으로 갱신
5. (선택) 커스텀 도메인 → `NEXT_PUBLIC_SITE_URL` 도 함께 변경

---

## 5. 궁합 줄세우기(보드) 동작 방식

- **내가 가운데**: `/board` 에서 내 닉네임·생년월일을 넣으면 중앙 허브(일간 캐릭터)가 생깁니다.
- **사람 추가**: 닉네임 + 관계(친구/썸·연인/가족/최애/기타) + 생년월일 → 만세력 엔진으로 두 사람의
  일간·일지 궁합을 계산해 **점수·한 줄 케미 태그**를 만듭니다.
  - 예: 90+ `찰떡 소울메이트`, 82+ `서로 채워주는 귀인`, 74+ `불꽃 튀는 티키타카`, 66+ `말 안 해도 통하는 단짝` …
- **랭킹 + 방사형 지도**: 점수 내림차순 1·2·3위(메달) 목록, 방사형 지도에는 점수가 높을수록 중심(나)에 가깝게 배치.
- **초대 링크**: `내 보드 주소`를 복사/공유하면 친구가 열어서 자기 닉네임·생년월일을 넣고 자기 순위를 확인합니다.
- **저장**:
  - 로그인 전: 브라우저 localStorage (`saju-board:<사주키>`) — 새로고침해도 유지
  - 로그인 후 "보드 저장": Supabase `compatibility_boards` + `board_entries` 에 저장,
    초대 링크에 `b=<boardId>` 가 붙어 친구가 추가한 사람까지 모두에게 보입니다.
    (로그인 전에 넣어 둔 참여자는 저장 시 서버로 함께 업로드)
- **점수는 서버에서 재계산**합니다(`/api/boards/[id]/entries`). 클라이언트가 보낸 점수를 믿지 않습니다.

### 공개 범위 · 개인정보

- `compatibility_boards.is_public = true` 인 보드만 초대 링크(익명 포함)로 읽을 수 있습니다.
- 링크에는 보드 주인의 생년월일이 쿼리로 들어갑니다(친구가 궁합을 계산하는 데 필요). 공유 여부는 사용자가 선택합니다.
- 참여자 추가·삭제는 로그인 사용자만 가능하고, 보드 주인은 모든 참여자를, 참여자는 자기 항목만 지울 수 있습니다(RLS).

---

## 6. DB 스키마 요약

| 테이블 | 역할 | RLS |
| --- | --- | --- |
| `saju_profiles` | 내 사주·지인 사주 프로필 | 본인만 조회/입력/수정/삭제 |
| `saju_readings` | 풀이 기록(`kind`: basic/compat/deep/paid, `result` jsonb) | 본인만 |
| `compatibility_boards` | 궁합 보드(주인 사주 포함, `share_slug`) | 공개 보드는 누구나 읽기 / 쓰기는 주인만 |
| `board_entries` | 보드 참여자(닉네임·생년월일·궁합 점수) | 공개 보드는 읽기 허용 / 추가는 로그인 사용자 / 삭제는 본인·보드 주인 |

향후 유료·심화 풀이는 `saju_readings.kind = 'deep' | 'paid'` + `is_paid` 로 같은 구조에서 확장할 수 있습니다.
(서버에서 결제 검증 후 `is_paid = true` 로 갱신하는 Route Handler 를 추가하면 됩니다.)

---

## 7. API 요약

| 메서드 | 경로 | 인증 | 설명 |
| --- | --- | --- | --- |
| GET/POST | `/api/readings` | 필요 | 풀이 목록 / 저장(서버에서 생년월일 재검증) |
| GET/DELETE | `/api/readings/:id` | 필요 | 단건 조회 / 삭제 |
| GET/POST | `/api/profiles` | 필요 | 프로필 목록 / 추가 |
| PATCH/DELETE | `/api/profiles/:id` | 필요 | 프로필 수정 / 삭제 |
| GET/POST | `/api/boards` | 필요 | 내 보드 목록 / 생성(같은 사주면 기존 보드 재사용) |
| GET | `/api/boards/:id` | 불필요 | 공개 보드 + 참여자(초대 링크 화면) |
| PATCH/DELETE | `/api/boards/:id` | 필요 | 제목·공개 여부 수정 / 삭제 |
| POST | `/api/boards/:id/entries` | 필요 | 참여자 추가(궁합 점수 서버 계산) |
| DELETE | `/api/boards/:id/entries/:entryId` | 필요 | 참여자 삭제 |

공통 오류 형식: `{ "error": "code", "message": "사람이 읽을 수 있는 안내" }`
- `503 supabase_not_configured` · `401 unauthorized` · `400 invalid_birth` · `404 not_found` · `413 payload_too_large`

---

## 8. 수익화 설정

| 요소 | 설정 |
| --- | --- |
| 쿠팡 파트너스 | 기본 ID `AF6829761` · 결과의 개운템 카드가 `lptag`+`subId` 로 연결 · 공정위 고지 문구 노출 |
| 애드센스 | `NEXT_PUBLIC_ADSENSE_CLIENT` + `NEXT_PUBLIC_ADSENSE_SLOT_RESULT_TOP/BOTTOM` 입력 시 실제 광고, 없으면 "광고 영역" 자리 표시 |
| 카카오 애드핏 | `NEXT_PUBLIC_ADFIT_UNIT` 입력 시 애드핏 스크립트·유닛 표시 |
| 광고 심사 | `/privacy` 개인정보처리방침(수집 항목·위탁·쿠키·광고·문의) 포함 |
| 공유 | 결과 요약 복사 · Web Share API · 공유 링크로 같은 사주 재현 |

---

## 9. 검증 결과 (2026-11-19)

- `npm run build` ✅ 성공 (Next 15.5.29, 18개 라우트, First Load JS ~103kB 공통)
- `npx tsc --noEmit` ✅ 오류 없음
- 브라우저(390×844 모바일) 실측
  - 메인: 입력 → 로딩 → 결과 렌더 ✅, 콘솔 에러 0
  - 기존 사이트와 동일 입력(1999-04-22)에서 **사주팔자·오행·오늘의 운세·공유 요약 문자열이 완전 일치** ✅
  - 공유 링크(`/?n=…&y=…&m=…&d=…&t=6`) 진입 시 자동 계산 ✅ (시주 경오)
  - 음력·윤달: 2020년 윤4월 15일 → 양력 2020.06.06 ✅, 윤달이 없는 달로 바꾸면 체크 자동 해제 + 안내 ✅
  - 결과 복사/공유, 궁합 카드, 하단 마스코트 섹션 ✅
  - `/board`: 보드 생성 → 6명 추가 → 랭킹(79·69·64·63·63·59점) 정렬 ✅, 새로고침 후 localStorage 복원 ✅,
    초대 링크 복사 ✅, 게스트가 링크로 들어와 자기 점수 확인 ✅
  - `/login`, `/my`: Supabase 미설정 시 안내 화면 ✅, `/api/*` 는 503 + 안내 문구 ✅
  - 레이아웃: 320px 가로 스크롤 없음 ✅ / 데스크톱에서 480px 카드 중앙 정렬 ✅
  - 정적 HTML에 인트로 히어로·폰트·타이틀이 포함(SEO) ✅, `/robots.txt`·`/sitemap.xml`·`/privacy` 응답 ✅
  - `/auth/callback`(코드 없음) → `/login?error=not_configured` 안내로 이동 ✅
- `supabase/schema.sql` 는 PostgreSQL 파서(pglast 8.8)로 51개 구문 파싱 검증 ✅ (문법 오류 없음)
- **실서버 검증 (2026-11-19, Supabase + 카카오 + Vercel 배포 완료)**
  - 배포 URL: https://saju-app-two-psi.vercel.app
  - 카카오 OIDC 로그인 → `auth.users` 에 유저 생성 ✅ (문무아, provider=kakao, 이메일 없음)
  - 결과 화면 “내 사주에 저장” → `saju_readings` 1행 생성 ✅ (RLS 적용, title `무아 님의 사주`)
  - 궁합 보드 “보드 저장하고 친구 초대하기” → `compatibility_boards` + `board_entries` 생성 ✅
  - 초기 1회 이슈: 테이블에는 RLS 정책만 있고 `anon/authenticated` 롤의 **테이블 권한(GRANT)** 이 없어
    `42501 permission denied` 가 났고, 아래 GRANT 문을 실행해 해결했습니다(스키마 파일에도 추가됨).
    `grant usage on schema public to anon, authenticated; grant all on all tables in schema public to anon, authenticated;`

---

## 10. 다음에 이어 붙이면 좋은 것

- 유료 심화 풀이(결제 → `saju_readings.kind='paid'`, `is_paid=true`)
- 보드 공유용 OG 이미지(동적 `opengraph-image`)로 카카오톡 미리보기 강화
- 결과 저장 시 프로필 재사용(같은 생년월일 프로필 자동 매칭)
- 애드센스 승인 후 광고 슬롯 위치 A/B 테스트


---

## 11. 사주아이 스타일 홈 + 코인 결제 (2026-11-19 추가)

`saju-kid.com`(사주아이)의 **무료 운세 뽑기 → 990원(1코인) 유료 리포트 → 코인 충전** 구조를 그대로 옮겨 왔습니다.

### 11-1. 화면 구성

| 경로 | 내용 |
| --- | --- |
| `/` | **홈**: 포춘캐처 히어로(오늘의 무료 운세 뽑기) · 상단 로그인/코인 배지 · 유료 상품 6종 그리드 · 누적 이용자 카운터 · 후기 롤링 · FAQ · 하단 고정 탭바 · 사업자 푸터 |
| `/saju` | 기존 만세력 무료 풀이(사주팔자·오행·오늘의 운세·개운템). 결과 하단에 **심화 사주 해설(1코인) 무료 미리보기 + 잠금해제** 카드 |
| `/report/[type]` | 유료 리포트: `newyear`(2027 신년운세) · `love`(연애운 2코인) · `gunghap`(궁합 심화 1코인) · `daewoon`(대운 1코인) · `yeonwoon`(연운 1코인). 입력 → **무료 미리보기** → 코인으로 잠금해제 → 전체 해설 |
| `/today` | 오늘의 운세(무료): 일진·점수·행운 색/숫자/시간 + 오늘의 한마디 |
| `/charge` | 코인 충전: 1·3·5·10코인 패키지 → 토스페이먼츠 결제창(또는 테스트 결제) |
| `/charge/success` · `/charge/fail` | 결제 승인 처리 · 실패 안내 |
| `/my` | 보관함: 코인 잔액 · 연 유료 리포트 · 저장한 사주/궁합 보드 |
| `/terms` | 이용약관(코인·환불 정책 포함) · `/privacy` 기존 개인정보처리방침 |

하단 탭바: `홈 · 궁합보드 · 오늘운세 · 보관함`.

### 11-2. 유료 상품 가격

| 상품 | 코인 | 가격 | 비고 |
| --- | --- | --- | --- |
| 990원 사주 (심화 해설 8장) | 1 | 990원 | 무료 미리보기 + 잠금해제 |
| 2027 신년운세 (7장 + 12개월 흐름) | 1 | 990원 | NEW |
| 연애운 (6장: 이상형·썸·결혼·재회) | 2 | 1,980원 | 정가 3코인 → 2코인 할인 |
| 990원 궁합 (심화 케미 6장) | 1 | 990원 | 보드와 같은 만세력 엔진 사용 |
| 990원 대운 (8개 대운) | 1 | 990원 | |
| 990원 연운 (월별 흐름) | 1 | 990원 | |

코인 패키지: 1코인 990원 · 3코인 2,700원 · **5코인 4,400원(추천)** · 10코인 8,500원.
금액·코인 수는 `src/lib/coins.ts` 한 곳에 있고, **서버(결제·잠금해제 API)가 이 값으로 다시 검증**합니다.

### 11-3. Supabase 스키마 추가

`supabase/migrations/002_coins_payments.sql` (또는 `supabase/schema.sql` 뒤쪽) 을 SQL Editor 에서 실행하세요.

- `coin_wallets(user_id, balance)` — 사용자당 1행
- `coin_orders(id, user_id, order_id, package_id, amount_krw, coins, status, payment_key, mode, ...)`
- `unlocked_reports(id, user_id, report_type, target_key, coins_spent, ...)` — 같은 리포트는 1회만 과금
- RLS: 세 테이블 모두 **본인 행만 SELECT**. 쓰기는 아래 함수/서버만 가능.
- 함수
  - `coin_unlock(report_type, target_key, coins)` — 로그인 사용자용. 잔액 확인 후 **원자적으로 차감 + 잠금해제 기록**
  - `coin_credit(user, coins)` · `finalize_coin_order(order_id, payment_key, paid)` — **service_role 전용**(결제 승인 서버만 호출)
  - `site_stats()` — 홈 카운터용 집계값(읽기 전용, 누구나)
- `anon/authenticated` 에는 테이블 SELECT 권한만, `service_role` 에는 전체 권한 + 기본 권한(default privileges)까지 부여합니다.

> `SUPABASE_SERVICE_ROLE_KEY` 가 없으면 주문 생성/승인이 503으로 막히고, 무료 기능과 미리보기는 그대로 동작합니다.
> 키는 Vercel Environment Variables 에 **서버 전용**으로 넣으세요(절대 `NEXT_PUBLIC_` 금지).

### 11-4. 토스페이먼츠 실결제 전환 (3단계)

1. **토스페이먼츠 가입** → 개발자센터 > 내 상점 > API 키
   - 사업자 없이도 **테스트 키**(`test_ck_…`, `test_sk_…`)를 바로 발급받을 수 있어요. 실제 돈은 나가지 않습니다.
2. Vercel > Settings > Environment Variables 에 추가
   - `NEXT_PUBLIC_TOSS_CLIENT_KEY` = `test_ck_…` (또는 실키 `live_ck_…`)
   - `TOSS_SECRET_KEY` = `test_sk_…` (또는 실키 `live_sk_…`)
3. 재배포하면 `/charge` 가 자동으로 **토스 결제창(카드·카카오페이 등)** 으로 전환됩니다.
   - 결제창 → `successUrl: /charge/success` → 서버 `/api/payments/confirm` 이 토스 승인 API 호출 → `finalize_coin_order` 로 코인 적립.
   - 실결제(정산)를 위해서는 토스페이먼츠 **가맹점 심사**(사업자등록증 + 통신판매업신고)가 필요합니다.

**키가 없을 때(현재 배포 상태)**: `테스트 결제 모드`로 동작합니다.
`/charge` → 주문 생성(pending) → `/api/payments/confirm` 이 시뮬레이션 승인 → 코인 적립 → 잠금해제까지 전 과정을 실제와 같은 API 로 확인할 수 있습니다.

### 11-5. 결제·잠금해제 API

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| GET | `/api/wallet` | 내 코인 잔액 + 잠금해제한 리포트 목록 |
| POST | `/api/payments/create` | `{ packageId }` → 주문 생성(pending), 결제창 파라미터 반환 |
| POST | `/api/payments/confirm` | `{ orderId, paymentKey, amount }` → 금액·소유자 검증 → 토스 승인(또는 테스트) → 코인 적립 |
| POST | `/api/unlocks` | `{ reportType, targetKey }` → 서버 카탈로그 코인으로 `coin_unlock` |
| GET | `/api/stats` | 누적 이용자/풀이 수(시드 + DB 집계) |

보안 포인트
- 코인을 올리는 경로는 **서비스 롤이 필요한 `finalize_coin_order` 하나뿐**입니다. 사용자가 직접 호출해 코인을 얻을 수 없습니다.
- 잠금해제는 `coin_unlock` 안에서 잔액 확인·차감·기록이 한 트랜잭션으로 처리되고, 같은 리포트는 재과금되지 않습니다.
- 결제 금액은 주문에 저장된 값과 클라이언트가 보낸 값을 비교해 다르면 승인하지 않습니다.

### 11-6. 사업자 정보 · 후기 문구

- 푸터/이용약관의 사업자 정보는 `src/lib/env.ts` 의 `BUSINESS_INFO` 기본값(리우네계절 사진관)이며,
  `NEXT_PUBLIC_BUSINESS_*` 환경변수로 실제 값(사업자등록번호·통신판매업 신고번호)을 넣을 수 있습니다.
- 홈의 이용자 후기(`src/components/kid/HomeScreen.tsx` 의 `REVIEWS`)는 **예시 문구**입니다.
  실제 후기가 쌓이면 교체해 주세요. 누적 카운터의 시드값(`STATS_SEED_*`)도 `src/lib/env.ts` 에서 조정합니다.
