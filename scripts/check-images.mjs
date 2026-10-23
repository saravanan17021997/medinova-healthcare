// Verifies that every image the app references exists in /public, is a real
// image, and matches the dimensions declared in the data. Fails the build otherwise.
// Usage: npm run check:images
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { loadData, root } from './lib/load-data.mjs';

const pub = path.join(root, 'public');
const refs = new Map(); // path -> { from:Set, width?, height? }
const add = (p, from, dims = {}) => {
  const key = p.split('?')[0];
  const r = refs.get(key) || { from: new Set() };
  r.from.add(from);
  Object.assign(r, dims);
  refs.set(key, r);
};

// 1. Literal paths in source, HTML, CSS and the web manifest.
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]));
const files = [...walk(path.join(root, 'src')).filter((f) => /\.(tsx?|css)$/.test(f)), path.join(root, 'index.html'), path.join(pub, 'site.webmanifest')];
const literal = /["'`(](\/(?:images\/[A-Za-z0-9/_.-]+|favicon[A-Za-z0-9._-]*|apple-touch-icon\.png|og-image\.png|icons\/[A-Za-z0-9._-]+))["'`)\s]/g;
const remote = /https?:\/\/[^\s"'`)]+\.(?:png|jpe?g|webp|gif|avif|svg)\b/gi;
const remoteHits = [];
for (const f of files) {
  const txt = fs.readFileSync(f, 'utf8');
  for (const m of txt.matchAll(literal)) if (!m[1].includes('${')) add(m[1], path.relative(root, f));
  for (const m of txt.matchAll(remote)) remoteHits.push(`${path.relative(root, f)}: ${m[0]}`);
}
for (const m of fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/imagesrcset="([^"]+)"/g)) m[1].split(',').forEach((part) => add(part.trim().split(' ')[0], 'index.html'));

// 2. Image assets declared in the data modules (including derived "-sm" variants).
const data = await loadData();
const visit = (v, from) => {
  if (!v || typeof v !== 'object') return;
  if (Array.isArray(v)) return v.forEach((x) => visit(x, from));
  if (typeof v.src === 'string' && v.src.startsWith('/') && typeof v.width === 'number') {
    add(v.src, from, { width: v.width, height: v.height });
    if (v.smallWidth && v.src.endsWith('.webp')) add(v.src.replace(/\.webp$/, '-sm.webp'), from, { width: v.smallWidth });
  }
  for (const [k, x] of Object.entries(v)) {
    if (typeof x === 'string' && /^\/(images|icons)\//.test(x)) add(x, `${from}.${k}`);
    else visit(x, from);
  }
};
for (const [name, mod] of Object.entries(data)) visit(mod, `src/data/${name}.ts`);

// 3. Verify every reference.
const problems = [];
let rasters = 0;
let svgs = 0;
for (const [p, r] of [...refs].sort()) {
  const abs = path.join(pub, p);
  if (!fs.existsSync(abs)) {
    problems.push(`MISSING  ${p}  (referenced in ${[...r.from].join(', ')})`);
    continue;
  }
  const buf = fs.readFileSync(abs);
  if (buf.length === 0) {
    problems.push(`EMPTY    ${p}`);
    continue;
  }
  if (p.endsWith('.svg')) {
    svgs++;
    const s = buf.toString();
    if (!/^<svg[\s\S]*<\/svg>\s*$/.test(s.trim()) || !/viewBox="/.test(s)) problems.push(`BAD SVG  ${p}`);
    continue;
  }
  if (p.endsWith('.webmanifest')) continue;
  try {
    const meta = await sharp(buf).metadata();
    rasters++;
    if (r.width && meta.width !== r.width) problems.push(`SIZE     ${p}: file is ${meta.width}px wide, data declares ${r.width}px`);
    if (r.height && meta.height !== r.height) problems.push(`SIZE     ${p}: file is ${meta.height}px tall, data declares ${r.height}px`);
  } catch (e) {
    problems.push(`UNREADABLE ${p}: ${e.message}`);
  }
}

// 4. Generated assets nobody references (informational).
const out = JSON.parse(fs.readFileSync(path.join(root, 'scripts/images/output.json'), 'utf8'));
const generated = out.assets.flatMap((a) => a.outputs.map((o) => '/' + o.file));
const unused = generated.filter((g) => !refs.has(g));

console.log(`Image check: ${refs.size} referenced files (${rasters} raster, ${svgs} SVG), ${generated.length} generated files.`);
if (remoteHits.length) {
  problems.push(...remoteHits.map((h) => `REMOTE   ${h} (images must be stored locally)`));
}
if (unused.length) console.log(`Not referenced by the app (${unused.length}):\n  ${unused.join('\n  ')}`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
console.log('All referenced images exist, are readable and match their declared dimensions.');
