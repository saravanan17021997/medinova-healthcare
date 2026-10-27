// Serves the production build (dist/) with the same headers and rewrites as
// vercel.json, so the security headers can be tested locally before deploying.
// Usage: node scripts/serve-vercel.mjs [port] [dir]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const port = Number(process.argv[2] || 4190);
const root = path.resolve(process.argv[3] || 'dist');
const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const toRegex = (source) => new RegExp('^' + source.replace(/\(\.\*\)/g, '(.*)') + '$');
const rules = config.headers.map((h) => ({ re: toRegex(h.source), headers: h.headers }));
const rewrites = config.rewrites.map((r) => ({ re: new RegExp('^' + r.source + '$'), to: r.destination }));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain', '.xml': 'application/xml' };

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let file = path.join(root, decodeURIComponent(url.pathname));
  if (!file.startsWith(root)) return res.writeHead(400).end();
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    const rw = rewrites.find((r) => r.re.test(url.pathname));
    file = rw ? path.join(root, rw.to) : file;
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) return res.writeHead(404).end('Not found');
  for (const r of rules) if (r.re.test(url.pathname)) for (const h of r.headers) res.setHeader(h.key, h.value);
  res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`serving ${root} with vercel.json headers on http://localhost:${port}`));
