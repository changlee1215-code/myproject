import type {
  CategoryMatcher,
  NewsItem,
  RankingItemContext,
  RelatedRankingResult,
} from '../types';
import {
  COMMON_NAMES,
  EN_STOPWORDS,
  KO_STOPWORDS,
  escapeRegExp,
  FAMOUS_BAND_MEMBERS,
  FAMOUS_BANDS,
} from '../stopwords';

export const detectRelatedRanking = (
  chosenCategory: CategoryMatcher | null,
  targetNewsList: NewsItem[],
  cleanKeyword: string,
  rankingContext: RankingItemContext[] | undefined,
  previousDayContext: RankingItemContext[] | undefined,
  currentRank: number | undefined,
  translations: Record<string, string>,
  isSelfDied: boolean,
  isMemorialDirectory: boolean
): RelatedRankingResult | null => {
  const hasToday = rankingContext && rankingContext.length > 0;
  const hasPrev = previousDayContext && previousDayContext.length > 0;
  if (!hasToday && !hasPrev) return null;

  const currentClean = cleanKeyword.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
  const currentBaseOnly = cleanKeyword
    .replace(/\bseason\s+\d+\b/gi, '')
    .replace(/시즌\s*\d+/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, '');

  // 1) 오늘 급상승 랭킹 후보군
  const todayCandidates = (rankingContext || [])
    .filter((item) => {
      if (currentRank !== undefined && item.rank === currentRank) return false;
      const candNorm = item.title.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
      const candBaseNorm = item.title
        .replace(/\s*\([^)]*\)\s*/g, ' ')
        .replace(/\bseason\s+\d+\b/gi, '')
        .replace(/시즌\s*\d+/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]/g, '');
      if (currentBaseOnly && candBaseNorm && currentBaseOnly === candBaseNorm) return false;
      return candNorm !== currentClean && candNorm.length >= 2;
    })
    .map((item) => ({ ...item, isPreviousDay: false }));

  // 2) 어제(전날) 실검 랭킹 후보군
  const prevCandidates = (previousDayContext || [])
    .filter((item) => {
      const candNorm = item.title.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
      const candBaseNorm = item.title
        .replace(/\s*\([^)]*\)\s*/g, ' ')
        .replace(/\bseason\s+\d+\b/gi, '')
        .replace(/시즌\s*\d+/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]/g, '');
      if (currentBaseOnly && candBaseNorm && currentBaseOnly === candBaseNorm) return false;
      const existsInToday = todayCandidates.some(
        (tc) => tc.title.toLowerCase().replace(/[^a-z0-9가-힣]/g, '') === candNorm
      );
      return !existsInToday && candNorm !== currentClean && candNorm.length >= 2;
    })
    .map((item) => ({ ...item, isPreviousDay: true }));

  const candidates = [...todayCandidates, ...prevCandidates];
  if (candidates.length === 0) return null;

  let bestMatch: {
    item: RankingItemContext;
    displayTitle: string;
    mentionCount: number;
    matchedTitles: string[];
  } | null = null;

  for (const cand of candidates) {
    const candBaseTitle = cand.title
      .replace(/\s*\([^)]*\)\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const candDisplayTitle = candBaseTitle.length >= 2 ? candBaseTitle : cand.title.trim();
    const candLower = candDisplayTitle.toLowerCase();
    const candCoreTitle = candLower
      .replace(/\bseason\s+\d+\b/gi, '')
      .replace(/시즌\s*\d+/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const isCandShowOrWork =
      /\b(tv series|television series|miniseries|film|movie|novel|game|album|song|season \d+|dancing with the stars|breaking bad|east of eden)\b/i.test(
        cand.title
      ) || /(드라마|시리즈|영화|소설|예능|프로그램|시즌\s*\d+)/i.test(cand.title);

    // [가드레일 1] 서치 토큰 추출 규칙 강화 (영-한 음차 교차 매칭 지원: Lite <-> 라이트 등)
    const tokens: string[] = [candLower];
    if (candCoreTitle.length >= 4 && candCoreTitle !== candLower) {
      tokens.push(candCoreTitle);
    }

    const KOREAN_TRANSLITERATION_MAP: Record<string, string> = {
      lite: '라이트',
      light: '라이트',
      soul: '소울',
      rookies: '루키즈',
      rookie: '루키',
      boys: '보이즈',
      girls: '걸스',
      junior: '주니어',
      super: '슈퍼',
    };

    let transliteratedTitle = candCoreTitle;
    let hasTranslit = false;
    Object.entries(KOREAN_TRANSLITERATION_MAP).forEach(([enKey, koVal]) => {
      const rx = new RegExp(`\\b${enKey}\\b`, 'gi');
      if (rx.test(transliteratedTitle)) {
        transliteratedTitle = transliteratedTitle.replace(rx, koVal);
        hasTranslit = true;
        tokens.push(koVal);
      }
    });
    if (hasTranslit && transliteratedTitle !== candCoreTitle) {
      tokens.push(transliteratedTitle);
    }

    const currentParts = new Set(
      cleanKeyword
        .toLowerCase()
        .replace(/[^\w\s가-힣]/g, ' ')
        .split(/\s+/)
        .filter((p) => p.length >= 2)
    );

    const parts = candCoreTitle
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter((p) => p.length >= 2);

    if (!isCandShowOrWork && parts.length >= 2 && parts.length <= 3) {
      parts.forEach((p, idx) => {
        const isKoreanToken = /[가-힣]/.test(p);
        if (!isKoreanToken && idx === 0) return; // 영문 이름 First name 단독 매칭 배제
        if (currentParts.has(p)) return; // 현재 키워드와 겹치면 배제
        if (COMMON_NAMES.has(p) || EN_STOPWORDS.has(p) || KO_STOPWORDS.has(p) || /^\d+$/.test(p)) return;
        if ((isKoreanToken && p.length >= 3) || (!isKoreanToken && p.length >= 4)) {
          tokens.push(p);
        }
      });
    }

    let mentionCount = 0;
    const matchedTitles: string[] = [];

    targetNewsList.forEach((n) => {
      const orig = n.title.toLowerCase();
      const trans = (translations[n.title] || '').toLowerCase();
      const combined = `${orig} ${trans}`;

      let isHit = combined.includes(candLower) || (candCoreTitle.length >= 4 && combined.includes(candCoreTitle));

      if (!isHit && tokens.length > 1) {
        isHit = tokens.slice(1).some((token) => {
          const isKoTok = /[가-힣]/.test(token);
          const rx = isKoTok
            ? new RegExp(`(^|[^a-zA-Z0-9가-힣])${escapeRegExp(token)}(은|는|이|가|을|를|의|에|와|과|도|로|으로|에서|에게|한테)?([^a-zA-Z0-9가-힣]|$)`, 'i')
            : new RegExp(`(^|[^a-zA-Z0-9가-힣])${escapeRegExp(token)}([^a-zA-Z0-9가-힣]|$)`, 'i');
          return rx.test(combined);
        });
      }

      if (isHit) {
        mentionCount++;
        matchedTitles.push(combined);
      }
    });

    // [가드레일 2] 상위 5대 핵심 헤드라인 노출 필수 요건
    const inTopHeadlines = targetNewsList.slice(0, 5).some((n) => {
      const combined = `${n.title} ${translations[n.title] || ''}`.toLowerCase();
      return tokens.some((t) => {
        const isKoTok = /[가-힣]/.test(t);
        const rx = isKoTok
          ? new RegExp(`(^|[^a-zA-Z0-9가-힣])${escapeRegExp(t)}(은|는|이|가|을|를|의|에|와|과|도|로|으로|에서|에게|한테)?([^a-zA-Z0-9가-힣]|$)`, 'i')
          : new RegExp(`(^|[^a-zA-Z0-9가-힣])${escapeRegExp(t)}([^a-zA-Z0-9가-힣]|$)`, 'i');
        return rx.test(combined);
      });
    });

    if (!inTopHeadlines) {
      continue;
    }

    // [가드레일 3] 지분율(Mention Ratio) 강화 (명확한 밴드-멤버 또는 기획사-아티스트 관계는 2건 이상 시 인정)
    const candNorm = candLower.replace(/[^a-z0-9가-힣]/g, '');
    const currentNorm = cleanKeyword.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
    const memberInfo = FAMOUS_BAND_MEMBERS[cleanKeyword.toLowerCase()] || FAMOUS_BAND_MEMBERS[currentNorm];
    const candBandInfo = FAMOUS_BANDS[candLower] || FAMOUS_BANDS[candNorm];
    const isDirectBandOrAgency =
      (memberInfo &&
        (candNorm.includes(memberInfo.bandEn.toLowerCase().replace(/[^a-z0-9가-힣]/g, '')) ||
          candNorm.includes(memberInfo.bandKo.toLowerCase().replace(/[^a-z0-9가-힣]/g, '')))) ||
      (candBandInfo &&
        candBandInfo.keyMembers.some((m) => m.toLowerCase().replace(/[^a-z0-9가-힣]/g, '').includes(currentNorm))) ||
      /(엔터|기획사|소속사|레이블|entertainment|agency|label)/i.test(cleanKeyword) ||
      /(엔터|기획사|소속사|레이블|entertainment|agency|label)/i.test(candDisplayTitle);

    const threshold =
      isDirectBandOrAgency || targetNewsList.length <= 5
        ? 2
        : Math.max(3, Math.ceil(targetNewsList.length * 0.25));

    if (mentionCount >= threshold) {
      if (!bestMatch || mentionCount > bestMatch.mentionCount) {
        bestMatch = { item: cand, displayTitle: candDisplayTitle, mentionCount, matchedTitles };
      }
    }
  }

  if (!bestMatch) return null;

  const target = bestMatch.item;
  const targetTitle = bestMatch.displayTitle || target.title;
  const allMatchedText = bestMatch.matchedTitles.join(' ');

  const isTargetShowOrWork =
    /\b(tv series|television series|miniseries|film|movie|novel|season \d+|dancing with the stars|\bdwts\b|breaking bad|east of eden)\b/i.test(
      target.title
    ) || /(드라마|시리즈|영화|소설|예능|프로그램|시즌\s*\d+)/i.test(target.title);

  // 0. 경연 프로그램 출연 / 헌정 무대 / 명장면 재현 판별
  const isTvCompetitionOrDedication =
    chosenCategory?.id === 'tv_competition_tribute' ||
    chosenCategory?.id === 'broadcast' ||
    /\b(dancing with the stars|\bdwts\b|dedication night|recreates? iconic|recreates? .+ moves|recreates? .+ moment|tribute dance|tribute routine|bachelor|leaderboard|judges)\b/i.test(
      allMatchedText
    ) ||
    /(댄싱\s*위드\s*더\s*스타|헌정\s*무대|헌정\s*공연|명장면\s*재현|안무\s*재현|경연|불후의\s*명곡|복면가왕)/i.test(
      allMatchedText
    );

  // 1. 결혼식 / 백년가약 / 웨딩 판별
  const isWeddingCeremony =
    chosenCategory?.id === 'wedding_marriage' ||
    /\b(wedding|weddings|ties the knot|tied the knot|got married|marry|nuptials|walks down the aisle|walked down the aisle|exchange vows|exchanged vows)\b/i.test(
      allMatchedText
    ) ||
    /(결혼식|웨딩|웨딩마치|백년가약|화촉|품절남|품절녀|결혼\s*발표|결혼\s*소식|결혼식\s*참석|새신랑|새신부)/i.test(
      allMatchedText
    );

  // 1-2. 배우자 / 부부 / 직관 응원 관계 판별
  const isSpouseOrCouple =
    chosenCategory?.id === 'spouse_cheer_couple' ||
    /\b(husband|wife|wives|spouse|spouses|cheer on husband|cheering on husband|cheers on husband|cheer on wife|cheering on wife|cheers on wife|cheer for husband|cheering for husband|married couple|couple|marriage|newlywed|in-laws?)\b/i.test(
      allMatchedText
    ) ||
    /(남편|아내|배우자|부부|잉꼬\s*부부|신혼\s*부부|특급\s*응원|동반\s*직관|직관|부부\s*케미|남편을\s*응원|아내를\s*응원)/i.test(
      allMatchedText
    );

  const isCheeringOrGame =
    /\b(cheer|cheers|cheering|game|bills|nfl|nba|mlb|stadium|suite|arena|sideline|match|bleachers)\b/i.test(
      allMatchedText
    ) || /(응원|직관|경기|경기장|관전|특급\s*응원)/i.test(allMatchedText);

  // 2. 신작 드라마 / 영화 / 동반 주연 / 제작발표회 관계 판별
  const isNewWorkOrCoStar =
    chosenCategory?.id === 'release_comeback' ||
    /\b(co-star|co-stars|co-starring|new drama|new series|press conference|upcoming movie|upcoming series|upcoming film|premiere|premieres|premiered|lead roles?|starring together|table read|rom-com)\b/i.test(
      allMatchedText
    ) ||
    /(제작발표회|제작보고회|제발회|새\s*드라마|신작\s*드라마|첫\s*방송|첫방|본방사수|남녀주인공|상대역|호흡|로코|연기\s*호흡|동반\s*출연|주연\s*발탁|캐스팅\s*확정|시사회|대본리딩|안방극장|포토타임)/i.test(
      allMatchedText
    );

  // 3. 동료 배우 / 캐스트메이트 관계 판별
  const isCoStarOrCastmate =
    !isTargetShowOrWork &&
    (/\b(co-stars?|costars?|castmates?|cast members?|fellow actors?|stars mourn|shared screen|co-starring)\b/i.test(
      allMatchedText
    ) ||
      /(동료\s*배우|함께\s*출연|호흡을\s*맞춘|출연진|동료들)/i.test(allMatchedText));

  // 4. 순수 가상 배역 / 캐릭터 판별
  const isFictionalRoleOrCharacter =
    !isCoStarOrCastmate &&
    !isTargetShowOrWork &&
    (/\b(character|role of|played the role|portrayed the character|as [A-Z][a-z]+|fictional character|iconic character|character in)\b/i.test(
      allMatchedText
    ) ||
      /(배역|역할|가상\s*인물|캐릭터|작중|극\s*중)/i.test(allMatchedText));

  // 5. 일반 작품 / 배역 연관성 판별
  const isRoleOrCharacter =
    isCoStarOrCastmate ||
    isFictionalRoleOrCharacter ||
    /\b(actor|actress|role|character|son|daughter|played|plays|playing|star|starred|casting|cast|portrayed|portrayal|character in|series|drama|movie|film|show)\b/i.test(
      allMatchedText
    ) ||
    /(배우|배역|역할|캐릭터|출연|열연|작품|드라마|영화|아들|딸|주인공|시리즈)/i.test(allMatchedText);

  // 6. 비보 / 사망 / 추모 이슈 판별
  const isDeathIssue =
    !isTvCompetitionOrDedication &&
    (chosenCategory?.id === 'death' ||
      chosenCategory?.id === 'tribute_mourning' ||
      /\b(dies|died|death|passed away|rip|mourn|mourning|obituary|tragedy)\b/i.test(allMatchedText) ||
      /(사망|별세|비보|타계|숨진|애도|고별)/i.test(allMatchedText));

  // 7. 스포츠 경기 / 맞대결 판별
  const isSportsMatch =
    !isTvCompetitionOrDedication &&
    (chosenCategory?.id === 'sports_award_mvp' ||
      chosenCategory?.id === 'sports_victory' ||
      chosenCategory?.id === 'sports_defeat_crisis' ||
      chosenCategory?.id === 'sports_transfer_general' ||
      /\b(vs|versus|match|game|defeat|victory|against|derby|rivalry)\b/i.test(allMatchedText) ||
      /(맞대결|경기|승리|패배|더비|라이벌)/i.test(allMatchedText));

  // 8. 사건 · 사고 / 논란 판별
  const isIncidentOrScandal =
    chosenCategory?.id === 'incident_society' ||
    chosenCategory?.id === 'scandal' ||
    /\b(investigation|lawsuit|allegation|accused|arrested|court|controversy)\b/i.test(allMatchedText) ||
    /(사건|사고|수사|재판|혐의|논란|공방)/i.test(allMatchedText);

  // 9. 대형 참사 / 사상자 발생 사고 판별
  const isCasualtyDisaster =
    chosenCategory?.id === 'accident_casualty' ||
    /\b(casualty|casualties|fatalities|deadly accident|fatal crash|plane crash|train crash|massive fire|explosion)\b/i.test(
      allMatchedText
    ) ||
    /(참사|사상자|인명\s*피해|추락\s*사고|화재\s*참사|붕괴\s*사고|폭발\s*사고)/i.test(allMatchedText);

  // 10. 열애 / 결혼 / 결별 판별
  const isRomanceOrBreakup =
    chosenCategory?.id === 'wedding_marriage' ||
    chosenCategory?.id === 'spouse_cheer_couple' ||
    chosenCategory?.id === 'dating_romance' ||
    chosenCategory?.id === 'baby_pregnancy' ||
    chosenCategory?.id === 'breakup_divorce' ||
    /\b(dating|relationship|romance|married|wedding|divorce|split|breakup)\b/i.test(allMatchedText) ||
    /(열애|결혼|웨딩|이혼|결별|파경)/i.test(allMatchedText);

  // 11. 군사 분쟁 / 무력 충돌 판별
  const isMilitaryWar =
    chosenCategory?.id === 'military_conflict' ||
    /\b(attacks?|strikes?|missiles?|drone strike|war|military|houthi|militia)\b/i.test(allMatchedText) ||
    /(공습|미사일|드론\s*공격|전쟁|군사|교전|후티|반군)/i.test(allMatchedText);

  // 12. 경제 / 주가 / 기업 이슈 판별
  const isBusinessEvent =
    chosenCategory?.id === 'business_boom' ||
    chosenCategory?.id === 'business_crisis' ||
    chosenCategory?.id === 'business_general' ||
    /\b(stocks?|earnings|soar|plunge|acquisition|merger|ipo)\b/i.test(allMatchedText) ||
    /(주가|실적|급등|폭락|어닝|인수합병|상장)/i.test(allMatchedText);

  // 13. 소속사 · 기획사 · 소속 아티스트 · 신인 아이돌 론칭/데뷔 연관성 판별
  const isAgencyArtistOrRookieLaunch =
    /\b(agency|label|entertainment|rookie|girl\s*group|boy\s*group|kpop|debut|launched?|producer|trainees?|unveils?|artists?)\b/i.test(
      allMatchedText
    ) ||
    /(소속사|기획사|엔터|엔터테인먼트|소속\s*가수|소속\s*아티스트|걸그룹|보이그룹|아이돌|신인\s*그룹|신인\s*걸그룹|신인\s*보이그룹|신인|데뷔|론칭|공개|루키|연습생|프로듀서|프로듀싱|총괄\s*프로듀서|출격|동시\s*출격|차트\s*1위|멜론\s*1위)/i.test(
      allMatchedText
    );

  // 14. 밴드 <-> 밴드 멤버(프론트맨/보컬/리더) 연계 판별 (예: 커트 코베인 <-> 너바나, 존 레논 <-> 비틀즈)
  const currentLowerNorm = cleanKeyword.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
  const candLowerNorm = targetTitle.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');

  const memberInfoForCurrent =
    FAMOUS_BAND_MEMBERS[cleanKeyword.toLowerCase()] ||
    FAMOUS_BAND_MEMBERS[currentLowerNorm];
  const memberInfoForCand =
    FAMOUS_BAND_MEMBERS[targetTitle.toLowerCase()] ||
    FAMOUS_BAND_MEMBERS[candLowerNorm];

  const bandInfoForCurrent =
    FAMOUS_BANDS[cleanKeyword.toLowerCase()] ||
    FAMOUS_BANDS[currentLowerNorm];
  const bandInfoForCand =
    FAMOUS_BANDS[targetTitle.toLowerCase()] ||
    FAMOUS_BANDS[candLowerNorm];

  const isBandMemberRelationship =
    (memberInfoForCurrent && (
      candLowerNorm.includes(memberInfoForCurrent.bandEn.toLowerCase().replace(/[^a-z0-9가-힣]/g, '')) ||
      candLowerNorm.includes(memberInfoForCurrent.bandKo.toLowerCase().replace(/[^a-z0-9가-힣]/g, '')) ||
      memberInfoForCurrent.bandEn.toLowerCase().includes(candLowerNorm) ||
      memberInfoForCurrent.bandKo.toLowerCase().includes(candLowerNorm)
    )) ||
    (memberInfoForCand && (
      currentLowerNorm.includes(memberInfoForCand.bandEn.toLowerCase().replace(/[^a-z0-9가-힣]/g, '')) ||
      currentLowerNorm.includes(memberInfoForCand.bandKo.toLowerCase().replace(/[^a-z0-9가-힣]/g, '')) ||
      memberInfoForCand.bandEn.toLowerCase().includes(currentLowerNorm) ||
      memberInfoForCand.bandKo.toLowerCase().includes(currentLowerNorm)
    )) ||
    (bandInfoForCurrent && bandInfoForCurrent.keyMembers.some((m) => {
      const mn = m.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
      return mn.includes(candLowerNorm) || candLowerNorm.includes(mn);
    })) ||
    (bandInfoForCand && bandInfoForCand.keyMembers.some((m) => {
      const mn = m.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
      return mn.includes(currentLowerNorm) || currentLowerNorm.includes(mn);
    }));

  // [가드레일 4] 맥락적 연결 고리 필수 요건화
  if (
    !isMemorialDirectory &&
    !isTvCompetitionOrDedication &&
    !isRoleOrCharacter &&
    !isNewWorkOrCoStar &&
    !isDeathIssue &&
    !isSportsMatch &&
    !isIncidentOrScandal &&
    !isCasualtyDisaster &&
    !isWeddingCeremony &&
    !isSpouseOrCouple &&
    !isRomanceOrBreakup &&
    !isMilitaryWar &&
    !isBusinessEvent &&
    !isAgencyArtistOrRookieLaunch &&
    !isBandMemberRelationship
  ) {
    return null;
  }

  let reasonType: RelatedRankingResult['reasonType'] = 'general';
  let reasonText = '';

  const rankTimeText = target.isPreviousDay ? `어제(전날) 실검 ${target.rank}위였던` : `오늘 급상승 ${target.rank}위인`;

  if (isMemorialDirectory) {
    reasonType = 'death_tribute';
    reasonText = `최근 타전된 주요 인물 '${targetTitle}'의 안타까운 비보(별세 소식) 영향으로, 2026년 한 해 동안의 공식 부고 및 추모 인명록을 총정리한 '${cleanKeyword}' 문서로 전 세계 네티즌들의 확인 및 추모 유입이 대거 집중되었습니다.`;
  } else if (isCasualtyDisaster) {
    reasonType = 'incident_scandal';
    reasonText = `대형 사고 및 참사(사상자 발생) 긴급 보도에서 ${rankTimeText} '${targetTitle}'와 함께 현장 상황 및 핵심 관련 대상/장소로 집중 보도되며 동반 급상승했습니다.`;
  } else if (isMilitaryWar) {
    reasonType = 'incident_scandal';
    reasonText = `군사 공습 및 무력 분쟁 긴급 보도에서 ${rankTimeText} '${targetTitle}'와 함께 핵심 공격 주체/피습 대상 또는 지정학적 갈등 당사자로 언론에 집중 조명되며 동반 급상승했습니다.`;
  } else if (isTvCompetitionOrDedication) {
    reasonType = 'tv_competition_tribute';
    const hasTributeOrRecreate =
      /\b(dedication|tribute|honor|honors|honoring|recreates?|recreating|recreated|iconic|reunion)\b/i.test(allMatchedText) ||
      /(헌정|추모|재현|명장면|오마주)/i.test(allMatchedText);
    if (hasTributeOrRecreate) {
      reasonText = `${rankTimeText} 인기 경연 프로그램 '${targetTitle}'에서 과거 대표작의 명장면 안무를 재현하거나 고인이 된 동료 배우·인물을 기리는 특별 헌정 무대(Dedication Night)를 준비해 선보이며, 출연자인 '${cleanKeyword}'에게 시청자들의 뜨거운 관심과 검색이 집중되었습니다.`;
    } else {
      reasonText = `${rankTimeText} 인기 경연·예능 프로그램 '${targetTitle}'에 참가자(출연진)로 출연하여 인상적인 무대와 활약상을 펼치며, 프로그램 화제성과 함께 '${cleanKeyword}'에 대한 시청자들의 검색 유입이 동반 급상승했습니다.`;
    }
  } else if (chosenCategory?.id === 'death' && isSelfDied) {
    reasonType = 'death_tribute';
    if (isTargetShowOrWork) {
      reasonText = `'${cleanKeyword}'의 안타까운 별세(공식 부고) 소식이 전해지며, 고인이 생전 열연했던 대표 출연작인 ${rankTimeText} '${targetTitle}'와 동료 배우들의 추모 물결이 함께 집중 조명되어 동반 급상승했습니다.`;
    } else {
      reasonText = `'${cleanKeyword}'의 안타까운 별세(공식 부고) 소식이 전해지며, 대표작에서 함께 호흡을 맞췄던 ${rankTimeText} 동료 배우 '${targetTitle}'의 애도 메시지와 생전 인연이 함께 조명되어 동반 급상승했습니다.`;
    }
  } else if ((isCoStarOrCastmate || chosenCategory?.id === 'tribute_mourning') && isDeathIssue) {
    reasonType = 'death_tribute';
    if (isTargetShowOrWork) {
      reasonText = `${rankTimeText} 대표작 '${targetTitle}'에 함께 출연했던 동료 배우의 안타까운 비보(별세 소식)가 전해짐에 따라, 동료인 '${cleanKeyword}'가 고인과의 추억과 애도의 뜻을 전하며 큰 주목을 받았습니다.`;
    } else {
      reasonText = `⚡ [생존 인물 확인 / 동료 추모] ${rankTimeText} 동료 배우 '${targetTitle}'의 안타까운 비보(별세 소식)가 전해짐에 따라, 대표작에서 함께 호흡을 맞춘 동료 배우인 '${cleanKeyword}'가 언론을 통해 고인과의 마지막 만남과 애도의 뜻을 전하며 큰 주목을 받았습니다. (⚠️ 본인의 비보가 아닌 고인과의 깊은 인연에 따른 동반 관심입니다.)`;
    }
  } else if (isFictionalRoleOrCharacter && isDeathIssue) {
    reasonType = 'character_role';
    reasonText = `${rankTimeText} 배우/인물 '${targetTitle}'의 안타까운 비보(사망·추모 소식)가 전해지며, 고인이 생전 열연했던 대표 배역 및 상징적 캐릭터인 '${cleanKeyword}'에 글로벌 팬들의 추모와 검색 관심이 집중되어 동반 급상승했습니다.`;
  } else if (chosenCategory?.id === 'tribute_mourning' || isDeathIssue) {
    reasonType = 'death_tribute';
    if (isTargetShowOrWork) {
      reasonText = `${rankTimeText} 작품 '${targetTitle}' 관련 출연 배우의 비보 및 추모 물결이 확산되면서 '${cleanKeyword}'에 대한 연관 검색 관심이 함께 집중되었습니다.`;
    } else {
      reasonText = `⚡ [생존 인물 확인 / 동료 추모] ${rankTimeText} 배우/인물 '${targetTitle}'의 안타까운 비보(별세 소식)의 영향으로, 함께 호흡을 맞춘 대표작 동료 배우인 '${cleanKeyword}'가 추모 메시지를 전하거나 생전 인연이 언론에 집중 조명되며 연쇄적인 검색 관심이 쏠렸습니다. (⚠️ 본인 비보가 아닌 연관 인물 추모 이슈 - 현재 인물은 생존)`;
    }
  } else if (isWeddingCeremony) {
    reasonType = 'wedding_marriage';
    reasonText = `${rankTimeText} 평생의 반려자인 '${targetTitle}'와의 감동적인 백년가약(결혼식 거행) 또는 기쁜 결혼 발표 소식이 언론을 통해 집중 보도되며, 대중의 뜨거운 축복 속에 동반 급상승했습니다.`;
  } else if (isSpouseOrCouple) {
    reasonType = 'spouse_couple';
    if (isCheeringOrGame) {
      reasonText = `${rankTimeText} 배우자(남편/아내)인 '${targetTitle}'의 중요한 경기(또는 공식 석상)에 직접 참석해 특급 응원을 펼치거나, 다정한 부부 케미와 일상 소식이 언론과 팬들의 큰 주목을 받으며 연쇄 검색 유입이 발생했습니다.`;
    } else {
      reasonText = `${rankTimeText} 배우자(남편/아내)인 '${targetTitle}'와의 다정한 부부 일상 및 공식 동반 행보가 화제를 모으며, 연관 검색과 대중의 관심이 집중되어 동반 급상승했습니다.`;
    }
  } else if (isRomanceOrBreakup) {
    reasonType = 'general';
    if (
      chosenCategory?.id === 'wedding_marriage' ||
      /\b(marry|wedding|ties the knot)\b/i.test(allMatchedText) ||
      /(결혼|웨딩|화촉|백년가약)/i.test(allMatchedText)
    ) {
      reasonText = `${rankTimeText} '${targetTitle}'와의 감동적인 결혼 및 백년가약 소식이 화제를 모으며, 배우자인 '${cleanKeyword}'에 대한 관심과 축하가 쏠려 동반 급상승했습니다.`;
    } else if (
      chosenCategory?.id === 'dating_romance' ||
      /\b(dating|relationship|romance)\b/i.test(allMatchedText) ||
      /(열애|핑크빛|연애)/i.test(allMatchedText)
    ) {
      reasonText = `${rankTimeText} '${targetTitle}'와의 핑크빛 열애 소식이 화제를 모으며, 연인 관계인 '${cleanKeyword}'에 대한 관심과 축하가 쏠려 동반 급상승했습니다.`;
    } else if (
      chosenCategory?.id === 'baby_pregnancy' ||
      /\b(baby|pregnant|birth)\b/i.test(allMatchedText) ||
      /(임신|출산|득남|득녀)/i.test(allMatchedText)
    ) {
      reasonText = `${rankTimeText} '${targetTitle}'와의 기쁜 득남·득녀(출산) 또는 임신 소식이 전해지며, 함께 부모가 된 '${cleanKeyword}'에 대한 축하와 관심이 쏠려 동반 급상승했습니다.`;
    } else {
      reasonText = `${rankTimeText} '${targetTitle}'와의 결별 또는 이혼(파경) 소식이 언론에 보도되며, 관련 당사자인 '${cleanKeyword}'에 대한 관심이 쏠려 동반 급상승했습니다.`;
    }
  } else if (isNewWorkOrCoStar) {
    reasonType = 'costar_work';
    if (isTargetShowOrWork) {
      reasonText = `${rankTimeText} 화제작 '${targetTitle}'의 방영·공개 소식이 언론에 집중 보도되면서, 관련 작품/출연진인 '${cleanKeyword}'에 대한 대중의 기대감과 관심이 쏠려 동반 급상승했습니다.`;
    } else {
      reasonText = `${rankTimeText} 신작 드라마·작품 또는 동반 주연인 '${targetTitle}' 관련 제작발표회 및 첫 방송(개봉) 일정이 언론에 집중 보도되며, 주연 배우인 '${cleanKeyword}'에 대한 대중의 기대감과 관심이 쏠려 동반 급상승했습니다.`;
    }
  } else if (isBandMemberRelationship) {
    reasonType = 'costar_work';
    const isBandCurrent = !!bandInfoForCurrent;
    const bandName = isBandCurrent ? cleanKeyword : targetTitle;
    const memberName = isBandCurrent ? targetTitle : cleanKeyword;
    const genre =
      bandInfoForCurrent?.genre ||
      bandInfoForCand?.genre ||
      memberInfoForCurrent?.genre ||
      memberInfoForCand?.genre ||
      '록';
    const groupTerm = /(아이돌|k-pop|팝|보컬)/i.test(genre) ? '그룹' : '밴드';
    reasonText = `유명 ${genre} ${groupTerm} '${bandName}'와(과) 해당 팀의 상징적인 멤버/아티스트인 '${memberName}' 간의 직접적인 연관 관심으로, 관련 수상·공연·신곡 및 명곡 재조명 보도와 함께 검색 유입이 동반 급상승했습니다.`;
  } else if (isIncidentOrScandal) {
    reasonType = 'incident_scandal';
    reasonText = `주요 사건·사고, 사법 조사 또는 사회적 논란 보도에서 ${rankTimeText} '${targetTitle}'와 함께 핵심 관련 인물로 언론에 집중 거론되며 동반 급상승했습니다.`;
  } else if (isSportsMatch) {
    reasonType = 'sports_rivalry';
    if (chosenCategory?.id === 'sports_award_mvp') {
      reasonText = `주요 대회/시리즈 MVP(최우수선수) 또는 개인 타이틀 수상 보도에서 ${rankTimeText} '${targetTitle}'와 함께 수상 경쟁자 또는 핵심 팀 동료/상대팀으로 집중 조명되며 동반 검색 트래픽이 발생했습니다.`;
    } else if (chosenCategory?.id === 'sports_victory') {
      reasonText = `주요 경기 맞대결 승전보(시리즈 스윕·결승 진출 등) 또는 결정적인 득점 맹활약 보도에서 ${rankTimeText} '${targetTitle}'와 함께 핵심 맞대결 상대팀/선수로 집중 조명되며 동반 검색 트래픽이 발생했습니다.`;
    } else if (chosenCategory?.id === 'sports_defeat_crisis') {
      reasonText = `경기 충격패, 시리즈 탈락 또는 주축 선수의 부상 결장·퇴장 등 악재 이슈에서 ${rankTimeText} '${targetTitle}'와 함께 핵심 상대/당사자로 언론에 거론되며 동반 검색 트래픽이 발생했습니다.`;
    } else {
      reasonText = `주요 경기 맞대결 또는 선수 이적·비교 이슈에서 ${rankTimeText} '${targetTitle}'와 함께 핵심 상대/동료로 거론되며 동반 검색 트래픽이 발생했습니다.`;
    }
  } else if (isRoleOrCharacter) {
    if (isTargetShowOrWork) {
      reasonType = 'character_role';
      reasonText = `${rankTimeText} 인기 프로그램·작품 '${targetTitle}' 관련 소식이 화제를 모으면서, 해당 방송/작품에서 활약 중인 '${cleanKeyword}'에 대한 시청자들의 관심이 함께 쏠려 동반 급상승했습니다.`;
    } else if (isFictionalRoleOrCharacter) {
      reasonType = 'character_role';
      reasonText = `${rankTimeText} '${targetTitle}' 관련 주요 소식의 파급 효과로, 해당 인물이 맡은 대표 배역 및 상징적 캐릭터인 '${cleanKeyword}'에 대한 대중의 관심이 함께 쏠리며 연쇄 검색이 일어났습니다.`;
    } else {
      reasonType = 'general';
      reasonText = `${rankTimeText} '${targetTitle}' 관련 주요 소식이 언론에 집중 보도되면서, 가족·연인 또는 밀접한 관련 인물인 '${cleanKeyword}'에게도 대중의 관심이 함께 쏠려 동반 급상승했습니다.`;
    }
  } else if (isBusinessEvent) {
    reasonType = 'general';
    if (chosenCategory?.id === 'business_boom') {
      reasonText = `${rankTimeText} '${targetTitle}'의 호실적 발표 또는 주가 급등 호재의 직접 수혜 기업/핵심 파트너사로 '${cleanKeyword}'가 주목받으며 동반 급상승했습니다.`;
    } else if (chosenCategory?.id === 'business_crisis') {
      reasonText = `${rankTimeText} '${targetTitle}'의 실적 쇼크 또는 주가 폭락 악재 이슈의 관련 기업/영향권 종목으로 '${cleanKeyword}'가 함께 거론되며 급상승했습니다.`;
    } else {
      reasonText = `기업 인수합병(M&A) 또는 주요 산업 이슈에서 ${rankTimeText} '${targetTitle}'와 함께 핵심 거래 상대/관련 기업으로 거론되어 동반 급상승했습니다.`;
    }
  } else if (isAgencyArtistOrRookieLaunch) {
    reasonType = 'costar_work';
    const isAgencyTarget = /(엔터|기획사|소속사|레이블|entertainment|agency|label)/i.test(cleanKeyword);
    if (isAgencyTarget) {
      reasonText = `최근 화제를 모은 ${rankTimeText} 소속 신인 걸그룹/아티스트 '${targetTitle}'의 데뷔 및 차트 1위 소식이 대중의 큰 주목을 받으면서, 해당 팀의 기획·소속사인 '${cleanKeyword}'로도 연관 관심과 검색 유입이 연결되어 동반 급상승했습니다.`;
    } else {
      reasonText = `${rankTimeText} 소속사/기획사인 '${targetTitle}'의 신인 론칭 및 프로듀싱 소식이 화제를 모으면서, 해당 프로젝트의 핵심 아티스트/그룹인 '${cleanKeyword}'에게도 대중의 관심이 함께 쏠려 동반 급상승했습니다.`;
    }
  } else {
    reasonType = 'general';
    reasonText = `최근 언론 및 커뮤니티에서 ${rankTimeText} '${targetTitle}' 관련 보도가 확산되는 과정에서 '${cleanKeyword}'가 핵심 연관 키워드로 함께 언급되어 연쇄적인 검색 유입을 이끌었습니다.`;
  }

  return {
    rank: target.rank,
    title: targetTitle,
    mentionCount: bestMatch.mentionCount,
    reasonType,
    reasonText,
    isPreviousDay: !!target.isPreviousDay,
  };
};
