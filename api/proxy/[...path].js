// Vercel serverless proxy for R Alpha.
// Only the two configured providers and the two required API endpoints are allowed.

const PROVIDERS = {
  dahl: 'https://inference.dahl.global',
  harbor: 'https://tokenharbor.ai',
};

const ALLOWED_PATHS = new Set(['/v1/models', '/v1/chat/completions']);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (!['GET', 'POST'].includes(req.method)) {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.end('Method not allowed');
  }

  const parts = Array.isArray(req.query.path)
    ? req.query.path
    : typeof req.query.path === 'string' ? [req.query.path] : [];
  const provider = parts.shift();
  const path = '/' + parts.join('/');
  const upstreamBase = PROVIDERS[provider];

  if (!upstreamBase || !ALLOWED_PATHS.has(path)) {
    res.statusCode = 404;
    return res.end('Unknown provider or API endpoint');
  }

  const incoming = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const target = new URL(path + incoming.search, upstreamBase);
  const headers = {};
  if (req.headers.authorization) headers.authorization = req.headers.authorization;
  if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'];
  if (req.headers.accept) headers.accept = req.headers.accept;

  try {
    let body;
    if (req.method === 'POST') {
      // Vercel may pre-parse JSON request bodies before invoking the handler.
      if (Buffer.isBuffer(req.body)) body = req.body;
      else if (typeof req.body === 'string') body = req.body;
      else if (req.body !== undefined) body = JSON.stringify(req.body);
      else {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        body = Buffer.concat(chunks);
      }
    }

    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body,
      signal: AbortSignal.timeout(300000),
    });

    res.statusCode = upstream.status;
    for (const name of ['content-type', 'cache-control', 'x-request-id']) {
      const value = upstream.headers.get(name);
      if (value) res.setHeader(name, value);
    }

    // Forward the response incrementally so streamed model replies remain live.
    if (upstream.body) {
      for await (const chunk of upstream.body) {
        if (!res.write(Buffer.from(chunk))) {
          await new Promise(resolve => res.once('drain', resolve));
        }
      }
    }
    return res.end();
  } catch (error) {
    if (!res.headersSent) {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    return res.end(JSON.stringify({ error: { message: 'Provider connection failed. Check the Vercel function logs and try again.' } }));
  }
};
