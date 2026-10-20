export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    let texts = [];
    if (req.method === 'POST') {
      const body = req.body || {};
      texts = Array.isArray(body.texts) ? body.texts : (body.text ? [body.text] : []);
    } else {
      const text = req.query.text;
      if (text) texts = text.split('\n');
    }

    if (texts.length === 0) {
      return res.status(400).json({ error: 'No texts provided' });
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

    const translations = {};
    texts.forEach((orig, idx) => {
      translations[orig] = transList[idx] || orig;
    });

    return res.status(200).json({ success: true, translations });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
