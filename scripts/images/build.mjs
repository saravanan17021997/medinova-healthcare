// Renders every asset in the inventory into public/ and records what it wrote.
// Usage: npm run images
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { inventory } from './inventory.mjs';
import { productArt } from './scenes/products.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const pub = path.join(root, 'public');

// Remove previously generated image folders so nothing stale survives.
for (const dir of ['images', 'icons']) fs.rmSync(path.join(pub, dir), { recursive: true, force: true });

const minify = (svg) => svg.replace(/\n\s*/g, '').replace(/\s{2,}/g, ' ');
const smallName = (file) => file.replace(/\.webp$/, '-sm.webp');
const results = [];
const bboxCache = {};

async function bboxFor(slug) {
  if (!bboxCache[slug]) {
    const { info } = await sharp(Buffer.from(productArt(slug))).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
    bboxCache[slug] = { left: -info.trimOffsetLeft, top: -info.trimOffsetTop, width: info.width, height: info.height };
  }
  return bboxCache[slug];
}

async function record(file) {
  const abs = path.join(pub, file);
  const buf = fs.readFileSync(abs);
  let width;
  let height;
  if (file.endsWith('.svg')) {
    const m = buf.toString().match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
    width = m ? Math.round(+m[1]) : null;
    height = m ? Math.round(+m[2]) : null;
  } else {
    const meta = await sharp(buf).metadata();
    width = meta.width;
    height = meta.height;
  }
  return { file, bytes: buf.length, width, height, sha256: crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16) };
}

for (const item of inventory) {
  const out = path.join(pub, item.file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const svg = item.productSlug ? item.render(await bboxFor(item.productSlug)) : item.render();
  const entry = { ...item, render: undefined, outputs: [] };

  if (item.kind === 'svg') {
    fs.writeFileSync(out, minify(svg));
    entry.outputs.push(await record(item.file));
  } else if (item.kind === 'png') {
    await sharp(Buffer.from(svg), { density: 72 * Math.max(1, item.width / 600) })
      .resize(item.width, item.height)
      .png({ compressionLevel: 9, palette: item.width <= 512 })
      .toFile(out);
    entry.outputs.push(await record(item.file));
  } else {
    const img = sharp(Buffer.from(svg));
    await img.clone().resize(item.width, item.height).webp({ quality: 80, effort: 6 }).toFile(out);
    entry.outputs.push(await record(item.file));
    if (item.small) {
      const sm = smallName(item.file);
      await img.clone().resize(item.small).webp({ quality: 78, effort: 6 }).toFile(path.join(pub, sm));
      entry.outputs.push(await record(sm));
    }
  }
  results.push(entry);
  process.stdout.write('.');
}

fs.writeFileSync(path.join(root, 'scripts/images/output.json'), JSON.stringify({ generatedAt: new Date().toISOString(), assets: results }, null, 2));
const files = results.flatMap((r) => r.outputs);
const total = files.reduce((a, f) => a + f.bytes, 0);
console.log(`\n${results.length} assets, ${files.length} files, ${(total / 1024 / 1024).toFixed(2)} MB`);
