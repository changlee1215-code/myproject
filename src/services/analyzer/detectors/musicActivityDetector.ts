import type { NewsItem, MusicActivityInfo } from '../types';

export const detectMusicActivity = (
  targetNewsList: NewsItem[],
  targetKeyword: string,
  categoryScores: Record<string, number>,
  translations: Record<string, string>
): MusicActivityInfo | null => {
  const totalSportsScore =
    (categoryScores['sports_award_mvp'] || 0) +
    (categoryScores['sports_victory'] || 0) +
    (categoryScores['sports_defeat_crisis'] || 0) +
    (categoryScores['sports_transfer_general'] || 0);
  const hardCrisisScore =
    (categoryScores['military_conflict'] || 0) +
    (categoryScores['accident_casualty'] || 0) +
    (categoryScores['incident_society'] || 0) +
    (categoryScores['death'] || 0) +
    (categoryScores['disaster_crisis'] || 0) +
    (categoryScores['politics_diplomacy'] || 0);
  if (totalSportsScore >= 2 || hardCrisisScore >= 2) {
    return null;
  }
  let viralScore = 0;
  let newReleaseScore = 0;
  let competitionScore = 0;
  let varietyScore = 0;
  let festivalScore = 0;
  let concertScore = 0;

  const viralCandidates = new Map<string, number>();
  const newReleaseCandidates = new Map<string, number>();
  const competitionCandidates = new Map<string, number>();
  const varietyCandidates = new Map<string, number>();
  const festivalCandidates = new Map<string, number>();

  const quoteRegex = /['"‘“《〈]([^'"’”》〉]{2,30})['"’”》〉]/g;
  const normKeyword = targetKeyword.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');

  const COMPETITION_SHOWS = [
    '복면가왕', '불후의 명곡', '불후의명곡', '싱어게인', '미스터트롯', '미스트롯',
    '현역가왕', '쇼미더머니', '팬텀싱어', '걸스플래닛', '보이즈플래닛', '빌드업',
    '퀸덤', '킹덤', '나는 가수다', '보컬전쟁', '오디션', '더보이스', '아메리칸 아이돌', '마스크드 싱어',
    'the voice', 'american idol', 'masked singer'
  ];

  const VARIETY_SHOWS = [
    '나 혼자 산다', '나혼산', '전지적 참견 시점', '전참시', '유 퀴즈 온 더 블럭', '유퀴즈',
    '아는 형님', '아는형님', '런닝맨', '라디오스타', '놀면 뭐하니', '미운 우리 새끼', '미우새',
    '짠한형', '핑계고', '살롱드립', '심야괴담회', '꼬꼬무', '동상이몽'
  ];

  const FESTIVAL_KEYWORDS = [
    '워터밤', 'waterbomb', '대학 축제', '대학축제', '캠퍼스 축제', '대동제',
    '흠뻑쇼', '서머소닉', '코첼라', 'coachella', '드림콘서트', '록 페스티벌',
    '락 페스티벌', '재즈 페스티벌', '펜타포트', '축하공연', '시상식 축하무대'
  ];

  const isProgramOrFestival = (cand: string) => {
    const c = cand.toLowerCase().replace(/\s+/g, '');
    return COMPETITION_SHOWS.some(s => s.toLowerCase().replace(/\s+/g, '') === c) ||
           VARIETY_SHOWS.some(s => s.toLowerCase().replace(/\s+/g, '') === c) ||
           FESTIVAL_KEYWORDS.some(s => s.toLowerCase().replace(/\s+/g, '') === c);
  };

  const badWords = new Set([
    '포토', '종합', '단독', '속보', '인터뷰', '공식', '심경', '눈물', '미안', '대박', '충격', '행복', '감동',
    '아내', '남편', '결혼', '결혼식', '열애', '이혼', '결별', '비보', '사망', '별세', '추모', 'mvp', '소감',
    '반응', '관객', '시청자', '팬들', '공개', '발표', '확정', '소식', '출연', '주연', '캐스팅', '현장', '스틸컷',
    '음악', '노래', '가수', '무대', '방송', '예능', '역주행', '바이럴', '챌린지', '신드롬'
  ]);

  targetNewsList.forEach(hl => {
    const orig = hl.title;
    const trans = translations[hl.title] || '';
    const combined = `${orig} ${trans}`;
    const combinedLower = combined.toLowerCase();

    // 0. 유행 / 역주행 / SNS 바이럴 / 숏폼 챌린지 매칭
    const isViralMatched =
      /(역주행|차트\s*역주행|음원\s*역주행|음원차트\s*역주행|역주행\s*신화|역주행\s*돌풍|음원\s*차트\s*재진입|순위\s*급상승|다시\s*1위|몇\s*년\s*만에\s*역주행|과거\s*명곡\s*재조명|숨은\s*명곡|숨듣명|알고리즘\s*간택|알고리즘\s*화제|댓글\s*모음|바이럴|숏폼\s*챌린지|댄스\s*챌린지|챌린지\s*열풍|틱톡\s*유행|릴스\s*유행|쇼츠\s*유행|SNS\s*열풍|SNS\s*화제|밈\s*열풍|입소문|sleeper hit|chart resurgence|climbs back|re-enters? charts?|resurfaces|goes viral|gone viral|trending sound|dance challenge|tiktok viral|viral video)/i.test(combined);
    if (isViralMatched) {
      viralScore += 3;
    }

    // A. 행사 / 대학 축제 / 페스티벌 매칭
    const isFestivalMatched =
      /(대학\s*축제|대학축제|캠퍼스\s*축제|대동제|축제\s*무대|축제\s*라인업|축제\s*섭외|축제\s*여신|축제\s*남신|축제\s*직캠|축제\s*떼창|떼창|직캠\s*화제|워터밤|waterbomb|흠뻑쇼|서머소닉|코첼라|coachella|드림콘서트|록\s*페스티벌|재즈\s*페스티벌|펜타포트|행사\s*무대|행사\s*직캠|시상식\s*축하무대|축하\s*공연)/i.test(combined);
    if (isFestivalMatched) {
      festivalScore += 2;
      FESTIVAL_KEYWORDS.forEach(fest => {
        if (combinedLower.includes(fest.toLowerCase())) {
          const displayFest = fest === '워터밤' || fest.toLowerCase() === 'waterbomb' ? '워터밤'
            : fest.includes('축제') || fest === '대동제' ? '대학 축제'
            : fest;
          festivalCandidates.set(displayFest, (festivalCandidates.get(displayFest) || 0) + 2);
        }
      });
    }

    // B. 경연 프로그램 매칭
    const isCompMatched =
      /(복면가왕|불후의\s*명곡|불후|싱어게인|미스터트롯|미스트롯|현역가왕|쇼미더머니|팬텀싱어|걸스플래닛|보이즈플래닛|빌드업|퀸덤|킹덤|나는\s*가수다|보컬\s*전쟁|경연\s*프로그램|경연\s*무대|가왕\s*등극|가왕|올하트|심사위원\s*극찬|레전드\s*무대|가창력\s*폭발|소름\s*돋는|경연|서바이벌\s*오디션|the voice|american idol|masked singer)/i.test(combined);
    if (isCompMatched) {
      competitionScore += 2;
      COMPETITION_SHOWS.forEach(show => {
        if (combinedLower.includes(show.toLowerCase())) {
          const normShow = show === '불후의명곡' ? '불후의 명곡' : show;
          competitionCandidates.set(normShow, (competitionCandidates.get(normShow) || 0) + 3);
        }
      });
    }

    // C. 예능 프로그램 매칭
    const isVarietyMatched =
      /(나\s*혼자\s*산다|나혼산|전참시|전지적\s*참견\s*시점|유퀴즈|유\s*퀴즈|아는\s*형님|런닝맨|라디오스타|놀면\s*뭐하니|미우새|미운\s*우리\s*새끼|짠한형|핑계고|살롱드립|예능\s*출연|예능감|입담\s*폭발|게스트\s*출격|게스트|일상\s*공개|비하인드\s*토크|솔직\s*입담|반전\s*매력|토크쇼|variety show|talk show)/i.test(combined);
    if (isVarietyMatched) {
      varietyScore += 2;
      VARIETY_SHOWS.forEach(show => {
        if (combinedLower.includes(show.toLowerCase())) {
          const normShow = (show === '나혼산' ? '나 혼자 산다' : show === '전참시' ? '전지적 참견 시점' : show === '유퀴즈' ? '유 퀴즈 온 더 블럭' : show === '아는형님' ? '아는 형님' : show === '미우새' ? '미운 우리 새끼' : show);
          varietyCandidates.set(normShow, (varietyCandidates.get(normShow) || 0) + 3);
        }
      });
    }

    // D. 신곡 / 앨범 발매 / 컴백 매칭
    const isReleaseMatched =
      /(신곡|새\s*싱글|새\s*앨범|신보|정규\s*\d+집|미니\s*앨범|\bEP\b|음원\s*공개|선공개\s*곡|선공개|컴백|타이틀곡|뮤직비디오|뮤비|\bMV\b|음원차트\s*1위|차트\s*올킬|음원차트|쇼케이스|신곡\s*발매|새\s*노래|\bnew single\b|\bnew album\b|\bdebut album\b|\bmusic video\b|\btracklist\b|\bsoundtrack\b|\bdiscography\b|\bnew song\b|\bcomeback\b)/i.test(combined);
    if (isReleaseMatched) {
      newReleaseScore += 2;
    }

    // 따옴표로 감싸진 곡명/타이틀 추출
    let match;
    const rx = new RegExp(quoteRegex);
    while ((match = rx.exec(combined)) !== null) {
      const cand = match[1].trim();
      const cleanCandNorm = cand.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
      if (
        cand.length >= 2 &&
        cand.length <= 25 &&
        cleanCandNorm !== normKeyword &&
        !normKeyword.includes(cleanCandNorm) &&
        !badWords.has(cand.toLowerCase()) &&
        !badWords.has(cleanCandNorm) &&
        !isProgramOrFestival(cand)
      ) {
        if (isViralMatched) {
          viralCandidates.set(cand, (viralCandidates.get(cand) || 0) + 3);
        }
        newReleaseCandidates.set(cand, (newReleaseCandidates.get(cand) || 0) + 2);
      }
    }
    const unquotedSong = /(?:신곡|새\s*싱글|타이틀곡|음원|명곡|대표곡|노래)\s+([A-Za-z0-9가-힣]{2,15})/i.exec(combined);
    if (unquotedSong) {
      const cand = unquotedSong[1].trim();
      const cleanCandNorm = cand.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
      if (cand.length >= 2 && cleanCandNorm !== normKeyword && !badWords.has(cand.toLowerCase()) && !isProgramOrFestival(cand)) {
        if (isViralMatched) {
          viralCandidates.set(cand, (viralCandidates.get(cand) || 0) + 2);
        }
        newReleaseCandidates.set(cand, (newReleaseCandidates.get(cand) || 0) + 1);
      }
    }

    // E. 콘서트 / 투어 매칭
    const isConcertMatched =
      /(단독\s*콘서트|콘서트\s*개최|월드투어|전국투어|앙코르\s*콘서트|팬미팅|전석\s*매진|피켓팅|티켓\s*오픈|월드\s*투어|world tour|stadium tour|arena tour|sold out concert)/i.test(combined);
    if (isConcertMatched) {
      concertScore += 2;
    }
  });

  const scores = [
    { type: 'viral_resurgence' as const, score: viralScore },
    { type: 'festival_event' as const, score: festivalScore },
    { type: 'competition' as const, score: competitionScore },
    { type: 'variety' as const, score: varietyScore },
    { type: 'new_release' as const, score: newReleaseScore },
    { type: 'concert' as const, score: concertScore },
  ];

  scores.sort((a, b) => b.score - a.score);
  const topScore = scores[0];

  const getBestTitle = (candMap: Map<string, number>): string | undefined => {
    let bestT: string | undefined;
    let maxCount = 0;
    for (const [title, count] of candMap.entries()) {
      if (count > maxCount) {
        maxCount = count;
        bestT = title;
      }
    }
    return bestT;
  };

  const bestSong = getBestTitle(newReleaseCandidates);
  const bestViralSong = getBestTitle(viralCandidates) || bestSong;

  if (!topScore || topScore.score < 2) {
    return null;
  }

  // 신곡/신보의 경우 명확한 곡명 후보가 없으면서 점수가 4점 미만(단 1건 매칭)인 경우 오탐 방지를 위해 배제
  if (topScore.type === 'new_release' && topScore.score < 4 && !bestSong) {
    return null;
  }

  // 0. 역주행 / SNS 바이럴 / 숏폼 챌린지
  if (topScore.type === 'viral_resurgence') {
    const detailTitle = bestViralSong;
    const songText = detailTitle ? `'${detailTitle}'` : '주요 곡';
    const isActualFestival = targetNewsList.some(n => /축제|페스티벌|대동제|워터밤|흠뻑쇼|서머소닉|코첼라/i.test(n.title));
    const isDanceChallenge = targetNewsList.some(n => /챌린지|틱톡|릴스|쇼츠|dance challenge|tiktok/i.test(n.title));

    let highlight = '';
    if (isActualFestival) {
      highlight = `대학 축제 및 라이브 페스티벌 무대 직캠이 SNS와 알고리즘을 타고 폭발적인 바이럴을 일으키며, ${songText} 음원 차트 역주행 신화로 이어졌습니다.`;
    } else if (isDanceChallenge) {
      highlight = `SNS 숏폼 챌린지(틱톡/릴스/쇼츠) 및 댄스 열풍이 유튜브 알고리즘을 타고 글로벌 바이럴을 일으키며, ${songText} 음원 차트 역주행 및 화제를 견인했습니다.`;
    } else {
      highlight = `유튜브 알고리즘 간택 및 SNS 댓글 모음 바이럴을 통해 ${songText} 노래가 대중에게 재조명되며 뜻밖의 화제성과 함께 음원 차트 역주행을 기록했습니다.`;
    }

    return {
      activityType: 'viral_resurgence',
      activityTypeName: '음원 역주행 · SNS 바이럴',
      detailTitle,
      detailType: 'viral',
      highlight,
      count: Math.ceil(viralScore / 3),
    };
  }

  if (topScore.type === 'festival_event') {
    const detailTitle = getBestTitle(festivalCandidates) || '대학 축제 및 페스티벌';
    const songText = bestSong ? `'${bestSong}' ` : '';
    return {
      activityType: 'festival_event',
      activityTypeName: '페스티벌 · 대학 축제 행사',
      detailTitle,
      detailType: 'festival',
      highlight: `${detailTitle} 무대에서 선보인 ${songText}라이브 직캠과 폭발적인 관객 떼창 열풍이 SNS와 미디어에서 큰 화제를 모았습니다.`,
      count: Math.ceil(festivalScore / 2),
    };
  }

  if (topScore.type === 'competition') {
    const detailTitle = getBestTitle(competitionCandidates) || '음악 경연 프로그램';
    const songText = bestSong ? `'${bestSong}' ` : '';
    return {
      activityType: 'competition',
      activityTypeName: '음악 경연 · 레전드 무대',
      detailTitle,
      detailType: 'show',
      highlight: `'${detailTitle}' 경연 무대에서 ${songText}열창으로 선보인 압도적인 가창력과 감동적인 보컬 무대로 심사위원과 시청자들의 극찬을 받으며 검색 관심이 집중되었습니다.`,
      count: Math.ceil(competitionScore / 2),
    };
  }

  if (topScore.type === 'variety') {
    const detailTitle = getBestTitle(varietyCandidates) || '예능 방송';
    return {
      activityType: 'variety',
      activityTypeName: '예능 출연 · 방송 화제',
      detailTitle,
      detailType: 'show',
      highlight: `인기 예능 '${detailTitle}'에 게스트로 출연하여 보여준 솔직한 입담과 반전 매력의 일상이 방영 직후 대중의 큰 관심과 웃음을 자아냈습니다.`,
      count: Math.ceil(varietyScore / 2),
    };
  }

  if (topScore.type === 'new_release') {
    const detailTitle = bestSong;
    const titleText = detailTitle ? `'${detailTitle}'` : '신보';
    return {
      activityType: 'new_release',
      activityTypeName: '신곡 · 음원 발매',
      detailTitle,
      detailType: 'song',
      highlight: `신곡 ${titleText} 음원 및 공식 뮤직비디오(MV) 공개와 컴백 소식이 주요 언론에 보도되며 팬들과 리스너들의 뜨거운 관심과 음원 차트 호응을 이끌어냈습니다.`,
      count: Math.ceil(newReleaseScore / 2),
    };
  }

  if (topScore.type === 'concert') {
    return {
      activityType: 'concert',
      activityTypeName: '단독 콘서트 · 투어',
      detailType: 'concert',
      highlight: `단독 콘서트 및 대규모 투어 개최 소식과 함께 티켓 오픈 직후 전석 매진을 기록하며 막강한 티켓 파워와 뜨거운 팬덤의 인기를 입증했습니다.`,
      count: Math.ceil(concertScore / 2),
    };
  }

  return null;
};
