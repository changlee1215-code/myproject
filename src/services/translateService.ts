/**
 * 영문 뉴스 및 외신 헤드라인 번역 서비스
 * 
 * 1순위: Vite 내장 미들웨어 / Express 백엔드 (/api/translate)
 * 2순위: 로컬 Express 백엔드 (http://localhost:3001/api/translate)
 * 3순위: 구글 웹 번역 클라이언트 (clients5) 직접 호출
 * 4순위: MyMemory 공개 번역 API (CORS 허용)
 */

const translationCache = new Map<string, string>();

export const translateBatch = async (
  texts: string[],
  from = 'en',
  to = 'ko'
): Promise<Record<string, string>> => {
  const result: Record<string, string> = {};
  if (!texts || texts.length === 0) return result;

  const toFetch: string[] = [];

  // 캐시 확인
  for (const text of texts) {
    if (!text || !text.trim()) continue;
    const cached = translationCache.get(text);
    if (cached) {
      result[text] = cached;
    } else {
      toFetch.push(text);
    }
  }

  if (toFetch.length === 0) {
    return result;
  }

  // 1순위: 상대 경로 (/api/translate) 호출 (Vite 개발 서버 미들웨어 및 프로덕션)
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: toFetch, from, to }),
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.translations) {
        Object.entries(data.translations).forEach(([orig, trans]) => {
          const transStr = trans as string;
          translationCache.set(orig, transStr);
          result[orig] = transStr;
        });
        return result;
      }
    }
  } catch {
    // 2순위로 이동
  }

  // 2순위: 포트 3001 직접 호출 시도
  try {
    const res = await fetch('http://localhost:3001/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: toFetch, from, to }),
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.translations) {
        Object.entries(data.translations).forEach(([orig, trans]) => {
          const transStr = trans as string;
          translationCache.set(orig, transStr);
          result[orig] = transStr;
        });
        return result;
      }
    }
  } catch {
    // 3순위로 이동
  }

  // 3순위: 구글 클라이언트 직접 번역 시도
  try {
    const joined = toFetch.join('\n');
    const directUrl = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${from}&tl=${to}&q=${encodeURIComponent(joined)}`;
    const res = await fetch(directUrl, { signal: AbortSignal.timeout(3500) });
    if (res.ok) {
      const data = await res.json();
      const rawText = Array.isArray(data) ? data[0] : (typeof data === 'string' ? data : '');
      if (rawText) {
        const transList = rawText.split('\n');
        toFetch.forEach((orig, idx) => {
          const trans = transList[idx] || orig;
          translationCache.set(orig, trans);
          result[orig] = trans;
        });
        return result;
      }
    }
  } catch {
    // 4순위로 이동
  }

  // 4순위: MyMemory 무료 CORS API (최후의 보루, 상위 항목 위주)
  try {
    const promises = toFetch.slice(0, 10).map(async (orig) => {
      try {
        const mmUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(orig)}&langpair=${from}|${to}`;
        const res = await fetch(mmUrl, { signal: AbortSignal.timeout(2500) });
        if (res.ok) {
          const json = await res.json();
          if (json.responseData?.translatedText) {
            const trans = json.responseData.translatedText;
            translationCache.set(orig, trans);
            result[orig] = trans;
          }
        }
      } catch {
        result[orig] = orig;
      }
    });
    await Promise.all(promises);
  } catch {
    // 실패 시 원본 그대로 유지
  }

  // 채워지지 않은 항목은 원본 유지
  toFetch.forEach(orig => {
    if (!result[orig]) {
      result[orig] = orig;
    }
  });

  return result;
};

export const translateText = async (
  text: string,
  from = 'en',
  to = 'ko'
): Promise<string> => {
  if (!text || !text.trim()) return '';
  const cached = translationCache.get(text);
  if (cached) return cached;

  const res = await translateBatch([text], from, to);
  return res[text] || text;
};
