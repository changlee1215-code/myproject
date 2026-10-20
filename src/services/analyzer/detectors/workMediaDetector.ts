import type { NewsItem, WorkMediaInfo } from '../types';
import { escapeRegExp } from '../stopwords';

export const detectWorkMedia = (
  targetNewsList: NewsItem[],
  targetKeyword: string,
  categoryScores: Record<string, number>,
  translations: Record<string, string>,
  disambigContext = ''
): WorkMediaInfo | null => {
  // 스포츠 구단/경기/포스트시즌(월드시리즈, 한국시리즈, NLCS, 스윕, 홈런 등) 지배적 맥락일 때는 신작 드라마/OTT 시리즈 감지 원천 차단!
  const totalSportsScore =
    (categoryScores['sports_award_mvp'] || 0) +
    (categoryScores['sports_victory'] || 0) +
    (categoryScores['sports_defeat_crisis'] || 0) +
    (categoryScores['sports_transfer_general'] || 0);
  const releaseScore = (categoryScores['release_comeback'] || 0) + (categoryScores['boxoffice_hit'] || 0);
  if (totalSportsScore >= 2 && totalSportsScore > releaseScore) {
    return null;
  }

  const quoteRegex = /['"‘“《〈]([^'"’”》〉]{2,30})['"’”》〉]/g;
  // 명확한 영상물/OTT 시리즈만 매칭 (월드시리즈 등 스포츠 시리즈 충돌 방지)
  const mediaIndicatorRegex =
    /(드라마|새\s*드라마|신작\s*드라마|영화|새\s*영화|신작\s*영화|신작\s*시리즈|새\s*시리즈|오리지널\s*시리즈|넷플릭스|디즈니\+|티빙|쿠팡플레이|웨이브|시사회|상영회|제작발표회|제작보고회|제발회|첫\s*방송|첫방|본방사수|개봉|방영|캐스팅|주연|스틸컷|포토타임|대본리딩|안방극장|무대인사|premiere|premieres|premiered|screening|screenings|teaser|trailer|stars\s+in|starring\s+in|film|movie|new\s+series|tv\s+series|miniseries|new\s+drama|press\s+conference|red\s+carpet)/i;

  const sportsHeadlineGuardRegex =
    /(월드시리즈|한국시리즈|챔피언십\s*시리즈|디비전\s*시리즈|와일드카드|포스트시즌|플레이오프|\bNLCS\b|\bALCS\b|\bMLB\b|\bKBO\b|\bNBA\b|\bEPL\b|\bUCL\b|world\s+series|championship\s+series|playoffs?|홈런|스리런|투런|솔로포|만루홈런|역전승|완승|대승|스윕|전패|전승|이닝|투수|타자|선발|다저스|양키스|밀워키|브루어스|오타니|득점|실점|골인|해트트릭)/i;

  const badWords = new Set([
    '포토', '종합', '단독', '속보', '인터뷰', '공식', '심경', '눈물', '미안', '대박', '충격', '행복', '감동',
    '아내', '남편', '결혼', '결혼식', '열애', '이혼', '결별', '비보', '사망', '별세', '추모', 'mvp', 'nlcs', 'alcs',
    '아내 최초 공개', '15년 만에', '15년 만에 결혼식', '화제', '근황', '소감', '반응', '관객', '관객들',
    '시청자', '팬들', '공개', '발표', '확정', '소식', '출연', '주연', '캐스팅', '현장', '스틸컷', '포토타임'
  ]);

  const candidates = new Map<string, WorkMediaInfo>();
  const normKeyword = targetKeyword.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');

  targetNewsList.forEach((hl) => {
    const orig = hl.title;
    const trans = translations[hl.title] || '';
    const combined = `${orig} ${trans}`;

    // 스포츠 경기/야구 시리즈 헤드라인은 신작 매체 추출에서 즉시 배제
    if (sportsHeadlineGuardRegex.test(combined)) return;

    const hasMediaIndicator = mediaIndicatorRegex.test(combined);
    if (!hasMediaIndicator) return;

    let detectedMediaType: WorkMediaInfo['mediaType'] = 'work';
    let detectedMediaTypeName = '신작/출연작';
    if (/(드라마|새\s*드라마|신작\s*드라마|안방극장|tv series|new drama)/i.test(combined)) {
      detectedMediaType = 'drama';
      detectedMediaTypeName = '드라마';
    } else if (/(영화|시사회|상영회|movie|film|cinema|개봉|무대인사)/i.test(combined)) {
      detectedMediaType = 'movie';
      detectedMediaTypeName = '영화';
    } else if (/(신작\s*시리즈|새\s*시리즈|오리지널\s*시리즈|넷플릭스|디즈니|티빙|웨이브|쿠팡플레이|new series|tv series|miniseries)/i.test(combined)) {
      detectedMediaType = 'series';
      detectedMediaTypeName = '시리즈(OTT)';
    }

    let detectedEventTypeName = '공식 개봉 및 방영';
    if (/(제작발표회|제작보고회|제발회)/i.test(combined)) {
      detectedEventTypeName = '제작발표회';
    } else if (/(시사회|상영회|screening|무대인사)/i.test(combined)) {
      detectedEventTypeName = '시사회·상영회';
    } else if (/(첫\s*방송|첫방|본방사수)/i.test(combined)) {
      detectedEventTypeName = '첫 방송';
    } else if (/(개봉|premiere)/i.test(combined)) {
      detectedEventTypeName = '개봉 및 프리미어';
    } else if (/(캐스팅|주연\s*확정|주연\s*발탁)/i.test(combined)) {
      detectedEventTypeName = '주연 캐스팅 확정';
    }

    // 1) 따옴표로 감싸진 제목 탐색
    let match;
    const regex = new RegExp(quoteRegex);
    let foundInQuote = false;
    while ((match = regex.exec(combined)) !== null) {
      const cand = match[1].trim();
      const cleanCandNorm = cand.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
      if (cand.length < 2 || cand.length > 25) continue;
      if (cleanCandNorm === normKeyword || normKeyword.includes(cleanCandNorm)) continue;
      if (badWords.has(cand.toLowerCase()) || badWords.has(cleanCandNorm)) continue;
      if (sportsHeadlineGuardRegex.test(cand)) continue;
      if (/^(포토|현장|단독|속보|인터뷰|공식|심경|사진|영상|눈물|미안|아내|남편)/.test(cand)) continue;

      const existing = candidates.get(cand) || {
        title: cand,
        count: 0,
        mediaType: 'work',
        mediaTypeName: '신작/출연작',
        eventTypeName: detectedEventTypeName,
        sample: hl.title,
      };
      existing.count += 1;
      if (detectedMediaType !== 'work') {
        existing.mediaType = detectedMediaType;
        existing.mediaTypeName = detectedMediaTypeName;
      }
      if (detectedEventTypeName !== '공식 개봉 및 방영') {
        existing.eventTypeName = detectedEventTypeName;
      }
      candidates.set(cand, existing);
      foundInQuote = true;
    }

    // 2) 따옴표가 없을 때 키워드 패턴 탐색
    if (!foundInQuote) {
      const unquotedKo =
        /(?:새\s*드라마|신작\s*드라마|드라마|신작\s*영화|새\s*영화|영화|신작\s*시리즈|오리지널\s*시리즈)\s+([A-Za-z0-9가-힣]{2,15}(?:\s+[A-Za-z0-9가-힣]{1,10})?)\s*(?:제작발표회|제작보고회|제발회|시사회|상영회|첫\s*방송|첫방|개봉|스틸컷|포스터|캐스팅|주연|출연)/i;
      const unquotedMatch = combined.match(unquotedKo);
      if (unquotedMatch) {
        const cand = unquotedMatch[1].trim();
        const cleanCandNorm = cand.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
        if (
          cand.length >= 2 &&
          cand.length <= 25 &&
          cleanCandNorm !== normKeyword &&
          !badWords.has(cand.toLowerCase()) &&
          !badWords.has(cleanCandNorm) &&
          !sportsHeadlineGuardRegex.test(cand)
        ) {
          const existing = candidates.get(cand) || {
            title: cand,
            count: 0,
            mediaType: 'work',
            mediaTypeName: '신작/출연작',
            eventTypeName: detectedEventTypeName,
            sample: hl.title,
          };
          existing.count += 1;
          if (detectedMediaType !== 'work') {
            existing.mediaType = detectedMediaType;
            existing.mediaTypeName = detectedMediaTypeName;
          }
          candidates.set(cand, existing);
        }
      }

      const unquotedEn =
        /(?:new\s+series|new\s+drama|new\s+film|new\s+movie|stars?\s+in|starring\s+in|cast\s+in)\s+([A-Z][A-Za-z0-9\s]{1,20})/i;
      const unquotedEnMatch = orig.match(unquotedEn);
      if (unquotedEnMatch) {
        const cand = unquotedEnMatch[1].trim();
        const cleanCandNorm = cand.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
        if (
          cand.length >= 2 &&
          cand.length <= 25 &&
          cleanCandNorm !== normKeyword &&
          !badWords.has(cand.toLowerCase()) &&
          !badWords.has(cleanCandNorm) &&
          !sportsHeadlineGuardRegex.test(cand)
        ) {
          const existing = candidates.get(cand) || {
            title: cand,
            count: 0,
            mediaType: 'work',
            mediaTypeName: '신작/출연작',
            eventTypeName: detectedEventTypeName,
            sample: hl.title,
          };
          existing.count += 1;
          if (detectedMediaType !== 'work') {
            existing.mediaType = detectedMediaType;
            existing.mediaTypeName = detectedMediaTypeName;
          }
          candidates.set(cand, existing);
        }
      }
    }
  });

  // 3) 검색 키워드 자체가 시리즈/영화/드라마인 경우 (위키백과 문서 자체가 작품인 경우)
  const isMediaDisambig = /\b(miniseries|series|tv series|television series|film|movie|drama|show|anime|novel)\b/i.test(
    disambigContext
  );
  let selfMediaCount = 0;
  let selfMediaType: WorkMediaInfo['mediaType'] =
    isMediaDisambig && /film|movie/i.test(disambigContext)
      ? 'movie'
      : isMediaDisambig && /miniseries|series/i.test(disambigContext)
      ? 'series'
      : 'work';
  let selfMediaTypeName =
    isMediaDisambig && /film|movie/i.test(disambigContext)
      ? '영화'
      : isMediaDisambig && /miniseries|series/i.test(disambigContext)
      ? '시리즈(OTT)'
      : '신작/출연작';
  let selfEventTypeName = '공식 개봉 및 방영';

  const escapedKeyword = escapeRegExp(targetKeyword);
  const selfTitlePattern = new RegExp(
    `(?:\\b(new|adaptation|remake|reboot|horror|television|tv)\\s+)?\\b${escapedKeyword}\\b(?:\\s+(?:series|miniseries|tv series|television series|movie|film|adaptation|remake|reboot|drama))?`,
    'i'
  );
  const mediaContextPattern =
    /\b(miniseries|tv series|television series|new series|adaptation|ordered to series|miniseries order|to helm|direct|directed by|premiering|premiere|stream|streaming|amazon prime|netflix|hbo|hulu|disney\+|trailer|first look)\b/i;

  targetNewsList.forEach((hl) => {
    const orig = hl.title;
    const trans = translations[hl.title] || '';
    const combined = `${orig} ${trans}`;

    if (sportsHeadlineGuardRegex.test(combined)) return;

    if (selfTitlePattern.test(combined) && (isMediaDisambig || mediaContextPattern.test(combined))) {
      selfMediaCount++;
      if (
        /(miniseries|television series|tv series|new series|시리즈)/i.test(combined) ||
        /miniseries|series/i.test(disambigContext)
      ) {
        selfMediaType = 'series';
        selfMediaTypeName = '시리즈(OTT)';
      } else if (/(영화|movie|film|cinema)/i.test(combined) || /film|movie/i.test(disambigContext)) {
        selfMediaType = 'movie';
        selfMediaTypeName = '영화';
      } else if (/(드라마|drama)/i.test(combined) || /drama/i.test(disambigContext)) {
        selfMediaType = 'drama';
        selfMediaTypeName = '드라마';
      }

      if (/(order|ordered|sets new|to helm|development|greenlit|제작\s*확정|시리즈화)/i.test(combined)) {
        selfEventTypeName = '신규 제작 및 시리즈화 확정';
      } else if (/(premiere|premieres|first look|trailer|티저|예고편|개봉|첫방)/i.test(combined)) {
        selfEventTypeName = '공식 공개 및 방영';
      }
    }
  });

  if (
    selfMediaCount >= 2 &&
    (!candidates.has(targetKeyword) || (candidates.get(targetKeyword)?.count || 0) < selfMediaCount)
  ) {
    candidates.set(targetKeyword, {
      title: targetKeyword,
      count: selfMediaCount,
      mediaType: selfMediaType,
      mediaTypeName: selfMediaTypeName,
      eventTypeName: selfEventTypeName,
      sample: targetNewsList[0]?.title || '',
    });
  }

  if (candidates.size === 0) return null;

  let best: WorkMediaInfo | null = null;
  for (const item of candidates.values()) {
    if (!best || item.count > best.count) {
      best = item;
    }
  }

  // 최소 2건 이상의 서로 다른 기사에서 일관되게 언급된 작품만 인정
  return best && best.count >= 2 ? best : null;
};
