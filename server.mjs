import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const port = Number(process.env.PORT || 5173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' };

function resolveFile(pathname) {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const candidate = path.resolve(root, `.${requested}`);
  if (!candidate.startsWith(root)) return null;
  try { if (fs.statSync(candidate).isDirectory()) return path.join(candidate, 'index.html'); } catch {}
  return candidate;
}

http.createServer((req, res) => {
  const pathname = decodeURIComponent(req.url.split('?')[0]);
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ ok: true, service: 'notedock', runtime: 'local' }));
  }
  const file = resolveFile(pathname);
  if (!file) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}).listen(port, '127.0.0.1', () => console.log(`FUMO Knowledge Desk preview at http://127.0.0.1:${port}`));
