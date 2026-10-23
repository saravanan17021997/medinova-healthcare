// Flat editorial people. Local units: a standing figure is 100 units tall,
// feet at y=100, head centre at (50, 11). Limbs are round-capped strokes,
// which keeps poses easy to change and the style consistent everywhere.
import { C, SKIN, HAIR, g, path, circle, ellipse, rect, limb, line } from './svg.mjs';

const shade = (hex, amt) => {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255,
    gg = (n >> 8) & 255,
    b = n & 255;
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + (amt < 0 ? v * amt : (255 - v) * amt))));
  r = f(r);
  gg = f(gg);
  b = f(b);
  return '#' + ((1 << 24) + (r << 16) + (gg << 8) + b).toString(16).slice(1);
};
export { shade };

const SHOULDER_L = [37.5, 25];
const ARM = {
  down: [[40, 25.6], [35, 39], [35.6, 52.5]],
  hip: [[40, 25.6], [31.5, 37], [37.5, 47]],
  chest: [[40, 25.6], [36.5, 41], [46, 40]],
  hold: [[40, 25.6], [37, 41], [45, 42.5]],
  wave: [[40, 25.6], [28.5, 30], [26.5, 16.5]],
  point: [[40, 25.6], [27, 31], [17.5, 29]],
  gesture: [[40, 25.6], [32.5, 39], [25, 36.5]],
  phone: [[40, 25.6], [33, 36], [42.5, 15.5]],
  cross: [[40, 25.6], [38.5, 40.5], [57, 38]],
  reach: [[40, 25.6], [30, 38], [22, 44]],
  desk: [[40, 25.6], [36, 40], [42, 50]],
  type: [[40, 25.6], [37.5, 41], [44, 53]],
};
const mirror = (pts) => pts.map(([x, y]) => [100 - x, y]);

function hairBack(style, col) {
  switch (style) {
    case 'long':
      return path('M41.6,12 C41.2,3.4 46,1.6 50,1.6 C54,1.6 58.8,3.4 58.4,12 L59.8,27.5 Q50,30.5 40.2,27.5 Z', { fill: col });
    case 'bob':
      return path('M41.4,12 C41,3.6 46,1.6 50,1.6 C54,1.6 59,3.6 58.6,12 L59.3,19.5 Q50,22 40.7,19.5 Z', { fill: col });
    case 'ponytail':
      return path('M57,8 C63,10 64,20 60.5,27 C59.5,22 58.8,16 56,12 Z', { fill: col });
    case 'afro':
      return circle(50, 8.6, 10.6, { fill: col });
    case 'curlylong':
      return g([
        path('M41,12 C40.5,3 46,1.2 50,1.2 C54,1.2 59.5,3 59,12 L60.6,26 Q50,30 39.4,26 Z', { fill: col }),
        ...[[40, 18], [40.5, 24], [59.5, 18], [59.5, 24], [44, 27.5], [56, 27.5]].map(([x, y]) => circle(x, y, 2.8, { fill: col })),
      ]);
    case 'hijab':
      return path('M50,1.2 C58,1.2 60.4,7 60.2,13.2 C60,18.4 61.8,21.4 64.5,25.6 L35.5,25.6 C38.2,21.4 40,18.4 39.8,13.2 C39.6,7 42,1.2 50,1.2 Z', { fill: col });
    default:
      return '';
  }
}

function hairFront(style, col) {
  const cap = 'M42.6,11.4 C42.3,4.4 46,2.1 50,2.1 C54.6,2.1 57.9,4.8 57.5,11.4 C56.2,8.6 53.4,7.1 50,7.3 C46.8,7.1 44,8.6 42.6,11.4 Z';
  switch (style) {
    case 'short':
      return path(cap, { fill: col });
    case 'sidepart':
      return path('M42.4,12.6 C41.8,4.4 46,1.9 50.5,1.9 C55.6,1.9 58.3,5.4 57.7,12.4 C57.1,9.2 55.2,7 52.2,6.6 C49,7.6 46,9.2 42.4,12.6 Z', { fill: col });
    case 'buzz':
      return path('M42.8,10.6 C42.8,5 46.2,3 50,3 C54,3 57.3,5 57.2,10.6 C55.6,8.4 53,7.6 50,7.6 C47,7.6 44.4,8.4 42.8,10.6 Z', { fill: col, opacity: 0.9 });
    case 'long':
    case 'bob':
      return path('M42.4,11.6 C42.1,4.2 46,2 50,2 C54,2 58,4.2 57.7,11.8 C56.6,8.4 53.8,6.4 50.6,6.2 C49.4,7.8 46.6,8.8 42.4,11.6 Z', { fill: col });
    case 'ponytail':
      return path(cap, { fill: col });
    case 'bun':
      return g([circle(50, 1.6, 3.6, { fill: col }), path(cap, { fill: col })]);
    case 'curly':
      return g([
        path(cap, { fill: col }),
        ...[[43.2, 7.6], [45.6, 4.2], [49.4, 2.6], [53.4, 3.2], [56.4, 6], [57.4, 9.6], [42.6, 10.6]].map(([x, y]) => circle(x, y, 2.6, { fill: col })),
      ]);
    case 'curlylong':
      return g([path(cap, { fill: col }), ...[[44, 5.2], [48, 3], [52.4, 3], [56, 5.2]].map(([x, y]) => circle(x, y, 2.4, { fill: col }))]);
    case 'afro':
      return path('M42.4,11.4 C42.2,6 45.6,3.4 50,3.4 C54.4,3.4 57.8,6 57.6,11.4 C56,9.4 53.4,8.4 50,8.4 C46.6,8.4 44,9.4 42.4,11.4 Z', { fill: col });
    case 'grey':
      return path(cap, { fill: col });
    default:
      return '';
  }
}

function face(o) {
  const { skin, hairColor, look = 0, detail = false, smile = 1 } = o;
  const eye = detail ? 0.95 : 0.78;
  const dk = shade(skin, -0.45);
  const parts = [
    // eyes
    ellipse(47.4 + look, 11.3, eye, eye * 1.08, { fill: '#1E2A3A' }),
    ellipse(52.6 + look, 11.3, eye, eye * 1.08, { fill: '#1E2A3A' }),
  ];
  parts.push(
    // brows
    path(`M${46 + look},9.2 Q${47.4 + look},8.4 ${48.8 + look},9.1`, { fill: 'none', stroke: hairColor, strokeWidth: 0.7, strokeLinecap: 'round' }),
    path(`M${51.2 + look},9.1 Q${52.6 + look},8.4 ${54 + look},9.2`, { fill: 'none', stroke: hairColor, strokeWidth: 0.7, strokeLinecap: 'round' }),
    // nose
    path(`M${50.2 + look},11.6 q-0.7,1.7 0.4,1.9`, { fill: 'none', stroke: dk, strokeWidth: 0.5, strokeLinecap: 'round', opacity: 0.7 }),
    // mouth
    smile
      ? path(`M${48.5 + look},14.6 Q${50 + look},${15.9} ${51.5 + look},14.6`, { fill: 'none', stroke: '#9A4A3C', strokeWidth: 0.62, strokeLinecap: 'round' })
      : line(48.8 + look, 14.9, 51.2 + look, 14.9, { stroke: '#9A4A3C', strokeWidth: 0.6, strokeLinecap: 'round' }),
    // cheeks
    circle(46 + look, 13.6, 1.15, { fill: C.coral, opacity: 0.18 }),
    circle(54 + look, 13.6, 1.15, { fill: C.coral, opacity: 0.18 }),
  );
  if (detail) {
    parts.push(
      circle(47.7 + look, 11, 0.28, { fill: '#fff' }),
      circle(52.9 + look, 11, 0.28, { fill: '#fff' }),
    );
  }
  return g(parts);
}

/**
 * person(opts) → SVG group string.
 *  x, y: floor point (centre between feet) in scene px; h: standing height in px.
 *  pose: 'stand' | 'sit'  (sit: floor point is still the feet; seat ≈ 38% of h above it)
 *  top: 'coat' | 'scrubs' | 'shirt' | 'sweater' | 'blouse'
 *  arms: { l, r } preset names from ARM (right side mirrored automatically)
 */
export function person(o = {}) {
  const {
    x = 0,
    y = 0,
    h = 300,
    skin = SKIN.s2,
    hairStyle = 'short',
    hairColor = HAIR.dark,
    top = 'shirt',
    topColor = C.navy2,
    shirt = C.aqua3,
    pants = C.navy,
    shoes = C.ink,
    pose = 'stand',
    arms = {},
    flip = false,
    look = 0,
    steth = false,
    lanyard = false,
    glasses = false,
    mask = false,
    beard = false,
    hijab = null,
    tie = null,
    hold = null, // 'clipboard' | 'tablet' | 'phone' | 'folder' | 'cup'
    detail = false,
    smile = 1,
    skirt = false,
  } = o;
  const s = h / 100;
  const tf = flip
    ? `translate(${x + 50 * s},${y - 100 * s}) scale(${-s},${s})`
    : `translate(${x - 50 * s},${y - 100 * s}) scale(${s})`;
  const sit = pose === 'sit';
  const outline = C.line;
  const parts = [];

  const coat = top === 'coat';
  const sleeve = coat ? '#FFFFFF' : topColor;

  // ---- legs
  if (sit) {
    parts.push(
      rect(38.5, 53, 23, 12.5, { rx: 5.5, fill: pants }),
      limb([[44.2, 62], [44, 90]], 7.6, pants),
      limb([[55.8, 62], [56, 90]], 7.6, pants),
      ellipse(43.2, 91.6, 4.9, 2.2, { fill: shoes }),
      ellipse(56.8, 91.6, 4.9, 2.2, { fill: shoes }),
    );
  } else if (skirt) {
    parts.push(
      limb([[45, 60], [45, 96]], 6.2, skin),
      limb([[55, 60], [55, 96]], 6.2, skin),
      path('M38.4,52 L61.6,52 L64,72 Q50,74.5 36,72 Z', { fill: pants }),
      ellipse(44, 97.6, 4.7, 2.1, { fill: shoes }),
      ellipse(56, 97.6, 4.7, 2.1, { fill: shoes }),
    );
  } else {
    parts.push(
      limb([[45, 55], [45, 96]], 8, pants),
      limb([[55, 55], [55, 96]], 8, pants),
      line(50, 60, 50, 95, { stroke: shade(pants, -0.25), strokeWidth: 0.5, opacity: 0.6 }),
      ellipse(44, 97.6, 5.1, 2.25, { fill: shoes }),
      ellipse(56, 97.6, 5.1, 2.25, { fill: shoes }),
    );
  }

  // ---- hair behind head / hijab hood
  parts.push(hijab ? hairBack('hijab', hijab) : hairBack(hairStyle, hairColor));

  // ---- neck
  parts.push(rect(46.8, 16.5, 6.4, 7.5, { rx: 2, fill: skin }), rect(46.8, 19.5, 6.4, 2.5, { fill: shade(skin, -0.12), opacity: 0.7 }));

  // ---- torso
  const torso = 'M36,26.5 Q36,21.6 41.2,21.6 L58.8,21.6 Q64,21.6 64,26.5 L62.4,56.5 L37.6,56.5 Z';
  if (coat) {
    parts.push(
      path(torso, { fill: shirt }),
      tie ? path('M49,23 L51,23 L52,40 L50,43 L48,40 Z', { fill: tie }) : '',
      path('M35.2,26.6 Q35.2,21.2 41,21.2 L46.4,21.2 L49.4,44 L49.4,75 L36,75 Z', { fill: '#FFFFFF', stroke: outline, strokeWidth: 0.55, strokeLinejoin: 'round' }),
      path('M64.8,26.6 Q64.8,21.2 59,21.2 L53.6,21.2 L50.6,44 L50.6,75 L64,75 Z', { fill: '#FFFFFF', stroke: outline, strokeWidth: 0.55, strokeLinejoin: 'round' }),
      path('M46.4,21.2 L44,27 L48.4,33', { fill: 'none', stroke: outline, strokeWidth: 0.55 }),
      path('M53.6,21.2 L56,27 L51.6,33', { fill: 'none', stroke: outline, strokeWidth: 0.55 }),
      rect(39, 57.5, 6.4, 5, { rx: 0.8, fill: 'none', stroke: outline, strokeWidth: 0.5 }),
      rect(54.6, 57.5, 6.4, 5, { rx: 0.8, fill: 'none', stroke: outline, strokeWidth: 0.5 }),
      rect(55.6, 30, 4.4, 1.2, { rx: 0.4, fill: C.teal, opacity: 0.9 }),
    );
  } else if (top === 'scrubs') {
    parts.push(
      path(torso, { fill: topColor }),
      path('M45.4,21.6 L50,29 L54.6,21.6 Z', { fill: skin }),
      path('M45.4,21.6 L50,29 L54.6,21.6', { fill: 'none', stroke: shade(topColor, -0.2), strokeWidth: 0.7 }),
      rect(40, 36, 6, 4.6, { rx: 0.6, fill: shade(topColor, -0.12) }),
    );
  } else if (top === 'blouse') {
    parts.push(path(torso, { fill: topColor }), path('M45,21.6 Q50,27 55,21.6 Z', { fill: skin }));
  } else if (top === 'sweater') {
    parts.push(
      path(torso, { fill: topColor }),
      path('M45.2,21.6 Q50,25 54.8,21.6', { fill: 'none', stroke: shade(topColor, -0.2), strokeWidth: 1.2 }),
      line(38, 54.5, 62, 54.5, { stroke: shade(topColor, -0.15), strokeWidth: 1.6 }),
    );
  } else {
    // shirt with collar
    parts.push(
      path(torso, { fill: topColor }),
      path('M45.6,21.4 L50,25.6 L47.4,27.6 Z', { fill: shade(topColor, 0.3) }),
      path('M54.4,21.4 L50,25.6 L52.6,27.6 Z', { fill: shade(topColor, 0.3) }),
      line(50, 25.6, 50, 56, { stroke: shade(topColor, -0.2), strokeWidth: 0.45 }),
    );
  }

  // ---- lanyard + badge
  if (lanyard) {
    parts.push(
      path('M46.5,22 L49,36 M53.5,22 L51,36', { fill: 'none', stroke: C.teal, strokeWidth: 0.7 }),
      rect(47.2, 36, 5.6, 7, { rx: 0.8, fill: '#FFFFFF', stroke: C.line, strokeWidth: 0.4 }),
      rect(48, 37, 4, 2.2, { rx: 0.4, fill: C.teal }),
    );
  }

  // ---- stethoscope
  if (steth) {
    parts.push(
      path('M45.6,21.8 C43.4,29 44.6,35.5 48.2,38.6', { fill: 'none', stroke: C.navy, strokeWidth: 0.95, strokeLinecap: 'round' }),
      path('M54.4,21.8 C56.6,29 55.6,33.5 53.6,36.4', { fill: 'none', stroke: C.navy, strokeWidth: 0.95, strokeLinecap: 'round' }),
      path('M48.2,38.6 Q50.6,40.2 53.6,36.4', { fill: 'none', stroke: C.navy, strokeWidth: 0.95 }),
      circle(53.9, 38.6, 1.9, { fill: C.steel, stroke: C.navy, strokeWidth: 0.6 }),
    );
  }

  // ---- arms
  const drawArm = (pts, hand = true) => {
    const sleeveEnd = top === 'scrubs' || top === 'blouse' ? 0.45 : 1;
    const arr = [];
    if (sleeveEnd < 1) {
      // short sleeve: upper arm in fabric, forearm in skin
      const mid = [pts[0][0] + (pts[1][0] - pts[0][0]) * 0.75, pts[0][1] + (pts[1][1] - pts[0][1]) * 0.75];
      arr.push(limb(pts.slice(1).length ? [mid, ...pts.slice(1)] : pts, 5.8, skin));
      arr.push(limb([pts[0], mid], 7.2, sleeve));
    } else {
      if (coat) arr.push(limb(pts, 7.9, outline));
      arr.push(limb(pts, 7, sleeve));
    }
    if (hand) arr.push(circle(pts[pts.length - 1][0], pts[pts.length - 1][1], 3.55, { fill: skin }));
    return arr.join('');
  };

  const heldBack = [];
  const heldFront = [];
  if (hold === 'clipboard') {
    heldFront.push(
      rect(41, 33, 11, 14, { rx: 1.2, fill: C.wood2, transform: 'rotate(-8 46.5 40)' }),
      rect(42.4, 35, 8.2, 11, { rx: 0.6, fill: '#FFFFFF', transform: 'rotate(-8 46.5 40)' }),
      rect(44.4, 32.6, 4.2, 1.8, { rx: 0.5, fill: C.steel2, transform: 'rotate(-8 46.5 40)' }),
      line(43.6, 38.4, 49, 37.6, { stroke: C.aqua, strokeWidth: 0.6 }),
      line(43.9, 40.6, 49.4, 39.8, { stroke: C.line, strokeWidth: 0.6 }),
      line(44.2, 42.8, 48.4, 42.2, { stroke: C.line, strokeWidth: 0.6 }),
    );
  }
  if (hold === 'tablet') {
    heldFront.push(
      rect(42, 34.5, 16, 11.5, { rx: 1.4, fill: C.ink }),
      rect(43.1, 35.6, 13.8, 9.3, { rx: 0.7, fill: C.aqua3 }),
      rect(44.2, 36.8, 6, 1.4, { rx: 0.4, fill: C.teal }),
      rect(44.2, 39.2, 11, 1, { rx: 0.4, fill: '#FFFFFF' }),
      rect(44.2, 41.2, 8.4, 1, { rx: 0.4, fill: '#FFFFFF' }),
    );
  }
  if (hold === 'folder') {
    heldFront.push(rect(40.5, 36, 12, 15, { rx: 1, fill: C.teal, transform: 'rotate(-6 46 43)' }), rect(41.5, 36, 10, 1.4, { fill: C.aqua2, transform: 'rotate(-6 46 43)' }));
  }
  if (hold === 'cup') {
    heldFront.push(rect(43.4, 37, 5.2, 6.2, { rx: 1, fill: '#FFFFFF', stroke: C.line, strokeWidth: 0.4 }), rect(43.4, 38.6, 5.2, 1.6, { fill: C.teal }));
  }

  const lPts = ARM[arms.l] || ARM.down;
  const rPts = mirror(ARM[arms.r] || ARM.down);
  const crossFirst = arms.l === 'cross';
  parts.push(...heldBack);
  if (crossFirst) {
    parts.push(drawArm(rPts), drawArm(lPts));
  } else {
    parts.push(drawArm(lPts), drawArm(rPts));
  }
  parts.push(...heldFront);
  if (hold === 'phone') {
    const hp = arms.l === 'phone' ? lPts[2] : arms.r === 'phone' ? rPts[2] : lPts[2];
    parts.push(rect(hp[0] - 2.2, hp[1] - 4.4, 4.4, 7.6, { rx: 0.9, fill: C.ink }), circle(hp[0], hp[1], 3.3, { fill: skin }));
  }
  // re-draw hands on top of held items so fingers overlap them
  if (hold === 'clipboard' || hold === 'tablet' || hold === 'folder' || hold === 'cup') {
    const hl = lPts[lPts.length - 1];
    const hr = rPts[rPts.length - 1];
    if (['chest', 'hold', 'cross', 'desk', 'type'].includes(arms.l)) parts.push(circle(hl[0], hl[1], 3.55, { fill: skin }));
    if (['chest', 'hold', 'cross', 'desk', 'type'].includes(arms.r)) parts.push(circle(hr[0], hr[1], 3.55, { fill: skin }));
  }

  // ---- head
  parts.push(
    ellipse(42.9, 11.8, 1.4, 2.1, { fill: shade(skin, -0.06) }),
    ellipse(57.1, 11.8, 1.4, 2.1, { fill: shade(skin, -0.06) }),
    ellipse(50, 11, 7.1, 8, { fill: skin }),
  );
  if (hijab) {
    parts.push(
      path('M43.2,15 Q50,22.5 56.8,15 L58,19.2 Q50,25 42,19.2 Z', { fill: hijab }),
      ellipse(50, 10.7, 7.4, 8.5, { fill: 'none', stroke: hijab, strokeWidth: 1.7 }),
      path('M43,6 C44.4,3 47,2 50,2 C53,2 55.6,3 57,6 C55,4.6 52.6,4.1 50,4.1 C47.4,4.1 45,4.6 43,6 Z', { fill: hijab }),
    );
  }
  parts.push(face({ skin, hairColor, look, detail, smile }));
  if (beard) {
    parts.push(
      path('M43.4,12.6 C43.6,18.6 46.6,20.2 50,20.2 C53.4,20.2 56.4,18.6 56.6,12.6 C55.6,15.6 53.2,16.8 50,16.8 C46.8,16.8 44.4,15.6 43.4,12.6 Z', { fill: hairColor }),
      path(`M${48.3 + look},14.9 Q${50 + look},16 ${51.7 + look},14.9`, { fill: 'none', stroke: '#F3D9C9', strokeWidth: 0.55, opacity: 0.6 }),
    );
  }
  if (!hijab) parts.push(hairFront(hairStyle, hairColor));
  if (glasses) {
    parts.push(
      rect(45.3 + look, 9.9, 4.3, 3, { rx: 1.2, fill: 'none', stroke: C.ink, strokeWidth: 0.5 }),
      rect(50.5 + look, 9.9, 4.3, 3, { rx: 1.2, fill: 'none', stroke: C.ink, strokeWidth: 0.5 }),
      line(49.6 + look, 11, 50.5 + look, 11, { stroke: C.ink, strokeWidth: 0.5 }),
    );
  }
  if (mask) {
    parts.push(
      path('M44.4,12.6 Q50,11.6 55.6,12.6 L55,16.6 Q50,19.4 45,16.6 Z', { fill: '#D9F0F7', stroke: '#B7DCE8', strokeWidth: 0.4 }),
      line(45.6, 14.2, 54.4, 14.2, { stroke: '#B7DCE8', strokeWidth: 0.35 }),
      path('M44.4,12.6 L43,11.6 M44.8,16.4 L43.2,13.6 M55.6,12.6 L57,11.6 M55.2,16.4 L56.8,13.6', { fill: 'none', stroke: '#B7DCE8', strokeWidth: 0.4 }),
    );
  }

  return g(parts, { transform: tf });
}
