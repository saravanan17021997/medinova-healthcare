// Converts text to SVG path outlines using the site's own typefaces
// (Fraunces and Figtree from @fontsource, SIL Open Font License 1.1).
// Outlined text renders identically everywhere and needs no font loading.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const fontFile = (pkg, file) => path.join(root, 'node_modules/@fontsource', pkg, 'files', file);

const cache = {};
const FONTS = {
  'fraunces-600': () => fontFile('fraunces', 'fraunces-latin-600-normal.woff'),
  'fraunces-700': () => fontFile('fraunces', 'fraunces-latin-700-normal.woff'),
  'figtree-500': () => fontFile('figtree', 'figtree-latin-500-normal.woff'),
  'figtree-600': () => fontFile('figtree', 'figtree-latin-600-normal.woff'),
  'figtree-700': () => fontFile('figtree', 'figtree-latin-700-normal.woff'),
};

export function font(name) {
  if (!cache[name]) {
    const buf = fs.readFileSync(FONTS[name]());
    cache[name] = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  }
  return cache[name];
}

/** Width of a string in px at a size. */
export function measure(str, { font: f = 'figtree-600', size = 16, tracking = 0 } = {}) {
  const fo = font(f);
  return fo.getAdvanceWidth(str, size, { kerning: true }) + tracking * (str.length - 1);
}

/**
 * Returns an SVG <path> for the string.
 * anchor: 'start' | 'middle' | 'end'; y is the baseline.
 */
export function text(str, { x = 0, y = 0, size = 16, font: f = 'figtree-600', fill = '#0B2545', anchor = 'start', tracking = 0, opacity } = {}) {
  const fo = font(f);
  const w = measure(str, { font: f, size, tracking });
  let sx = x;
  if (anchor === 'middle') sx = x - w / 2;
  if (anchor === 'end') sx = x - w;
  let d = '';
  if (tracking) {
    let cx = sx;
    for (const ch of str) {
      d += fo.getPath(ch, cx, y, size).toPathData(2);
      cx += fo.getAdvanceWidth(ch, size) + tracking;
    }
  } else {
    d = fo.getPath(str, sx, y, size, { kerning: true }).toPathData(2);
  }
  return `<path d="${d}" fill="${fill}"${opacity !== undefined ? ` opacity="${opacity}"` : ''}/>`;
}
