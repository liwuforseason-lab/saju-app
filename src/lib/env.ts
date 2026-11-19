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

export const COUPANG_PARTNER_ID =
  read(process.env.NEXT_PUBLIC_COUPANG_PARTNER_ID) || "AF6829761";

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
