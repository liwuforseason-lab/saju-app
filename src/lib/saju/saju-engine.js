/*!
 * saju-engine.js — 만세력 기반 사주 계산 엔진
 * ------------------------------------------------------------------
 * 의존 라이브러리 (모두 MIT, 브라우저에서 오프라인 동작)
 *   - js/lunar.js                     : lunar-javascript 1.7.8 (절기·60갑자·사주팔자)
 *   - js/korean-lunar-calendar.min.js : 한국천문연구원(KARI) 기준 음양력 변환
 *
 * 설계 원칙
 *   1) 음력 입력은 반드시 '한국 음력'으로 양력 변환한 뒤 사주를 계산한다.
 *   2) 년주·월주는 절기(입춘·경칩 등) 기준, 일주는 자정 기준(00:00)으로 바뀐다.
 *   3) 결과는 입력값에 대해 항상 동일하다(시드 기반) — 공유 링크 재현성 확보.
 * ------------------------------------------------------------------
 */
import LunarLib from './lunar.js';
import KoreanLunarCalendar from './korean-lunar-calendar.min.js';

/*
 * 만세력 라이브러리(lunar.js, korean-lunar-calendar)를 이 엔진 전용 스코프에만
 * 주입합니다. window/globalThis 를 오염시키지 않아 브라우저·서버 어디서든 동작합니다.
 */
const SAJU_SCOPE = Object.assign({}, LunarLib, { KoreanLunarCalendar: KoreanLunarCalendar });

(function (global) {
  'use strict';

  /* ================================================================
   * 0. 기본 상수
   * ================================================================ */
  var GAN = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
  var GAN_HANJA = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var GAN_ROMAJA = ['Gap', 'Eul', 'Byeong', 'Jeong', 'Mu', 'Gi', 'Gyeong', 'Sin', 'Im', 'Gye'];
  var ZHI = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
  var ZHI_HANJA = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var ZHI_ANIMAL = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];
  var ZHI_HOUR_LABEL = ['23~01시', '01~03시', '03~05시', '05~07시', '07~09시', '09~11시',
    '11~13시', '13~15시', '15~17시', '17~19시', '19~21시', '21~23시'];
  var MONTH_ZHI = ['인', '묘', '진', '사', '오', '미', '신', '유', '술', '해', '자', '축']; // 1월(입춘)~12월

  var GAN_ELEM = ['목', '목', '화', '화', '토', '토', '금', '금', '수', '수'];
  var GAN_YANG = [true, false, true, false, true, false, true, false, true, false];
  var ZHI_ELEM = ['수', '토', '목', '목', '토', '화', '화', '토', '금', '금', '토', '수'];
  var ZHI_YANG = [true, false, true, false, true, false, true, false, true, false, true, false];
  // 지지 본기(本氣) 천간 — 십신 계산용
  var ZHI_MAIN_GAN = ['계', '기', '갑', '을', '무', '병', '정', '기', '경', '신', '무', '임'];

  var ELEMS = ['목', '화', '토', '금', '수'];

  var ELEM_INFO = {
    목: {
      hanja: '木', color: '#3F9463', soft: '#DDEEE1', icon: '🌿',
      keyword: '성장 · 시작 · 기획',
      nature: '뻗어 나가는 나무의 기운',
      lack: '시작하는 힘과 기획력이 조금 아쉬워요. 새로운 일을 벌일 때 첫걸음이 무겁게 느껴질 수 있어요.',
      excess: '추진력이 넘쳐 주변을 밀어붙이기 쉬워요. 속도를 한 번씩 늦추면 훨씬 부드러워져요.'
    },
    화: {
      hanja: '火', color: '#DD5A46', soft: '#FADFD9', icon: '🔥',
      keyword: '열정 · 표현 · 관계',
      nature: '밝게 타오르는 불의 기운',
      lack: '감정을 드러내는 일이 적어 무기력하게 보일 수 있어요. 좋아하는 마음을 조금만 표현해 보세요.',
      excess: '에너지가 앞서 감정 기복이 생기기 쉬워요. 잠깐의 휴식이 오히려 속도를 살려줘요.'
    },
    토: {
      hanja: '土', color: '#C08F35', soft: '#F5E8CC', icon: '⛰️',
      keyword: '안정 · 신뢰 · 중심',
      nature: '모든 것을 품는 흙의 기운',
      lack: '중심을 잡아주는 안정감이 약해요. 생활 리듬과 공간을 정돈하면 마음이 훨씬 단단해져요.',
      excess: '안전한 쪽만 고르다 기회를 놓치기 쉬워요. 작은 변화부터 시도해 보세요.'
    },
    금: {
      hanja: '金', color: '#7C849C', soft: '#E4E7EE', icon: '⚔️',
      keyword: '결단 · 정리 · 완성',
      nature: '단단하게 벼려진 쇠의 기운',
      lack: '끊고 정리하는 힘이 약해 미련이 오래 남아요. 물건을 비우고 일정을 정리해 보세요.',
      excess: '기준이 또렷해 스스로에게도 엄격해져요. 80점에서 멈추는 연습이 필요해요.'
    },
    수: {
      hanja: '水', color: '#3C6BA8', soft: '#DCE7F5', icon: '🌊',
      keyword: '지혜 · 유연 · 흐름',
      nature: '낮은 곳을 채우는 물의 기운',
      lack: '쉬어가는 힘이 부족해 금방 지칠 수 있어요. 물을 자주 마시고 잠을 넉넉히 챙겨 주세요.',
      excess: '생각이 많아 실행이 늦어지기 쉬워요. 오늘 할 일 하나만 정해 바로 시작해 보세요.'
    }
  };

  // 상생(生) / 상극(剋)
  var GENERATES = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' };
  var CONTROLS = { 목: '토', 토: '수', 수: '화', 화: '금', 금: '목' };

  var SIPSIN_GROUP = {
    비견: '비겁', 겁재: '비겁',
    식신: '식상', 상관: '식상',
    편재: '재성', 정재: '재성',
    편관: '관성', 정관: '관성',
    편인: '인성', 정인: '인성'
  };

  var SIPSIN_DESC = {
    비견: '나와 같은 기운 · 동료와 함께하는 힘',
    겁재: '경쟁과 추진의 기운 · 물러서지 않는 힘',
    식신: '표현과 여유의 기운 · 먹을 복과 재능',
    상관: '재치와 변화의 기운 · 틀을 깨는 재능',
    편재: '유동하는 재물 · 사업 수완과 활동력',
    정재: '차곡차곡 쌓이는 재물 · 성실한 관리',
    편관: '압박을 이겨내는 힘 · 카리스마와 승부욕',
    정관: '질서와 책임 · 안정된 자리와 명예',
    편인: '직관과 아이디어 · 남다른 시선',
    정인: '배움과 보호 · 문서와 인덕'
  };

  /* ================================================================
   * 1. 일간(日干) 10종 캐릭터
   * ================================================================ */
  var ILGAN_INFO = {
    갑: {
      title: '하늘로 뻗는 큰 나무', emoji: '🌳', keyword: ['리더십', '성장', '정직'],
      oneLine: '한번 정한 방향으로 곧게 자라는 사람',
      desc: '갑목은 곧은 줄기처럼 위로 자라는 나무의 기운이에요. 목표가 생기면 흔들리지 않고 밀고 나가는 힘이 있고, 주변에서 자연스럽게 중심을 잡아 줘요. 겉은 담담해 보여도 안에는 "더 크게 자라야 한다"는 야심이 조용히 타오르고 있어요.',
      strong: ['목표를 세우면 끝까지 가는 추진력', '사람을 끌어당기는 자연스러운 리더십', '원칙과 약속을 지키는 신뢰감'],
      weak: ['도움을 청하기보다 혼자 짊어지기 쉬움', '융통성 없이 보일 때가 있음', '인정 욕구가 커서 서운함을 오래 곱씹음'],
      money: '크게 벌고 크게 쓰는 편이에요. 계획표보다 "시스템"을 만들 때 재물이 쌓여요.',
      love: '한 사람을 오래 바라보는 스타일. 다만 표현이 적어 상대가 마음을 못 읽을 수 있어요.',
      work: '기획·교육·브랜딩처럼 "키우는 일"에서 강해요. 조직을 세우는 자리에 잘 맞아요.'
    },
    을: {
      title: '바람에 유연한 넝쿨', emoji: '🌿', keyword: ['적응력', '감성', '관계'],
      oneLine: '어디서든 자기 자리를 찾아 꽃피우는 사람',
      desc: '을목은 바위틈에서도 길을 찾아 뻗는 넝쿨의 기운이에요. 상황을 빠르게 읽고 부드럽게 적응하는 능력이 뛰어나요. 강하게 밀어붙이기보다 상대의 마음을 읽어 움직이는 쪽이 훨씬 자연스러워요.',
      strong: ['분위기와 사람을 읽는 섬세한 감각', '어떤 환경에서도 살아남는 적응력', '부드럽지만 끈질긴 생명력'],
      weak: ['남의 부탁을 잘 거절하지 못함', '속마음을 늦게 꺼내 오해를 사기도', '결정의 순간에 망설임이 길어짐'],
      money: '작은 수입을 꾸준히 모으는 타입. 인연을 통해 들어오는 재물이 많아요.',
      love: '상대에게 맞춰주는 다정함이 무기. 다만 참기만 하면 서운함이 쌓여요.',
      work: '디자인·상담·서비스·마케팅처럼 감각과 관계가 중요한 일에 강해요.'
    },
    병: {
      title: '세상을 밝히는 태양', emoji: '☀️', keyword: ['열정', '표현', '리더'],
      oneLine: '있으면 주변이 환해지는 사람',
      desc: '병화는 하늘 높이 뜬 태양의 기운이에요. 감정도 에너지도 크고, 숨기는 걸 못 해요. 사람들 앞에 서면 자연스럽게 분위기를 끌고 가고, "재미있게 해야 한다"는 본능이 있어요.',
      strong: ['압도적인 존재감과 분위기 메이커', '솔직하고 시원한 화법', '큰 그림을 보는 스케일'],
      weak: ['감정 기복이 크고 금방 식기도', '디테일을 놓치기 쉬움', '인정받지 못하면 급격히 지침'],
      money: '크게 쓰고 크게 버는 스타일. 통장을 나눠 두면 새는 돈이 확 줄어요.',
      love: '불같이 시작해 뜨겁게 타는 연애. 상대가 무기력해 보이면 답답해해요.',
      work: '방송·영업·강의·콘텐츠처럼 사람 앞에 서는 일이 천직이에요.'
    },
    정: {
      title: '밤을 밝히는 촛불', emoji: '🕯️', keyword: ['섬세함', '집중', '따뜻함'],
      oneLine: '조용히 오래 빛나는 사람',
      desc: '정화는 어두운 방을 밝히는 촛불의 기운이에요. 태양처럼 크지는 않지만 한 곳을 집중해서 비추는 힘이 있어요. 마음이 따뜻하고 눈치가 빨라, 말하지 않아도 분위기를 먼저 알아차려요.',
      strong: ['한 가지에 깊게 몰입하는 집중력', '상대의 감정을 읽는 섬세함', '조용한 헌신과 따뜻함'],
      weak: ['생각이 많아 혼자 앓는 일이 많음', '감정 소모가 커서 쉽게 지침', '완벽하지 않으면 시작을 미룸'],
      money: '전문성으로 버는 재물이 잘 맞아요. 작은 지출 관리에 강해요.',
      love: '한 사람에게 깊게 빠지는 타입. 표현을 조금만 더 하면 관계가 훨씬 편안해져요.',
      work: '연구·기획·글쓰기·상담처럼 집중과 공감이 필요한 일에 강해요.'
    },
    무: {
      title: '든든한 큰 산', emoji: '⛰️', keyword: ['안정', '신뢰', '포용'],
      oneLine: '곁에 있으면 마음이 놓이는 사람',
      desc: '무토는 우뚝 솟은 큰 산의 기운이에요. 쉽게 흔들리지 않고, 사람과 일을 품어내는 넓은 그릇이 있어요. 말은 적어도 한번 한 약속은 반드시 지키는 신뢰의 사람이에요.',
      strong: ['흔들리지 않는 중심과 안정감', '사람을 품는 넓은 포용력', '끝까지 책임지는 신뢰감'],
      weak: ['변화를 받아들이는 속도가 느림', '속마음을 잘 안 보여줘 답답해 보임', '고집이 세다는 말을 듣기도'],
      money: '부동산·저축처럼 묵직한 재테크가 잘 맞아요. 급하게 굴리면 오히려 손해.',
      love: '표현은 서툴지만 오래 곁을 지키는 타입. 상대에게 마음을 말로 들려주세요.',
      work: '관리·운영·부동산·제조처럼 기반을 다지는 일에 강해요.'
    },
    기: {
      title: '싹을 품은 기름진 밭', emoji: '🌾', keyword: ['포용', '실속', '배려'],
      oneLine: '조용히 사람을 키워내는 사람',
      desc: '기토는 씨앗을 품고 싹을 틔우는 밭의 기운이에요. 화려하게 드러나진 않지만 실속 있고 세심해요. 주변 사람을 하나하나 챙기고, 일의 자잘한 구석을 놓치지 않아요.',
      strong: ['세심한 배려와 실무 감각', '사람과 정보를 연결하는 능력', '겉으로 드러내지 않는 끈기'],
      weak: ['속을 잘 드러내지 않아 오해받기 쉬움', '걱정이 많아 결정이 느림', '남의 일에 감정 이입을 과하게'],
      money: '생활 속 재테크와 소소한 부업에서 강해요. 정보를 모아 실속을 챙겨요.',
      love: '챙겨주는 다정함으로 사랑을 표현해요. 받는 것도 연습해 보세요.',
      work: '총무·회계·유통·교육처럼 관리와 조율이 필요한 일에 강해요.'
    },
    경: {
      title: '단단한 바위와 칼', emoji: '🗡️', keyword: ['결단', '추진', '정의'],
      oneLine: '할 말은 하고 할 일은 해내는 사람',
      desc: '경금은 벼려지지 않은 원석과 칼의 기운이에요. 결단이 빠르고, 아니면 아니라고 말할 줄 알아요. 추진력이 강해 어려운 일도 밀어붙여 끝내는 힘이 있어요.',
      strong: ['빠른 결단과 강한 실행력', '불의를 참지 못하는 정의감', '위기에서 더 강해지는 배짱'],
      weak: ['말이 직설적이라 상처를 주기도', '참는 힘이 약해 관계가 끊기기도', '융통성 부족으로 손해를 보기도'],
      money: '큰 승부를 거는 재물운. 다만 몰빵은 금물이에요.',
      love: '직진하는 스타일. 상대의 속도를 살짝 맞춰 주면 오래가요.',
      work: '영업·법조·스포츠·엔지니어링처럼 승부와 결단이 필요한 일에 강해요.'
    },
    신: {
      title: '빛나는 보석', emoji: '💎', keyword: ['세련', '완벽', '감각'],
      oneLine: '작은 것도 놓치지 않는 섬세한 사람',
      desc: '신금은 세공된 보석의 기운이에요. 미적 감각과 완벽주의가 함께 있어요. 남들이 그냥 지나치는 디테일을 알아채고, 자기만의 기준으로 다듬어 내는 힘이 있어요.',
      strong: ['뛰어난 미적 감각과 세련됨', '높은 기준과 꼼꼼한 완성도', '섬세한 관찰력'],
      weak: ['스스로에게 너무 엄격함', '비판에 예민하게 반응', '시작 전 고민이 길어짐'],
      money: '전문직·프리미엄 시장에서 재물이 잘 붙어요. 디테일이 곧 돈이에요.',
      love: '쉽게 마음을 열지 않지만 한번 열면 깊어요. 기준을 조금 낮추면 편해져요.',
      work: '디자인·뷰티·의료·금융·편집처럼 정교함이 필요한 일에 강해요.'
    },
    임: {
      title: '흐르는 큰 바다', emoji: '🌊', keyword: ['지혜', '포용', '스케일'],
      oneLine: '멀리 보고 크게 담아내는 사람',
      desc: '임수는 깊고 넓은 바다의 기운이에요. 생각의 범위가 넓고 모든 것을 받아들이는 포용력이 있어요. 지식과 정보를 흡수하는 속도가 빠르고, 큰 흐름을 읽는 눈이 있어요.',
      strong: ['큰 흐름을 읽는 지혜', '사람과 상황을 담아내는 포용력', '빠른 학습과 유연한 사고'],
      weak: ['생각이 많아 실행이 늦어짐', '속을 알 수 없다는 말을 자주 들음', '한곳에 정착하기 어려워함'],
      money: '흐르는 재물이 많아요. 들어오는 만큼 관리 시스템을 만들면 크게 쌓여요.',
      love: '자유로움을 중요하게 여겨요. 구속보다 신뢰를 원해요.',
      work: '무역·물류·여행·기획·데이터처럼 흐름을 다루는 일에 강해요.'
    },
    계: {
      title: '촉촉한 이슬비', emoji: '💧', keyword: ['직관', '섬세', '유연'],
      oneLine: '말없이 스며들어 마음을 적시는 사람',
      desc: '계수는 조용히 내리는 이슬비의 기운이에요. 겉으로는 소박해 보이지만 직관이 뛰어나고, 사람의 마음을 스며들 듯 읽어요. 부드러운 방식으로 원하는 것을 이뤄내는 지혜가 있어요.',
      strong: ['뛰어난 직관과 눈치', '조용히 스며드는 친화력', '부드럽게 밀어붙이는 끈기'],
      weak: ['감정을 속으로 삭이는 편', '걱정과 불안이 많은 편', '결정을 미루다 기회를 놓치기도'],
      money: '소소하지만 꾸준한 재물이에요. 감으로 하는 투자는 피하는 게 좋아요.',
      love: '섬세하게 챙겨주는 스타일. 서운한 건 바로 말하는 연습이 필요해요.',
      work: '상담·치유·교육·기획·서비스처럼 섬세함이 무기인 일에 강해요.'
    }
  };

  /* ================================================================
   * 2. 십신 · 세운 문구
   * ================================================================ */
  var YEAR_FORTUNE = {
    비견: '내 힘으로 밀고 나가는 해예요. 동료·친구와 함께하면 두 배로 커지지만, 고집이 세지면 마찰도 생겨요.',
    겁재: '경쟁이 붙는 해예요. 승부욕이 살아나지만 지출도 함께 늘어요. 큰 돈은 한 번 더 확인하세요.',
    식신: '표현과 여유가 살아나는 해예요. 새로 시작한 취미나 콘텐츠가 수입으로 이어질 수 있어요.',
    상관: '재능이 밖으로 터지는 해예요. 말과 행동이 앞서 나가기 쉬우니 한 박자 쉬어가면 좋아요.',
    편재: '활동 반경이 넓어지고 돈이 도는 해예요. 부업·사업·투자 모두 기회가 보여요. 다만 새는 돈도 커져요.',
    정재: '착실하게 쌓이는 해예요. 급하게 벌기보다 꾸준히 모으면 확실히 남아요.',
    편관: '압박과 책임이 커지는 해예요. 힘들지만 그만큼 실력이 붙고 존재감이 세져요.',
    정관: '자리가 잡히는 해예요. 승진·합격·계약처럼 "공식적인 일"이 잘 풀려요.',
    편인: '새로운 공부와 아이디어가 솟는 해예요. 혼자만의 시간이 약이 돼요.',
    정인: '도움과 인연이 들어오는 해예요. 배움·자격·문서운이 좋아요. 몸과 마음의 충전이 필요한 해이기도 해요.'
  };

  var SIPSIN_TODAY = {
    비견: { score: 4, text: '내 페이스가 살아나는 날. 혼자 결정하기보다 같이 움직이면 더 좋아요.' },
    겁재: { score: 1, text: '경쟁과 지출이 붙는 날. 충동구매와 말다툼만 조심하세요.' },
    식신: { score: 6, text: '입과 말이 즐거운 날. 맛있는 걸 먹고 아이디어를 적어 두면 복이 돼요.' },
    상관: { score: 2, text: '말이 튀기 쉬운 날. 하고 싶은 말이 있어도 한 번만 더 생각해 보세요.' },
    편재: { score: 5, text: '돈과 사람이 도는 날. 부업·영업·연락에 좋은 흐름이에요.' },
    정재: { score: 5, text: '착실하게 쌓기 좋은 날. 미뤄둔 정산과 저축을 처리하기 좋아요.' },
    편관: { score: 2, text: '압박이 들어오는 날. 중요한 결단은 내일로 미루는 편이 안전해요.' },
    정관: { score: 4, text: '공식적인 일이 잘 풀리는 날. 면접·계약·보고에 좋아요.' },
    편인: { score: 3, text: '생각이 많은 날. 공부와 정리에 집중하면 성과가 남아요.' },
    정인: { score: 5, text: '도움과 정보가 들어오는 날. 배움과 문서에 투자해 보세요.' }
  };

  /* ================================================================
   * 3. 개운템 (쿠팡 파트너스 연결)
   * ================================================================ */
  var COUPANG_PARTNER_ID = 'AF6829761';
  var COUPANG_LINK_MAP = {}; // README 참고: 여기에 link.coupang.com 단축 링크를 넣으면 그 링크를 우선 사용합니다.

  var LUCKY_ITEMS = {
    목: [
      { name: '초록 잎 인테리어 화분', desc: '공간에 자라는 기운을 더해 시작의 흐름을 살려요.', query: '관엽식물 화분 세트', emoji: '🪴' },
      { name: '천연 원목 액세서리', desc: '나무 소재는 목 기운을 가장 직접적으로 보태요.', query: '원목 팔찌', emoji: '🪵' },
      { name: '사운드 우드 미니 선반', desc: '책상 위 성장 공간을 정리해 집중을 도와요.', query: '미니 원목 선반', emoji: '🛠️' }
    ],
    화: [
      { name: '소이 캔들 · 향초', desc: '불의 기운을 불러와 관계와 표현을 밝혀요.', query: '소이캔들 향초', emoji: '🕯️' },
      { name: '코랄 포인트 소품', desc: '화 기운의 색을 곁에 두면 활력이 올라가요.', query: '코랄 미니멀 인테리어 소품', emoji: '🧣' },
      { name: '무드 조명 스탠드', desc: '따뜻한 빛은 기분과 관계운을 함께 깨워요.', query: '무드등 스탠드', emoji: '💡' }
    ],
    토: [
      { name: '도자기 화기 · 그릇', desc: '흙으로 빚은 그릇은 토 기운을 담는 대표 아이템이에요.', query: '도자기 화분 그릇', emoji: '🏺' },
      { name: '황토 · 세라믹 소품', desc: '중심을 잡아주는 안정의 기운을 더해요.', query: '세라믹 오브제', emoji: '🪨' },
      { name: '브라운 가죽 카드지갑', desc: '재물을 담는 물건을 토 기운으로 바꿔 보세요.', query: '가죽 카드지갑', emoji: '👛' }
    ],
    금: [
      { name: '실버 · 화이트골드 액세서리', desc: '금 기운은 결단과 정리를 도와요.', query: '실버 목걸이', emoji: '💍' },
      { name: '메탈 손목시계', desc: '시간을 다스리는 물건은 금 기운과 잘 맞아요.', query: '메탈 손목시계', emoji: '⌚' },
      { name: '화이트 세라믹 정리 트레이', desc: '공간을 비우면 머리도 함께 정리돼요.', query: '화이트 정리 트레이', emoji: '🗂️' }
    ],
    수: [
      { name: '유리 화병 · 유리컵', desc: '맑은 물의 기운을 담아 흐름을 열어요.', query: '유리 화병', emoji: '🫙' },
      { name: '미니 어항 · 수경 식물', desc: '물과 생명이 함께 있는 공간은 수 기운의 정석이에요.', query: '수경 식물 유리병', emoji: '🐟' },
      { name: '네이비 패브릭 소품', desc: '깊은 파랑은 생각을 가라앉히고 직관을 살려요.', query: '네이비 쿠션 커버', emoji: '🛋️' }
    ]
  };

  var LUCKY_COLOR = {
    목: { name: '연두 · 그린', hex: '#8FC59A' },
    화: { name: '코랄 · 레드', hex: '#EE8B7A' },
    토: { name: '베이지 · 브라운', hex: '#D8BE93' },
    금: { name: '화이트 · 실버', hex: '#D6DAE3' },
    수: { name: '네이비 · 블루', hex: '#8FB2DC' }
  };

  /* ================================================================
   * 4. 유틸
   * ================================================================ */
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function hashSeed(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

  // 라이브러리는 한자(甲子)로 값을 돌려주므로 한글·한자 모두 인식한다.
  function ganIndex(ch) {
    var i = GAN.indexOf(ch);
    return i > -1 ? i : GAN_HANJA.indexOf(ch);
  }
  function zhiIndex(ch) {
    var i = ZHI.indexOf(ch);
    return i > -1 ? i : ZHI_HANJA.indexOf(ch);
  }

  function sipsinOf(dayGanIdx, otherGanIdx) {
    var de = GAN_ELEM[dayGanIdx], oe = GAN_ELEM[otherGanIdx];
    var same = GAN_YANG[dayGanIdx] === GAN_YANG[otherGanIdx];
    if (de === oe) return same ? '비견' : '겁재';
    if (GENERATES[de] === oe) return same ? '식신' : '상관';
    if (CONTROLS[de] === oe) return same ? '편재' : '정재';
    if (CONTROLS[oe] === de) return same ? '편관' : '정관';
    if (GENERATES[oe] === de) return same ? '편인' : '정인';
    return '비견';
  }

  var YUKHAP = { 자: '축', 축: '자', 인: '해', 해: '인', 묘: '술', 술: '묘', 진: '유', 유: '진', 사: '신', 신: '사', 오: '미', 미: '오' };
  var CHUNG = { 자: '오', 오: '자', 축: '미', 미: '축', 인: '신', 신: '인', 묘: '유', 유: '묘', 진: '술', 술: '진', 사: '해', 해: '사' };
  var WONJIN = { 자: '미', 미: '자', 축: '오', 오: '축', 인: '유', 유: '인', 묘: '신', 신: '묘', 진: '해', 해: '진', 사: '술', 술: '사' };
  var SAMHAP = [
    { zhi: ['인', '오', '술'], elem: '화' },
    { zhi: ['해', '묘', '미'], elem: '목' },
    { zhi: ['신', '자', '진'], elem: '수' },
    { zhi: ['사', '유', '축'], elem: '금' }
  ];

  function zhiRelation(a, b) {
    if (a === b) return { type: 'same', score: 3, text: '같은 지지 — 취향과 리듬이 닮은 사이' };
    if (YUKHAP[a] === b) return { type: 'yukhap', score: 12, text: '육합(六合) — 서로를 끌어당기는 인연' };
    if (CHUNG[a] === b) return { type: 'chung', score: -9, text: '충(沖) — 부딪히지만 자극이 되는 관계' };
    if (WONJIN[a] === b) return { type: 'wonjin', score: -6, text: '원진(怨嗔) — 이유 없이 서운해지기 쉬운 사이' };
    for (var i = 0; i < SAMHAP.length; i++) {
      if (SAMHAP[i].zhi.indexOf(a) > -1 && SAMHAP[i].zhi.indexOf(b) > -1) {
        return { type: 'samhap', score: 9, text: '삼합(三合) — 같은 방향을 보는 사이' };
      }
    }
    return { type: 'none', score: 0, text: '특별한 합·충 없이 담백한 사이' };
  }

  /* ================================================================
   * 5. 사주 계산
   * ================================================================ */
  var TIME_OPTIONS = [];
  for (var ti = 0; ti < 12; ti++) {
    TIME_OPTIONS.push({ index: ti, label: ZHI[ti] + '시', hanja: ZHI_HANJA[ti], range: ZHI_HOUR_LABEL[ti] });
  }
  // 대표 시각(지지 시간대의 중앙값). 자시는 자정 기준(00:30).
  var TIME_MID_HOUR = [0.5, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

  function validateSolar(y, m, d) {
    if (!(y >= 1900 && y <= 2035)) return false;
    if (!(m >= 1 && m <= 12)) return false;
    var dim = new Date(y, m, 0).getDate();
    return d >= 1 && d <= dim;
  }

  function computeSaju(input) {
    if (!global.Solar || !global.KoreanLunarCalendar) {
      throw new Error('만세력 라이브러리를 불러오지 못했어요. 잠시 후 새로고침해 주세요.');
    }
    var solarY = input.year, solarM = input.month, solarD = input.day;
    var lunarInfo = null;

    if (input.calendar === 'lunar') {
      if (!validateSolar(input.year, 1, 1) || input.year < 1900 || input.year > 2035) {
        throw new Error('음력은 1900년부터 2035년까지 계산할 수 있어요.');
      }
      var kc = new global.KoreanLunarCalendar();
      var ok = kc.setLunarDate(input.year, input.month, input.day, !!input.leap);
      if (!ok) {
        throw new Error('입력한 음력 날짜가 달력에 없어요. 윤달 여부를 다시 확인해 주세요.');
      }
      var sol = kc.getSolarCalendar();
      solarY = sol.year; solarM = sol.month; solarD = sol.day;
      lunarInfo = { year: input.year, month: input.month, day: input.day, leap: !!input.leap };
    } else {
      if (!validateSolar(input.year, input.month, input.day)) {
        throw new Error('생년월일을 다시 확인해 주세요. (1900~2035년)');
      }
      var kc2 = new global.KoreanLunarCalendar();
      if (kc2.setSolarDate(input.year, input.month, input.day)) {
        var l = kc2.getLunarCalendar();
        lunarInfo = { year: l.year, month: l.month, day: l.day, leap: !!l.intercalation };
      }
    }

    var hasTime = typeof input.timeIndex === 'number' && input.timeIndex >= 0 && input.timeIndex <= 11;
    var hour = hasTime ? TIME_MID_HOUR[input.timeIndex] : 12;

    var solar = global.Solar.fromYmdHms(solarY, solarM, solarD, Math.floor(hour), Math.round((hour % 1) * 60), 0);
    var lunarObj = solar.getLunar();
    var ec = lunarObj.getEightChar();
    ec.setSect(2); // 일주는 00:00 기준으로 바뀐다.

    var raw = {
      year: ec.getYear(),
      month: ec.getMonth(),
      day: ec.getDay(),
      time: hasTime ? ec.getTime() : null
    };

    function makePillar(gz, key, label) {
      if (!gz) return null;
      var gi = ganIndex(gz.charAt(0)), zi = zhiIndex(gz.charAt(1));
      var g = GAN[gi], z = ZHI[zi];
      return {
        key: key, label: label,
        gan: g, zhi: z,
        ganHanja: GAN_HANJA[gi], zhiHanja: ZHI_HANJA[zi],
        ganRomaja: GAN_ROMAJA[gi],
        ganElem: GAN_ELEM[gi], zhiElem: ZHI_ELEM[zi],
        ganYang: GAN_YANG[gi], zhiYang: ZHI_YANG[zi],
        ganSipsin: key === 'day' ? '일간(나)' : sipsinOf(ganIndex(raw.day.charAt(0)), gi),
        zhiSipsin: sipsinOf(ganIndex(raw.day.charAt(0)), ganIndex(ZHI_MAIN_GAN[zi])),
        animal: ZHI_ANIMAL[zi]
      };
    }

    var pillars = {
      year: makePillar(raw.year, 'year', '년주'),
      month: makePillar(raw.month, 'month', '월주'),
      day: makePillar(raw.day, 'day', '일주'),
      hour: raw.time ? makePillar(raw.time, 'time', '시주') : null
    };

    var dayGan = pillars.day.gan;
    var dayZhi = pillars.day.zhi;
    var dayGanIdx = ganIndex(dayGan);
    var dayZhiIdx = zhiIndex(dayZhi);

    // ---- 오행 집계 (천간 4 + 지지 4)
    var counts = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
    var yin = 0, yang = 0;
    var letters = [];
    ['year', 'month', 'day', 'hour'].forEach(function (k) {
      var p = pillars[k];
      if (!p) return;
      counts[p.ganElem] += 1;
      counts[p.zhiElem] += 1;
      letters.push({ gan: p.gan, zhi: p.zhi });
      if (p.ganYang) yang++; else yin++;
      if (p.zhiYang) yang++; else yin++;
    });
    var total = yin + yang;
    var percent = {};
    ELEMS.forEach(function (e) { percent[e] = Math.round((counts[e] / total) * 100); });
    // 반올림 오차 보정
    var sumPct = ELEMS.reduce(function (a, e) { return a + percent[e]; }, 0);
    if (sumPct !== 100 && total > 0) {
      var maxE = ELEMS.slice().sort(function (a, b) { return counts[b] - counts[a]; })[0];
      percent[maxE] += 100 - sumPct;
    }

    var sortedElems = ELEMS.slice().sort(function (a, b) {
      if (counts[b] !== counts[a]) return counts[b] - counts[a];
      return ELEMS.indexOf(a) - ELEMS.indexOf(b);
    });
    var strongest = sortedElems[0];
    var weakest = sortedElems[sortedElems.length - 1];
    var missing = ELEMS.filter(function (e) { return counts[e] === 0; });

    // ---- 십신 분포 (천간 4 + 지지 본기 4)
    var sipsinCounts = {};
    Object.keys(SIPSIN_GROUP).forEach(function (k) { sipsinCounts[k] = 0; });
    ['year', 'month', 'hour'].forEach(function (k) {
      var p = pillars[k]; if (!p) return;
      sipsinCounts[p.ganSipsin] += 1;
      sipsinCounts[p.zhiSipsin] += 1;
    });
    sipsinCounts[pillars.day.zhiSipsin] += 1; // 일지는 본인 자리
    var groupCounts = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
    Object.keys(sipsinCounts).forEach(function (k) {
      groupCounts[SIPSIN_GROUP[k]] += sipsinCounts[k];
    });

    // ---- 신강/신약 (간이)
    var dayElem = GAN_ELEM[dayGanIdx];
    var supportElem2 = null;
    ELEMS.forEach(function (e) { if (GENERATES[e] === dayElem) supportElem2 = e; });
    var support = 0, drain = 0;
    ['year', 'month', 'day', 'hour'].forEach(function (k) {
      var p = pillars[k]; if (!p) return;
      var w = (k === 'month') ? 2.2 : 1;
      [p.ganElem, p.zhiElem].forEach(function (el, idx) {
        var ww = w * (idx === 1 ? 1.3 : 1);
        if (el === dayElem || el === supportElem2) support += ww; else drain += ww;
      });
    });
    var supportRatio = support / (support + drain);
    var strength = supportRatio >= 0.58 ? '신강' : (supportRatio <= 0.44 ? '신약' : '중화');
    var strengthText = {
      신강: '기운이 단단한 편이에요. 내 힘으로 밀고 나가는 대신, 에너지를 밖으로 쓰는 일(표현·나눔·일)에서 운이 열려요.',
      중화: '기운의 균형이 좋아요. 어떤 환경에도 무리 없이 적응하는 타입이에요.',
      신약: '주변의 도움과 환경이 힘이 되는 편이에요. 혼자 버티기보다 사람과 시스템을 활용하면 훨씬 편해져요.'
    }[strength];

    // ---- 일간 정보
    var ilgan = ILGAN_INFO[dayGan];

    // ---- 운세 점수
    var seedStr = [solarY, solarM, solarD, input.timeIndex, input.gender].join('-');
    var rnd = mulberry32(hashSeed(seedStr));
    var jitter = function () { return Math.round((rnd() - 0.5) * 6); };

    var spouseStar = input.gender === 'm' ? '재성' : '관성';
    var moneyScore = clamp(56 + groupCounts.재성 * 7 + groupCounts.식상 * 3
      - Math.max(0, groupCounts.비겁 - 2) * 4 + (strength === '중화' ? 4 : 0) + jitter(), 38, 96);
    var dohwa = ['자', '오', '묘', '유'].indexOf(dayZhi) > -1 ? 4 : 0; // 도화(桃花) 지지
    var loveScore = clamp(52 + groupCounts[spouseStar] * 8 + groupCounts.인성 * 2 + dohwa + jitter(), 36, 96);
    var workScore = clamp(54 + groupCounts.관성 * 7 + groupCounts.인성 * 4
      + (strength === '신강' ? 4 : 0) + jitter(), 38, 97);

    function band(s) {
      if (s >= 85) return { label: '매우 좋음', tone: 'up' };
      if (s >= 70) return { label: '좋음', tone: 'up' };
      if (s >= 55) return { label: '무난함', tone: 'mid' };
      return { label: '신경 쓸 때', tone: 'down' };
    }

    // ---- 세운 (2026 병오, 2027 정미)
    var years = [
      { year: 2026, gan: '병', zhi: '오' },
      { year: 2027, gan: '정', zhi: '미' }
    ].map(function (y) {
      var ss = sipsinOf(dayGanIdx, ganIndex(y.gan));
      var grp = SIPSIN_GROUP[ss];
      var zRel = zhiRelation(dayZhi, y.zhi);
      var score = clamp(62 + (zRel.score) + (grp === '재성' || grp === '관성' ? 6 : 0)
        + (grp === '비겁' ? -4 : 0) + (grp === '식상' ? 5 : 0) + (grp === '인성' ? 3 : 0), 45, 95);
      return {
        year: y.year,
        gan: y.gan, zhi: y.zhi,
        ganja: y.gan + y.zhi,
        ganjaHanja: GAN_HANJA[ganIndex(y.gan)] + ZHI_HANJA[zhiIndex(y.zhi)],
        animal: ZHI_ANIMAL[zhiIndex(y.zhi)],
        sipsin: ss,
        score: score,
        band: band(score),
        text: YEAR_FORTUNE[ss],
        zhiNote: zRel.text
      };
    });

    // ---- 오늘의 운세
    var today = null;
    try {
      var now = new Date();
      var tSolar = global.Solar.fromYmd(now.getFullYear(), now.getMonth() + 1, now.getDate());
      var tLunar = tSolar.getLunar();
      var tGz = tLunar.getDayInGanZhi();
      var tGanIdx = ganIndex(tGz.charAt(0));
      var tZhiK = ZHI[zhiIndex(tGz.charAt(1))];
      var tSs = sipsinOf(dayGanIdx, tGanIdx);
      var tRel = zhiRelation(dayZhi, tZhiK);
      var tBase = SIPSIN_TODAY[tSs].score; // 1~6
      var tScore = clamp(45 + tBase * 8 + tRel.score + Math.round((mulberry32(hashSeed(seedStr + tGz))() - 0.5) * 8), 30, 98);
      var luckyElem = ELEMS[(ELEMS.indexOf(GAN_ELEM[dayGanIdx]) + 1) % 5];
      today = {
        date: now.getFullYear() + '.' + pad2(now.getMonth() + 1) + '.' + pad2(now.getDate()),
        ganja: GAN[tGanIdx] + tZhiK,
        ganjaHanja: GAN_HANJA[tGanIdx] + ZHI_HANJA[zhiIndex(tZhiK)],
        sipsin: tSs,
        score: tScore,
        band: band(tScore),
        text: SIPSIN_TODAY[tSs].text,
        zhiText: (tRel.type === 'chung' || tRel.type === 'wonjin')
          ? '다만 오늘은 일지와 ' + tRel.text.split(' — ')[0] + ' 관계라 감정 기복을 조심하세요.'
          : (tRel.type === 'yukhap' || tRel.type === 'samhap')
            ? '일지와 ' + tRel.text.split(' — ')[0] + ' 관계라 사람과의 흐름이 좋아요.'
            : '일지와 부딪히는 기운 없이 무난하게 흘러가요.',
        lucky: {
          color: LUCKY_COLOR[luckyElem],
          number: (tGanIdx + zhiIndex(tZhiK) + dayGanIdx) % 9 + 1,
          hour: ZHI[((dayZhiIdx + 6) % 12)] + '시'
        }
      };
    } catch (e) {
      today = null;
    }

    // ---- 절기 정보
    var jieqi = null;
    try {
      var prev = lunarObj.getPrevJie();
      var next = lunarObj.getNextJie();
      if (prev && next) {
        jieqi = {
          prevName: prev.getName(), prevDate: prev.getSolar().toYmd(),
          nextName: next.getName(), nextDate: next.getSolar().toYmd()
        };
      }
    } catch (e) { jieqi = null; }

    // 태어난 날이 절입일이면 시각에 따라 년주·월주가 갈린다.
    var boundaryDay = false;
    if (jieqi) {
      var ymd = solarY + '-' + pad2(solarM) + '-' + pad2(solarD);
      boundaryDay = (jieqi.prevDate === ymd || jieqi.nextDate === ymd);
    }

    return {
      input: {
        name: (input.name || '').trim(),
        gender: input.gender || 'n',
        timeIndex: hasTime ? input.timeIndex : -1,
        calendar: input.calendar,
        leap: !!input.leap
      },
      solar: { year: solarY, month: solarM, day: solarD },
      lunar: lunarInfo,
      pillars: pillars,
      letters: letters,
      dayGan: dayGan, dayZhi: dayZhi,
      dayGanHanja: GAN_HANJA[dayGanIdx],
      dayZhiHanja: ZHI_HANJA[dayZhiIdx],
      animal: ZHI_ANIMAL[dayZhiIdx],
      ohaeng: {
        counts: counts, percent: percent, total: total,
        strongest: strongest, weakest: weakest, missing: missing,
        yin: yin, yang: yang
      },
      ilgan: ilgan,
      sipsinCounts: sipsinCounts,
      groupCounts: groupCounts,
      strength: strength,
      strengthRatio: supportRatio,
      strengthText: strengthText,
      hasTime: hasTime,
      fortune: {
        money: { score: moneyScore, band: band(moneyScore), text: moneyText(moneyScore, groupCounts, ilgan) },
        love: { score: loveScore, band: band(loveScore), text: loveText(loveScore, groupCounts, ilgan, spouseStar) },
        work: { score: workScore, band: band(workScore), text: workText(workScore, groupCounts, ilgan, strength) }
      },
      years: years,
      today: today,
      jieqi: jieqi,
      boundaryDay: boundaryDay
    };
  }

  function moneyText(score, g, ilgan) {
    var base = ilgan.money;
    if (score >= 80) return '재물의 문이 크게 열려 있어요. ' + base + ' 지금 흐름을 놓치지 말고 구체적인 계획 하나를 세워 보세요.';
    if (score >= 65) return '꾸준히 모이는 재물운이에요. ' + base;
    if (score >= 50) return '들어오는 만큼 나가는 흐름이에요. ' + base;
    return '새는 돈을 막는 게 먼저예요. ' + base + ' 구독·소액결제를 한 번 정리해 보세요.';
  }

  function loveText(score, g, ilgan, spouseStar) {
    var base = ilgan.love;
    var starTxt = spouseStar === '재성' ? '인연을 직접 찾아 나서는 쪽이에요.' : '좋은 인연이 자연스럽게 다가오는 편이에요.';
    if (score >= 80) return '인연의 기운이 강한 때예요. ' + starTxt + ' ' + base;
    if (score >= 65) return '관계가 부드럽게 흐르는 편이에요. ' + base;
    if (score >= 50) return '마음을 정리할 시간이 필요해요. ' + base;
    return '서운함을 쌓아두면 관계가 멀어져요. ' + base + ' 오늘은 먼저 연락해 보세요.';
  }

  function workText(score, g, ilgan, strength) {
    var base = ilgan.work;
    if (score >= 80) return '일과 자리에서 성과가 잘 나오는 흐름이에요. ' + base;
    if (score >= 65) return '실력을 쌓기 좋은 때예요. ' + base;
    if (score >= 50) return '방향을 점검해 볼 시기예요. ' + base;
    return '무리하게 벌이기보다 하나를 깊게 파세요. ' + base;
  }

  /* ================================================================
   * 6. 궁합
   * ================================================================ */
  function josa(word, withBatchim, withoutBatchim) {
    var ch = word.charAt(word.length - 1);
    var code = ch.charCodeAt(0);
    if (code < 0xAC00 || code > 0xD7A3) return withBatchim;
    return ((code - 0xAC00) % 28) ? withBatchim : withoutBatchim;
  }

  function compatibility(a, b) {
    var ea = GAN_ELEM[ganIndex(a.dayGan)], eb = GAN_ELEM[ganIndex(b.dayGan)];
    var an = a.input.name ? a.input.name + ' 님' : '내', bn = b.input.name ? b.input.name + ' 님' : '상대';
    var anS = an + josa(an, '이', '가'), bnS = bn + josa(bn, '이', '가');
    var ganScore = 0, ganText = '';
    if (ea === eb) { ganScore = 5; ganText = '같은 기운을 가진 닮은꼴 — 말하지 않아도 통하는 사이예요.'; }
    else if (GENERATES[ea] === eb) { ganScore = 10; ganText = anS + ' ' + bn + '에게 기운을 보태주는 관계예요. 한쪽이 자연스럽게 더 챙기게 돼요.'; }
    else if (GENERATES[eb] === ea) { ganScore = 10; ganText = bnS + ' ' + an + '에게 힘이 되어주는 관계예요.'; }
    else if (CONTROLS[ea] === eb) { ganScore = -3; ganText = '서로 주도권을 잡으려는 긴장이 있어요. 역할을 나누면 오히려 강해져요.'; }
    else { ganScore = -3; ganText = '한쪽이 다른 쪽에 눌리는 느낌이 들 수 있어요. 표현을 자주 나누세요.'; }

    var rel = zhiRelation(a.dayZhi, b.dayZhi);

    // 오행 보완
    var complement = 0;
    ELEMS.forEach(function (e) {
      if (a.ohaeng.counts[e] <= 1 && b.ohaeng.counts[e] >= 2) complement += 1;
      if (b.ohaeng.counts[e] <= 1 && a.ohaeng.counts[e] >= 2) complement += 1;
    });

    var score = clamp(58 + ganScore + rel.score + complement * 2, 30, 97);
    var label = score >= 85 ? '천생연분' : score >= 72 ? '잘 맞는 사이' : score >= 60 ? '노력하면 좋아요' : score >= 48 ? '서로 다른 점이 많아요' : '쉽지 않은 조합';

    var advice = [];
    if (rel.type === 'chung') advice.push('의견이 부딪힐 때 결론을 서두르지 말고 하루 뒤에 다시 이야기해 보세요.');
    if (rel.type === 'wonjin') advice.push('서운한 감정은 그날 안에 말로 꺼내는 게 좋아요.');
    if (rel.type === 'yukhap' || rel.type === 'samhap') advice.push('함께 있을 때 시너지가 커요. 공동의 목표를 만들어 보세요.');
    if (complement >= 2) advice.push('서로 부족한 기운을 채워주는 조합이라 오래 갈수록 편안해져요.');
    if (advice.length === 0) advice.push('서로의 속도를 존중하면 안정적으로 오래가는 관계예요.');

    return {
      score: score, label: label,
      ganText: ganText, zhiText: rel.text, zhiType: rel.type,
      complement: complement,
      advice: advice
    };
  }

  /* ================================================================
   * 7. 공유 · 내보내기
   * ================================================================ */
  function summaryText(r) {
    var p = r.pillars;
    var pillars = [
      '년주 ' + p.year.gan + p.year.zhi,
      '월주 ' + p.month.gan + p.month.zhi,
      '일주 ' + p.day.gan + p.day.zhi
    ];
    if (p.hour) pillars.push('시주 ' + p.hour.gan + p.hour.zhi);
    var name = r.input.name ? r.input.name + ' 님의 ' : '내 ';
    return '🔮 ' + name + '사주팔자\n' +
      pillars.join(' · ') + '\n' +
      '일간 ' + r.dayGan + '(' + r.dayGanHanja + ') — ' + r.ilgan.title + '\n' +
      '부족한 오행: ' + (r.ohaeng.missing.length ? r.ohaeng.missing.join(', ') : r.ohaeng.weakest) +
      ' / 강한 오행: ' + r.ohaeng.strongest + '\n' +
      '오늘의 운세 ' + (r.today ? r.today.score + '점' : '-') + ' · 2026 병오년 ' + r.years[0].score + '점\n' +
      '#사주 #운세 #만세력';
  }

  function toShareParams(r) {
    var q = new URLSearchParams();
    if (r.input.name) q.set('n', r.input.name);
    if (r.input.gender && r.input.gender !== 'n') q.set('g', r.input.gender);
    q.set('cal', r.input.calendar);
    q.set('y', String(r.input.calendar === 'lunar' && r.lunar ? r.lunar.year : r.solar.year));
    q.set('m', String(r.input.calendar === 'lunar' && r.lunar ? r.lunar.month : r.solar.month));
    q.set('d', String(r.input.calendar === 'lunar' && r.lunar ? r.lunar.day : r.solar.day));
    if (r.input.calendar === 'lunar' && r.lunar && r.lunar.leap) q.set('leap', '1');
    if (r.input.timeIndex >= 0) q.set('t', String(r.input.timeIndex));
    return q.toString();
  }

  /* ================================================================
   * 8. 내보내기
   * ================================================================ */
  global.Saju = {
    GAN: GAN, GAN_HANJA: GAN_HANJA, ZHI: ZHI, ZHI_HANJA: ZHI_HANJA,
    ZHI_ANIMAL: ZHI_ANIMAL, ZHI_HOUR_LABEL: ZHI_HOUR_LABEL, ZHI_MAIN_GAN: ZHI_MAIN_GAN,
    ELEMS: ELEMS, ELEM_INFO: ELEM_INFO, GENERATES: GENERATES, CONTROLS: CONTROLS,
    GAN_ELEM: GAN_ELEM, GAN_YANG: GAN_YANG, ZHI_ELEM: ZHI_ELEM, ZHI_YANG: ZHI_YANG,
    TIME_OPTIONS: TIME_OPTIONS, TIME_MID_HOUR: TIME_MID_HOUR,
    ILGAN_INFO: ILGAN_INFO, SIPSIN_GROUP: SIPSIN_GROUP, SIPSIN_DESC: SIPSIN_DESC,
    LUCKY_ITEMS: LUCKY_ITEMS, LUCKY_COLOR: LUCKY_COLOR,
    COUPANG_PARTNER_ID: COUPANG_PARTNER_ID, COUPANG_LINK_MAP: COUPANG_LINK_MAP,
    sipsinOf: sipsinOf, zhiRelation: zhiRelation,
    computeSaju: computeSaju, compatibility: compatibility,
    summaryText: summaryText, toShareParams: toShareParams
  };

})(SAJU_SCOPE);

export default SAJU_SCOPE.Saju;

/** 음력·윤달 존재 여부 확인용 (폼에서 윤달 체크 검증에 사용) */
export const KoreanLunarCalendarCtor = SAJU_SCOPE.KoreanLunarCalendar;

