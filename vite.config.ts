import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

// Vite 개발/프리뷰 서버 내장 뉴스 프록시 플러그인 (별도 백엔드 서버 없이도 구글 뉴스 RSS 파싱 및 번역 지원)
function googleNewsDevPlugin(): Plugin {
  const registerMiddlewares = (server: any) => {
    server.middlewares.use('/api/news', async (req: any, res: any) => {
      // CORS 및 preflight 대응
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      try {
        const queryString = (req.url || '').split('?')[1] || '';
        const searchParams = new URLSearchParams(queryString);
        const query = searchParams.get('q');
        const lang = searchParams.get('lang') === 'en' ? 'en' : 'ko';

        if (!query) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'Query parameter "q" is required' }));
          return;
        }

        const hl = lang === 'en' ? 'en-US' : 'ko';
        const gl = lang === 'en' ? 'US' : 'KR';
        const ceid = lang === 'en' ? 'US:en' : 'KR:ko';

        // 위키백과 동음이의어 식별자(예: '바다 (가수)', '김지원 (배우)', 'Dancing with the Stars (American TV series) season 35') 분리 파싱
        const disambigMatch = query.match(/\(([^)]+)\)/);
        const disambigContext = disambigMatch ? disambigMatch[1].replace(/_/g, ' ').trim() : '';
        const baseQuery = query
          .replace(/\s*\([^)]*\)\s*/g, ' ')
          .replace(/_/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const isKo = lang === 'ko' || /[가-힣]/.test(query);

        // 동음이의어 문맥을 반영한 스마트 쿼리 생성 (단순 괄호 제거로 인한 일반명사 오탐 방지)
        const smartQuery1 = disambigContext
          ? (isKo ? `${disambigContext} ${baseQuery}` : `${baseQuery} ${disambigContext}`)
          : (baseQuery.length >= 2 ? baseQuery : query);

        const smartQuery2 = disambigContext
          ? (isKo ? `${baseQuery} ${disambigContext}` : `${disambigContext} ${baseQuery}`)
          : '';

        const fetchRss = async (searchTerm: string) => {
          const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(searchTerm)}&hl=${hl}&gl=${gl}&ceid=${ceid}`;
          const response = await fetch(rssUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            signal: AbortSignal.timeout(9000),
          });

          if (!response.ok) return [];

          const xml = await response.text();
          const items: any[] = [];
          const matches = xml.matchAll(/<item>([\s\S]*?)<\/item>/gi);

          for (const match of matches) {
            const content = match[1];
            const titleM = content.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
            const linkM = content.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
            const pubDateM = content.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
            const sourceM = content.match(/<source[^>]*>([\s\S]*?)<\/source>/i);

            if (titleM && linkM) {
              items.push({
                title: titleM[1].replace(/<[^>]+>/g, '').trim(),
                link: linkM[1].trim(),
                pubDate: pubDateM ? pubDateM[1].trim() : '',
                source: sourceM ? sourceM[1].replace(/<[^>]+>/g, '').trim() : 'Google News',
              });
            }
          }
          return items;
        };

        // 1차 검색 시도 (스마트 쿼리 또는 원본)
        let items = await fetchRss(smartQuery1);

        // 결과가 부족하고 보조 스마트 쿼리가 있는 경우 2차 시도 (예: '바다 가수')
        if (items.length < 3 && smartQuery2) {
          const altItems = await fetchRss(smartQuery2);
          if (altItems.length > items.length) {
            items = altItems;
          }
        }

        // 결과가 부족하고 원본 쿼리와 다르면 원본 키워드로 3차 시도
        if (items.length < 3 && query !== smartQuery1) {
          const rawItems = await fetchRss(query);
          if (rawItems.length > items.length) {
            items = rawItems;
          }
        }

        // 동음이의어 태그가 없었던 일반 키워드에 한해서만 baseQuery 폴백 허용 (동음이의어 오탐 절대 방지)
        if (items.length < 3 && !disambigContext && baseQuery !== query && baseQuery.length >= 2) {
          const fallbackItems = await fetchRss(baseQuery);
          if (fallbackItems.length > items.length) {
            items = fallbackItems;
          }
        }

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ success: true, count: items.length, items: items.slice(0, 30) }));
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: err.message }));
      }
    });

    server.middlewares.use('/api/translate', async (req: any, res: any) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      try {
        let texts: string[] = [];
        if (req.method === 'POST') {
          const chunks: any[] = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          const raw = Buffer.concat(chunks).toString('utf-8');
          const body = JSON.parse(raw || '{}');
          texts = Array.isArray(body.texts) ? body.texts : (body.text ? [body.text] : []);
        } else {
          const queryString = (req.url || '').split('?')[1] || '';
          const searchParams = new URLSearchParams(queryString);
          const text = searchParams.get('text');
          if (text) texts = text.split('\n');
        }

        if (texts.length === 0) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'No texts provided' }));
          return;
        }

        const joined = texts.join('\n');
        const apiUrl = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=ko&q=${encodeURIComponent(joined)}`;
        const response = await fetch(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          signal: AbortSignal.timeout(6000),
        });

        if (!response.ok) {
          throw new Error(`Google translate returned status ${response.status}`);
        }

        const data = await response.json();
        const rawText = Array.isArray(data) ? data[0] : (typeof data === 'string' ? data : '');
        const transList = typeof rawText === 'string' ? rawText.split('\n') : [];

        const translations: Record<string, string> = {};
        texts.forEach((orig, idx) => {
          translations[orig] = transList[idx] || orig;
        });

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ success: true, translations }));
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  };

  return {
    name: 'vite-plugin-google-news',
    configureServer(server) {
      registerMiddlewares(server);
    },
    configurePreviewServer(server) {
      registerMiddlewares(server);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), googleNewsDevPlugin()],
  server: {
    proxy: {
      '/api/traffic': 'http://localhost:3001',
    },
  },
});

