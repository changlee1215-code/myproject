import type { NewsItem } from './types';

export interface SmartQueryInfo {
  normalizedKeyword: string;
  disambigContext: string;
  baseKeyword: string;
  cleanKeyword: string;
  smartQuery: string;
  altSmartQuery: string;
  isKo: boolean;
  isAcademicOrCatalogList: boolean;
}

export const parseSmartKeyword = (keyword: string, lang: 'ko' | 'en'): SmartQueryInfo => {
  const normalizedKeyword = keyword.replace(/_/g, ' ').trim();
  const disambigMatch = normalizedKeyword.match(/\(([^)]+)\)/);
  const disambigContext = disambigMatch ? disambigMatch[1].trim() : '';
  const baseKeyword = normalizedKeyword
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const cleanKeyword = baseKeyword.length >= 2 ? baseKeyword : normalizedKeyword;

  const isAcademicOrCatalogList =
    /^list\s+of\s+/i.test(cleanKeyword) ||
    /^outline\s+of\s+/i.test(cleanKeyword) ||
    /^index\s+of\s+/i.test(cleanKeyword) ||
    /\b(list of equations|equations?|mathematics|formulas?|theorems?|glossary of)\b/i.test(cleanKeyword) ||
    /(방정식\s*목록|수식\s*목록|공식\s*목록|학술\s*목록)/i.test(cleanKeyword);

  const isKo = lang === 'ko' || /[가-힣]/.test(normalizedKeyword);

  // 동음이의어(Disambiguation) 유형 판별:
  // 1. 단순 동음이의어 표기 (동음이의, disambiguation 등): 검색어에서 완전히 제거하고 기본 키워드로 검색
  const isGenericDisambig = /^(동음이의|동음이의어|동명이인|동음|disambiguation)$/i.test(disambigContext);

  // 2. 출생/연도 구분자 (예: 1963년, 1969년, born 1980 등):
  // 뉴스 헤드라인에 연도가 직접 붙는 경우가 드물어 '1963년 차지훈'처럼 검색 시 0건이 반환되므로
  // 1순위 검색어는 baseKeyword 단독으로 설정하고, 연도 결합 검색어는 2순위 보조 쿼리로 배치
  const isYearDisambig = /^(\d{4}년?|\d{4}\s*생|(born\s+)?\d{4})$/i.test(disambigContext);

  let smartQuery: string;
  let altSmartQuery: string;

  if (isGenericDisambig) {
    smartQuery = baseKeyword.length >= 2 ? baseKeyword : normalizedKeyword;
    altSmartQuery = '';
  } else if (isYearDisambig) {
    smartQuery = baseKeyword.length >= 2 ? baseKeyword : normalizedKeyword;
    altSmartQuery = isKo ? `${baseKeyword} ${disambigContext}` : `${disambigContext} ${baseKeyword}`;
  } else if (disambigContext) {
    smartQuery = isKo ? `${disambigContext} ${baseKeyword}` : `${baseKeyword} ${disambigContext}`;
    altSmartQuery = isKo ? `${baseKeyword} ${disambigContext}` : `${disambigContext} ${baseKeyword}`;
  } else {
    smartQuery = baseKeyword.length >= 2 ? baseKeyword : normalizedKeyword;
    altSmartQuery = '';
  }

  return {
    normalizedKeyword,
    disambigContext,
    baseKeyword,
    cleanKeyword,
    smartQuery,
    altSmartQuery,
    isKo,
    isAcademicOrCatalogList,
  };
};

export const fetchNewsArticles = async (
  keyword: string,
  lang: 'ko' | 'en',
  smartInfo: SmartQueryInfo
): Promise<NewsItem[]> => {
  let rawItems: any[] = [];
  const primaryQuery = smartInfo.smartQuery;

  // 1순위: Vite 내장 개발/프리뷰 미들웨어 API (/api/news) 호출 (CORS 원천 해결)
  try {
    const localRes = await fetch(
      `/api/news?q=${encodeURIComponent(primaryQuery)}&lang=${lang}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (localRes.ok) {
      const data = await localRes.json();
      if (data.items && data.items.length > 0) {
        rawItems = data.items;
      }
    }
  } catch {}

  // 1-2순위: 1순위 결과가 없고 보조 스마트 검색어가 있다면 시도 (예: '바다 가수')
  if (rawItems.length === 0 && smartInfo.altSmartQuery) {
    try {
      const localResAlt = await fetch(
        `/api/news?q=${encodeURIComponent(smartInfo.altSmartQuery)}&lang=${lang}`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (localResAlt.ok) {
        const data = await localResAlt.json();
        if (data.items && data.items.length > 0) {
          rawItems = data.items;
        }
      }
    } catch {}
  }

  // 1-3순위: 결과가 여전히 없고 원본 키워드가 primaryQuery와 달랐다면 원본 키워드로 재시도 (예: '바다 (가수)')
  if (rawItems.length === 0 && primaryQuery !== keyword) {
    try {
      const localRes2 = await fetch(
        `/api/news?q=${encodeURIComponent(keyword)}&lang=${lang}`,
        { signal: AbortSignal.timeout(6000) }
      );
      if (localRes2.ok) {
        const data = await localRes2.json();
        if (data.items && data.items.length > 0) {
          rawItems = data.items;
        }
      }
    } catch {}
  }

  // 2순위: 로컬 Express 백엔드 서버 (포트 3001) 직접 호출 시도
  if (rawItems.length === 0) {
    try {
      const backendRes = await fetch(
        `http://localhost:3001/api/news?q=${encodeURIComponent(primaryQuery)}&lang=${lang}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (backendRes.ok) {
        const data = await backendRes.json();
        if (data.items && data.items.length > 0) {
          rawItems = data.items;
        }
      }
    } catch {}
  }

  // 2-2순위: Express 백엔드 보조 쿼리 시도
  if (rawItems.length === 0 && smartInfo.altSmartQuery) {
    try {
      const backendResAlt = await fetch(
        `http://localhost:3001/api/news?q=${encodeURIComponent(smartInfo.altSmartQuery)}&lang=${lang}`,
        { signal: AbortSignal.timeout(4000) }
      );
      if (backendResAlt.ok) {
        const data = await backendResAlt.json();
        if (data.items && data.items.length > 0) {
          rawItems = data.items;
        }
      }
    } catch {}
  }

  // 3순위: 공개 프록시 (최후의 보루)
  if (rawItems.length === 0) {
    try {
      const gl = lang === 'ko' ? 'KR' : 'US';
      const hl = lang === 'ko' ? 'ko' : 'en-US';
      const ceid = lang === 'ko' ? 'KR:ko' : 'US:en';
      const queryForProxy = primaryQuery || keyword;
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(queryForProxy)}&hl=${hl}&gl=${gl}&ceid=${ceid}`;

      const proxyRes = await fetch(
        `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (proxyRes.ok) {
        const json = await proxyRes.json();
        const xml = json.contents || '';
        const matches = xml.matchAll(/<item>([\s\S]*?)<\/item>/gi);
        for (const match of matches) {
          const content = match[1];
          const titleM = content.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
          const linkM = content.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
          const pubDateM = content.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
          const sourceM = content.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
          if (titleM && linkM) {
            rawItems.push({
              title: titleM[1].replace(/<[^>]+>/g, '').trim(),
              link: linkM[1].trim(),
              pubDate: pubDateM ? pubDateM[1].trim() : '',
              source: sourceM ? sourceM[1].replace(/<[^>]+>/g, '').trim() : 'Google News',
            });
          }
        }
      }
    } catch {}
  }

  if (rawItems.length === 0) {
    return [];
  }

  // 정제 검색어 및 원본 키워드, 동음이의어 식별자를 바탕으로 연관 필터링 키워드 추출
  const searchTerms = [
    ...smartInfo.cleanKeyword.toLowerCase().split(/\s+/),
    ...keyword.replace(/_/g, ' ').toLowerCase().split(/\s+/),
    ...smartInfo.smartQuery.toLowerCase().split(/\s+/),
    ...(smartInfo.altSmartQuery ? smartInfo.altSmartQuery.toLowerCase().split(/\s+/) : []),
    ...(smartInfo.disambigContext ? smartInfo.disambigContext.toLowerCase().split(/\s+/) : []),
  ]
    .map((t) => t.replace(/[^\w\s가-힣]/g, '').trim())
    .filter((term) => term.length >= 2);

  let filteredItems = rawItems.filter((item: any) => {
    const title = (item.title || '').toLowerCase();
    return searchTerms.some((term) => title.includes(term));
  });

  if (smartInfo.disambigContext && filteredItems.length > 0) {
    const contextLower = smartInfo.disambigContext.toLowerCase();
    filteredItems.sort((a: any, b: any) => {
      const aText = `${a.title || ''} ${a.source || ''}`.toLowerCase();
      const bText = `${b.title || ''} ${b.source || ''}`.toLowerCase();
      const aHas = aText.includes(contextLower);
      const bHas = bText.includes(contextLower);
      if (aHas && !bHas) return -1;
      if (!aHas && bHas) return 1;
      return 0;
    });
  }

  if (filteredItems.length < 3) {
    filteredItems = rawItems;
  }

  return filteredItems.slice(0, 25).map((item: any) => {
    let title = item.title || '';
    let source = item.source || 'News';
    if (title.includes(' - ') && (source === 'Google News' || !item.source)) {
      const parts = title.split(' - ');
      source = parts.pop() || source;
      title = parts.join(' - ');
    }
    return {
      title: title.trim(),
      link: item.link,
      pubDate: item.pubDate,
      source: source.trim(),
    };
  });
};
