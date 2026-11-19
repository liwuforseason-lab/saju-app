/**
 * 환경변수 접근 지점.
 * - NEXT_PUBLIC_* 값은 빌드 시점에 인라인되므로 브라우저에서도 안전하게 읽을 수 있습니다.
 * - SUPABASE_SERVICE_ROLE_KEY 는 여기(NEXT_PUBLIC_ 없는 이름)에서만 읽고,
 *   실제 사용은 서버 전용 모듈(lib/supabase/admin.ts)에서만 합니다.
 */

const read = (value: string | undefined): string => (value ?? "").trim();

export const SUPABASE_URL = read(process.env.NEXT_PUBLIC_SUPABASE_URL);
export const SUPABASE_ANON_KEY = read(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const SITE_URL =
  read(process.env.NEXT_PUBLIC_SITE_URL) || "http://localhost:3000";

/**
 * 카카오 OIDC 로그인용 서버 전용 값.
 * - REST API 키(클라이언트 ID)와 클라이언트 시크릿은 서버(route handler)에서만 씁니다.
 * - 카카오는 id_token(openid)으로 로그인하고, 그 토큰을 Supabase 세션으로 교환합니다.
 *   (Supabase 기본 Kakao 프로바이더는 account_email 스코프까지 요청하는데,
 *    이메일 동의항목은 비즈 앱 인증이 필요해 일반 앱에서는 쓸 수 없습니다.)
 */
export const KAKAO_REST_API_KEY = read(process.env.KAKAO_REST_API_KEY);
export const KAKAO_CLIENT_SECRET = read(process.env.KAKAO_CLIENT_SECRET);

export const ADSENSE_CLIENT = read(process.env.NEXT_PUBLIC_ADSENSE_CLIENT);
export const ADSENSE_SLOT_RESULT_TOP = read(
  process.env.NEXT_PUBLIC_ADSENSE_SLOT_RESULT_TOP,
);
export const ADSENSE_SLOT_RESULT_BOTTOM = read(
  process.env.NEXT_PUBLIC_ADSENSE_SLOT_RESULT_BOTTOM,
);
export const ADFIT_UNIT = read(process.env.NEXT_PUBLIC_ADFIT_UNIT);
export const CONTACT_EMAIL = read(process.env.NEXT_PUBLIC_CONTACT_EMAIL);

export const COUPANG_PARTNER_ID =
  read(process.env.NEXT_PUBLIC_COUPANG_PARTNER_ID) || "AF6829761";

/**
 * 토스페이먼츠 결제 키.
 * - NEXT_PUBLIC_TOSS_CLIENT_KEY: 브라우저 결제창용(공개 OK). 테스트 키는 test_ck_, 실키는 live_ck_.
 * - TOSS_SECRET_KEY: 서버 승인 API 전용. 절대 NEXT_PUBLIC_ 접두사를 붙이지 마세요.
 * 두 값이 없으면 "테스트 결제 모드"로 동작합니다(주문 생성 → 승인 → 코인 적립 전 과정 시뮬레이션).
 */
export const TOSS_CLIENT_KEY = read(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY);
export const TOSS_SECRET_KEY = read(process.env.TOSS_SECRET_KEY);

/** 실결제(토스 결제창)를 켤 수 있는 상태인지 */
export const isTossConfigured = Boolean(TOSS_CLIENT_KEY && TOSS_SECRET_KEY);

/** 결제 모드: live(실결제) / test(PG 심사 전 시뮬레이션) */
export const PAYMENT_MODE: "live" | "test" = isTossConfigured ? "live" : "test";

/**
 * 누적 이용자 카운터의 시드값.
 * 실제 DB 집계(풀이 저장 수·가입자 수)에 더해서 보여 줍니다.
 * 서비스 초창기 숫자가 0으로 보이지 않도록 하는 장치예요. (원하면 0으로)
 */
export const STATS_SEED_USERS = 12840;
export const STATS_SEED_READINGS = 48215;

/** 사업자 정보(푸터·이용약관 표시용). 실제 값으로 채워 주세요. */
export const BUSINESS_INFO = {
  name: read(process.env.NEXT_PUBLIC_BUSINESS_NAME) || "리우네계절 사진관",
  owner: read(process.env.NEXT_PUBLIC_BUSINESS_OWNER) || "문무아",
  number: read(process.env.NEXT_PUBLIC_BUSINESS_NUMBER) || "사업자등록번호 준비 중",
  mailOrder: read(process.env.NEXT_PUBLIC_BUSINESS_MAIL_ORDER) || "통신판매업 신고 준비 중",
  address:
    read(process.env.NEXT_PUBLIC_BUSINESS_ADDRESS) ||
    "경기도 성남시 수정구 수정로 95 1층",
  contact: read(process.env.NEXT_PUBLIC_CONTACT_EMAIL) || "문의: 앱 채팅으로 연락 주세요",
};

/** Supabase URL·anon key 가 모두 있을 때만 로그인/저장 기능을 켭니다. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** 카카오 OIDC 로그인이 준비되었는지(서버 키 포함). */
export const isKakaoLoginReady = Boolean(
  isSupabaseConfigured && KAKAO_REST_API_KEY && KAKAO_CLIENT_SECRET,
);

/** 카카오 로그인 안내 문구에서 사용하는 상태 메시지. */
export const SUPABASE_SETUP_HINT =
  "카카오 로그인과 사주 저장 기능은 Supabase 연결 후 사용할 수 있어요. " +
  "지금은 사주 풀이를 그대로 무료로 보실 수 있습니다.";
