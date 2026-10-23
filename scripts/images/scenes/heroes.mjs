// Section A: hospital and healthcare hero images (1600 × 1000).
import { C, SKIN, HAIR, doc, rect, circle, ellipse, path, g, line, linear, radial, shadow, poly, limb } from '../lib/svg.mjs';
import { person } from '../lib/people.mjs';
import * as P from '../lib/props.mjs';
import { mark } from '../lib/brand.mjs';

const W = 1600;
const H = 1000;

export function heroTeam() {
  const r = P.room(W, H, { floorY: 790, gid: 'ht' });
  const w1 = P.windowPane(150, 140, 300, 560, { arch: true, cols: 2, rows: 2, gid: 'ht1' });
  const w2 = P.windowPane(650, 110, 300, 590, { arch: true, cols: 2, rows: 2, gid: 'ht2', scene: 'city' });
  const w3 = P.windowPane(1150, 140, 300, 560, { arch: true, cols: 2, rows: 2, gid: 'ht3' });
  const defs = r.defs + w1.defs + w2.defs + w3.defs + radial('ht-glow', [[0, '#FFFFFF', 0.9], [1, '#FFFFFF', 0]]);
  const body = [
    r.body,
    w1.body,
    w2.body,
    w3.body,
    ellipse(800, 420, 700, 380, { fill: 'url(#ht-glow)' }),
    P.pendantLamp(560, 0, 70, { color: C.teal }),
    P.pendantLamp(1040, 0, 70, { color: C.teal }),
    P.plant(560, 790, 1.5, { variant: 'tall' }),
    P.plant(1045, 790, 1.4, { variant: 'monstera' }),
    P.rug(800, 905, 560, 58, C.aqua3),
    shadow(800, 900, 460, 24, 0.1),
    person({ x: 510, y: 905, h: 600, top: 'scrubs', topColor: C.teal, hairStyle: 'bun', hairColor: HAIR.black, skin: SKIN.s2, arms: { l: 'hold', r: 'hold' }, hold: 'tablet', look: 0.8 }),
    person({ x: 700, y: 912, h: 640, top: 'coat', steth: true, hairStyle: 'short', hairColor: HAIR.dark, skin: SKIN.s4, shirt: C.aqua2, tie: C.navy2, arms: { l: 'down', r: 'hip' }, look: 0.6 }),
    person({ x: 900, y: 912, h: 615, top: 'coat', hijab: C.navy2, skin: SKIN.s3, shirt: C.aqua3, arms: { l: 'chest', r: 'down' }, hold: 'clipboard', steth: true, look: -0.4 }),
    person({ x: 1090, y: 905, h: 630, top: 'coat', hairStyle: 'grey', hairColor: HAIR.grey, skin: SKIN.s1, glasses: true, beard: true, shirt: C.navy3, arms: { l: 'cross', r: 'cross' }, look: -0.8 }),
    P.plant(110, 960, 1.9, { variant: 'monstera' }),
    P.plant(1520, 960, 1.8, { variant: 'bushy' }),
  ].join('');
  return doc(W, H, body, defs);
}

export function heroConsultation() {
  const r = P.room(W, H, { floorY: 800, gid: 'hc', wall: '#E8F3F4' });
  const win = P.windowPane(1110, 150, 360, 430, { cols: 2, rows: 2, gid: 'hcw' });
  const body = [
    r.body,
    win.body,
    P.wallArt(220, 210, 200, 150, { variant: 0 }),
    P.wallArt(450, 250, 140, 110, { variant: 2 }),
    P.cabinet(140, 560, 230, 240, { drawers: 3 }),
    P.plant(255, 560, 1.1, { variant: 'bushy' }),
    P.clock(700, 230, 34),
    // patient, seated left, looking right
    P.officeChair(600, 905, 1.6, { color: C.aqua }),
    person({ x: 600, y: 905, h: 560, pose: 'sit', top: 'sweater', topColor: C.coral, hairStyle: 'long', hairColor: HAIR.brown, skin: SKIN.s2, arms: { l: 'desk', r: 'desk' }, look: 1.6 }),
    // doctor, seated right, looking left
    P.officeChair(1000, 905, 1.6, { color: C.navy2 }),
    person({ x: 1000, y: 905, h: 580, pose: 'sit', top: 'coat', steth: true, hairStyle: 'sidepart', hairColor: HAIR.black, skin: SKIN.s4, shirt: C.aqua2, arms: { l: 'gesture', r: 'desk' }, look: -1.6 }),
    P.desk(400, 640, 800, { h: 22, depth: 230, panel: '#FFFFFF' }),
    P.laptop(860, 520, 190, { kind: 'chart' }),
    rect(520, 618, 120, 18, { rx: 4, fill: '#FFFFFF', stroke: C.line, strokeWidth: 2 }),
    rect(530, 604, 100, 16, { rx: 4, fill: C.aqua3 }),
    path('M700,640 C690,600 740,590 760,616 C770,632 750,640 740,640', { fill: 'none', stroke: C.navy, strokeWidth: 5, strokeLinecap: 'round' }),
    circle(744, 634, 9, { fill: C.steel, stroke: C.navy, strokeWidth: 3 }),
    P.plant(1340, 960, 1.6, { variant: 'monstera' }),
  ].join('');
  return doc(W, H, body, r.defs + win.defs);
}

export function heroProfessional() {
  const r = P.room(W, H, { floorY: 1000, gid: 'hp', wall: '#DCEEF0', wall2: '#F7FBFC' });
  const body = [
    r.body,
    // soft corridor depth in the background
    rect(80, 120, 260, 760, { rx: 8, fill: '#FFFFFF', opacity: 0.7 }),
    rect(110, 160, 200, 180, { rx: 10, fill: C.sky, opacity: 0.6 }),
    rect(1300, 120, 230, 760, { rx: 8, fill: '#FFFFFF', opacity: 0.7 }),
    rect(1330, 160, 170, 180, { rx: 10, fill: C.sky, opacity: 0.6 }),
    rect(420, 70, 760, 16, { rx: 8, fill: '#FFFFFF' }),
    circle(1000, 520, 470, { fill: C.aqua3, opacity: 0.55 }),
    path('M640,1000 L640,420 C640,240 790,140 1000,140 C1210,140 1360,240 1360,420 L1360,1000 Z', { fill: C.aqua, opacity: 0.18 }),
    P.plant(300, 1040, 2.6, { variant: 'monstera' }),
    person({ x: 1000, y: 1700, h: 1580, top: 'scrubs', topColor: C.teal, hairStyle: 'curlylong', hairColor: HAIR.dark, skin: SKIN.s5, arms: { l: 'hold', r: 'hold' }, hold: 'tablet', lanyard: true, detail: true }),
  ].join('');
  return doc(W, H, body, r.defs);
}

export function heroReception() {
  const r = P.room(W, H, { floorY: 790, gid: 'hr', wall: '#E3F1F2' });
  const body = [
    r.body,
    rect(470, 90, 660, 470, { rx: 28, fill: C.ink }),
    rect(500, 120, 600, 410, { rx: 18, fill: C.navy }),
    mark({ x: 720, y: 190, size: 160, bg: C.aqua, cross: C.ink, accent: '#FFFFFF' }),
    rect(660, 400, 280, 12, { rx: 6, fill: C.aqua2, opacity: 0.6 }),
    rect(700, 430, 200, 10, { rx: 5, fill: C.aqua2, opacity: 0.35 }),
    P.pendantLamp(380, 0, 120, { color: C.teal }),
    P.pendantLamp(1220, 0, 120, { color: C.teal }),
    P.plant(300, 790, 1.4, { variant: 'tall' }),
    // receptionist behind the desk
    person({ x: 940, y: 840, h: 560, top: 'blouse', topColor: C.teal, hairStyle: 'bob', hairColor: HAIR.black, skin: SKIN.s3, arms: { l: 'gesture', r: 'type' }, lanyard: true, look: -1.4 }),
    P.receptionDesk(560, 640, 620, { h: 200 }),
    P.monitor(980, 520, 160, 104, { kind: 'calendar' }),
    // arriving visitor with a child
    shadow(420, 905, 120, 14, 0.12),
    person({ x: 400, y: 905, h: 620, top: 'shirt', topColor: C.navy3, hairStyle: 'short', hairColor: HAIR.dark, skin: SKIN.s5, arms: { l: 'down', r: 'reach' }, look: 1.4 }),
    person({ x: 520, y: 905, h: 360, top: 'sweater', topColor: C.amber, pants: C.navy2, hairStyle: 'curly', hairColor: HAIR.black, skin: SKIN.s5, arms: { l: 'wave', r: 'down' }, look: 1.4 }),
    P.waitingChair(1320, 900, 1.6, { color: C.aqua }),
    P.waitingChair(1470, 900, 1.6, { color: C.aqua }),
    P.plant(1400, 760, 0.9, { variant: 'bushy' }),
  ].join('');
  return doc(W, H, body, r.defs);
}

export function heroExterior() {
  const defs =
    linear('he-sky', [[0, '#BFE4F1'], [1, '#EAF7FB']]) +
    linear('he-glass', [[0, '#9FD3E6'], [1, '#D9F0F7']]) +
    linear('he-ground', [[0, '#CFE7DA'], [1, '#E5F2EA']]);
  const glassGrid = (x, y, cols, rows, cw, ch, gap) => {
    const out = [];
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++)
        out.push(rect(x + i * (cw + gap), y + j * (ch + gap), cw, ch, { rx: 4, fill: 'url(#he-glass)' }), rect(x + i * (cw + gap), y + j * (ch + gap), cw * 0.3, ch, { rx: 4, fill: '#FFFFFF', opacity: 0.25 }));
    return out.join('');
  };
  const tree = (x, y, s, c = C.leaf) =>
    g([shadow(x, y, 60 * s, 10 * s, 0.12), rect(x - 8 * s, y - 120 * s, 16 * s, 120 * s, { fill: C.wood3 }), circle(x, y - 160 * s, 70 * s, { fill: c }), circle(x - 46 * s, y - 120 * s, 46 * s, { fill: C.leaf2 }), circle(x + 48 * s, y - 124 * s, 50 * s, { fill: C.leaf3 })]);
  const body = [
    rect(0, 0, W, H, { fill: 'url(#he-sky)' }),
    circle(1320, 170, 70, { fill: '#FFF4D6', opacity: 0.9 }),
    ellipse(320, 150, 120, 26, { fill: '#FFFFFF', opacity: 0.8 }),
    ellipse(420, 175, 90, 22, { fill: '#FFFFFF', opacity: 0.7 }),
    ellipse(1080, 110, 110, 22, { fill: '#FFFFFF', opacity: 0.7 }),
    rect(0, 780, W, 220, { fill: 'url(#he-ground)' }),
    // tower
    rect(300, 200, 360, 600, { rx: 10, fill: '#FFFFFF' }),
    rect(300, 200, 360, 30, { rx: 10, fill: C.ink }),
    glassGrid(330, 260, 4, 7, 66, 54, 14),
    // signage on tower roof
    mark({ x: 430, y: 112, size: 100, bg: C.ink, cross: '#FFFFFF', accent: C.aqua }),
    // main wing
    rect(640, 400, 720, 400, { rx: 10, fill: '#F5FAFB' }),
    rect(640, 400, 720, 26, { rx: 8, fill: C.teal }),
    glassGrid(680, 460, 8, 3, 64, 60, 18),
    // entrance
    rect(860, 690, 280, 110, { rx: 6, fill: C.screen }),
    rect(880, 704, 115, 96, { rx: 4, fill: 'url(#he-glass)' }),
    rect(1005, 704, 115, 96, { rx: 4, fill: 'url(#he-glass)' }),
    rect(820, 660, 360, 26, { rx: 8, fill: C.ink }),
    rect(830, 686, 10, 114, { fill: C.steel2 }),
    rect(1160, 686, 10, 114, { fill: C.steel2 }),
    // path to entrance
    poly([[900, 800], [1100, 800], [1240, 1000], [760, 1000]], { fill: '#F1F6F4' }),
    rect(0, 800, W, 10, { fill: '#BFD9CB' }),
    tree(170, 860, 1.25),
    tree(1450, 860, 1.35, C.leaf3),
    tree(1270, 900, 0.8),
    P.plant(780, 830, 0.8, { variant: 'bushy', pot: C.steel2 }),
    P.plant(1220, 830, 0.8, { variant: 'bushy', pot: C.steel2 }),
    person({ x: 640, y: 930, h: 230, top: 'shirt', topColor: C.coral, hairStyle: 'ponytail', hairColor: HAIR.dark, skin: SKIN.s2, arms: { l: 'down', r: 'down' }, look: 1 }),
    person({ x: 700, y: 935, h: 220, top: 'sweater', topColor: C.navy3, hairStyle: 'short', hairColor: HAIR.black, skin: SKIN.s4, arms: { l: 'down', r: 'down' }, look: 1 }),
  ].join('');
  return doc(W, H, body, defs);
}

export function heroCollaboration() {
  const r = P.room(W, H, { floorY: 800, gid: 'hk', wall: '#E6F2F3' });
  const win = P.windowPane(1180, 150, 300, 470, { cols: 2, rows: 2, gid: 'hkw', scene: 'city' });
  const body = [
    r.body,
    win.body,
    // wall screen
    rect(150, 170, 560, 340, { rx: 18, fill: C.ink }),
    rect(166, 186, 528, 308, { rx: 10, fill: C.screen }),
    P.screenContent('chart', 166, 186, 260, 308),
    P.screenContent('ecg', 430, 186, 264, 160),
    P.screenContent('ui', 430, 340, 264, 154),
    P.pendantLamp(800, 0, 160, { color: C.teal }),
    // standing presenter pointing at the screen
    person({ x: 800, y: 912, h: 630, top: 'coat', hairStyle: 'ponytail', hairColor: HAIR.auburn, skin: SKIN.s1, shirt: C.aqua2, arms: { l: 'point', r: 'down' }, steth: true, look: -1.8 }),
    // seated team behind the table
    person({ x: 1030, y: 905, h: 560, pose: 'sit', top: 'shirt', topColor: C.navy2, hairStyle: 'short', hairColor: HAIR.dark, skin: SKIN.s3, glasses: true, arms: { l: 'desk', r: 'desk' }, look: -1.5 }),
    person({ x: 1220, y: 905, h: 560, pose: 'sit', top: 'scrubs', topColor: C.navy3, hairStyle: 'buzz', hairColor: HAIR.black, skin: SKIN.s6, arms: { l: 'desk', r: 'desk' }, look: -1.5 }),
    person({ x: 1410, y: 905, h: 560, pose: 'sit', top: 'coat', hijab: C.teal, skin: SKIN.s2, shirt: C.navy3, arms: { l: 'desk', r: 'desk' }, look: -1.6 }),
    P.desk(930, 650, 600, { h: 22, depth: 210, panel: '#FFFFFF' }),
    P.laptop(1150, 548, 150, { kind: 'ui' }),
    rect(990, 628, 90, 22, { rx: 4, fill: C.teal }),
    rect(1360, 630, 110, 20, { rx: 4, fill: '#FFFFFF', stroke: C.line, strokeWidth: 2 }),
    P.plant(150, 940, 1.6, { variant: 'tall' }),
  ].join('');
  return doc(W, H, body, r.defs + win.defs);
}

export function heroAppointment() {
  const r = P.room(W, H, { floorY: 800, gid: 'ha', wall: '#F0F7F7', floor: '#E7D9C6', floor2: '#F1E7DA' });
  const win = P.windowPane(140, 150, 340, 470, { cols: 2, rows: 2, gid: 'haw' });
  const card = (x, y) =>
    g([
      shadow(x + 200, y + 410, 180, 16, 0.12),
      rect(x, y, 400, 380, { rx: 28, fill: '#FFFFFF', stroke: C.line, strokeWidth: 2 }),
      rect(x, y, 400, 84, { rx: 28, fill: C.teal }),
      rect(x, y + 56, 400, 28, { fill: C.teal }),
      circle(x + 52, y + 42, 18, { fill: '#FFFFFF', opacity: 0.9 }),
      rect(x + 86, y + 30, 150, 12, { rx: 6, fill: '#FFFFFF', opacity: 0.9 }),
      rect(x + 86, y + 50, 100, 10, { rx: 5, fill: '#FFFFFF', opacity: 0.6 }),
      ...Array.from({ length: 3 }, (_, rr) =>
        Array.from({ length: 4 }, (_, cc) =>
          rect(x + 30 + cc * 88, y + 112 + rr * 62, 72, 46, { rx: 12, fill: rr === 1 && cc === 2 ? C.aqua : C.mist2 }),
        ).join(''),
      ),
      rect(x + 30, y + 310, 340, 46, { rx: 23, fill: C.ink }),
      rect(x + 150, y + 328, 100, 10, { rx: 5, fill: '#FFFFFF' }),
    ]);
  const body = [
    r.body,
    win.body,
    P.wallArt(1180, 200, 220, 170, { variant: 1 }),
    rect(560, 300, 14, 500, { fill: C.steel2 }),
    path('M520,310 L614,310 L594,250 L540,250 Z', { fill: C.amber }),
    P.plant(140, 800, 1.3, { variant: 'tall' }),
    P.rug(780, 905, 520, 52, '#D9EFEE'),
    P.sofa(560, 905, 560, { color: C.aqua, seat: 205 }),
    person({ x: 820, y: 905, h: 560, pose: 'sit', top: 'sweater', topColor: C.navy3, hairStyle: 'curly', hairColor: HAIR.dark, skin: SKIN.s4, arms: { l: 'hold', r: 'hold' }, hold: 'phone', look: 0.6 }),
    rect(1020, 760, 180, 14, { rx: 6, fill: C.wood }),
    rect(1040, 774, 12, 130, { fill: C.wood3 }),
    rect(1168, 774, 12, 130, { fill: C.wood3 }),
    rect(1060, 726, 34, 34, { rx: 6, fill: '#FFFFFF', stroke: C.line, strokeWidth: 2 }),
    card(1080, 330),
    path('M990,520 C1030,500 1050,470 1072,456', { fill: 'none', stroke: C.aqua, strokeWidth: 6, strokeLinecap: 'round', strokeDasharray: '2 16' }),
    circle(1290, 458, 22, { fill: C.teal }),
    path('M1279,458 L1287,466 L1302,450', { fill: 'none', stroke: '#FFFFFF', strokeWidth: 5, strokeLinecap: 'round', strokeLinejoin: 'round' }),
  ].join('');
  return doc(W, H, body, r.defs + win.defs);
}
