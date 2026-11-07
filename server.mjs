// R Alpha local server: serves r-alpha.html and proxies /_p/<provider>/... so the browser never hits CORS.
// Usage: node server.mjs   (Node 18+, no dependencies)   then open http://localhost:8787
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8787;
const UPSTREAM = { dahl: 'https://inference.dahl.global', harbor: 'https://tokenharbor.ai' };
const PASS = ['authorization', 'content-type', 'accept', 'x-th-cache-control'];

http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://local');
  if (u.pathname === '/_ralpha') { res.writeHead(200, { 'content-type': 'text/plain' }); return res.end('ok'); }

  const m = u.pathname.match(/^\/_p\/(dahl|harbor)(\/.*)$/);
  if (m) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const headers = {};
    for (const h of PASS) if (req.headers[h]) headers[h] = req.headers[h];
    const ac = new AbortController();
    res.on('close', () => ac.abort());
    try {
      const up = await fetch(UPSTREAM[m[1]] + m[2] + u.search, {
        method: req.method, headers, signal: ac.signal,
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
      });
      res.writeHead(up.status, {
        'content-type': up.headers.get('content-type') || 'application/json',
        'cache-control': 'no-store', 'x-accel-buffering': 'no',
      });
      if (up.body) for await (const c of up.body) res.write(c);
      return res.end();
    } catch (e) {
      if (!res.headersSent) res.writeHead(502, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ error: { message: 'Proxy could not reach ' + m[1] + ': ' + e.message } }));
    }
  }

  if (u.pathname === '/' || u.pathname === '/r-alpha.html') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return fs.createReadStream(path.join(dir, 'r-alpha.html')).pipe(res);
  }
  res.writeHead(404, { 'content-type': 'text/plain' }); res.end('Not found');
}).listen(PORT, () => console.log('R Alpha on http://localhost:' + PORT));
