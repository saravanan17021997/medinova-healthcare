// MediNova brand mark: an arched doorway (a welcoming clinic entrance) holding
// a soft medical cross, with an aqua line leaving the cross and ending in a
// node — "connected healthcare". Original artwork, no third-party marks.
import { C, path, circle, rect, g } from './svg.mjs';
import { text, measure } from './text.mjs';

/** Mark drawn in a 64×64 box. */
export function mark({ x = 0, y = 0, size = 64, bg = C.ink, cross = '#FFFFFF', accent = C.aqua } = {}) {
  const s = size / 64;
  return g(
    [
      // arch doorway
      path('M6,58 L6,28 C6,13.6 17.6,4 32,4 C46.4,4 58,13.6 58,28 L58,58 Q58,62 54,62 L10,62 Q6,62 6,58 Z', { fill: bg }),
      // soft cross
      rect(27.5, 20, 9, 30, { rx: 4.5, fill: cross }),
      rect(17, 30.5, 30, 9, { rx: 4.5, fill: cross }),
      // connected pathway
      path('M43,35 C48,35 48.5,24 52.5,19.5', { fill: 'none', stroke: accent, strokeWidth: 3, strokeLinecap: 'round' }),
      circle(52.8, 18.6, 3.6, { fill: accent }),
    ],
    { transform: `translate(${x},${y}) scale(${s})` },
  );
}

/** Horizontal lockup: mark + "MediNova" + "Healthcare". Returns { svg, width, height }. */
export function lockup({ x = 0, y = 0, height = 64, dark = false } = {}) {
  const word = dark ? '#FFFFFF' : C.ink;
  const sub = dark ? C.aqua2 : C.teal;
  const s = height / 64;
  const nameSize = 34 * s;
  const subSize = 14 * s;
  const gap = 14 * s;
  const tx = x + height + gap;
  const name = text('MediNova', { x: tx, y: y + 37 * s, size: nameSize, font: 'fraunces-600', fill: word });
  const tag = text('Healthcare', { x: tx + 1 * s, y: y + 55 * s, size: subSize, font: 'figtree-600', fill: sub, tracking: 0.6 * s });
  const w = Math.max(measure('MediNova', { font: 'fraunces-600', size: nameSize }), measure('Healthcare', { font: 'figtree-600', size: subSize, tracking: 0.6 * s }));
  return {
    svg: mark({ x, y, size: height, bg: dark ? C.aqua : C.ink, cross: dark ? C.ink : '#FFFFFF', accent: dark ? '#FFFFFF' : C.aqua }) + name + tag,
    width: height + gap + w + 2,
    height,
  };
}
