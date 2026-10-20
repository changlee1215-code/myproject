/**
 * Metaphor & Context Shield (비유적 표현 및 맥락 왜곡 방지 선행 필터)
 * 
 * 1. 비유적 관용구 중립화 (취업전쟁, 세금 폭탄, 참패를 'OO참사'로 표현 등)
 * 2. 픽션/드라마 줄거리 보호 (배우의 극 중 살인/수감/이혼 배역을 실제 사건으로 오판 방지)
 * 3. 부정문 및 루머 반박 감지 (사망설 일축, 결별설 사실무근, 가짜뉴스)
 * 4. 과거 인물 헌정/추모 무대 분리 (오늘 사망한 것이 아닌 과거 고인 헌정 무대 분리)
 */

export interface ShieldInspectionResult {
  sanitizedHeadline: string;
  isMetaphorDetected: boolean;
  isFictionPlot: boolean;
  isRumorDebunking: boolean;
  isStageTribute: boolean;
  suppressCategories: Set<string>;
}

// 1. 비유적 합성어 / 관용구 마스킹 사전
const METAPHOR_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string | ((match: string) => string) }> = [
  // 전쟁/전투/참사 은유 -> 경쟁/화제
  {
    pattern: /취업\s*전쟁|입시\s*전쟁|출근\s*전쟁|퇴근\s*전쟁|육아\s*전쟁|다이어트\s*전쟁|티켓\s*전쟁|피켓팅\s*전쟁|예매\s*전쟁|수강신청\s*전쟁|쩐의\s*전쟁|별들의\s*전쟁|시청률\s*전쟁|음원\s*전쟁|차트\s*전쟁|컴백\s*전쟁|섭외\s*전쟁|주전\s*전쟁|생존\s*전쟁|총성\s*없는\s*전쟁|코인\s*전쟁|안방극장\s*전쟁/gi,
    replacement: '치열한 경쟁',
  },
  {
    pattern: /폭탄\s*발언|폭탄\s*선언|핵폭탄급|웃음\s*폭탄|매력\s*폭발|인기\s*폭발|케미\s*폭발|비주얼\s*폭발|가창력\s*폭발|감성\s*폭발|세금\s*폭탄|금리\s*폭탄|흥행\s*폭탄|폭탄\s*세일|폭탄\s*매물/gi,
    replacement: '큰 화제',
  },
  {
    pattern: /심장\s*폭행|심장\s*마비\s*주의|숨멎\s*주의|치사량|출구\s*봉쇄|시선\s*(강탈\s*)?체포|여심\s*체포|남심\s*체포/gi,
    replacement: '시선집중 매력',
  },
  {
    pattern: /차트\s*폭격|음원\s*폭격|홈런포로\s*격침|골\s*폭풍/gi,
    replacement: '대활약',
  },
  {
    pattern: /마약\s*같은\s*매력|마약\s*김밥|마약\s*베개|마약\s*토스트/gi,
    replacement: '치명적매력',
  },
  {
    pattern: /연기\s*참사|패션\s*참사|예능\s*참사|헤어\s*참사|음향\s*사고|방송\s*사고급\s*웃음/gi,
    replacement: '해프닝',
  },

  // 반어적 칭찬 / 논란 종식 -> 호평 (scandal 오분류 방지)
  {
    pattern: /미담\s*폭로|선행\s*폭로|인성\s*폭로|천사표\s*폭로/gi,
    replacement: '미담 공개',
  },
  {
    pattern: /미모\s*논란|비주얼\s*논란|동안\s*논란|비율\s*논란|기럭지\s*논란|실력\s*논란\s*종식|연기력\s*논란\s*종식|가창력\s*논란\s*종식|불화설\s*종식|논란\s*일축|논란\s*잠재운/gi,
    replacement: '화제 호평',
  },

  // 비즈니스/소속사/팀 결별 -> 계약 종료 (breakup_divorce 연인 파경 오분류 방지)
  {
    pattern: /소속사[와과]?\s*결별|전속\s*계약\s*결별|아름다운\s*결별|소속사\s*떠난|소속사와\s*계약\s*종료|홀로서기|FA\s*시장/gi,
    replacement: '계약 종료',
  },

  // 하객/축가/웨딩화보 -> 행사 참석 (본인 결혼 오분류 방지)
  {
    pattern: /결혼식\s*하객|하객\s*패션|하객\s*참석|결혼식\s*참석|결혼식\s*축가|축가\s*부른|축가\s*선물|부케\s*받은|웨딩\s*화보\s*모델|커플\s*화보/gi,
    replacement: '행사 화보 참석',
  },

  // 스포츠 참패를 참사로 과장 -> 경기패배
  {
    pattern: /([가-힣A-Za-z0-9]+\s*참사(?!\s*(현장|사상자|유가족|수색|붕괴|화재|침몰)))/gi,
    replacement: (match: string) => {
      if (/(도쿄|카타르|월드컵|아시안게임|수비|패션|시청률|흥행|경기)/i.test(match)) {
        return '경기패배';
      }
      return match;
    },
  },

  // 영어 비유 표현 (English metaphors)
  {
    pattern: /\b(job war|ratings war|box office war|price war|bidding war|chart war|turf war|streaming war)\b/gi,
    replacement: 'intense competition',
  },
  {
    pattern: /\b(fashion disaster|box office bomb|truth bomb|photo bomb|bombshell statement|tax bomb|slay(?:ed|ing)?|killed it|drop dead gorgeous|to die for)\b/gi,
    replacement: 'great performance',
  },
  {
    pattern: /\b(parts ways with (?:agency|label|management|team)|leaves (?:agency|label|management))\b/gi,
    replacement: 'contract ended',
  },
  {
    pattern: /\b(attends? wedding|wedding guest|sings? at wedding|wedding singer)\b/gi,
    replacement: 'attends event',
  },
];

export const inspectAndShieldHeadline = (headline: string): ShieldInspectionResult => {
  let sanitized = headline;
  let isMetaphorDetected = false;

  for (const { pattern, replacement } of METAPHOR_REPLACEMENTS) {
    const next =
      typeof replacement === 'string'
        ? sanitized.replace(pattern, replacement)
        : sanitized.replace(pattern, replacement);
    if (next !== sanitized) {
      sanitized = next;
      isMetaphorDetected = true;
    }
  }

  const suppressCategories = new Set<string>();

  // 2. 픽션/드라마 배역 보호 (Fiction & Drama Shield)
  // 기사에 '극 중', '드라마', '영화', '캐릭터', '엔딩', '줄거리', '스포' 등이 포함된 범죄/이혼/사망
  const isFictionPlot =
    /(극\s*중|작중|드라마에서|영화에서|엔딩서|캐릭터가|역할을\s*맡아|줄거리|스포일러|대본리딩|첫방서|마지막회서)/i.test(headline) &&
    /(살인|누명|교도소|수감|구속|피살|이혼|사망|숨져|결별)/i.test(headline);

  if (isFictionPlot) {
    suppressCategories.add('incident_society');
    suppressCategories.add('scandal');
    suppressCategories.add('death');
    suppressCategories.add('breakup_divorce');
  }

  // 3. 루머 / 가짜뉴스 / 반박 / 부인 감지 (Debunking Detector)
  // 기사 내용이 "사실이 아니다"라고 해명한 것
  const isRumorDebunking =
    /(사망설\s*(일축|부인|사실무근|황당|해명)|결별설\s*(일축|부인|사실무근|해명)|열애설\s*(일축|부인|사실무근|초고속\s*부인)|이혼설\s*(일축|부인|사실무근)|불화설\s*(일축|부인|사실무근)|피소설\s*(부인|반박)|가짜뉴스에\s*분노|법적\s*대응)/i.test(headline) ||
    /\b(shuts down|denies|debunks?|slams?|rubbishes?|false rumors?|hoax|not dead|alive and well)\b/i.test(headline);

  if (isRumorDebunking) {
    // 긍정 카테고리 매칭 억제 (실제 사망, 실제 결별, 실제 열애 등)
    if (/(사망|dead|dies)/i.test(headline)) suppressCategories.add('death');
    if (/(결별|이혼|divorce|split)/i.test(headline)) suppressCategories.add('breakup_divorce');
    if (/(열애|dating|romance)/i.test(headline)) suppressCategories.add('dating_romance');
    if (/(결혼|wedding)/i.test(headline)) suppressCategories.add('wedding_marriage');
  }

  // 4. 과거 고인 헌정 무대 / 오마주 감지 (Stage Tribute Shield)
  // 경연 프로그램, 콘서트, 10주기 등 과거 고인에 대한 헌정
  const isStageTribute =
    /(헌정\s*무대|헌정\s*공연|추모\s*무대|오마주\s*무대|명장면\s*재현|안무\s*재현|\d+주기\s*추모|기리며|고별\s*무대|dedication night|tribute dance|tribute performance|recreates? iconic)/i.test(headline);

  const hasFreshDeathClues =
    /(향년\s*\d+세로\s*별세|\d+세로\s*사망|자택서\s*사망|오늘\s*별세|숨진\s*채\s*발견|dies at \d+|found dead|pronounced dead)/i.test(headline);

  if (isStageTribute && !hasFreshDeathClues) {
    // 최근 실제 비보 발생(death)으로 오판 금지
    suppressCategories.add('death');
  }

  return {
    sanitizedHeadline: sanitized,
    isMetaphorDetected,
    isFictionPlot,
    isRumorDebunking,
    isStageTribute,
    suppressCategories,
  };
};
