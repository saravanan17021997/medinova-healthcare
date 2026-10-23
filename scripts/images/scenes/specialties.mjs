// Section B: medical specialty images (1200 × 900). One distinct subject each.
import { C, SKIN, HAIR, doc, rect, circle, ellipse, path, g, line, linear, radial, shadow, limb, poly, rng } from '../lib/svg.mjs';
import { person, shade } from '../lib/people.mjs';
import * as P from '../lib/props.mjs';
import { text } from '../lib/text.mjs';

const W = 1200;
const H = 900;

function base(gid, { top = '#F7FBFC', bottom = C.aqua3, surface = C.wood, surfaceY = 690, archFill = '#FFFFFF' } = {}) {
  const defs =
    linear(`${gid}-bg`, [[0, top], [1, bottom]]) +
    linear(`${gid}-sf`, [[0, surface], [1, shade(surface, -0.12)]]);
  const body = [
    rect(0, 0, W, H, { fill: `url(#${gid}-bg)` }),
    path('M250,' + H + ' L250,450 C250,250 410,120 600,120 C790,120 950,250 950,450 L950,' + H + ' Z', { fill: archFill, opacity: 0.6 }),
    surface === 'none' ? '' : rect(0, surfaceY, W, H - surfaceY, { fill: `url(#${gid}-sf)` }),
    surface === 'none' ? '' : rect(0, surfaceY, W, 12, { fill: shade(surface, 0.15) }),
  ].join('');
  return { defs, body };
}

const stethoscope = (x, y, s = 1, col = C.navy) =>
  g(
    [
      path('M-60,-150 C-70,-60 -40,-10 20,-10 C90,-10 110,-70 80,-120', { fill: 'none', stroke: col, strokeWidth: 12, strokeLinecap: 'round' }),
      path('M-60,-150 L-80,-190 M-60,-150 L-30,-195', { fill: 'none', stroke: C.steel2, strokeWidth: 8, strokeLinecap: 'round' }),
      circle(-80, -192, 8, { fill: C.ink }),
      circle(-30, -197, 8, { fill: C.ink }),
      path('M80,-120 C60,-170 140,-190 150,-120', { fill: 'none', stroke: col, strokeWidth: 12, strokeLinecap: 'round' }),
      circle(150, -100, 30, { fill: C.steel, stroke: C.ink, strokeWidth: 6 }),
      circle(150, -100, 16, { fill: '#FFFFFF', opacity: 0.6 }),
    ],
    { transform: `translate(${x},${y}) scale(${s})` },
  );

export function generalMedicine() {
  const b = base('sg');
  const body = [
    b.body,
    P.windowPane(80, 140, 160, 220, { cols: 1, rows: 2, gid: 'sgw' }).body,
    person({ x: 600, y: 1470, h: 1240, top: 'coat', steth: true, hairStyle: 'sidepart', hairColor: HAIR.dark, skin: SKIN.s3, shirt: C.aqua2, tie: C.navy3, arms: { l: 'chest', r: 'gesture' }, hold: 'clipboard', detail: true }),
    rect(0, 690, W, 210, { fill: `url(#sg-sf)` }),
    rect(0, 690, W, 12, { fill: shade(C.wood, 0.15) }),
    shadow(330, 800, 170, 16, 0.12),
    stethoscope(300, 800, 1),
    shadow(880, 790, 150, 12, 0.1),
    rect(760, 730, 240, 60, { rx: 12, fill: '#FFFFFF', stroke: C.line, strokeWidth: 3, transform: 'rotate(-6 880 760)' }),
    rect(780, 748, 120, 12, { rx: 6, fill: C.teal, transform: 'rotate(-6 880 760)' }),
    rect(780, 768, 180, 10, { rx: 5, fill: C.line, transform: 'rotate(-6 880 760)' }),
    // digital thermometer
    rect(1010, 770, 150, 26, { rx: 13, fill: '#FFFFFF', stroke: C.line, strokeWidth: 3, transform: 'rotate(18 1085 783)' }),
    rect(1030, 776, 50, 14, { rx: 4, fill: C.aqua2, transform: 'rotate(18 1085 783)' }),
  ].join('');
  return doc(W, H, body, b.defs + P.windowPane(80, 140, 160, 220, { cols: 1, rows: 2, gid: 'sgw' }).defs);
}

export function cardiology() {
  const b = base('sc', { bottom: '#F9E3DE' });
  const heart = g(
    [
      // aorta and vessels
      path('M520,250 C520,190 560,170 600,190 C640,210 650,260 640,300', { fill: 'none', stroke: '#C8505A', strokeWidth: 46, strokeLinecap: 'round' }),
      path('M560,215 L560,150 M600,195 L610,130 M635,215 L660,160', { fill: 'none', stroke: '#C8505A', strokeWidth: 22, strokeLinecap: 'round' }),
      path('M470,300 C460,250 490,230 520,240', { fill: 'none', stroke: C.navy3, strokeWidth: 34, strokeLinecap: 'round' }),
      // heart body
      path('M470,300 C380,330 360,470 450,560 C510,620 570,660 590,700 C640,640 720,600 760,520 C820,400 760,290 660,290 C610,290 590,320 575,340 C550,300 520,285 470,300 Z', { fill: '#E46A6E' }),
      path('M575,340 C560,420 560,520 590,700', { fill: 'none', stroke: '#C8505A', strokeWidth: 8, strokeLinecap: 'round', opacity: 0.7 }),
      path('M480,330 C430,360 420,440 460,500', { fill: 'none', stroke: '#F4A6A3', strokeWidth: 14, strokeLinecap: 'round', opacity: 0.8 }),
    ],
    { transform: 'translate(-150,20)' },
  );
  const pulse = [[0, 420], [300, 420], [340, 360], [380, 480], [420, 300], [460, 520], [500, 420], [1200, 420]];
  const body = [
    b.body,
    path(pulse.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' '), { fill: 'none', stroke: C.teal, strokeWidth: 8, strokeLinejoin: 'round', strokeLinecap: 'round', opacity: 0.25, transform: 'translate(0,-40)' }),
    heart,
    P.monitor(700, 300, 380, 250, { kind: 'ecg' }),
    shadow(890, 690, 160, 10, 0.12),
    P.icons('heart', 1040, 230, 28, C.coral),
    circle(1040, 230, 48, { fill: 'none', stroke: C.coral, strokeWidth: 4, opacity: 0.5 }),
  ].join('');
  return doc(W, H, body, b.defs);
}

export function orthopaedics() {
  const b = base('so', { bottom: '#DCEBF3' });
  const bone = (x1, y1, x2, y2, wd, col = '#E9F2F7') =>
    g([limb([[x1, y1], [x2, y2]], wd + 6, col === '#E9F2F7' ? 'none' : C.steel2), limb([[x1, y1], [x2, y2]], wd, col), ...[[x1 - wd * 0.35, y1], [x1 + wd * 0.35, y1], [x2 - wd * 0.35, y2], [x2 + wd * 0.35, y2]].map(([cx, cy]) => circle(cx, cy, wd * 0.75, { fill: col, stroke: col === '#E9F2F7' ? 'none' : C.steel2, strokeWidth: 3 }))]);
  const body = [
    b.body,
    // x-ray lightbox
    rect(330, 120, 540, 480, { rx: 22, fill: C.ink }),
    rect(354, 144, 492, 432, { rx: 12, fill: '#163454' }),
    bone(560, 170, 590, 340, 46),
    bone(600, 390, 590, 560, 42),
    limb([[640, 400], [650, 560]], 18, '#C9DCE7'),
    ellipse(620, 360, 30, 22, { fill: '#C9DCE7' }),
    ellipse(596, 366, 70, 14, { fill: C.aqua, opacity: 0.35 }),
    rect(380, 170, 70, 10, { rx: 5, fill: C.aqua }),
    // knee model on the desk
    shadow(250, 790, 120, 14, 0.14),
    g([bone(-10, -260, 0, -150, 34, '#F7F3EC'), bone(0, -110, -6, 10, 32, '#F7F3EC'), ellipse(-2, -130, 40, 18, { fill: C.aqua2 }), rect(-60, 0, 120, 26, { rx: 10, fill: C.navy2 })], { transform: 'translate(250,764)' }),
    // crutch leaning
    limb([[980, 790], [1060, 240]], 18, C.steel2),
    limb([[1010, 790], [1090, 250]], 12, C.steel),
    limb([[1035, 260], [1110, 270]], 22, C.navy2),
    limb([[1028, 470], [1078, 476]], 18, C.navy2),
  ].join('');
  return doc(W, H, body, b.defs);
}

export function dermatology() {
  const b = base('sd', { bottom: '#F6E3D8' });
  const R = rng(9);
  const block = (x, y, w) => {
    const layers = [
      { h: 40, c: '#F2B8A2' },
      { h: 140, c: '#F6D1BC' },
      { h: 110, c: '#FBE7B5' },
    ];
    let yy = y;
    const out = [path(`M${x},${y} Q${x + w * 0.25},${y - 14} ${x + w * 0.5},${y} T${x + w},${y} L${x + w},${y + 40} L${x},${y + 40} Z`, { fill: '#E9A28B' })];
    layers.forEach((l, i) => {
      out.push(rect(x, yy + (i ? 0 : 6), w, l.h, { fill: l.c }));
      yy += l.h;
    });
    // fat cells
    for (let i = 0; i < 12; i++) out.push(circle(x + 30 + (i % 6) * (w / 6), y + 210 + Math.floor(i / 6) * 50 + R() * 10, 20, { fill: '#F7DA92', stroke: '#EFCB7A', strokeWidth: 2 }));
    // hair follicles + vessels
    [0.25, 0.55, 0.8].forEach((t) => {
      out.push(limb([[x + w * t, y - 70], [x + w * t + 6, y + 120]], 5, HAIR.dark));
      out.push(ellipse(x + w * t + 6, y + 128, 14, 22, { fill: '#E9A28B' }));
    });
    out.push(path(`M${x},${y + 160} C${x + w * 0.3},${y + 130} ${x + w * 0.6},${y + 190} ${x + w},${y + 150}`, { fill: 'none', stroke: '#D65A5A', strokeWidth: 6, opacity: 0.6 }));
    out.push(path(`M${x},${y + 175} C${x + w * 0.35},${y + 150} ${x + w * 0.65},${y + 205} ${x + w},${y + 168}`, { fill: 'none', stroke: C.navy3, strokeWidth: 6, opacity: 0.5 }));
    return g([shadow(x + w / 2, y + 300, w * 0.55, 16, 0.12), ...out]);
  };
  const body = [
    b.body,
    block(240, 380, 520),
    // magnifier
    g([circle(0, 0, 130, { fill: '#FFFFFF', opacity: 0.35, stroke: C.ink, strokeWidth: 22 }), circle(-40, -40, 30, { fill: '#FFFFFF', opacity: 0.6 }), limb([[92, 92], [190, 190]], 34, C.ink), limb([[110, 110], [190, 190]], 24, C.teal)], { transform: 'translate(620,330)' }),
    // cream jar and dermatoscope
    shadow(980, 790, 90, 12, 0.12),
    rect(910, 690, 140, 100, { rx: 18, fill: '#FFFFFF', stroke: C.line, strokeWidth: 3 }),
    rect(900, 660, 160, 40, { rx: 12, fill: C.teal }),
    rect(940, 720, 80, 12, { rx: 6, fill: C.aqua2 }),
    g([rect(-24, -170, 48, 170, { rx: 20, fill: C.navy2 }), circle(0, -190, 36, { fill: C.steel, stroke: C.ink, strokeWidth: 8 }), circle(0, -190, 18, { fill: C.aqua2 })], { transform: 'translate(1100,780) rotate(14)' }),
  ].join('');
  return doc(W, H, body, b.defs);
}

export function paediatrics() {
  const b = base('sp', { bottom: '#FDF0D5', surface: '#E3D3BF', surfaceY: 720 });
  const blocks = [
    [140, 640, C.coral],
    [240, 640, C.amber],
    [190, 540, C.teal2],
  ].map(([x, y, c]) => g([rect(x, y, 96, 96, { rx: 10, fill: c }), rect(x + 26, y + 26, 44, 44, { rx: 8, fill: '#FFFFFF', opacity: 0.35 })]));
  const teddy = g(
    [
      shadow(0, 0, 110, 14, 0.14),
      ellipse(0, -100, 92, 100, { fill: '#C9905E' }),
      ellipse(0, -80, 52, 60, { fill: '#E5BE91' }),
      circle(-70, -40, 34, { fill: '#C9905E' }),
      circle(70, -40, 34, { fill: '#C9905E' }),
      circle(-82, -150, 34, { fill: '#C9905E' }),
      circle(82, -150, 34, { fill: '#C9905E' }),
      circle(0, -250, 78, { fill: '#C9905E' }),
      circle(-60, -310, 28, { fill: '#C9905E' }),
      circle(60, -310, 28, { fill: '#C9905E' }),
      circle(-60, -310, 14, { fill: '#E5BE91' }),
      circle(60, -310, 14, { fill: '#E5BE91' }),
      ellipse(0, -226, 34, 26, { fill: '#E5BE91' }),
      circle(-26, -262, 7, { fill: C.ink }),
      circle(26, -262, 7, { fill: C.ink }),
      ellipse(0, -236, 10, 7, { fill: C.ink }),
      rect(-40, -186, 80, 18, { rx: 9, fill: C.teal }),
      // bandage on the arm
      rect(52, -70, 44, 18, { rx: 6, fill: '#FFFFFF', transform: 'rotate(-30 74 -61)' }),
    ],
    { transform: 'translate(880,780)' },
  );
  const chart = g([
    rect(560, 120, 110, 600, { rx: 14, fill: '#FFFFFF', stroke: C.line, strokeWidth: 3 }),
    ...[C.coral, C.amber, C.leaf3, C.aqua, C.navy3].map((c, i) => rect(572, 132 + i * 117, 86, 105, { rx: 8, fill: c, opacity: 0.85 })),
    ...Array.from({ length: 11 }, (_, i) => rect(572, 180 + i * 50, 30, 4, { rx: 2, fill: '#FFFFFF' })),
  ]);
  const body = [
    b.body,
    chart,
    person({ x: 470, y: 760, h: 430, top: 'sweater', topColor: C.aqua, pants: C.navy3, hairStyle: 'curly', hairColor: HAIR.black, skin: SKIN.s4, arms: { l: 'wave', r: 'down' }, look: 0.8 }),
    ...blocks,
    teddy,
    stethoscope(330, 860, 0.55, C.coral),
  ].join('');
  return doc(W, H, body, b.defs);
}

export function neurology() {
  const b = base('sn', { top: '#F2F7FB', bottom: '#D5E4F2', surface: 'none' });
  const R = rng(21);
  const nodes = Array.from({ length: 18 }, () => [380 + R() * 440, 230 + R() * 340]);
  const links = [];
  nodes.forEach((a, i) => {
    nodes.slice(i + 1).forEach((bb) => {
      const d = Math.hypot(a[0] - bb[0], a[1] - bb[1]);
      if (d < 150) links.push(line(a[0], a[1], bb[0], bb[1], { stroke: '#FFFFFF', strokeWidth: 3, opacity: 0.7 }));
    });
  });
  const brain = g([
    path('M360,420 C340,300 430,210 540,210 C600,170 700,180 750,230 C840,240 880,330 850,410 C890,470 850,560 770,570 C740,620 650,630 600,600 C540,640 440,620 420,560 C360,540 340,480 360,420 Z', { fill: C.teal2 }),
    path('M600,220 C580,300 620,360 600,420 C580,480 620,540 600,600', { fill: 'none', stroke: shade(C.teal2, -0.25), strokeWidth: 8, strokeLinecap: 'round' }),
    path('M420,360 C470,330 520,380 560,350 M440,480 C490,450 530,500 570,470 M650,330 C690,300 740,340 790,310 M640,460 C690,430 740,480 800,450', { fill: 'none', stroke: shade(C.teal2, -0.2), strokeWidth: 7, strokeLinecap: 'round' }),
    path('M700,600 C720,660 700,720 660,760', { fill: 'none', stroke: C.teal, strokeWidth: 40, strokeLinecap: 'round' }),
    ...links,
    ...nodes.map(([x, y]) => circle(x, y, 7, { fill: C.aqua3 })),
  ]);
  const body = [
    b.body,
    ellipse(600, 420, 380, 300, { fill: C.aqua, opacity: 0.12 }),
    brain,
    P.monitor(870, 560, 260, 170, { kind: 'brain', stand: false }),
    P.monitor(70, 560, 260, 170, { kind: 'scan', stand: false }),
  ].join('');
  return doc(W, H, body, b.defs);
}

export function ophthalmology() {
  const b = base('se', { bottom: '#D9ECEF' });
  const rows = [['E', 92], ['F P', 66], ['T O Z', 48], ['L P E D', 36], ['P E C F D', 28]];
  const chart = g([
    rect(120, 110, 340, 520, { rx: 18, fill: '#FFFFFF', stroke: C.line, strokeWidth: 3 }),
    ...rows.map(([t, s], i) => text(t, { x: 290, y: 220 + i * 86 - (i ? 0 : 6), size: s, font: 'figtree-700', fill: C.ink, anchor: 'middle', tracking: s * 0.25 })),
    rect(150, 590, 280, 8, { rx: 4, fill: C.coral }),
  ]);
  const eye = g([
    path('M-260,0 C-160,-150 160,-150 260,0 C160,150 -160,150 -260,0 Z', { fill: '#FFFFFF', stroke: C.ink, strokeWidth: 14 }),
    circle(0, 0, 100, { fill: C.teal }),
    circle(0, 0, 62, { fill: C.navy }),
    circle(0, 0, 34, { fill: C.ink }),
    circle(-30, -32, 18, { fill: '#FFFFFF', opacity: 0.85 }),
    ...[-160, -95, -30, 35, 100, 165].map((x, i) => limb([[x, -118 + Math.abs(x) * 0.25], [x * 1.15, -170 + Math.abs(x) * 0.25]], 10, C.ink)),
  ], { transform: 'translate(800,370)' });
  const glasses = g([
    rect(-150, -40, 130, 90, { rx: 40, fill: C.aqua3, opacity: 0.6, stroke: C.ink, strokeWidth: 12 }),
    rect(20, -40, 130, 90, { rx: 40, fill: C.aqua3, opacity: 0.6, stroke: C.ink, strokeWidth: 12 }),
    path('M-20,-6 Q0,-22 20,-6', { fill: 'none', stroke: C.ink, strokeWidth: 10 }),
    limb([[-150, -20], [-200, -30]], 10, C.ink),
    limb([[150, -20], [200, -30]], 10, C.ink),
  ], { transform: 'translate(800,770)' });
  const body = [b.body, chart, eye, shadow(800, 830, 200, 14, 0.12), glasses].join('');
  return doc(W, H, body, b.defs);
}

export function dentistry() {
  const b = base('st', { bottom: '#DCF0F2' });
  const tooth = g([
    shadow(0, 290, 230, 22, 0.14),
    path('M-170,-150 C-170,-250 -80,-270 0,-230 C80,-270 170,-250 170,-150 C170,-60 140,0 130,90 C120,200 100,260 70,260 C40,260 40,120 0,120 C-40,120 -40,260 -70,260 C-100,260 -120,200 -130,90 C-140,0 -170,-60 -170,-150 Z', { fill: '#FFFFFF', stroke: C.line, strokeWidth: 6 }),
    path('M-120,-170 C-110,-220 -60,-220 -40,-190', { fill: 'none', stroke: C.aqua2, strokeWidth: 14, strokeLinecap: 'round', opacity: 0.8 }),
    circle(-50, -60, 12, { fill: C.ink }),
    circle(50, -60, 12, { fill: C.ink }),
    path('M-36,-10 Q0,22 36,-10', { fill: 'none', stroke: C.ink, strokeWidth: 9, strokeLinecap: 'round' }),
    circle(-90, -20, 16, { fill: C.coral, opacity: 0.3 }),
    circle(90, -20, 16, { fill: C.coral, opacity: 0.3 }),
  ], { transform: 'translate(560,470)' });
  const brush = g([
    rect(-30, -360, 60, 360, { rx: 26, fill: C.teal }),
    rect(-30, -470, 60, 120, { rx: 22, fill: '#FFFFFF', stroke: C.line, strokeWidth: 3 }),
    ...Array.from({ length: 5 }, (_, i) => rect(-46, -460 + i * 22, 30, 14, { rx: 6, fill: C.aqua2 })),
  ], { transform: 'translate(920,790) rotate(18)' });
  const mirror = g([limb([[0, 0], [0, -330]], 14, C.steel2), circle(0, -360, 42, { fill: '#DFF1F6', stroke: C.steel2, strokeWidth: 10 })], { transform: 'translate(250,790) rotate(-16)' });
  const body = [b.body, sparkle(860, 200), sparkle(330, 240, 0.7), tooth, brush, mirror].join('');
  return doc(W, H, body, b.defs);
}

function sparkle(x, y, s = 1) {
  return path(`M${x},${y - 34 * s} Q${x + 6 * s},${y - 6 * s} ${x + 34 * s},${y} Q${x + 6 * s},${y + 6 * s} ${x},${y + 34 * s} Q${x - 6 * s},${y + 6 * s} ${x - 34 * s},${y} Q${x - 6 * s},${y - 6 * s} ${x},${y - 34 * s} Z`, { fill: C.amber });
}

export function gynaecology() {
  const b = base('sy', { bottom: '#F4E0E6', surfaceY: 720, surface: '#E2D3C9' });
  const ultrasound = g([
    shadow(0, 0, 130, 12, 0.14),
    rect(-110, -330, 220, 250, { rx: 18, fill: '#FFFFFF', stroke: C.line, strokeWidth: 3 }),
    rect(-90, -80, 180, 70, { rx: 10, fill: C.mist2, stroke: C.line, strokeWidth: 2 }),
    circle(-80, 0, 14, { fill: C.ink }),
    circle(80, 0, 14, { fill: C.ink }),
    rect(-130, -560, 260, 210, { rx: 16, fill: C.ink }),
    rect(-116, -546, 232, 182, { rx: 8, fill: '#0E2238' }),
    path('M0,-530 L-90,-390 Q0,-360 90,-390 Z', { fill: '#2A5577', opacity: 0.9 }),
    ellipse(0, -430, 34, 26, { fill: '#7DB7D6', opacity: 0.8 }),
    rect(-100, -540, 50, 10, { rx: 4, fill: C.aqua }),
    rect(-80, -300, 160, 120, { rx: 10, fill: C.mist2 }),
    ...Array.from({ length: 6 }, (_, i) => circle(-50 + (i % 3) * 50, -270 + Math.floor(i / 3) * 50, 12, { fill: [C.teal, C.aqua, C.coral][i % 3] })),
  ], { transform: 'translate(290,800)' });
  const calendar = g([
    rect(860, 150, 240, 220, { rx: 18, fill: '#FFFFFF', stroke: C.line, strokeWidth: 3 }),
    rect(860, 150, 240, 56, { rx: 18, fill: C.rose }),
    rect(860, 180, 240, 26, { fill: C.rose }),
    ...Array.from({ length: 12 }, (_, i) => rect(880 + (i % 4) * 54, 226 + Math.floor(i / 4) * 44, 40, 30, { rx: 6, fill: i === 6 ? C.teal : C.mist2 })),
  ]);
  const lotus = g([
    shadow(0, 0, 70, 10, 0.12),
    rect(-40, -80, 80, 80, { rx: 20, fill: '#FFFFFF', stroke: C.line, strokeWidth: 3 }),
    ...[-40, -20, 0, 20, 40].map((a) => ellipse(0, -150, 22, 60, { fill: a === 0 ? C.rose : '#F2C4CB', transform: `rotate(${a} 0 -100)` })),
  ], { transform: 'translate(1040,790)' });
  const body = [
    b.body,
    calendar,
    person({ x: 650, y: 980, h: 760, top: 'coat', steth: true, hairStyle: 'long', hairColor: HAIR.black, skin: SKIN.s3, shirt: '#F2C4CB', arms: { l: 'hold', r: 'hold' }, hold: 'tablet', detail: true, look: -0.6 }),
    rect(0, 720, W, 180, { fill: 'url(#sy-sf)' }),
    rect(0, 720, W, 12, { fill: shade('#E2D3C9', 0.15) }),
    ultrasound,
    lotus,
  ].join('');
  return doc(W, H, body, b.defs);
}

export function diagnostics() {
  const b = base('sl', { bottom: '#D8ECEE', surface: '#FFFFFF', surfaceY: 700 });
  const petri = (x, y, c) => g([ellipse(x, y, 90, 26, { fill: '#F4FBFD', stroke: C.line, strokeWidth: 3 }), ellipse(x, y - 4, 70, 18, { fill: c, opacity: 0.45 }), ...[[-30, -6], [10, -2], [36, -8]].map(([dx, dy]) => circle(x + dx, y + dy, 6, { fill: c }))]);
  const helix = g(
    Array.from({ length: 13 }, (_, i) => {
      const y = 150 + i * 36;
      const dx = Math.sin(i * 0.7) * 70;
      return g([line(600 - dx, y, 600 + dx, y, { stroke: '#FFFFFF', strokeWidth: 5, opacity: 0.8 }), circle(600 - dx, y, 11, { fill: C.teal2 }), circle(600 + dx, y, 11, { fill: C.coral })]);
    }),
    { opacity: 0.85 },
  );
  const body = [
    b.body,
    helix,
    P.microscope(300, 720, 2.0),
    P.tubeRack(690, 720, 1.4),
    petri(950, 760, C.coral),
    petri(1040, 820, C.teal2),
    // pipette
    g([rect(-12, -300, 24, 220, { rx: 10, fill: '#FFFFFF', stroke: C.line, strokeWidth: 3 }), rect(-22, -360, 44, 70, { rx: 14, fill: C.navy2 }), path('M-8,-80 L8,-80 L2,-10 L-2,-10 Z', { fill: C.steel2 })], { transform: 'translate(1020,620) rotate(20)' }),
  ].join('');
  return doc(W, H, body, b.defs);
}
