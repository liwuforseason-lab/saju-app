import type { TimeOption } from "@/lib/saju/types";

/**
 * 폼에 표시하는 12시간(시주) 라벨.
 * 엔진의 ZHI_HOUR_LABEL 과 같은 값이며, 폼 화면은 엔진(만세력 라이브러리)을
 * 미리 내려받지 않도록 이 표를 사용합니다. 값이 바뀌면 엔진도 함께 맞춰 주세요.
 */
export const TIME_OPTIONS: TimeOption[] = [
  { index: 0, label: "자시", hanja: "子", range: "23~01시" },
  { index: 1, label: "축시", hanja: "丑", range: "01~03시" },
  { index: 2, label: "인시", hanja: "寅", range: "03~05시" },
  { index: 3, label: "묘시", hanja: "卯", range: "05~07시" },
  { index: 4, label: "진시", hanja: "辰", range: "07~09시" },
  { index: 5, label: "사시", hanja: "巳", range: "09~11시" },
  { index: 6, label: "오시", hanja: "午", range: "11~13시" },
  { index: 7, label: "미시", hanja: "未", range: "13~15시" },
  { index: 8, label: "신시", hanja: "申", range: "15~17시" },
  { index: 9, label: "유시", hanja: "酉", range: "17~19시" },
  { index: 10, label: "술시", hanja: "戌", range: "19~21시" },
  { index: 11, label: "해시", hanja: "亥", range: "21~23시" },
];
