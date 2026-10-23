// Section F: supporting illustrations (kept as SVG) and store category icons.
import { C, doc, rect, circle, ellipse, path, g, line, linear, shadow, limb, poly } from '../lib/svg.mjs';

const W = 480;
const H = 360;
const halo = (cx = 240, cy = 190, r = 150) => circle(cx, cy, r, { fill: C.aqua3, opacity: 0.55 });
const spark = (x, y, s = 1, col = C.amber) =>
  path(`M${x},${y - 14 * s} Q${x + 2.5 * s},${y - 2.5 * s} ${x + 14 * s},${y} Q${x + 2.5 * s},${y + 2.5 * s} ${x},${y + 14 * s} Q${x - 2.5 * s},${y + 2.5 * s} ${x - 14 * s},${y} Q${x - 2.5 * s},${y - 2.5 * s} ${x},${y - 14 * s} Z`, { fill: col });
const check = (cx, cy, r, bg = C.teal) =>
  g([circle(cx, cy, r, { fill: bg }), path(`M${cx - r * 0.42},${cy + r * 0.02} L${cx - r * 0.1},${cy + r * 0.34} L${cx + r * 0.45},${cy - r * 0.3}`, { fill: 'none', stroke: '#FFFFFF', strokeWidth: r * 0.22, strokeLinecap: 'round', strokeLinejoin: 'round' })]);

export function appointment() {
  return doc(W, H, [
    halo(),
    shadow(240, 318, 150, 12, 0.1),
    rect(120, 70, 240, 230, { rx: 26, fill: '#FFFFFF', stroke: C.line, strokeWidth: 3 }),
    rect(120, 70, 240, 58, { rx: 26, fill: C.teal }),
    rect(120, 104, 240, 24, { fill: C.teal }),
    rect(168, 52, 16, 44, { rx: 8, fill: C.ink }),
    rect(296, 52, 16, 44, { rx: 8, fill: C.ink }),
    ...Array.from({ length: 12 }, (_, i) => rect(146 + (i % 4) * 50, 148 + Math.floor(i / 4) * 44, 36, 30, { rx: 8, fill: i === 6 ? C.aqua : C.mist2 })),
    check(352, 262, 34),
    g([circle(0, 0, 40, { fill: '#FFFFFF', stroke: C.navy, strokeWidth: 6 }), limb([[0, 0], [0, -24]], 6, C.navy), limb([[0, 0], [17, 6]], 6, C.teal), circle(0, 0, 5, { fill: C.navy })], { transform: 'translate(110,250)' }),
    spark(400, 90, 1),
    spark(80, 120, 0.7, C.aqua),
  ].join(''), '', { title: 'Calendar with a confirmed time slot' });
}

export function contact() {
  return doc(W, H, [
    halo(),
    shadow(240, 318, 140, 12, 0.1),
    path('M110,90 Q110,70 130,70 L300,70 Q320,70 320,90 L320,180 Q320,200 300,200 L180,200 L140,236 L146,200 L130,200 Q110,200 110,180 Z', { fill: C.teal }),
    rect(140, 104, 140, 14, { rx: 7, fill: '#FFFFFF', opacity: 0.9 }),
    rect(140, 132, 110, 14, { rx: 7, fill: '#FFFFFF', opacity: 0.6 }),
    rect(140, 160, 80, 14, { rx: 7, fill: '#FFFFFF', opacity: 0.6 }),
    path('M220,190 Q220,172 238,172 L360,172 Q378,172 378,190 L378,256 Q378,274 360,274 L352,274 L356,304 L322,274 L238,274 Q220,274 220,256 Z', { fill: '#FFFFFF', stroke: C.line, strokeWidth: 3 }),
    ...[0, 1, 2].map((i) => circle(262 + i * 36, 223, 9, { fill: [C.navy, C.aqua, C.teal][i] })),
    g([path('M-26,-40 C-38,-38 -46,-26 -40,-12 C-28,18 -2,42 26,48 C40,52 50,42 50,30 L50,18 C50,12 44,8 38,10 L20,16 C14,18 12,24 14,30 C-2,24 -14,12 -20,-4 C-14,-2 -8,-6 -6,-12 L0,-30 C2,-36 -2,-42 -8,-42 Z', { fill: C.navy })], { transform: 'translate(398,108) scale(0.9)' }),
    spark(84, 250, 0.9),
  ].join(''), '', { title: 'Chat bubbles and a phone' });
}

export function location() {
  return doc(W, H, [
    halo(),
    shadow(240, 318, 160, 12, 0.1),
    poly([[90, 110], [190, 80], [290, 110], [390, 80], [390, 290], [290, 320], [190, 290], [90, 320]], { fill: '#FFFFFF', stroke: C.line, strokeWidth: 3 }),
    poly([[190, 80], [290, 110], [290, 320], [190, 290]], { fill: C.mist2 }),
    path('M120,270 C160,230 200,250 230,210 C260,170 300,190 330,150', { fill: 'none', stroke: C.teal, strokeWidth: 7, strokeLinecap: 'round', strokeDasharray: '2 16' }),
    circle(120, 270, 10, { fill: C.navy }),
    path('M330,70 C300,70 282,92 282,116 C282,150 330,190 330,190 C330,190 378,150 378,116 C378,92 360,70 330,70 Z', { fill: C.coral }),
    circle(330, 116, 16, { fill: '#FFFFFF' }),
    ellipse(330, 194, 24, 7, { fill: C.ink, opacity: 0.15 }),
  ].join(''), '', { title: 'Map with a route to a location pin' });
}

export function emptyCart() {
  return doc(W, H, [
    halo(),
    shadow(240, 312, 140, 12, 0.1),
    path('M90,90 L130,90 L170,250 L340,250 L372,140 L150,140', { fill: 'none', stroke: C.navy, strokeWidth: 12, strokeLinecap: 'round', strokeLinejoin: 'round' }),
    poly([[156, 152], [358, 152], [334, 238], [176, 238]], { fill: '#FFFFFF' }),
    rect(196, 110, 50, 50, { rx: 10, fill: 'none', stroke: C.aqua, strokeWidth: 4, strokeDasharray: '8 8' }),
    rect(262, 96, 60, 64, { rx: 10, fill: 'none', stroke: C.aqua, strokeWidth: 4, strokeDasharray: '8 8' }),
    circle(190, 284, 18, { fill: C.teal }),
    circle(320, 284, 18, { fill: C.teal }),
    spark(390, 90, 0.9),
    spark(100, 200, 0.6, C.aqua),
  ].join(''), '', { title: 'An empty shopping cart' });
}

export function emptySearch() {
  return doc(W, H, [
    halo(),
    shadow(240, 318, 120, 12, 0.1),
    rect(120, 90, 200, 180, { rx: 20, fill: '#FFFFFF', stroke: C.line, strokeWidth: 3 }),
    ...[0, 1, 2, 3].map((i) => rect(146, 120 + i * 34, i % 2 ? 110 : 148, 14, { rx: 7, fill: C.mist2 })),
    circle(300, 200, 62, { fill: '#FFFFFF', opacity: 0.6, stroke: C.navy, strokeWidth: 12 }),
    limb([[344, 244], [392, 292]], 18, C.navy),
    path('M286,186 Q286,168 302,168 Q318,168 318,184 Q318,196 304,200 L304,212', { fill: 'none', stroke: C.teal, strokeWidth: 8, strokeLinecap: 'round' }),
    circle(304, 230, 5, { fill: C.teal }),
  ].join(''), '', { title: 'A magnifying glass over an empty list' });
}

export function emptyCatalogue() {
  return doc(W, H, [
    halo(),
    shadow(240, 318, 170, 12, 0.1),
    rect(90, 70, 300, 240, { rx: 20, fill: '#FFFFFF', stroke: C.line, strokeWidth: 3 }),
    rect(108, 166, 264, 10, { rx: 5, fill: C.wood2 }),
    rect(108, 266, 264, 10, { rx: 5, fill: C.wood2 }),
    ...[[130, 100, 60, 66], [210, 116, 44, 50], [276, 96, 70, 70], [140, 206, 50, 60], [216, 196, 70, 70], [306, 214, 44, 52]].map(([x, y, w, h]) => rect(x, y, w, h, { rx: 10, fill: 'none', stroke: C.aqua, strokeWidth: 4, strokeDasharray: '8 8' })),
    spark(400, 80, 0.8),
  ].join(''), '', { title: 'Empty shelves' });
}

export function error() {
  return doc(W, H, [
    halo(),
    shadow(240, 318, 120, 12, 0.1),
    rect(232, 100, 16, 214, { rx: 6, fill: C.wood3 }),
    path('M110,110 L230,110 L230,164 L110,164 L84,137 Z', { fill: C.teal }),
    path('M250,170 L370,170 L396,197 L370,224 L250,224 Z', { fill: C.navy }),
    limb([[124, 137], [196, 137]], 8, '#FFFFFF', { opacity: 0.8 }),
    limb([[284, 197], [356, 197]], 8, '#FFFFFF', { opacity: 0.8 }),
    path('M300,60 Q300,40 320,40 Q340,40 340,58 Q340,72 324,78 L324,90', { fill: 'none', stroke: C.coral, strokeWidth: 9, strokeLinecap: 'round' }),
    circle(324, 108, 6, { fill: C.coral }),
    path('M60,300 C140,270 180,330 250,300 C320,272 360,320 430,296', { fill: 'none', stroke: C.aqua, strokeWidth: 6, strokeLinecap: 'round', strokeDasharray: '2 14' }),
  ].join(''), '', { title: 'A signpost pointing two ways' });
}

export function orderPlaced() {
  return doc(W, H, [
    halo(),
    shadow(240, 312, 140, 12, 0.1),
    poly([[130, 140], [240, 100], [350, 140], [240, 180]], { fill: C.wood }),
    poly([[130, 140], [240, 180], [240, 300], [130, 260]], { fill: C.wood2 }),
    poly([[350, 140], [240, 180], [240, 300], [350, 260]], { fill: C.wood3 }),
    poly([[185, 120], [295, 160], [295, 200], [185, 160]], { fill: '#FFFFFF', opacity: 0.5 }),
    check(340, 110, 38),
    spark(110, 100, 0.8),
    spark(400, 230, 0.6, C.aqua),
  ].join(''), '', { title: 'A parcel with a check mark' });
}

// ---------------------------------------------------------------- category icons (64×64)
const icon = (inner, title) => doc(64, 64, rect(0, 0, 64, 64, { rx: 18, fill: C.aqua3 }) + inner, '', { title });

export const categoryIcons = {
  monitoring: () =>
    icon([rect(14, 16, 36, 28, { rx: 7, fill: C.teal }), path('M19,31 L26,31 L29,24 L33,38 L36,31 L45,31', { fill: 'none', stroke: '#FFFFFF', strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round' }), rect(26, 46, 12, 4, { rx: 2, fill: C.navy })].join(''), 'Monitoring devices'),
  'first-aid': () =>
    icon([rect(26, 14, 12, 8, { rx: 3, fill: 'none', stroke: C.navy, strokeWidth: 3 }), rect(12, 20, 40, 30, { rx: 8, fill: C.red }), rect(28.5, 26, 7, 18, { rx: 2, fill: '#FFFFFF' }), rect(23, 31.5, 18, 7, { rx: 2, fill: '#FFFFFF' })].join(''), 'First aid and care'),
  protective: () =>
    icon([path('M32,12 L50,19 L50,32 C50,42 42,49 32,53 C22,49 14,42 14,32 L14,19 Z', { fill: C.navy3 }), path('M24,32 L30,38 L41,26', { fill: 'none', stroke: '#FFFFFF', strokeWidth: 4, strokeLinecap: 'round', strokeLinejoin: 'round' })].join(''), 'Protective supplies'),
  diagnostic: () =>
    icon([path('M22,14 C18,28 20,36 30,38 C40,36 42,28 38,14', { fill: 'none', stroke: C.navy, strokeWidth: 3.5, strokeLinecap: 'round' }), path('M30,38 C30,46 34,50 40,50', { fill: 'none', stroke: C.navy, strokeWidth: 3.5, strokeLinecap: 'round' }), circle(44, 48, 6, { fill: C.teal }), circle(22, 13, 3, { fill: C.ink }), circle(38, 13, 3, { fill: C.ink })].join(''), 'Diagnostic tools'),
  storage: () =>
    icon([rect(10, 22, 44, 22, { rx: 6, fill: '#FFFFFF', stroke: C.line, strokeWidth: 2 }), ...[0, 1, 2, 3].map((i) => rect(13 + i * 10, 25, 8, 16, { rx: 3, fill: [C.teal, C.aqua, C.coral, C.amber][i] }))].join(''), 'Storage and daily living'),
  mobility: () =>
    icon([path('M22,14 L40,14 C44,14 44,20 40,20 L33,20 L33,52', { fill: 'none', stroke: C.navy, strokeWidth: 4.5, strokeLinecap: 'round', strokeLinejoin: 'round' }), rect(29, 48, 8, 6, { rx: 2, fill: C.ink }), rect(30.5, 28, 5, 3, { rx: 1, fill: C.teal })].join(''), 'Mobility and support'),
};

// preview
export const iconSheet = () => {
  const keys = Object.keys(categoryIcons);
  return doc(64 * keys.length + 10 * (keys.length + 1), 84, rect(0, 0, 999, 99, { fill: '#FFFFFF' }) + keys.map((k, i) => `<g transform="translate(${10 + i * 74},10)">${categoryIcons[k]().replace(/<\/?svg[^>]*>/g, '').replace(/<title>.*?<\/title>/, '')}</g>`).join(''));
};
