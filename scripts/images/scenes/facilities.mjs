// Section D: hospital interiors and facilities (1200 × 800).
import { C, SKIN, HAIR, doc, rect, circle, ellipse, path, g, line, linear, shadow, poly, limb } from '../lib/svg.mjs';
import { person, shade } from '../lib/people.mjs';
import * as P from '../lib/props.mjs';
import { mark } from '../lib/brand.mjs';

const W = 1200;
const H = 800;

export function receptionWaiting() {
  const r = P.room(W, H, { floorY: 600, gid: 'fw', wall: '#E5F2F3' });
  const win = P.windowPane(820, 110, 300, 360, { cols: 3, rows: 2, gid: 'fww' });
  const body = [
    r.body,
    win.body,
    P.monitor(150, 120, 260, 150, { kind: 'ui', stand: false }),
    P.clock(500, 160, 30),
    P.wallArt(560, 140, 160, 120, { variant: 0 }),
    // water dispenser
    rect(40, 410, 70, 190, { rx: 10, fill: '#FFFFFF', stroke: C.line, strokeWidth: 2 }),
    rect(48, 330, 54, 84, { rx: 16, fill: '#D7F0FA', stroke: C.aqua2, strokeWidth: 2 }),
    rect(60, 450, 30, 12, { rx: 4, fill: C.teal }),
    P.waitingChair(200, 690, 1.55, { color: C.teal }),
    P.waitingChair(350, 690, 1.55, { color: C.teal }),
    P.waitingChair(500, 690, 1.55, { color: C.teal }),
    person({ x: 350, y: 690, h: 290, pose: 'sit', top: 'sweater', topColor: C.coral, hairStyle: 'long', hairColor: HAIR.dark, skin: SKIN.s3, arms: { l: 'hold', r: 'hold' }, hold: 'phone', look: 0.6 }),
    person({ x: 500, y: 690, h: 300, pose: 'sit', top: 'shirt', topColor: C.navy3, hairStyle: 'grey', hairColor: HAIR.grey, skin: SKIN.s1, glasses: true, arms: { l: 'desk', r: 'desk' }, look: -0.6 }),
    rect(640, 560, 120, 14, { rx: 6, fill: C.wood }),
    rect(660, 574, 10, 116, { fill: C.wood3 }),
    rect(730, 574, 10, 116, { fill: C.wood3 }),
    P.plant(700, 560, 0.7, { variant: 'bushy' }),
    P.plant(960, 700, 1.4, { variant: 'monstera' }),
    P.plant(1120, 720, 1.2, { variant: 'tall' }),
    P.rug(380, 720, 300, 34, C.aqua3),
  ].join('');
  return doc(W, H, body, r.defs + win.defs);
}

export function consultationRoom() {
  const r = P.room(W, H, { floorY: 600, gid: 'fc', wall: '#EAF4F5' });
  const win = P.windowPane(470, 110, 260, 300, { cols: 2, rows: 2, gid: 'fcw' });
  const body = [
    r.body,
    win.body,
    // privacy curtain rail and curtain
    rect(40, 70, 330, 10, { rx: 5, fill: C.steel2 }),
    path('M50,80 L50,560 Q90,575 130,560 Q170,575 210,560 L210,80 Z', { fill: C.aqua2, opacity: 0.8 }),
    path('M90,80 L90,560 M130,80 L130,560 M170,80 L170,560', { stroke: '#FFFFFF', strokeWidth: 3, opacity: 0.4 }),
    P.examBed(230, 470, 320, { color: C.teal }),
    rect(250, 595, 60, 18, { rx: 6, fill: C.steel }),
    // wall cabinet + sink
    rect(800, 140, 300, 140, { rx: 12, fill: '#FFFFFF', stroke: C.line, strokeWidth: 2 }),
    line(950, 146, 950, 274, { stroke: C.line, strokeWidth: 2 }),
    rect(930, 200, 8, 26, { rx: 4, fill: C.steel2 }),
    rect(962, 200, 8, 26, { rx: 4, fill: C.steel2 }),
    // desk with computer, chair
    P.desk(780, 470, 360, { h: 18, depth: 130 }),
    P.monitor(860, 330, 190, 120, { kind: 'chart' }),
    rect(1060, 446, 50, 24, { rx: 4, fill: C.aqua3 }),
    P.officeChair(700, 700, 1.3, { color: C.navy2 }),
    P.plant(1150, 700, 1.1, { variant: 'bushy' }),
    P.ivStand(640, 690, 330),
  ].join('');
  return doc(W, H, body, r.defs + win.defs);
}

export function corridor() {
  const defs =
    linear('cor-wall', [[0, '#FFFFFF'], [1, '#E3F0F2']]) +
    linear('cor-floor', [[0, '#C7DDE1'], [1, '#E6F1F3']]) +
    linear('cor-ceil', [[0, '#F2F8F9'], [1, '#FFFFFF']]);
  const vx = 600, vy = 330; // vanishing point
  const back = { x1: 470, y1: 230, x2: 730, y2: 470 };
  const body = [
    rect(0, 0, W, H, { fill: 'url(#cor-wall)' }),
    poly([[0, 0], [W, 0], [back.x2, back.y1], [back.x1, back.y1]], { fill: 'url(#cor-ceil)' }),
    poly([[0, H], [W, H], [back.x2, back.y2], [back.x1, back.y2]], { fill: 'url(#cor-floor)' }),
    poly([[0, 0], [back.x1, back.y1], [back.x1, back.y2], [0, H]], { fill: '#EDF6F7' }),
    poly([[W, 0], [back.x2, back.y1], [back.x2, back.y2], [W, H]], { fill: '#E6F2F4' }),
    rect(back.x1, back.y1, back.x2 - back.x1, back.y2 - back.y1, { fill: '#DCEEF1' }),
    rect(back.x1 + 70, back.y1 + 40, 120, 120, { rx: 8, fill: C.sky }),
    // ceiling light panels
    ...[0.15, 0.4, 0.62].map((t) => {
      const yy = back.y1 * (1 - t) * 0 + (0 + (back.y1 - 0) * t);
      const half = 260 * (1 - t) + 60 * t;
      return poly([[vx - half, yy], [vx + half, yy], [vx + half * 0.85, yy + 16 * (1 - t) + 4], [vx - half * 0.85, yy + 16 * (1 - t) + 4]], { fill: '#FFFFFF' });
    }),
    // handrail lines
    line(0, 560, back.x1, 400, { stroke: C.teal, strokeWidth: 10, strokeLinecap: 'round', opacity: 0.7 }),
    line(W, 560, back.x2, 400, { stroke: C.teal, strokeWidth: 10, strokeLinecap: 'round', opacity: 0.7 }),
    // doors on left wall
    poly([[90, 210], [210, 245], [210, 640], [90, 700]], { fill: '#FFFFFF', stroke: C.line, strokeWidth: 3 }),
    poly([[110, 250], [190, 272], [190, 360], [110, 345]], { fill: C.sky, opacity: 0.7 }),
    poly([[300, 270], [370, 290], [370, 545], [300, 575]], { fill: '#FFFFFF', stroke: C.line, strokeWidth: 3 }),
    poly([[90, 150], [210, 188], [210, 225], [90, 190]], { fill: C.teal }),
    // doors on right wall
    poly([[1110, 210], [990, 245], [990, 640], [1110, 700]], { fill: '#FFFFFF', stroke: C.line, strokeWidth: 3 }),
    poly([[1090, 250], [1010, 272], [1010, 360], [1090, 345]], { fill: C.sky, opacity: 0.7 }),
    poly([[900, 270], [830, 290], [830, 545], [900, 575]], { fill: '#FFFFFF', stroke: C.line, strokeWidth: 3 }),
    poly([[1110, 150], [990, 188], [990, 225], [1110, 190]], { fill: C.navy3 }),
    // floor guide line
    poly([[560, 470], [640, 470], [700, 800], [500, 800]], { fill: C.aqua, opacity: 0.25 }),
    // figures
    person({ x: 560, y: 520, h: 150, top: 'scrubs', topColor: C.teal, hairStyle: 'bun', hairColor: HAIR.dark, skin: SKIN.s3, arms: { l: 'down', r: 'down' } }),
    P.cart(630, 520, 0.55),
    person({ x: 760, y: 740, h: 400, top: 'coat', hairStyle: 'short', hairColor: HAIR.black, skin: SKIN.s5, steth: true, shirt: C.aqua2, arms: { l: 'chest', r: 'down' }, hold: 'tablet', look: -1 }),
    P.plant(80, 800, 1.3, { variant: 'monstera' }),
  ].join('');
  return doc(W, H, body, defs);
}

export function patientRoom() {
  const r = P.room(W, H, { floorY: 600, gid: 'fp', wall: '#EEF6F4' });
  const win = P.windowPane(700, 100, 330, 330, { cols: 2, rows: 2, gid: 'fpw' });
  // patient lying in bed: head and shoulders above the blanket
  const patient = g([
    path('M318,512 C330,456 420,446 500,456 C600,470 690,472 724,482 L724,528 L318,528 Z', { fill: C.aqua }),
    path('M318,512 C330,456 420,446 500,456 C560,464 600,468 620,470', { fill: 'none', stroke: '#BDE8E6', strokeWidth: 8, strokeLinecap: 'round' }),
    limb([[360, 476], [420, 486], [462, 480]], 22, '#FFFFFF', { stroke: C.mist3 }),
    limb([[360, 476], [420, 486], [462, 480]], 18, '#FFFFFF'),
    circle(468, 478, 11, { fill: SKIN.s4 }),
    rect(318, 456, 40, 34, { rx: 12, fill: SKIN.s4 }),
    ellipse(296, 440, 42, 48, { fill: SKIN.s4, transform: 'rotate(-12 296 440)' }),
    path('M254,436 C250,392 280,376 302,376 C330,376 348,398 344,432 C334,414 318,408 298,410 C278,410 264,418 254,436 Z', { fill: HAIR.black, transform: 'rotate(-12 300 410)' }),
    circle(284, 446, 4.2, { fill: '#1E2A3A' }),
    circle(310, 441, 4.2, { fill: '#1E2A3A' }),
    path('M292,467 Q303,473 312,463', { fill: 'none', stroke: '#9A4A3C', strokeWidth: 3, strokeLinecap: 'round' }),
  ]);
  const body = [
    r.body,
    win.body,
    P.wallArt(120, 150, 180, 140, { variant: 2 }),
    rect(80, 300, 520, 40, { rx: 10, fill: '#FFFFFF', stroke: C.line, strokeWidth: 2 }),
    circle(140, 320, 8, { fill: C.teal }),
    circle(170, 320, 8, { fill: C.aqua }),
    rect(200, 312, 120, 16, { rx: 6, fill: C.mist2 }),
    P.hospitalBed(210, 480, 520, { blanket: 'none' }),
    patient,
    P.vitalsMonitor(80, 660, { h: 330, w: 130 }),
    P.ivStand(790, 660, 360),
    // visitor chair and visitor
    P.officeChair(960, 700, 2.0, { color: C.coral }),
    person({ x: 960, y: 700, h: 330, pose: 'sit', top: 'sweater', topColor: C.navy3, hairStyle: 'bob', hairColor: HAIR.brown, skin: SKIN.s2, arms: { l: 'reach', r: 'desk' }, look: -1.4 }),
    P.plant(1120, 690, 1.1, { variant: 'tall' }),
    // flowers on the side table
    rect(1040, 520, 110, 12, { rx: 5, fill: C.wood }),
    rect(1058, 532, 10, 160, { fill: C.wood3 }),
    rect(1122, 532, 10, 160, { fill: C.wood3 }),
    rect(1080, 482, 30, 40, { rx: 8, fill: '#FFFFFF', stroke: C.line, strokeWidth: 2 }),
    ...[[1084, 462, C.coral], [1100, 450, C.amber], [1110, 466, C.rose]].map(([x, y, c]) => circle(x, y, 12, { fill: c })),
  ].join('');
  return doc(W, H, body, r.defs + win.defs);
}

export function laboratory() {
  const r = P.room(W, H, { floorY: 620, gid: 'fl', wall: '#E8F3F6' });
  const body = [
    r.body,
    P.shelf(80, 170, 420, { rows: 2, gap: 110, color: C.steel, seed: 7 }),
    P.shelf(720, 170, 400, { rows: 2, gap: 110, color: C.steel, seed: 11 }),
    // fume hood / window panel
    rect(520, 90, 180, 280, { rx: 12, fill: '#FFFFFF', stroke: C.line, strokeWidth: 2 }),
    rect(536, 110, 148, 180, { rx: 8, fill: C.sky, opacity: 0.6 }),
    // technician behind the bench
    person({ x: 600, y: 676, h: 500, top: 'coat', hairStyle: 'ponytail', hairColor: HAIR.black, skin: SKIN.s3, glasses: true, mask: true, shirt: C.navy3, arms: { l: 'type', r: 'reach' }, look: 0.5 }),
    P.bench(60, 520, 1080, { top: '#FFFFFF', legs: C.mist2 }),
    rect(60, 518, 1080, 8, { fill: C.line }),
    P.microscope(260, 520, 1.15),
    P.tubeRack(520, 520, 0.9),
    P.flask(720, 520, 0.9, { liquid: C.aqua }),
    P.flask(800, 520, 0.7, { liquid: C.coral }),
    P.centrifuge(990, 520, 1),
  ].join('');
  return doc(W, H, body, r.defs);
}

export function diagnosticImaging() {
  const r = P.room(W, H, { floorY: 610, gid: 'fd', wall: '#E3EFF4' });
  const body = [
    r.body,
    // control-room window
    rect(830, 120, 300, 220, { rx: 14, fill: C.ink }),
    rect(846, 136, 268, 188, { rx: 8, fill: '#D6EEF7' }),
    rect(870, 250, 90, 60, { rx: 6, fill: C.screen }),
    rect(976, 250, 110, 60, { rx: 6, fill: C.screen }),
    P.screenContent('scan', 976, 250, 110, 60),
    P.ceilingLights(W, 20, 3),
    P.scanner(140, 700, 720),
    person({ x: 1010, y: 720, h: 430, top: 'scrubs', topColor: C.navy3, hairStyle: 'short', hairColor: HAIR.dark, skin: SKIN.s2, arms: { l: 'hold', r: 'hold' }, hold: 'tablet', look: -1.3 }),
    P.plant(1140, 720, 1, { variant: 'bushy' }),
  ].join('');
  return doc(W, H, body, r.defs);
}

export function medicalEquipment() {
  const r = P.room(W, H, { floorY: 620, gid: 'fe', wall: '#EAF4F6' });
  const body = [
    r.body,
    rect(0, 120, W, 22, { fill: '#FFFFFF' }),
    ...[180, 420, 660, 900].map((x) => g([rect(x, 142, 60, 30, { rx: 6, fill: '#FFFFFF', stroke: C.line, strokeWidth: 2 }), circle(x + 18, 157, 5, { fill: C.teal }), circle(x + 42, 157, 5, { fill: C.coral })])),
    P.vitalsMonitor(120, 720, { h: 470, w: 200 }),
    // infusion pumps on a pole
    P.ivStand(460, 720, 430),
    P.infusionPump(460, 470, 1.2),
    P.infusionPump(460, 560, 1.2),
    // defibrillator on a trolley
    P.cart(720, 720, 1.4),
    P.defibrillator(720, 512, 0.95),
    // ECG cart
    rect(900, 380, 220, 150, { rx: 16, fill: '#FFFFFF', stroke: C.line, strokeWidth: 2 }),
    rect(920, 400, 180, 90, { rx: 8, fill: C.screen }),
    P.screenContent('ecg', 920, 400, 180, 90),
    rect(940, 530, 140, 160, { rx: 10, fill: C.mist2, stroke: C.line, strokeWidth: 2 }),
    circle(950, 700, 12, { fill: C.ink }),
    circle(1070, 700, 12, { fill: C.ink }),
    path('M1000,530 C960,600 1040,640 1000,690', { fill: 'none', stroke: C.navy, strokeWidth: 4 }),
  ].join('');
  return doc(W, H, body, r.defs);
}

export function staffAtWork() {
  const r = P.room(W, H, { floorY: 600, gid: 'fs', wall: '#E7F2F3' });
  const win = P.windowPane(900, 110, 240, 320, { cols: 2, rows: 2, gid: 'fsw' });
  const body = [
    r.body,
    win.body,
    P.shelf(80, 170, 320, { rows: 2, gap: 100, color: C.wood2, seed: 4 }),
    P.clock(520, 150, 30),
    // seated nurse at the station
    person({ x: 590, y: 760, h: 470, pose: 'sit', top: 'scrubs', topColor: C.teal, hairStyle: 'bun', hairColor: HAIR.dark, skin: SKIN.s4, arms: { l: 'type', r: 'type' }, look: 1 }),
    // standing colleague with clipboard
    person({ x: 850, y: 730, h: 560, top: 'coat', steth: true, hairStyle: 'sidepart', hairColor: HAIR.auburn, skin: SKIN.s1, shirt: C.aqua2, arms: { l: 'chest', r: 'gesture' }, hold: 'clipboard', look: -1.6 }),
    // nurse station counter
    rect(120, 500, 640, 230, { rx: 18, fill: C.navy }),
    rect(110, 486, 660, 26, { rx: 10, fill: C.wood }),
    rect(150, 540, 580, 150, { rx: 12, fill: shade(C.navy, 0.12) }),
    mark({ x: 410, y: 575, size: 70, bg: C.aqua, cross: C.ink, accent: '#FFFFFF' }),
    P.monitor(300, 356, 200, 124, { kind: 'ui' }),
    rect(560, 470, 120, 16, { rx: 4, fill: '#FFFFFF', stroke: C.line, strokeWidth: 2 }),
    P.plant(1080, 720, 1.3, { variant: 'monstera' }),
  ].join('');
  return doc(W, H, body, r.defs + win.defs);
}
