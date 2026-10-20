import type {
  AnalysisReport,
  CategoryMatcher,
  NewsItem,
  RankingItemContext,
} from './types';
import { CATEGORIES, CATEGORY_PRIORITY_ORDER } from './categories';
import {
  isWithinOneMonth,
  escapeRegExp,
  COMMON_NAMES,
  FAMOUS_BAND_MEMBERS,
  FAMOUS_BANDS,
} from './stopwords';
import { inspectAndShieldHeadline } from './metaphorShield';
import { detectWorkMedia } from './detectors/workMediaDetector';
import { detectMusicActivity } from './detectors/musicActivityDetector';
import { verifySelfDeath } from './detectors/deathVerifier';
import { extractKeyTopics } from './detectors/topicExtractor';
import { detectRelatedRanking } from './detectors/relatedRankingDetector';
import type { SmartQueryInfo } from './newsFetcher';

export interface AnalysisInput {
  keyword: string;
  lang: 'ko' | 'en';
  news: NewsItem[];
  translations: Record<string, string>;
  smartInfo: SmartQueryInfo;
  rankingContext?: RankingItemContext[];
  previousDayContext?: RankingItemContext[];
  currentRank?: number;
}

function getArticleWeight(pubDate: string | undefined, idx: number): number {
  let weight = 1.0;
  if (idx < 3) weight += 0.35; // 최상단 Top 3 헤드라인 가산점
  else if (idx < 8) weight += 0.15; // 상위권 가산점

  if (pubDate) {
    const pubTime = Date.parse(pubDate);
    if (!isNaN(pubTime)) {
      const ageDays = (Date.now() - pubTime) / (1000 * 60 * 60 * 24);
      if (ageDays <= 2) weight *= 1.5; // 48시간 이내 최신 속보 1.5배
      else if (ageDays <= 7) weight *= 1.2; // 1주일 이내 1.2배
      else if (ageDays >= 14) weight *= 0.6; // 2주 이상 경과한 과거 기사 감쇠
    }
  }
  return Number(weight.toFixed(2));
}

export const runNewsAnalysis = (input: AnalysisInput): AnalysisReport | null => {
  const {
    keyword,
    lang,
    news,
    translations,
    smartInfo,
    rankingContext,
    previousDayContext,
    currentRank,
  } = input;

  if (news.length === 0) return null;

  const {
    normalizedKeyword,
    disambigContext,
    baseKeyword,
    cleanKeyword,
    isAcademicOrCatalogList,
  } = smartInfo;

  // 1. 기사 날짜 검사
  const articlesWithValidDate = news.filter((n) => n.pubDate && !isNaN(new Date(n.pubDate).getTime()));
  const recentNews = news.filter((n) => isWithinOneMonth(n.pubDate));

  // 크롤링한 뉴스들의 시간대가 최근 1달 이내에 전혀 없는 경우 -> 판단 보류
  if (articlesWithValidDate.length > 0 && recentNews.length === 0) {
    const sortedPast = [...articlesWithValidDate].sort((a, b) => {
      return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
    });
    const latestPast = sortedPast[0] || news[0];

    return {
      category: lang === 'ko' ? '판단 보류' : '판단 보류 (외신)',
      badgeStyle:
        'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
      explanation:
        lang === 'ko'
          ? '수집된 기사들의 보도 시점이 모두 최근 1달 이전입니다. 시의성 있는 최신 뉴스가 확인되지 않아 트래픽 급증 원인에 대한 판단을 보류합니다. 과거 이슈의 단순 재확산, 특정 커뮤니티 바이럴, 또는 기념일 등 미디어 외적 요인으로 인한 관심 증가일 가능성이 높습니다.'
          : '수집된 외신 기사 중 최근 1달 이내에 보도된 뉴스가 확인되지 않았습니다. 시의성 있는 최신 보도가 없어 원인 판단을 보류하며, 과거 이슈 재조명 또는 SNS/커뮤니티 중심의 바이럴일 가능성이 높습니다.',
      keyTopics: [],
      evidenceArticle: latestPast,
      isDeferred: true,
      sampleCount: 0,
      isSmallSample: false,
      relatedRanking: null,
    };
  }

  const targetNews = recentNews.length > 0 ? recentNews : news;
  const sampleCount = targetNews.length;
  const isSmallSample = sampleCount <= 5;

  // 2. 카테고리 매칭 점수 집계 (비유어 중립화 쉴드 적용)
  const categoryScores: Record<string, number> = {};
  const categoryHitCounts: Record<string, number> = {};
  const categoryMatches: Record<string, NewsItem[]> = {};

  CATEGORIES.forEach((c) => {
    categoryScores[c.id] = 0;
    categoryHitCounts[c.id] = 0;
    categoryMatches[c.id] = [];
  });

  const isSubjectTvOrMedia =
    /\b(tv series|television series|miniseries|reality show|game show|competition|season \d+|dancing with the stars|\bdwts\b)\b/i.test(
      `${normalizedKeyword} ${disambigContext}`
    ) || /(드라마|시리즈|예능|프로그램|시즌\s*\d+)/i.test(`${normalizedKeyword} ${disambigContext}`);

  const isSubjectSeasonTopic =
    /\b(season\s*(\d+|[ivx]+)|new\s*season)\b/i.test(`${normalizedKeyword} ${disambigContext}`) ||
    /(시즌\s*\d+|새\s*시즌|신규\s*시즌|시즌제)/i.test(`${normalizedKeyword} ${disambigContext}`) ||
    (/\b(tv series|television series|reality show|variety show|drama)\b/i.test(`${normalizedKeyword} ${disambigContext}`) &&
      /\bseason\b/i.test(normalizedKeyword));

  targetNews.forEach((item, idx) => {
    const orig = item.title;
    const trans = translations[item.title] || '';

    // [신규] 선행 비유어/픽션/루머 쉴드 적용 (orig & trans 양쪽 모두 보호)
    const shieldOrig = inspectAndShieldHeadline(orig);
    const shieldTrans = inspectAndShieldHeadline(trans);
    const sanitizedOrig = shieldOrig.sanitizedHeadline;
    const sanitizedTrans = shieldTrans.sanitizedHeadline;
    const suppressedSet = new Set([
      ...shieldOrig.suppressCategories,
      ...shieldTrans.suppressCategories,
    ]);

    const combined = `${sanitizedOrig} ${sanitizedTrans}`;
    const articleWeight = getArticleWeight(item.pubDate, idx);

    // 군사 공습, 무력 공격, 참사 관련 맥락 감지
    const isMilitaryOrCrisis =
      /\b(airstrike|airstrikes|air strike|missile|missiles|drone strike|drone attack|military|houthi|houthis|militia|bombing|explosion|crash|plane crash|mass shooting)\b/i.test(
        sanitizedOrig
      ) ||
      /(공습|미사일|드론\s*공격|군사\s*작전|교전|후티|반군|민병대|폭발\s*사고|추락\s*사고|총기\s*난사|대형\s*참사|보안\s*경고)/i.test(
        combined
      );

    // TV 경연/서바이벌/예능 프로그램 및 헌정 무대 맥락 감지
    const isTvCompetitionOrVariety =
      isSubjectTvOrMedia ||
      shieldOrig.isStageTribute ||
      shieldTrans.isStageTribute ||
      /\b(dancing with the stars|\bdwts\b|dedication night|recreates? iconic|recreates? .+ moves|recreates? .+ moment|bachelor|bachelorette|american idol|the voice|masked singer|survivor|reality tv|reality show|talk show|leaderboard|judges|celeb cast|pro partner)\b/i.test(
        sanitizedOrig
      ) ||
      /(댄싱\s*위드\s*더\s*스타|불후의\s*명곡|복면가왕|유퀴즈|싱어게인|미스터트롯|미스트롯|현역가왕|헌정\s*무대|헌정\s*공연|명장면\s*재현|안무\s*재현|경연|서바이벌\s*예능)/i.test(
        combined
      );

    CATEGORIES.forEach((c) => {
      // 쉴드에서 억제된 카테고리면 스킵 (예: 픽션 속 살인 -> 범죄/사건 카테고리 억제)
      if (suppressedSet.has(c.id)) {
        return;
      }

      let matchesEn = c.enRegex.test(sanitizedOrig);
      let matchesKo = c.koRegex.test(combined);

      // 예능 프로그램 회차 우승은 공식 시상식/챔피언십에서 제외
      if (c.id === 'award_win') {
        const isTvVariety =
          isTvCompetitionOrVariety ||
          /(불후의\s*명곡|불후|복면가왕|음악방송|뮤직뱅크|음악중심|인기가요|예능|유퀴즈)/i.test(combined);
        const isSports =
          /\b(match|game|goal|vs|score|league|premier league|champions league|bundesliga|la liga|nba|nfl|mlb)\b/i.test(
            sanitizedOrig
          ) || /(축구|야구|농구|배구|경기|골인|득점|리그|승리)/i.test(combined);
        if (isTvVariety || isSports) {
          matchesKo = false;
          matchesEn = false;
        }
      }

      // TV 경연 탈락, 경연 점수, 헌정 무대 및 교도소/범죄 사건은 스포츠에서 엄격 제외
      if (
        c.id === 'sports_award_mvp' ||
        c.id === 'sports_defeat_crisis' ||
        c.id === 'sports_victory' ||
        c.id === 'sports_transfer_general'
      ) {
        const isCrimeOrPrison =
          /\b(prison|inmate|jail|drug lord|cartel|gang|assault|murder|homicide|arrest|arrested|police)\b/i.test(
            sanitizedOrig
          ) || /(교도소|감옥|수감자|마약왕|카르텔|갱단|폭행|살인|체포|경찰)/i.test(combined);
        if (isTvCompetitionOrVariety || isCrimeOrPrison) {
          matchesKo = false;
          matchesEn = false;
        }
      }

      // 경연 프로그램 헌정 무대는 실제 최근 비보로 인한 동료 별세 애도에서 제외
      if (c.id === 'tribute_mourning') {
        const isStageTribute =
          isTvCompetitionOrVariety ||
          shieldOrig.isStageTribute ||
          shieldTrans.isStageTribute ||
          /\b(dedication night|recreates?|dance|dancing|moves|routine|stage|performance|episode)\b/i.test(
            sanitizedOrig
          ) ||
          /(헌정\s*무대|헌정\s*공연|안무|댄스|재현|경연)/i.test(combined);
        const hasActualRecentDeathWords =
          /\b(dies at \d+|died at \d+|dead at \d+|passes? away|passed away|found dead|suicide|cause of death|funeral|obituary)\b/i.test(
            sanitizedOrig
          ) || /(별세|타계|사망|숨진|향년|부고|빈소|조문|영결식)/i.test(combined);
        if (isStageTribute && !hasActualRecentDeathWords) {
          matchesKo = false;
          matchesEn = false;
        }
      }

      // 동료 추모 기사나 참사 뉴스는 본인 부고(death)에서 엄격 제외하되,
      // 추모 대상이 검색 주체 본인인 경우(본인의 사망)는 제외하지 않음
      if (c.id === 'death') {
        const isTributeMourning =
          /\b(pays? tribute|paying tribute|paid tribute|tributes? to|tributes? from|mourns?|mourning|mourned|remembers?|remembering|remembered|honors?|honoring|honored|breaks? silence|heartbroken|speaks? out on|reacts? to (the )?(death|passing)|emotional tribute|touching tribute|co-star (dies|death|dead|passing)|loss of co-star|condolences?|grieves?|grieving|remembrances?|praises? .+ in tribute)\b/i.test(
            sanitizedOrig
          ) ||
          /(추모글|추모\s*메시지|애도\s*뜻|애도를\s*표|비보에\s*눈물|비보에\s*먹먹|비보\s*접하고|눈물의\s*추모|故\s*[가-힣]+.*추모|故\s*[가-힣]+.*애도|선배님\s*편히|동료\s*배우.*별세|동료.*비보|비보에\s*비통|비보에\s*충격|애도\s*물결\s*동참|마지막\s*인사|명복을\s*빕니다|가슴이\s*미어져|눈물의\s*조문|조문|빈소\s*찾아)/i.test(
            combined
          );

        const normKey = cleanKeyword.toLowerCase().replace(/[^a-z0-9가-힣\s]/g, '').trim();
        const keyTokens = normKey.split(/\s+/).filter((t) => t.length >= 2 && !COMMON_NAMES.has(t));
        const escapedKeyTokens = keyTokens.map(escapeRegExp);
        const isTributeAboutSubject =
          escapedKeyTokens.length > 0 &&
          (new RegExp(`\\b(tributes? to|mourns?|remembers?|honors?|costars? of|remembering)\\b[\\s\\S]{0,50}\\b(${escapedKeyTokens.join('|')})\\b`, 'i').test(sanitizedOrig) ||
           new RegExp(`\\b(${escapedKeyTokens.join('|')})['’]?s?\\b[\\s\\S]{0,60}\\b(death|passing|suicide|tragic loss)\\b`, 'i').test(sanitizedOrig));

        if (
          (isTributeMourning && !isTributeAboutSubject) ||
          isMilitaryOrCrisis ||
          isTvCompetitionOrVariety ||
          shieldOrig.isStageTribute ||
          shieldTrans.isStageTribute
        ) {
          matchesKo = false;
          matchesEn = false;
        }
      }

      // 스포츠 수상 시상식 및 MVP에서 수상 불발/보이콧/2위 기사는 제외
      if (c.id === 'sports_award_mvp' || c.id === 'award_win') {
        const isAwardSnubOrBoycott =
          /\b(misses?\s+out\s+on\s+(?:award|trophy|ballon)|snubbed?|boycotts?|boycotted|finishing\s+second|runner-up|denied\s+(?:award|ballon)|loses?\s+out\s+on)\b/i.test(
            sanitizedOrig
          ) || /(수상\s*불발|시상식\s*불참|보이콧|아쉬운\s*2위|고배)/i.test(combined);
        if (isAwardSnubOrBoycott) {
          matchesKo = false;
          matchesEn = false;
        }
      }

      // 신작/음반 발매(release_comeback)가 스포츠 경기/기록 기사에 오탐되는 것 차단
      if (c.id === 'release_comeback') {
        const isSportsArticle =
          /\b(mlb|nba|nfl|nhl|premier\s+league|champions\s+league|la\s+liga|serie\s+a|bundesliga|fifa|world\s+series|super\s+bowl|world\s+cup|ballon\s*d['’]?or|home\s*runs?|stolen\s+bases?|touchdowns?|hat-?tricks?|clean\s+sheets?|pitcher|quarterback|goalkeeper|striker|midfielder)\b/i.test(
            sanitizedOrig
          ) ||
          /(프로야구|메이저리그|월드시리즈|프리미어리그|챔피언스리그|손흥민|오타니|축구|야구|농구|배구|골프)/i.test(
            combined
          );
        if (isSportsArticle) {
          matchesKo = false;
          matchesEn = false;
        }
      }

      // 스포츠 경기 주체 승패 판별 (영문/국문 양방향 문법 인식)
      const sportsKeyTokens = cleanKeyword
        .toLowerCase()
        .replace(/[^a-z0-9가-힣\s]/g, '')
        .split(/\s+/)
        .filter((t) => t.length >= 2 && !['new', 'los', 'san', 'the', 'fc', 'ac'].includes(t));
      const sportsTokenList = sportsKeyTokens.length > 0 ? sportsKeyTokens : [cleanKeyword.toLowerCase()];
      const sportsSubj = `(?:${sportsTokenList.map(escapeRegExp).join('|')})`;

      // 1) 검색 주체가 명백한 승리자(Winner)인 패턴
      const isSubjectActiveWinnerEn =
        new RegExp(
          `\\b${sportsSubj}\\b\\s*(?:(?:['"‘“][^'"’”]+['"’”]|\\S+)\\s+){0,3}\\b(defeats?|beats?|downs?|tops?|edges?|sweeps?|crushes?|routs?|overpowers?|eliminates?|breezes?\\s+past|cruises?\\s+past|topples?|slams?|overcomes?|punches?\\s+ticket|secures?\\s+win|seals?\\s+win)\\b`,
          'i'
        ).test(sanitizedOrig) ||
        new RegExp(
          `\\b${sportsSubj}\\b\\s*(?:(?:['"‘“][^'"’”]+['"’”]|\\S+)\\s+){0,4}\\b(wins?|won|advanc(?:es?|ed|ing)\\s+to|clinch(?:es?|ed|ing)?|celebrat(?:es?|ed|ing)|crowned|captur(?:es?|ed)|claims?|lift(?:s|ed)?\\s+trophy|hoist(?:s|ed)?\\s+trophy|triumph(?:s|ed)?|surges?|dominat(?:es?|ed)|advancing)\\b`,
          'i'
        ).test(sanitizedOrig) ||
        new RegExp(
          `\\b(?:defeated|beaten|swept|eliminated|routed|crushed|downed|stunned)\\s+by\\s+(?:(?:['"‘“][^'"’”]+['"’”]|\\S+)\\s+){0,2}\\b${sportsSubj}\\b`,
          'i'
        ).test(sanitizedOrig);

      const isSubjectActiveWinnerKo =
        new RegExp(
          `${escapeRegExp(cleanKeyword)}[^,·….]*?(역전승|완승|대승|승리|스윕|격침|제압|꺾고|물리치고|진출|월드시리즈\\s*진출|결승\\s*진출|우승|제패|시리즈\\s*스윕)`,
          'i'
        ).test(combined) ||
        new RegExp(`(거함|강호|디펜딩).*?(격침|제압|물리치|꺾).*?${escapeRegExp(cleanKeyword)}`, 'i').test(
          combined
        ) ||
        new RegExp(
          `${escapeRegExp(cleanKeyword)}에\\s*(?:\\d+전\\s*)?(?:전패|패배|완패|충격패|역전패|무릎|발목|일격|탈락|스윕)`,
          'i'
        ).test(combined);

      const isSubjectClearWinner = isSubjectActiveWinnerEn || isSubjectActiveWinnerKo;

      // 2) 검색 주체가 명백한 패배자(Loser) 또는 부상/경질 당사자인 패턴
      const isSubjectActiveLoserEn =
        new RegExp(
          `\\b${sportsSubj}\\b\\s*(?:(?:['"‘“][^'"’”]+['"’”]|\\S+)\\s+){0,3}\\b(falls?\\s+(?:to|short)|lost\\s+to|loses?\\s+to|bows?\\s+out|crashed?\\s+out|eliminated|swept\\s+by|beaten\\s+by|defeated\\s+by|crushed\\s+by|routed\\s+by|stunned\\s+by|humbled\\s+by|chokes?|choked|squanders?\\s+lead|blows?\\s+lead|misses?\\s+out\\s+on|snubbed?|boycotts?|finishing\\s+second|runner-up)\\b`,
          'i'
        ).test(sanitizedOrig) ||
        new RegExp(
          `\\b(defeats?|beats?|downs?|tops?|edges?|sweeps?|crushes?|routs?|overpowers?|eliminates?)\\s+(?:(?:['"‘“][^'"’”]+['"’”]|\\S+)\\s+){0,3}\\b${sportsSubj}\\b`,
          'i'
        ).test(sanitizedOrig) ||
        new RegExp(
          `\\b${sportsSubj}\\b\\s*(?:(?:['"‘“][^'"’”]+['"’”]|\\S+)\\s+){0,3}\\b(sacked|dismissed|fired|benched|ruled\\s+out|carted\\s+off|stretchered\\s+off|injur(?:y|ed)|torn\\s+(?:acl|achilles|meniscus)|hamstring|surgery|suspended)\\b`,
          'i'
        ).test(sanitizedOrig) ||
        new RegExp(
          `\\b(sacks?|dismiss(?:es|ed)?|fires?)\\s+(?:(?:['"‘“][^'"’”]+['"’”]|\\S+)\\s+){0,2}\\b${sportsSubj}\\b`,
          'i'
        ).test(sanitizedOrig);

      const isSubjectActiveLoserKo =
        new RegExp(
          `${escapeRegExp(cleanKeyword)}(?:은|는|이|가|,)?\\s*[^,·….]*?(패배|완패|역전패|충격패|전패|탈락|무산|연패|부상|결장|강등|경질)`,
          'i'
        ).test(combined) ||
        new RegExp(`${escapeRegExp(cleanKeyword)}[\\s\\S]{0,15}(패|탈락|사퇴|경질|부상)`, 'i').test(combined);

      const isSubjectExplicitLoser = isSubjectActiveLoserEn || isSubjectActiveLoserKo;

      // 경기 패배 키워드가 있어도 검색 주체가 승리한 경우 승전보로 유지
      if (c.id === 'sports_victory') {
        const isDefeatOrInjury =
          /\b(defeat|defeated|defeats|loss|losses|lost|crash out|eliminated|knocked out|relegation|relegated|shock defeat|upset loss|injury|injured|hamstring|torn acl|season-ending|ruled out|sacked|dismissed|benched|blow)\b/i.test(
            sanitizedOrig
          ) ||
          /(패배|완패|대패|충격패|역전패|전패|탈락|무산|강등|퇴장|부상|결장|시즌\s*아웃|십자인대|햄스트링|수술대|들것|경질|사퇴|연패|졸전|아쉬운\s*패배)/i.test(
            combined
          );

        if (isSubjectExplicitLoser && !isSubjectClearWinner) {
          matchesKo = false;
          matchesEn = false;
        } else if (isDefeatOrInjury && !isSubjectClearWinner) {
          matchesKo = false;
          matchesEn = false;
        }
      }

      // 반대로 검색 주체가 승리한 기사는 스포츠 패배에서 제외
      if (c.id === 'sports_defeat_crisis') {
        if (isSubjectClearWinner && !isSubjectExplicitLoser) {
          matchesKo = false;
          matchesEn = false;
        }
      }

      // 주가 폭락이나 실적 쇼크 키워드가 있으면 경제 호재에서 제외
      if (c.id === 'business_boom') {
        const isBusinessCrisis =
          /\b(plunges?|tumbles?|crashes?|slumps?|earnings miss|profit drops?|loss widens|bearish|layoffs?|bankruptcy|bankrupt|insolvent|default|liquidation|downgrade)\b/i.test(
            sanitizedOrig
          ) ||
          /(주가\s*폭락|하한가|신저가|어닝\s*쇼크|실적\s*부진|영업익\s*급감|적자|부도|파산|법정관리|상장폐지|구조조정|디폴트)/i.test(
            combined
          );
        if (isBusinessCrisis) {
          matchesKo = false;
          matchesEn = false;
        }
      }

      // 결별이나 이혼 키워드가 있으면 결혼/열애 경사에서 제외
      if (
        c.id === 'wedding_marriage' ||
        c.id === 'spouse_cheer_couple' ||
        c.id === 'dating_romance' ||
        c.id === 'baby_pregnancy'
      ) {
        const isBreakup =
          /\b(divorce|divorced|divorcing|split|splits|breakup|broke up|part ways|separated|separation|called off|broken engagement)\b/i.test(
            sanitizedOrig
          ) || /(결별|이혼|파경|별거|파혼|남남으로|연인\s*관계\s*정리)/i.test(combined);
        if (isBreakup) {
          matchesKo = false;
          matchesEn = false;
        }
      }

      // 드라마/시리즈 새 시즌 검색어인 경우 series_season에 매칭 가산
      if (c.id === 'series_season' && isSubjectSeasonTopic) {
        matchesEn = true;
        matchesKo = true;
      }

      if (matchesEn || matchesKo) {
        categoryScores[c.id] += articleWeight;
        categoryHitCounts[c.id] += 1;
        categoryMatches[c.id].push(item);
      }
    });
  });

  // 3. 도메인 특화 감지기 실행
  const workMediaInfo = detectWorkMedia(
    targetNews,
    cleanKeyword,
    categoryScores,
    translations,
    disambigContext
  );
  const musicActivityInfo = !workMediaInfo
    ? detectMusicActivity(targetNews, cleanKeyword, categoryScores, translations)
    : null;

  let keyTopics = extractKeyTopics(
    targetNews,
    keyword,
    baseKeyword,
    disambigContext,
    lang,
    translations,
    sampleCount
  );

  if (workMediaInfo) {
    keyTopics = [workMediaInfo.title, ...keyTopics.filter((k) => k !== workMediaInfo.title)].slice(0, 3);
  } else if (musicActivityInfo?.detailTitle) {
    keyTopics = [
      musicActivityInfo.detailTitle,
      ...keyTopics.filter((k) => k !== musicActivityInfo.detailTitle),
    ].slice(0, 3);
  }

  // 4. 본인 직접 사망 여부 엄격 검증
  const isMemorialDirectory =
    /^deaths\s+in\s+\d{4}/i.test(cleanKeyword) ||
    /\b(deaths in|list of deaths)\b/i.test(cleanKeyword) ||
    /(사망자\s*명단|부고\s*인명록|타계자\s*명단)/i.test(cleanKeyword);

  const isSelfDied = verifySelfDeath(
    cleanKeyword,
    targetNews,
    translations,
    isMemorialDirectory,
    isSubjectTvOrMedia
  );

  const casualtyScore = categoryScores['accident_casualty'] || 0;
  const militaryScore = categoryScores['military_conflict'] || 0;
  const tributeScore = categoryScores['tribute_mourning'] || 0;

  if (isSelfDied) {
    categoryScores['tribute_mourning'] = 0;
    categoryScores['death'] = Math.max(categoryScores['death'] || 0, 3);
    categoryHitCounts['death'] = Math.max(categoryHitCounts['death'] || 0, 2);
    if (!categoryMatches['death'] || categoryMatches['death'].length === 0) {
      categoryMatches['death'] = targetNews.filter((n) =>
        /death|dies|died|dead|suicide|obituary|passing|별세|타계|사망/i.test(
          `${n.title} ${translations[n.title] || ''}`
        )
      );
      if (categoryMatches['death'].length === 0) {
        categoryMatches['death'] = [targetNews[0]];
      }
    }
  } else if (militaryScore >= 2 || casualtyScore >= 2 || tributeScore >= 1 || isMemorialDirectory) {
    categoryScores['death'] = 0;
  }

  if (
    !isSubjectTvOrMedia &&
    (categoryScores['tv_competition_tribute'] || 0) >= 1 &&
    (categoryScores['broadcast'] || 0) >= 1
  ) {
    categoryScores['tv_competition_tribute'] = Math.max(
      categoryScores['tv_competition_tribute'] || 0,
      categoryScores['broadcast'] || 0
    );
  }

  // 5. 최다 득표 카테고리 선정
  let bestCategory: CategoryMatcher | null = null;
  let maxScore = 0;

  const minMatchesRequired =
    sampleCount <= 3 ? 1 : sampleCount <= 7 ? 2 : Math.max(3, Math.ceil(sampleCount * 0.15));

  for (const c of CATEGORIES) {
    const score = categoryScores[c.id] || 0;
    const hitCount = categoryHitCounts[c.id] || 0;

    if (c.id === 'death' && targetNews.length >= 4 && hitCount < 2) {
      continue;
    }

    if (hitCount < 1) {
      continue;
    }

    if (score > maxScore) {
      maxScore = score;
      bestCategory = c;
    } else if (score === maxScore && score > 0 && bestCategory) {
      const currentIdx = CATEGORY_PRIORITY_ORDER.indexOf(c.id);
      const bestIdx = CATEGORY_PRIORITY_ORDER.indexOf(bestCategory.id);
      if (currentIdx !== -1 && (bestIdx === -1 || currentIdx < bestIdx)) {
        bestCategory = c;
      }
    }
  }

  // 6. 랭킹 간 상호 연관성 감지
  const relatedRanking = detectRelatedRanking(
    bestCategory,
    targetNews,
    cleanKeyword,
    rankingContext,
    previousDayContext,
    currentRank,
    translations,
    isSelfDied,
    isMemorialDirectory
  );

  // 7. 공식 부고 인명록 리포트
  if (isMemorialDirectory) {
    return {
      category: lang === 'ko' ? '연간 공식 부고 집계 · 인명록' : '연간 공식 부고 집계 · 인명록 (외신)',
      badgeStyle:
        'bg-zinc-200 text-zinc-900 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700',
      explanation:
        lang === 'ko'
          ? '2026년 한 해 동안 별세한 전 세계 유명 인사와 문화예술계 스타들의 공식 부고를 일자별로 총정리한 위키백과 인명록 문서입니다. 최근 주요 인물의 비보 소식이 전해지며 대중의 추모 및 확인 검색이 집중되었습니다.'
          : '2026년 한 해 동안 별세한 글로벌 유명 인사들의 공식 부고를 총정리한 위키백과 인명록 문서로, 최근 전해진 유명 인사의 비보 소식에 따라 추모 및 확인 검색이 집중되었습니다.',
      keyTopics: ['부고집계', '연간기록', '추모인명록'],
      evidenceArticle: targetNews[0] || news[0],
      isDeferred: false,
      sampleCount,
      isSmallSample: false,
      relatedRanking,
    };
  }

  // 8. 학술/수학 색인 문서의 AI 봇 크롤링 트래픽 판별
  if (isAcademicOrCatalogList && (isSmallSample || maxScore < 2)) {
    return {
      category: lang === 'ko' ? '학술·수학 인덱스 · AI/봇 트래픽' : '학술·과학 인덱스 · AI/봇 트래픽 (외신)',
      badgeStyle:
        'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-800',
      explanation:
        lang === 'ko'
          ? `'${cleanKeyword}'는 다양한 수학·물리 방정식과 학술 이론이 총정리된 대표적인 색인(인덱스) 문서입니다. 최근 언론 보도가 거의 없거나 관련 속보가 확인되지 않는 상태에서 실검에 오른 것은, 대중의 뉴스 관심보다는 AI 모델 학습용 과학 데이터 대량 크롤링(웹 스크래핑), 자동화 봇의 인덱스 수집 또는 시스템 수식(LaTeX) 렌더링 벤치마크 트래픽이 집중 유입된 '고스트 트래픽' 현상으로 추정됩니다.`
          : `'${cleanKeyword}' serves as an extensive index cataloging scientific and mathematical equations. With minimal corresponding news coverage, this sudden traffic surge is strongly estimated to be driven by AI model training web scrapers, automated bot indexing, or computational LaTeX rendering benchmarks rather than organic breaking news.`,
      keyTopics: ['학술인덱스', '수학방정식', 'AI데이터수집'],
      evidenceArticle: targetNews[0] || news[0],
      isDeferred: false,
      sampleCount,
      isSmallSample,
      relatedRanking,
    };
  }

  // 9. 카테고리 확정 리포트
  const minRequiredForBest = bestCategory?.minMatchesRequired ?? minMatchesRequired;
  if (bestCategory && (categoryHitCounts[bestCategory.id] || 0) >= minRequiredForBest) {
    const categoryId: string = bestCategory.id;
    const matchingItems = categoryMatches[categoryId] || [];
    const evidenceArticle = matchingItems[0] || targetNews[0];

    const isNonMediaCategory =
      categoryId.startsWith('sports_') ||
      categoryId === 'death' ||
      categoryId === 'family_bereavement' ||
      categoryId === 'tribute_mourning' ||
      categoryId === 'rumor_debunking' ||
      categoryId === 'accident_casualty' ||
      categoryId === 'military_conflict' ||
      categoryId === 'politics_diplomacy' ||
      categoryId === 'incident_society' ||
      categoryId === 'series_season';

    if (
      workMediaInfo &&
      !isNonMediaCategory &&
      (categoryId === 'release_comeback' || categoryId === 'boxoffice_hit' || workMediaInfo.count >= 2)
    ) {
      return {
        category:
          lang === 'ko'
            ? `신작 ${workMediaInfo.mediaTypeName} · 《${workMediaInfo.title}》`
            : `신작 ${workMediaInfo.mediaTypeName} · '${workMediaInfo.title}' (외신)`,
        badgeStyle:
          'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/70 dark:text-teal-200 dark:border-teal-800',
        explanation:
          workMediaInfo.title.toLowerCase().replace(/[^a-z0-9가-힣]/g, '') ===
          cleanKeyword.toLowerCase().replace(/[^a-z0-9가-힣]/g, '')
            ? lang === 'ko'
              ? `화제작 '${workMediaInfo.title}'의 신규 ${workMediaInfo.mediaTypeName} 제작 및 공식 ${workMediaInfo.eventTypeName} 소식이 주요 언론을 통해 집중 보도되며 팬들과 시청자들의 뜨거운 기대와 관심이 집중되었습니다.`
              : `신작 ${workMediaInfo.mediaTypeName} '${workMediaInfo.title}'의 공식 ${workMediaInfo.eventTypeName} 소식이 주요 외신을 통해 집중 타전되며 글로벌 시청자들과 팬들의 뜨거운 기대와 관심이 집중되었습니다.`
            : lang === 'ko'
            ? `배우 '${cleanKeyword}'의 신작 ${workMediaInfo.mediaTypeName} 《${workMediaInfo.title}》의 ${workMediaInfo.eventTypeName} 소식이 언론에 집중 보도되며, 작품 속 새로운 연기 변신과 호흡에 대한 대중의 뜨거운 기대감이 검색 유입을 견인했습니다.`
            : `배우 '${cleanKeyword}'가 주연/출연한 신작 ${workMediaInfo.mediaTypeName} '${workMediaInfo.title}'의 공식 ${workMediaInfo.eventTypeName} 소식이 주요 외신을 통해 집중 타전되며 글로벌 팬들의 뜨거운 기대와 관심이 집중되었습니다.`,
        keyTopics,
        evidenceArticle,
        isDeferred: false,
        sampleCount,
        isSmallSample,
        relatedRanking,
        workMediaInfo,
        musicActivityInfo: null,
      };
    }

    if (musicActivityInfo && !isNonMediaCategory) {
      let dynamicCategory = '';
      let badgeStyle =
        'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950/70 dark:text-violet-200 dark:border-violet-800';

      if (musicActivityInfo.activityType === 'viral_resurgence') {
        dynamicCategory = musicActivityInfo.detailTitle
          ? lang === 'ko'
            ? `음원 역주행 · 《${musicActivityInfo.detailTitle}》`
            : `차트 역주행 · '${musicActivityInfo.detailTitle}' (외신)`
          : lang === 'ko'
          ? 'SNS 바이럴 · 음원 역주행'
          : 'SNS 바이럴 · 역주행 돌풍 (외신)';
        badgeStyle =
          'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-800';
      } else if (musicActivityInfo.activityType === 'new_release') {
        dynamicCategory = musicActivityInfo.detailTitle
          ? lang === 'ko'
            ? `신곡 발매 · 《${musicActivityInfo.detailTitle}》`
            : `신곡 발매 · '${musicActivityInfo.detailTitle}' (외신)`
          : lang === 'ko'
          ? '가수 컴백 · 신보 발표'
          : '가수 컴백 · 신보 발표 (외신)';
        badgeStyle =
          'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/70 dark:text-teal-200 dark:border-teal-800';
      } else if (musicActivityInfo.activityType === 'competition') {
        dynamicCategory = musicActivityInfo.detailTitle
          ? lang === 'ko'
            ? `음악 경연 · 《${musicActivityInfo.detailTitle}》`
            : `음악 경연 · '${musicActivityInfo.detailTitle}' (외신)`
          : lang === 'ko'
          ? '음악 경연 · 레전드 무대'
          : '음악 경연 · 레전드 무대 (외신)';
        badgeStyle =
          'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300 dark:bg-fuchsia-950/70 dark:text-fuchsia-200 dark:border-fuchsia-800';
      } else if (musicActivityInfo.activityType === 'variety') {
        dynamicCategory = musicActivityInfo.detailTitle
          ? lang === 'ko'
            ? `예능 출연 · 《${musicActivityInfo.detailTitle}》`
            : `예능 출연 · '${musicActivityInfo.detailTitle}' (외신)`
          : lang === 'ko'
          ? '예능 출연 · 방송 화제'
          : '예능 출연 · 방송 화제 (외신)';
        badgeStyle =
          'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/70 dark:text-purple-200 dark:border-purple-800';
      } else if (musicActivityInfo.activityType === 'festival_event') {
        dynamicCategory = musicActivityInfo.detailTitle
          ? lang === 'ko'
            ? `축제 행사 · 《${musicActivityInfo.detailTitle}》`
            : `축제 행사 · '${musicActivityInfo.detailTitle}' (외신)`
          : lang === 'ko'
          ? '축제 · 페스티벌 무대 화제'
          : '축제 · 페스티벌 무대 화제 (외신)';
        badgeStyle =
          'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-800';
      } else if (musicActivityInfo.activityType === 'concert') {
        dynamicCategory = lang === 'ko' ? '단독 콘서트 · 투어 매진' : '단독 콘서트 · 월드투어 (외신)';
        badgeStyle =
          'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-950/70 dark:text-pink-200 dark:border-pink-800';
      }

      return {
        category: dynamicCategory,
        badgeStyle,
        explanation: musicActivityInfo.highlight,
        keyTopics,
        evidenceArticle,
        isDeferred: false,
        sampleCount,
        isSmallSample,
        relatedRanking,
        workMediaInfo: null,
        musicActivityInfo,
      };
    }

    let explanation = lang === 'ko' ? bestCategory.explanationKo : bestCategory.explanationEn;
    if (categoryId === 'series_season') {
      const showTitle = cleanKeyword || baseKeyword;
      explanation =
        lang === 'ko'
          ? `'${showTitle}' 관련 새 시즌 소식(출연진 정보, 방영 일정 등)이 전해졌습니다. 자세한 내막보다는 새 시즌과 관련된 일부 소식이 전달되어 화제가 된 것으로 보입니다.`
          : `'${showTitle}'의 새 시즌과 관련하여 세부적인 전개보다는 새 출연진 합류, 방영 일정, 시청 방법 등 일부 소식이 전달되어 화제가 된 것으로 보입니다.`;
    } else if (categoryId === 'award_win') {
      const allText = targetNews.map((n) => `${n.title} ${translations[n.title] || ''}`).join(' ');
      if (
        /\b(video vanguard award|vanguard award|vmas?)\b/i.test(allText) ||
        /(비디오\s*뱅가드|뱅가드상|VMA)/i.test(allText)
      ) {
        const normKey = cleanKeyword.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
        const memberB = FAMOUS_BAND_MEMBERS[cleanKeyword.toLowerCase()] || FAMOUS_BAND_MEMBERS[normKey];
        const directB = FAMOUS_BANDS[cleanKeyword.toLowerCase()] || FAMOUS_BANDS[normKey];
        const bName = directB ? `${directB.bandKo}(${directB.bandEn})` : memberB ? `${memberB.bandKo}(${memberB.bandEn})` : cleanKeyword;
        explanation = `전설적인 아티스트 '${bName}'가 MTV VMA에서 최고 권위의 비디오 뱅가드상(Video Vanguard Award)을 수상하고, 팀의 상징적인 음악적 유산 및 대표 명곡들이 주요 외신에서 일제히 재조명되었습니다.`;
      }
    }

    return {
      category: lang === 'ko' ? bestCategory.categoryKo : bestCategory.categoryEn,
      badgeStyle: bestCategory.badgeStyle,
      explanation,
      keyTopics,
      evidenceArticle,
      isDeferred: false,
      sampleCount,
      isSmallSample,
      relatedRanking,
      workMediaInfo: isNonMediaCategory ? null : workMediaInfo,
      musicActivityInfo: null,
    };
  }

  // 10. 특정 카테고리로 좁혀지지 않을 때 폴백
  if (workMediaInfo) {
    const evidenceArticle =
      targetNews.find((n) => {
        const t = `${n.title} ${translations[n.title] || ''}`.toLowerCase();
        return t.includes(workMediaInfo.title.toLowerCase());
      }) || targetNews[0];

    return {
      category:
        lang === 'ko'
          ? `신작 ${workMediaInfo.mediaTypeName} · 《${workMediaInfo.title}》`
          : `신작 ${workMediaInfo.mediaTypeName} · '${workMediaInfo.title}' (외신)`,
      badgeStyle:
        'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/70 dark:text-teal-200 dark:border-teal-800',
      explanation:
        workMediaInfo.title.toLowerCase().replace(/[^a-z0-9가-힣]/g, '') ===
        cleanKeyword.toLowerCase().replace(/[^a-z0-9가-힣]/g, '')
          ? lang === 'ko'
            ? `화제작 '${workMediaInfo.title}'의 신규 ${workMediaInfo.mediaTypeName} 제작 및 공식 ${workMediaInfo.eventTypeName} 소식이 주요 언론을 통해 집중 보도되며 팬들과 시청자들의 뜨거운 기대와 관심이 집중되었습니다.`
            : `신작 ${workMediaInfo.mediaTypeName} '${workMediaInfo.title}'의 공식 ${workMediaInfo.eventTypeName} 소식이 주요 외신을 통해 집중 타전되며 글로벌 시청자들과 팬들의 뜨거운 기대와 관심이 집중되었습니다.`
          : lang === 'ko'
          ? `배우 '${cleanKeyword}'의 신작 ${workMediaInfo.mediaTypeName} 《${workMediaInfo.title}》의 ${workMediaInfo.eventTypeName} 소식이 언론에 집중 보도되며, 작품 속 새로운 연기 변신과 호흡에 대한 대중의 뜨거운 기대감이 검색 유입을 견인했습니다.`
          : `배우 '${cleanKeyword}'가 주연/출연한 신작 ${workMediaInfo.mediaTypeName} '${workMediaInfo.title}'의 공식 ${workMediaInfo.eventTypeName} 소식이 주요 외신을 통해 집중 타전되며 글로벌 팬들의 뜨거운 기대와 관심이 집중되었습니다.`,
      keyTopics,
      evidenceArticle,
      isDeferred: false,
      sampleCount,
      isSmallSample,
      relatedRanking,
      workMediaInfo,
      musicActivityInfo: null,
    };
  }

  const hasStrongCrisisSignal =
    (categoryScores['military_conflict'] || 0) >= 1 ||
    (categoryScores['accident_casualty'] || 0) >= 1 ||
    (categoryScores['incident_society'] || 0) >= 1 ||
    (categoryScores['death'] || 0) >= 1 ||
    (categoryScores['disaster_crisis'] || 0) >= 1 ||
    (categoryScores['politics_diplomacy'] || 0) >= 1;

  if (musicActivityInfo && !hasStrongCrisisSignal) {
    const evidenceArticle =
      targetNews.find((n) => {
        const t = `${n.title} ${translations[n.title] || ''}`.toLowerCase();
        return musicActivityInfo.detailTitle ? t.includes(musicActivityInfo.detailTitle.toLowerCase()) : false;
      }) || targetNews[0];

    let dynamicCategory = '';
    let badgeStyle =
      'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950/70 dark:text-violet-200 dark:border-violet-800';

    if (musicActivityInfo.activityType === 'viral_resurgence') {
      dynamicCategory = musicActivityInfo.detailTitle
        ? lang === 'ko'
          ? `음원 역주행 · 《${musicActivityInfo.detailTitle}》`
          : `차트 역주행 · '${musicActivityInfo.detailTitle}' (외신)`
        : lang === 'ko'
        ? 'SNS 바이럴 · 음원 역주행'
        : 'SNS 바이럴 · 역주행 돌풍 (외신)';
      badgeStyle =
        'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-800';
    } else if (musicActivityInfo.activityType === 'new_release') {
      dynamicCategory = musicActivityInfo.detailTitle
        ? lang === 'ko'
          ? `신곡 발매 · 《${musicActivityInfo.detailTitle}》`
          : `신곡 발매 · '${musicActivityInfo.detailTitle}' (외신)`
        : lang === 'ko'
        ? '가수 컴백 · 신보 발표'
        : '가수 컴백 · 신보 발표 (외신)';
      badgeStyle =
        'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/70 dark:text-teal-200 dark:border-teal-800';
    } else if (musicActivityInfo.activityType === 'competition') {
      dynamicCategory = musicActivityInfo.detailTitle
        ? lang === 'ko'
          ? `음악 경연 · 《${musicActivityInfo.detailTitle}》`
          : `음악 경연 · '${musicActivityInfo.detailTitle}' (외신)`
        : lang === 'ko'
        ? '음악 경연 · 레전드 무대'
        : '음악 경연 · 레전드 무대 (외신)';
      badgeStyle =
        'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300 dark:bg-fuchsia-950/70 dark:text-fuchsia-200 dark:border-fuchsia-800';
    } else if (musicActivityInfo.activityType === 'variety') {
      dynamicCategory = musicActivityInfo.detailTitle
        ? lang === 'ko'
          ? `예능 출연 · 《${musicActivityInfo.detailTitle}》`
          : `예능 출연 · '${musicActivityInfo.detailTitle}' (외신)`
        : lang === 'ko'
        ? '예능 출연 · 방송 화제'
        : '예능 출연 · 방송 화제 (외신)';
      badgeStyle =
        'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/70 dark:text-purple-200 dark:border-purple-800';
    } else if (musicActivityInfo.activityType === 'festival_event') {
      dynamicCategory = musicActivityInfo.detailTitle
        ? lang === 'ko'
          ? `축제 행사 · 《${musicActivityInfo.detailTitle}》`
          : `축제 행사 · '${musicActivityInfo.detailTitle}' (외신)`
        : lang === 'ko'
        ? '축제 · 페스티벌 무대 화제'
        : '축제 · 페스티벌 무대 화제 (외신)';
      badgeStyle =
        'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-800';
    } else if (musicActivityInfo.activityType === 'concert') {
      dynamicCategory = lang === 'ko' ? '단독 콘서트 · 투어 매진' : '단독 콘서트 · 월드투어 (외신)';
      badgeStyle =
        'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-950/70 dark:text-pink-200 dark:border-pink-800';
    }

    return {
      category: dynamicCategory,
      badgeStyle,
      explanation: musicActivityInfo.highlight,
      keyTopics,
      evidenceArticle,
      isDeferred: false,
      sampleCount,
      isSmallSample,
      relatedRanking,
      workMediaInfo: null,
      musicActivityInfo,
    };
  }

  const normKeywordLower = cleanKeyword.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
  const memberBandInfo =
    FAMOUS_BAND_MEMBERS[cleanKeyword.toLowerCase()] ||
    FAMOUS_BAND_MEMBERS[normKeywordLower] ||
    FAMOUS_BAND_MEMBERS[keyword.toLowerCase()];
  const bandInfo =
    FAMOUS_BANDS[cleanKeyword.toLowerCase()] ||
    FAMOUS_BANDS[normKeywordLower] ||
    FAMOUS_BANDS[keyword.toLowerCase()];

  const allNewsText = targetNews.map((n) => `${n.title} ${translations[n.title] || ''}`).join(' ');

  // 1) 밴드 멤버(커트 코베인 등)에 대한 밴드 유산/재조명 분석
  if (memberBandInfo) {
    const bandEn = memberBandInfo.bandEn;
    const bandKo = memberBandInfo.bandKo;
    const isBandMentioned =
      new RegExp(`\\b(${escapeRegExp(bandEn)}|${escapeRegExp(bandKo)})\\b`, 'i').test(allNewsText) ||
      allNewsText.toLowerCase().includes('grunge') ||
      allNewsText.includes('그런지');

    const isRetrospectiveOrLegacy =
      isBandMentioned ||
      /\b(exhibit|museum|apartment|airbnb|memorabilia|documentary|biography|book review|grunge|rock history|unheard|unreleased|anniversary|vanguard|heritage)\b/i.test(
        allNewsText
      ) ||
      /(전시|박물관|에어비앤비|아파트|서평|전기|다큐|재조명|명곡|일화|비하인드|유산)/i.test(allNewsText);

    if (isRetrospectiveOrLegacy) {
      const enrichedTopics = [
        `${bandKo} (밴드)`,
        ...keyTopics.filter((t) => !t.includes(bandKo) && !t.toLowerCase().includes(bandEn.toLowerCase())),
      ].slice(0, 3);

      const topEvidence =
        targetNews.find((n) => {
          const t = `${n.title} ${translations[n.title] || ''}`.toLowerCase();
          return (
            t.includes(bandEn.toLowerCase()) ||
            t.includes(bandKo.toLowerCase()) ||
            t.includes('olympia') ||
            t.includes('apartment') ||
            t.includes('airbnb')
          );
        }) || targetNews[0];

      const hasApartmentAirbnb = /olympia|apartment|airbnb|아파트|에어비앤비/i.test(allNewsText);
      const specificHighlight = hasApartmentAirbnb ? '과거 거주지(아파트) 보존·등록 소식 및 ' : '';
      const groupType = /(아이돌|k-pop|팝|보컬)/i.test(memberBandInfo.genre) ? '그룹' : '밴드';

      return {
        category:
          lang === 'ko'
            ? `레전드 아티스트 · ${bandKo}(${bandEn}) 재조명`
            : `레전드 아티스트 · ${bandKo}(${bandEn}) 재조명 (외신)`,
        badgeStyle:
          'bg-violet-100 text-violet-900 border-violet-300 dark:bg-violet-950/70 dark:text-violet-200 dark:border-violet-800',
        explanation:
          lang === 'ko'
            ? `전설적인 ${memberBandInfo.genre} ${groupType} '${bandKo}(${bandEn})'의 ${memberBandInfo.role}인 '${cleanKeyword}'의 음악적 유산과 활동, ${specificHighlight}기념 전시 및 명곡 비하인드가 주요 언론을 통해 집중 조명되며 글로벌 팬들의 관심이 집중되었습니다.`
            : `전설적인 ${memberBandInfo.genre} ${groupType} '${bandKo}(${bandEn})'의 ${memberBandInfo.role}인 '${cleanKeyword}'의 음악적 유산과 활동, ${specificHighlight}기념 전시 및 명곡 비하인드가 주요 외신을 통해 집중 조명되며 글로벌 관심이 집중되었습니다.`,
        keyTopics: enrichedTopics,
        evidenceArticle: topEvidence,
        isDeferred: false,
        sampleCount,
        isSmallSample,
        relatedRanking,
        workMediaInfo: null,
        musicActivityInfo: null,
      };
    }
  }

  // 2) 밴드 자체(너바나, 오아시스, 비틀즈 등)에 대한 분석
  if (bandInfo) {
    const bandKo = bandInfo.bandKo;
    const bandEn = bandInfo.bandEn;
    const groupType = /(아이돌|k-pop|팝|보컬)/i.test(bandInfo.genre) ? '그룹' : '밴드';

    const hasVanguardOrAward =
      /\b(video vanguard award|vanguard award|vma|vmas|mtv video music awards?|grammy|billboard music award|award)\b/i.test(allNewsText) ||
      /(비디오\s*뱅가드|뱅가드상|VMA|그래미|빌보드|시상식|수상|어워드)/i.test(allNewsText);

    const hasVanguard = /\b(video vanguard|vanguard)\b/i.test(allNewsText) || /(비디오\s*뱅가드|뱅가드상)/i.test(allNewsText);
    const awardTitle = hasVanguard ? '비디오 뱅가드상 수상' : '주요 음악상 수상 및 재조명';

    const matchedKeyMember = bandInfo.keyMembers.find((m) =>
      allNewsText.toLowerCase().includes(m.toLowerCase())
    );
    const memberMention = matchedKeyMember ? `핵심 멤버 '${matchedKeyMember}' 및 ` : '';

    const isReunionOrComeback =
      /\b(reunion|reunite|reunites|reunited|comeback|new single|new album|world tour|tour dates?|tickets?)\b/i.test(allNewsText) ||
      /(재결합|재결성|컴백|신보|신곡|월드투어|내한|티켓)/i.test(allNewsText);

    const enrichedTopics = hasVanguard
      ? ['MTV VMA', '비디오 뱅가드상', ...keyTopics.filter((t) => !t.includes('MTV') && !t.includes('뱅가드'))].slice(0, 3)
      : isReunionOrComeback
      ? ['재결합투어', '월드투어', ...keyTopics.filter((t) => !t.includes('투어'))].slice(0, 3)
      : keyTopics;

    const topEvidence =
      targetNews.find((n) => {
        const t = `${n.title} ${translations[n.title] || ''}`.toLowerCase();
        return (
          t.includes('vanguard') ||
          t.includes('vma') ||
          t.includes('award') ||
          t.includes('reunion') ||
          t.includes('tour') ||
          t.includes('rolling stone') ||
          t.includes('billboard')
        );
      }) || targetNews[0];

    if (hasVanguardOrAward) {
      return {
        category: lang === 'ko' ? `시상식 · ${awardTitle}` : `시상식 · ${awardTitle} (외신)`,
        badgeStyle:
          'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-800',
        explanation:
          lang === 'ko'
            ? `전설적인 ${bandInfo.genre} ${groupType} '${bandKo}(${bandEn})'가 주요 음악 시상식에서 공로상 및 트로피를 수상하고, ${memberMention}팀의 음악적 유산과 불멸의 명곡들이 주요 외신에서 일제히 재조명되었습니다.`
            : `전설적인 ${bandInfo.genre} ${groupType} '${bandKo}(${bandEn})'가 주요 음악 시상식에서 공로상 및 트로피를 수상하고, ${memberMention}팀의 음악적 유산과 불멸의 명곡들이 주요 외신에서 일제히 재조명되었습니다.`,
        keyTopics: enrichedTopics,
        evidenceArticle: topEvidence,
        isDeferred: false,
        sampleCount,
        isSmallSample,
        relatedRanking,
        workMediaInfo: null,
        musicActivityInfo: null,
      };
    }

    if (isReunionOrComeback) {
      return {
        category: lang === 'ko' ? `밴드 재결합 · 컴백 투어` : `밴드 재결합 · 컴백 투어 (외신)`,
        badgeStyle:
          'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-800',
        explanation:
          lang === 'ko'
            ? `전설적인 ${bandInfo.genre} ${groupType} '${bandKo}(${bandEn})'의 공식 재결합, 신규 투어 및 음원 발표 소식이 주요 외신을 통해 일제히 보도되며 글로벌 음악 팬들의 뜨거운 관심이 집중되었습니다.`
            : `전설적인 ${bandInfo.genre} ${groupType} '${bandKo}(${bandEn})'의 공식 재결합, 신규 투어 및 음원 발표 소식이 주요 외신을 통해 일제히 보도되며 글로벌 음악 팬들의 뜨거운 관심이 집중되었습니다.`,
        keyTopics: enrichedTopics,
        evidenceArticle: topEvidence,
        isDeferred: false,
        sampleCount,
        isSmallSample,
        relatedRanking,
        workMediaInfo: null,
        musicActivityInfo: null,
      };
    }
  }

  if (keyTopics.length >= 2) {
    const topArticle =
      targetNews.find((n) => {
        const t = n.title.toLowerCase();
        const transT = (translations[n.title] || '').toLowerCase();
        const combined = `${t} ${transT}`;
        return keyTopics.every((k) => combined.includes(k)) || keyTopics.some((k) => combined.includes(k));
      }) || targetNews[0];

    const topicCategoryTitle =
      lang === 'ko' ? `화제 집중: #${keyTopics.slice(0, 2).join(' #')}` : `화제 집중 (외신)`;

    return {
      category: topicCategoryTitle,
      badgeStyle:
        'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
      explanation:
        lang === 'ko'
          ? `수집된 기사들을 교차 분석한 결과, 주로 '${keyTopics.join("', '")}' 관련 보도가 집중되며 검색 유입을 견인했습니다.`
          : `수집된 영문 외신들을 교차 분석한 결과, 주로 '${keyTopics.join("', '")}' 관련 이슈가 글로벌 검색 유입을 견인한 핵심 요인으로 분석됩니다.`,
      keyTopics,
      evidenceArticle: topArticle,
      isDeferred: false,
      sampleCount,
      isSmallSample,
      relatedRanking,
      workMediaInfo: null,
      musicActivityInfo: null,
    };
  }

  return {
    category: lang === 'ko' ? '언론 집중 보도' : '외신 집중 보도',
    badgeStyle: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    explanation:
      lang === 'ko'
        ? '최근 언론과 미디어를 통해 확산된 화제성 보도 및 관련 인터뷰가 대중의 검색 유입을 이끈 것으로 분석됩니다.'
        : '최근 글로벌 커뮤니티 및 주요 외신들을 통해 확산된 화제성 보도가 전 세계적인 검색 트래픽을 견인한 것으로 분석됩니다.',
    keyTopics,
    evidenceArticle: targetNews[0] || news[0],
    isDeferred: false,
    sampleCount,
    isSmallSample,
    relatedRanking,
    workMediaInfo: null,
    musicActivityInfo: null,
  };
};
