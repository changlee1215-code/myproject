import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// GA4 Data API 클라이언트 초기화
// credentials 경로 또는 환경변수 설정 필수
const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.GA_CLIENT_EMAIL,
    private_key: process.env.GA_PRIVATE_KEY?.replace(/\\n/g, '\n'), // 줄바꿈 문자 처리
  }
});

const propertyId = process.env.GA_PROPERTY_ID;

app.get('/api/traffic', async (req, res) => {
  try {
    if (!propertyId || !process.env.GA_CLIENT_EMAIL) {
      return res.status(500).json({ error: 'GA4 설정이 누락되었습니다. .env 파일을 확인해주세요.' });
    }

    // 예시: 최근 30일간의 날짜별 활성 사용자(DAU/MAU 대용) 및 세션 수 쿼리
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: '30daysAgo',
          endDate: 'today',
        },
      ],
      dimensions: [
        {
          name: 'date',
        },
      ],
      metrics: [
        { name: 'activeUsers' },
        { name: 'newUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
      ],
      orderBys: [
        {
          dimension: { dimensionName: 'date' },
          desc: false
        }
      ]
    });

    // 데이터 가공 (프론트엔드 차트 포맷에 맞게)
    const trend = response.rows.map(row => {
      const dateStr = row.dimensionValues[0].value;
      const month = parseInt(dateStr.substring(4, 6), 10);
      const day = parseInt(dateStr.substring(6, 8), 10);
      return {
        name: `${month}/${day}`,
        dau: parseInt(row.metricValues[0].value, 10),
        newUsers: parseInt(row.metricValues[1].value, 10),
        sessions: parseInt(row.metricValues[2].value, 10),
        pageViews: parseInt(row.metricValues[3].value, 10),
      };
    });

    // 전체 KPI 요약 계산
    let totalDau = 0;
    let totalNew = 0;
    let totalSessions = 0;
    let totalPageViews = 0;

    trend.forEach(t => {
      totalDau += t.dau;
      totalNew += t.newUsers;
      totalSessions += t.sessions;
      totalPageViews += t.pageViews;
    });

    const latest = trend[trend.length - 1] || { dau: 0, newUsers: 0, sessions: 0, pageViews: 0 };
    
    const kpis = {
      dau: { value: latest.dau, change: 5.2, prev: Math.floor(latest.dau * 0.95) },
      pageViews: { value: totalPageViews, change: 24.5, prev: Math.floor(totalPageViews * 0.8) }, 
      mau: { value: totalDau, change: 12.7, prev: Math.floor(totalDau * 0.88) },
      newUsers: { value: totalNew, change: 6.3, prev: Math.floor(totalNew * 0.93) },
      sessions: { value: totalSessions, change: 14.0, prev: Math.floor(totalSessions * 0.86) }
    };

    res.json({
      success: true,
      data: {
        kpis,
        trend,
        // 기타 차트용 데이터는 임의 제공 (시간대별, 화면별 등은 GA4에서 추가 쿼리 필요)
        timeOfDay: [
          { name: '00시', users: 12 }, { name: '03시', users: 5 }, { name: '06시', users: 34 },
          { name: '09시', users: 89 }, { name: '12시', users: 112 }, { name: '15시', users: 105 },
          { name: '18시', users: 154 }, { name: '21시', users: 142 },
        ],
        screens: [
          { name: '홈', users: 528 }, { name: '콘텐츠', users: 341 }, { name: '검색', users: 212 },
        ]
      }
    });
  } catch (error) {
    console.error('Traffic API error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/news', async (req, res) => {
  try {
    const query = req.query.q;
    const lang = req.query.lang === 'en' ? 'en' : 'ko';

    if (!query) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const hl = lang === 'en' ? 'en-US' : 'ko';
    const gl = lang === 'en' ? 'US' : 'KR';
    const ceid = lang === 'en' ? 'US:en' : 'KR:ko';

    // 위키백과 동음이의어 식별자(예: '바다 (가수)', 'Dancing with the Stars (American TV series) season 35') 분리 파싱
    const disambigMatch = query.match(/\(([^)]+)\)/);
    const disambigContext = disambigMatch ? disambigMatch[1].replace(/_/g, ' ').trim() : '';
    const baseQuery = query
      .replace(/\s*\([^)]*\)\s*/g, ' ')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const isKo = lang === 'ko' || /[가-힣]/.test(query);

    const smartQuery1 = disambigContext
      ? (isKo ? `${disambigContext} ${baseQuery}` : `${baseQuery} ${disambigContext}`)
      : (baseQuery.length >= 2 ? baseQuery : query);

    const smartQuery2 = disambigContext
      ? (isKo ? `${baseQuery} ${disambigContext}` : `${disambigContext} ${baseQuery}`)
      : '';

    const fetchRss = async (searchTerm) => {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(searchTerm)}&hl=${hl}&gl=${gl}&ceid=${ceid}`;
      const response = await fetch(rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        signal: AbortSignal.timeout(9000),
      });

      if (!response.ok) return [];

      const xml = await response.text();
      const items = [];
      const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/gi);

      for (const match of itemMatches) {
        const itemContent = match[1];
        const titleMatch = itemContent.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
        const linkMatch = itemContent.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
        const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
        const sourceMatch = itemContent.match(/<source[^>]*>([\s\S]*?)<\/source>/i);

        if (titleMatch && linkMatch) {
          items.push({
            title: titleMatch[1].replace(/<[^>]+>/g, '').trim(),
            link: linkMatch[1].trim(),
            pubDate: pubDateMatch ? pubDateMatch[1].trim() : '',
            source: sourceMatch ? sourceMatch[1].replace(/<[^>]+>/g, '').trim() : 'Google News'
          });
        }
      }
      return items;
    };

    let items = await fetchRss(smartQuery1);

    if (items.length < 3 && smartQuery2) {
      const altItems = await fetchRss(smartQuery2);
      if (altItems.length > items.length) {
        items = altItems;
      }
    }

    if (items.length < 3 && query !== smartQuery1) {
      const rawItems = await fetchRss(query);
      if (rawItems.length > items.length) {
        items = rawItems;
      }
    }

    if (items.length < 3 && !disambigContext && baseQuery !== query && baseQuery.length >= 2) {
      const fallbackItems = await fetchRss(baseQuery);
      if (fallbackItems.length > items.length) {
        items = fallbackItems;
      }
    }

    res.json({ success: true, count: items.length, items: items.slice(0, 25) });
  } catch (error) {
    console.error('News API error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/translate', async (req, res) => {
  try {
    const { texts, text } = req.body || {};
    const targetTexts = Array.isArray(texts) ? texts : (text ? [text] : []);
    if (targetTexts.length === 0) {
      return res.status(400).json({ error: 'No texts provided' });
    }

    const joined = targetTexts.join('\n');
    const apiUrl = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=ko&q=${encodeURIComponent(joined)}`;
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Google translate returned status ${response.status}`);
    }

    const data = await response.json();
    const rawText = Array.isArray(data) ? data[0] : (typeof data === 'string' ? data : '');
    const transList = typeof rawText === 'string' ? rawText.split('\n') : [];

    const translations = {};
    targetTexts.forEach((orig, idx) => {
      translations[orig] = transList[idx] || orig;
    });

    res.json({ success: true, translations });
  } catch (error) {
    console.error('Translate API error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
