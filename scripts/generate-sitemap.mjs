// Writes public/sitemap.xml and public/robots.txt.
// With VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set (as on Vercel), the pages
// come from the database: only published specialties, doctors and products, and
// only those whose specialty or category is also shown. If the database cannot be
// reached the built-in sample data is used, so a build never fails because of it.
// Indexing is OFF by default because the site contains fictional profiles;
// set VITE_ALLOW_INDEXING=true (and VITE_SITE_URL) for a real deployment.
import fs from 'node:fs';
import path from 'node:path';
import { loadData, root } from './lib/load-data.mjs';

const env = { ...readEnv(path.join(root, '.env')), ...readEnv(path.join(root, '.env.production')), ...process.env };
const site = (env.VITE_SITE_URL || 'http://localhost:4173').replace(/\/$/, '');
const allow = String(env.VITE_ALLOW_INDEXING).toLowerCase() === 'true';

const today = new Date().toISOString().slice(0, 10);
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const fixed = ['/', '/specialties', '/doctors', '/facilities', '/appointment', '/store', '/contact'].map((path) => ({ path, lastmod: today }));

async function fromDatabase() {
  const url = (env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
  const key = (env.VITE_SUPABASE_ANON_KEY || '').trim();
  if (!url || !key) return null;
  if (key.startsWith('sb_secret_') || /"role"\s*:\s*"service_role"/.test(decodeJwt(key))) throw new Error('VITE_SUPABASE_ANON_KEY is a secret key; refusing to use it');
  const get = async (q) => {
    const res = await fetch(`${url}/rest/v1/${q}`, { headers: { apikey: key, Accept: 'application/json' }, signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`${q.split('?')[0]}: HTTP ${res.status}`);
    return res.json();
  };
  const [specs, docs, cats, prods] = await Promise.all([
    get('sd_specialties?select=id,slug,updated_at&published=eq.true'),
    get('sd_doctors?select=slug,specialty_id,updated_at&published=eq.true'),
    get('sd_categories?select=id&published=eq.true'),
    get('sd_products?select=slug,category_id,updated_at&published=eq.true'),
  ]);
  const shownSpecs = new Set(specs.map((x) => x.id));
  const shownCats = new Set(cats.map((x) => x.id));
  const day = (t) => (typeof t === 'string' ? t.slice(0, 10) : today);
  const ok = (x) => typeof x.slug === 'string' && SLUG.test(x.slug);
  return [
    ...specs.filter(ok).map((x) => ({ path: `/specialties/${x.slug}`, lastmod: day(x.updated_at) })),
    ...docs.filter((x) => ok(x) && shownSpecs.has(x.specialty_id)).map((x) => ({ path: `/doctors/${x.slug}`, lastmod: day(x.updated_at) })),
    ...prods.filter((x) => ok(x) && shownCats.has(x.category_id)).map((x) => ({ path: `/store/${x.slug}`, lastmod: day(x.updated_at) })),
  ];
}

async function fromSample() {
  const { specialties, doctors, products } = await loadData();
  return [
    ...specialties.specialties.map((s) => ({ path: `/specialties/${s.slug}`, lastmod: today })),
    ...doctors.doctors.map((d) => ({ path: `/doctors/${d.slug}`, lastmod: today })),
    ...products.products.map((p) => ({ path: `/store/${p.slug}`, lastmod: today })),
  ];
}

let source = 'sample data';
let pages;
try {
  pages = await fromDatabase();
  if (pages) source = 'the database';
} catch (e) {
  console.warn(`Sitemap: could not read the database (${e.message}). Using the sample data instead.`);
}
pages ??= await fromSample();
const routes = [...fixed, ...pages];
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes.map((r) => `  <url><loc>${esc(site + r.path)}</loc><lastmod>${r.lastmod}</lastmod></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(root, 'public/sitemap.xml'), xml);
fs.writeFileSync(path.join(root, 'public/robots.txt'), allow ? `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${site}/sitemap.xml\n` : `# Demonstration site with fictional content: not for search engines.\n# Set VITE_ALLOW_INDEXING=true for a real deployment.\nUser-agent: *\nDisallow: /\n`);
console.log(`Sitemap: ${routes.length} routes for ${site} from ${source}. Indexing ${allow ? 'allowed' : 'disabled (demo)'}.`);

function decodeJwt(k) {
  const part = k.split('.')[1];
  if (!part) return '';
  try {
    return Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  } catch {
    return '';
  }
}

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
