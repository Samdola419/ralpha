// Vercel serverless function (api/search.js). Tries your Firecrawl key first, then Firecrawl keyless.
// Add FIRECRAWL_API_KEY in Vercel > Project > Settings > Environment Variables, then redeploy.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const query = String((req.body && req.body.query) || '').slice(0, 300);
  if (query.length < 3) return res.status(400).json({ error: 'query too short' });
  const key = process.env.FIRECRAWL_API_KEY;
  const attempts = key ? [{ via: 'key', h: { Authorization: 'Bearer ' + key } }, { via: 'keyless', h: {} }] : [{ via: 'keyless', h: {} }];
  let last = { status: 502, data: { error: 'search failed' } };
  for (const a of attempts) {
    try {
      const r = await fetch('https://api.firecrawl.dev/v2/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...a.h },
        body: JSON.stringify({ query, limit: 5 })
      });
      const data = await r.json().catch(() => ({}));
      const hits = (data.data && data.data.web) || data.web || [];
      if (r.ok && hits.length) return res.status(200).json({ ...data, via: a.via });
      last = { status: r.ok ? 404 : r.status, data };
    } catch (e) {
      last = { status: 502, data: { error: 'upstream failed' } };
    }
  }
  return res.status(last.status).json(last.data);
};
