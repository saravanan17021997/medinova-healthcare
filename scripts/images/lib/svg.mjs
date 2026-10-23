// Small helpers for building SVG strings. Every MediNova image is drawn
// from these primitives, so the whole library shares one palette and style.

export const C = {
  ink: '#0B2545',
  navy: '#13315C',
  navy2: '#1D4A7A',
  navy3: '#2C5E92',
  teal: '#0E7C7B',
  teal2: '#13A09C',
  aqua: '#5BC0BE',
  aqua2: '#97D7D4',
  aqua3: '#CDEDEB',
  mist: '#EEF6F7',
  mist2: '#E1EEF0',
  mist3: '#D3E5E8',
  white: '#FFFFFF',
  line: '#C4D8DD',
  steel: '#AFC3CA',
  steel2: '#8BA3AD',
  slate: '#5D7783',
  wood: '#DDB892',
  wood2: '#C69C74',
  wood3: '#A87F59',
  leaf: '#3E9E7B',
  leaf2: '#2B7F62',
  leaf3: '#5DBB93',
  amber: '#F2B134',
  coral: '#EE8B6A',
  rose: '#E7A3A8',
  sky: '#BFE3F2',
  sky2: '#E6F4FA',
  screen: '#0F3A5F',
  red: '#D65A5A',
};

export const SKIN = {
  s1: '#F6D7C0',
  s2: '#EDBF95',
  s3: '#D9A06F',
  s4: '#B97A4C',
  s5: '#8F5A33',
  s6: '#6A3F27',
};

export const HAIR = {
  black: '#1E1A18',
  dark: '#3A2A20',
  brown: '#5C3D25',
  auburn: '#8A4B2A',
  blonde: '#C9A061',
  grey: '#B9BEC2',
  white: '#E4E6E8',
};

let uid = 0;
export const id = (p = 'g') => `${p}${++uid}`;
export const resetIds = () => {
  uid = 0;
};

export const attrs = (o = {}) =>
  Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}="${v}"`)
    .join(' ');

export const el = (tag, a = {}, inner = '') =>
  inner === '' || inner === null ? `<${tag} ${attrs(a)}/>` : `<${tag} ${attrs(a)}>${inner}</${tag}>`;

export const rect = (x, y, w, h, a = {}) => el('rect', { x, y, width: w, height: h, ...a });
export const circle = (cx, cy, r, a = {}) => el('circle', { cx, cy, r, ...a });
export const ellipse = (cx, cy, rx, ry, a = {}) => el('ellipse', { cx, cy, rx, ry, ...a });
export const path = (d, a = {}) => el('path', { d, ...a });
export const line = (x1, y1, x2, y2, a = {}) => el('line', { x1, y1, x2, y2, ...a });
export const g = (inner, a = {}) => el('g', a, Array.isArray(inner) ? inner.join('') : inner);
export const poly = (pts, a = {}) =>
  el('polygon', { points: pts.map((p) => p.join(',')).join(' '), ...a });
export const pline = (pts, a = {}) =>
  el('polyline', { points: pts.map((p) => p.join(',')).join(' '), fill: 'none', ...a });

/** A stroked, round-capped path through points: used for limbs, tubes and cables. */
export const limb = (pts, width, color, extra = {}) => {
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
  return path(d, {
    fill: 'none',
    stroke: color,
    strokeWidth: width,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    ...extra,
  });
};

/** Smooth curve through points (Catmull-Rom converted to cubic Béziers). */
export const smooth = (pts) => {
  if (pts.length < 3) return pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(2)},${c1[1].toFixed(2)} ${c2[0].toFixed(2)},${c2[1].toFixed(2)} ${p2[0]},${p2[1]}`;
  }
  return d;
};

export const linear = (gid, stops, { x1 = 0, y1 = 0, x2 = 0, y2 = 1 } = {}) =>
  el(
    'linearGradient',
    { id: gid, x1, y1, x2, y2 },
    stops
      .map(([o, c, op]) => el('stop', { offset: o, stopColor: c, stopOpacity: op ?? 1 }))
      .join(''),
  );

export const radial = (gid, stops, { cx = 0.5, cy = 0.5, r = 0.5, fx, fy } = {}) =>
  el(
    'radialGradient',
    { id: gid, cx, cy, r, fx, fy },
    stops
      .map(([o, c, op]) => el('stop', { offset: o, stopColor: c, stopOpacity: op ?? 1 }))
      .join(''),
  );

/** Wrap content into a complete SVG document. */
export const doc = (w, h, body, defs = '', { title } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">` +
  (title ? `<title>${title}</title>` : '') +
  (defs ? `<defs>${defs}</defs>` : '') +
  body +
  `</svg>`;

/** Soft contact shadow under an object. */
export const shadow = (cx, cy, rx, ry, op = 0.14, color = '#0B2545') =>
  ellipse(cx, cy, rx, ry, { fill: color, opacity: op });

/** Deterministic pseudo-random generator so every build draws the same picture. */
export const rng = (seed = 1) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};
