// Writes public/sitemap.xml and public/robots.txt from the site data.
// Indexing is OFF by default because the site contains fictional profiles;
// set VITE_ALLOW_INDEXING=true (and VITE_SITE_URL) for a real deployment.
import fs from 'node:fs';
import path from 'node:path';
import { loadData, root } from './lib/load-data.mjs';

const env = { ...readEnv(path.join(root, '.env')), ...readEnv(path.join(root, '.env.production')), ...process.env };
const site = (env.VITE_SITE_URL || 'http://localhost:4173').replace(/\/$/, '');
const allow = String(env.VITE_ALLOW_INDEXING).toLowerCase() === 'true';

const { specialties, doctors, products } = await loadData();
const routes = ['/', '/specialties', '/doctors', '/facilities', '/appointment', '/store', '/contact', ...specialties.specialties.map((s) => `/specialties/${s.slug}`), ...doctors.doctors.map((d) => `/doctors/${d.slug}`), ...products.products.map((p) => `/store/${p.slug}`)];

const today = new Date().toISOString().slice(0, 10);
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map((r) => `  <url><loc>${site}${r}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(root, 'public/sitemap.xml'), xml);
fs.writeFileSync(path.join(root, 'public/robots.txt'), allow ? `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${site}/sitemap.xml\n` : `# Demonstration site with fictional content: not for search engines.\n# Set VITE_ALLOW_INDEXING=true for a real deployment.\nUser-agent: *\nDisallow: /\n`);
console.log(`Sitemap: ${routes.length} routes for ${site}. Indexing ${allow ? 'allowed' : 'disabled (demo)'}.`);

function readEnv(file) {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/))
      .filter(Boolean)
      .map((m) => [m[1], m[2].replace(/^["']|["']$/g, '')]),
  );
}
