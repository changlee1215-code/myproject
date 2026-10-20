export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const query = req.query.q;
    const lang = req.query.lang === 'en' ? 'en' : 'ko';

    if (!query) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const hl = lang === 'en' ? 'en-US' : 'ko';
    const gl = lang === 'en' ? 'US' : 'KR';
    const ceid = lang === 'en' ? 'US:en' : 'KR:ko';

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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(9000),
      });

      if (!response.ok) return [];

      const xml = await response.text();
      const items = [];
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

    let items = await fetchRss(smartQuery1);

    if (items.length < 3 && smartQuery2) {
      const altItems = await fetchRss(smartQuery2);
      if (altItems.length > items.length) items = altItems;
    }

    if (items.length < 3 && query !== smartQuery1) {
      const rawItems = await fetchRss(query);
      if (rawItems.length > items.length) items = rawItems;
    }

    if (items.length < 3 && !disambigContext && baseQuery !== query && baseQuery.length >= 2) {
      const fallbackItems = await fetchRss(baseQuery);
      if (fallbackItems.length > items.length) items = fallbackItems;
    }

    return res.status(200).json({ success: true, count: items.length, items: items.slice(0, 30) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
