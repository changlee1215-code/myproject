import type { NewsItem } from '../types';
import {
  KO_STOPWORDS,
  EN_STOPWORDS,
  cleanKoreanJosa,
  cleanHeadline,
  KNOWN_TRANSLITERATION_MAP,
  FAMOUS_BAND_MEMBERS,
  FAMOUS_BANDS,
} from '../stopwords';

export const extractKeyTopics = (
  targetNews: NewsItem[],
  keyword: string,
  baseKeyword: string,
  disambigContext: string,
  lang: 'ko' | 'en',
  translations: Record<string, string>,
  sampleCount: number
): string[] => {
  const cleanKeywordNorm = keyword.toLowerCase().replace(/[_\s()]+/g, '');
  const baseKeywordNorm = baseKeyword.toLowerCase().replace(/[_\s()]+/g, '');
  const disambigNorm = disambigContext.toLowerCase().replace(/[_\s()]+/g, '');

  // 키워드의 모든 개별 토큰(영문 및 한글 음차)을 수집하여 핵심 토픽에서 원천 배제
  const keywordTokens = new Set<string>();
  [keyword, baseKeyword, disambigContext].forEach((k) => {
    k.toLowerCase()
      .split(/[\s_()]+/)
      .filter((t) => t.length >= 2)
      .forEach((t) => {
        keywordTokens.add(t);
        const trans = KNOWN_TRANSLITERATION_MAP[t];
        if (trans) keywordTokens.add(trans);
      });
  });

  // 영문 키워드일 경우 번역문에서 해당 키워드와 매칭되는 한글 이름 단어들을 자동 수집하여 토픽 노이즈 제거
  if (lang === 'en' && Object.keys(translations).length > 0) {
    const rawEnTokens = keyword.toLowerCase().split(/[\s_()]+/).filter((t) => t.length >= 2);
    targetNews.forEach((n) => {
      const orig = n.title.toLowerCase();
      const trans = translations[n.title];
      if (!trans) return;
      if (rawEnTokens.some((tok) => orig.includes(tok))) {
        const transWords = trans
          .replace(/[^\w\s가-힣]/g, ' ')
          .split(/\s+/)
          .map((w) => cleanKoreanJosa(w.trim().toLowerCase()));
        transWords.forEach((tw) => {
          if (tw.length >= 2) {
            for (const enTok of rawEnTokens) {
              if (KNOWN_TRANSLITERATION_MAP[enTok] === tw) {
                keywordTokens.add(tw);
              }
            }
          }
        });
      }
    });
  }

  const isKeywordNoise = (w: string) => {
    const lower = w.toLowerCase();
    if (keywordTokens.has(lower)) return true;
    if (cleanKeywordNorm && (lower.includes(cleanKeywordNorm) || cleanKeywordNorm.includes(lower))) return true;
    if (baseKeywordNorm && (lower.includes(baseKeywordNorm) || baseKeywordNorm.includes(lower))) return true;
    if (disambigNorm && (lower.includes(disambigNorm) || disambigNorm.includes(lower))) return true;
    return false;
  };

  const formatTopicWithContext = (word: string): string => {
    const norm = word.toLowerCase();
    const cleanNorm = norm.replace(/[^a-z0-9가-힣]/g, '');

    // 1) 유명 밴드 목록에 직접 등록된 밴드명일 경우 (밴드) 주석 부여
    const directBand = FAMOUS_BANDS[norm] || FAMOUS_BANDS[cleanNorm];
    if (directBand) {
      return `${directBand.bandKo} (밴드)`;
    }

    // 2) 밴드 멤버 검색 시 해당 소속 밴드가 언급된 경우 (밴드) 주석 부여
    const memberBand =
      FAMOUS_BAND_MEMBERS[cleanKeywordNorm] ||
      FAMOUS_BAND_MEMBERS[keyword.toLowerCase()] ||
      FAMOUS_BAND_MEMBERS[baseKeyword.toLowerCase()];
    if (memberBand) {
      const bKo = memberBand.bandKo.toLowerCase();
      const bEn = memberBand.bandEn.toLowerCase();
      if (bKo.includes(norm) || bEn.includes(norm) || norm.includes(bKo) || norm.includes(bEn)) {
        return `${memberBand.bandKo} (밴드)`;
      }
    }

    if (norm === 'vma' || norm === 'vmas') {
      return 'MTV VMA';
    }
    return word;
  };

  const counts: Record<string, number> = {};

  // 1순위: 외신 번역문이 존재할 경우 한국어 핵심 키워드를 최우선 추출 (이용자 가독성 극대화)
  if (lang === 'en' && Object.keys(translations).length > 0) {
    targetNews.forEach((n) => {
      const trans = translations[n.title];
      if (!trans) return;

      const cleanedTrans = cleanHeadline(trans);

      const words = cleanedTrans
        .replace(/[^\w\s가-힣]/g, ' ')
        .split(/\s+/)
        .map((w) => cleanKoreanJosa(w.trim().toLowerCase()))
        .filter((w) => {
          if (w.length < 2) return false;
          // 번역문 추출 시 반드시 한글이 포함된 단어만 수집하여 영문 언론사/불용어 노이즈 원천 차단
          if (!/[가-힣]/.test(w)) return false;
          if (KO_STOPWORDS.has(w)) return false;
          if (/^\d+$/.test(w)) return false;
          if (
            /(했다고|됐다고|밝혔다고|전했다고|보였다|알렸다|이어졌다|나타났다|가졌다|나섰다|합니다|됩니다|습니다|았습니다|었습니다|려짐|해짐|려져|해져|있나요|없나요|인가요|입니까|니다|니까|나요|네요|대요|데요|어요|아요|여요|세요)$/.test(
              w
            )
          )
            return false;
          if (isKeywordNoise(w)) return false;
          return true;
        });

      const uniqueWords = Array.from(new Set(words));
      uniqueWords.forEach((w) => {
        counts[w] = (counts[w] || 0) + 1;
      });
    });

    let sortedKo = Object.entries(counts)
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => formatTopicWithContext(word));

    // 표본이 적은 경우(5건 이하 소수 표본)에는 1회 언급된 핵심 단어도 수용하여 분석 반영
    if (sortedKo.length < 2 && sampleCount <= 5) {
      sortedKo = Object.entries(counts)
        .filter(([, count]) => count >= 1)
        .sort((a, b) => b[1] - a[1])
        .map(([word]) => formatTopicWithContext(word));
    }

    if (sortedKo.length >= 1) {
      return sortedKo.slice(0, 3);
    }
  }

  // 2순위 (국내 뉴스 또는 영문 원문 기반): 영문/국문 원문 토픽 추출
  const fallbackCounts: Record<string, number> = {};
  const stopWords = lang === 'ko' ? KO_STOPWORDS : EN_STOPWORDS;

  targetNews.forEach((n) => {
    const cleanedTitle = cleanHeadline(n.title);
    const words = cleanedTitle
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .map((w) => (lang === 'ko' ? cleanKoreanJosa(w.trim().toLowerCase()) : w.trim().toLowerCase()))
      .filter((w) => {
        if (lang === 'ko' && w.length < 2) return false;
        if (lang === 'en' && w.length < 3) return false;
        if (stopWords.has(w)) return false;
        if (EN_STOPWORDS.has(w)) return false;
        if (/^\d+$/.test(w)) return false;
        if (isKeywordNoise(w)) return false;
        return true;
      });

    const uniqueWords = Array.from(new Set(words));
    uniqueWords.forEach((w) => {
      fallbackCounts[w] = (fallbackCounts[w] || 0) + 1;
    });
  });

  let sorted = Object.entries(fallbackCounts)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => formatTopicWithContext(word));

  // 표본이 적은 경우(5건 이하)에는 1회 언급 단어도 수용
  if (sorted.length < 2 && sampleCount <= 5) {
    sorted = Object.entries(fallbackCounts)
      .filter(([, count]) => count >= 1)
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => formatTopicWithContext(word));
  }

  return sorted.slice(0, 3);
};
