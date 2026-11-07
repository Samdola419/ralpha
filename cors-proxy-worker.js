// Minimal CORS proxy for a Cloudflare Worker.
//
// Why: browsers refuse to call an API from a web page unless the API answers
// the CORS preflight. If Token Harbor (or any provider) doesn't, put this in front.
//
// Setup:
//  1. Create a Worker and paste this file.
//  2. Add a variable UPSTREAM = https://tokenharbor.ai   (no trailing slash)
//  3. Optional: ALLOW_ORIGIN = https://your-site.example  (default is *)
//  4. In R Alpha > Settings > Token Harbor > Custom base URL, enter:
//        https://<your-worker>.workers.dev/v1
//
// The key is still sent by the browser in the Authorization header and passed
// straight through; nothing is stored here.

export default {
  async fetch(req, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOW_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Max-Age': '86400',
    };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const url = new URL(req.url);
    const headers = new Headers(req.headers);
    headers.delete('origin');
    headers.delete('referer');

    const upstream = await fetch(env.UPSTREAM + url.pathname + url.search, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
    });

    const res = new Response(upstream.body, upstream);
    for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
    return res;
  },
};
