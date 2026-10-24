// Section E: demo product catalogue renders (1000 × 1000). Each product has
// three gallery views — main (on the podium), detail (close-up) and box.
import { C, doc, rect, circle, ellipse, path, g, line, linear, radial, shadow, limb, poly } from '../lib/svg.mjs';
import { shade } from '../lib/people.mjs';
import { mark } from '../lib/brand.mjs';
import { text } from '../lib/text.mjs';

const S = 1000;

// ---------------------------------------------------------------- products
const lcd = (x, y, w, h, value, { size, fill = C.ink, bg = '#CFEDEA', unit } = {}) =>
  g([
    rect(x, y, w, h, { rx: Math.min(14, h * 0.25), fill: bg }),
    text(value, { x: x + w / 2 - (unit ? w * 0.06 : 0), y: y + h * 0.72, size: size || h * 0.62, font: 'figtree-700', fill, anchor: 'middle' }),
    unit ? text(unit, { x: x + w - w * 0.08, y: y + h * 0.42, size: h * 0.24, font: 'figtree-600', fill, anchor: 'end' }) : '',
  ]);

export const PRODUCTS = {
  'digital-thermometer': {
    name: 'Digital Thermometer',
    focus: [520, 470],
    draw: () =>
      g(
        [
          rect(-60, -300, 120, 520, { rx: 60, fill: '#FFFFFF', stroke: C.line, strokeWidth: 6 }),
          path('M-60,160 L60,160 L60,170 C60,240 30,300 0,330 C-30,300 -60,240 -60,170 Z', { fill: '#FFFFFF', stroke: C.line, strokeWidth: 6 }),
          path('M-22,300 C-14,330 14,330 22,300 L16,380 Q0,400 -16,380 Z', { fill: C.steel, stroke: C.steel2, strokeWidth: 4 }),
          rect(-42, -200, 84, 170, { rx: 16, fill: '#DDF2EF' }),
          g([text('36.8', { x: 0, y: 0, size: 64, font: 'figtree-700', fill: C.ink, anchor: 'middle' })], { transform: 'translate(-6,-115) rotate(90)' }),
          circle(0, 40, 26, { fill: C.teal }),
          circle(0, 40, 12, { fill: '#FFFFFF', opacity: 0.5 }),
          rect(-60, -300, 120, 60, { rx: 30, fill: C.teal }),
          rect(-60, -260, 120, 20, { fill: C.teal }),
          rect(-40, -100, 6, 200, { rx: 3, fill: '#FFFFFF', opacity: 0.0 }),
        ],
        { transform: 'translate(500,470) rotate(-35)' },
      ),
  },
  'blood-pressure-monitor': {
    name: 'Digital Blood Pressure Monitor',
    focus: [600, 430],
    draw: () =>
      g([
        // cuff
        path('M140,560 C120,460 190,380 300,370 L420,365 C460,365 470,420 440,440 L330,470 C270,486 250,540 270,600 Z', { fill: C.navy2 }),
        path('M140,560 C150,640 230,680 330,660 L470,630 C500,624 500,580 470,575 L340,595 C290,604 270,600 270,600 Z', { fill: C.navy }),
        rect(160, 470, 90, 110, { rx: 12, fill: C.teal, transform: 'rotate(-12 205 525)' }),
        path('M200,505 L215,520 L200,535', { fill: 'none', stroke: '#FFFFFF', strokeWidth: 6, transform: 'rotate(-12 205 525)' }),
        // tube
        path('M430,420 C520,420 520,560 600,600', { fill: 'none', stroke: C.ink, strokeWidth: 12, strokeLinecap: 'round' }),
        // monitor unit
        rect(500, 240, 360, 420, { rx: 60, fill: '#FFFFFF', stroke: C.line, strokeWidth: 6 }),
        rect(540, 280, 280, 250, { rx: 22, fill: '#DDF2EF' }),
        text('118', { x: 780, y: 375, size: 92, font: 'figtree-700', fill: C.ink, anchor: 'end' }),
        text('76', { x: 780, y: 470, size: 76, font: 'figtree-700', fill: C.ink, anchor: 'end' }),
        text('72', { x: 780, y: 515, size: 34, font: 'figtree-600', fill: C.teal, anchor: 'end' }),
        P_heart(575, 498, 14, C.coral),
        rect(560, 312, 60, 12, { rx: 6, fill: C.teal, opacity: 0.6 }),
        rect(560, 340, 40, 12, { rx: 6, fill: C.teal, opacity: 0.35 }),
        circle(680, 595, 34, { fill: C.teal }),
        circle(680, 595, 16, { fill: '#FFFFFF', opacity: 0.45 }),
        rect(570, 585, 50, 20, { rx: 10, fill: C.mist3 }),
        rect(740, 585, 50, 20, { rx: 10, fill: C.mist3 }),
      ]),
  },
  'pulse-oximeter': {
    name: 'Fingertip Pulse Oximeter',
    focus: [500, 440],
    draw: () =>
      g([
        // lanyard
        path('M690,360 C800,320 860,420 800,520 C760,590 700,600 690,560', { fill: 'none', stroke: C.teal, strokeWidth: 10, strokeLinecap: 'round' }),
        // lower body
        path('M260,520 L700,520 Q740,520 740,560 L740,600 Q740,660 680,660 L320,660 Q260,660 260,600 Z', { fill: C.navy2 }),
        // hinge gap
        rect(270, 500, 460, 30, { rx: 10, fill: C.ink }),
        // upper body
        path('M250,330 Q250,280 300,280 L700,280 Q750,280 750,330 L750,470 Q750,510 710,510 L290,510 Q250,510 250,470 Z', { fill: '#FFFFFF', stroke: C.line, strokeWidth: 6 }),
        rect(300, 320, 300, 150, { rx: 18, fill: C.ink }),
        text('98', { x: 420, y: 430, size: 96, font: 'figtree-700', fill: C.aqua, anchor: 'middle' }),
        text('%', { x: 490, y: 380, size: 34, font: 'figtree-700', fill: C.aqua }),
        text('74', { x: 570, y: 430, size: 56, font: 'figtree-700', fill: C.amber, anchor: 'middle' }),
        rect(520, 444, 90, 10, { rx: 5, fill: C.amber, opacity: 0.8 }),
        circle(670, 395, 30, { fill: C.teal }),
        circle(670, 395, 13, { fill: '#FFFFFF', opacity: 0.45 }),
      ]),
  },
  'first-aid-kit': {
    name: 'First-Aid Kit',
    focus: [500, 480],
    draw: () =>
      g([
        path('M380,250 Q380,190 440,190 L560,190 Q620,190 620,250 L620,290 L580,290 L580,250 Q580,230 560,230 L440,230 Q420,230 420,250 L420,290 L380,290 Z', { fill: C.ink }),
        rect(190, 280, 620, 420, { rx: 56, fill: C.red }),
        rect(190, 280, 620, 70, { rx: 34, fill: shade(C.red, 0.15) }),
        rect(190, 330, 620, 20, { fill: shade(C.red, 0.15) }),
        line(200, 352, 800, 352, { stroke: shade(C.red, -0.25), strokeWidth: 6 }),
        rect(250, 330, 40, 50, { rx: 10, fill: C.ink }),
        rect(710, 330, 40, 50, { rx: 10, fill: C.ink }),
        rect(440, 410, 120, 260, { rx: 30, fill: '#FFFFFF' }),
        rect(370, 480, 260, 120, { rx: 30, fill: '#FFFFFF' }),
      ]),
  },
  stethoscope: {
    name: 'Stethoscope',
    focus: [700, 640],
    draw: () =>
      g([
        path('M380,250 C330,430 360,560 470,600', { fill: 'none', stroke: C.navy, strokeWidth: 26, strokeLinecap: 'round' }),
        path('M560,250 C610,430 580,560 470,600', { fill: 'none', stroke: C.navy, strokeWidth: 26, strokeLinecap: 'round' }),
        path('M380,250 L360,180 M560,250 L580,180', { fill: 'none', stroke: C.steel2, strokeWidth: 16, strokeLinecap: 'round' }),
        ellipse(356, 168, 22, 16, { fill: C.ink }),
        ellipse(584, 168, 22, 16, { fill: C.ink }),
        path('M380,250 Q470,300 560,250', { fill: 'none', stroke: C.steel2, strokeWidth: 10 }),
        path('M470,600 C470,700 520,760 600,740 C680,720 690,640 700,640', { fill: 'none', stroke: C.navy, strokeWidth: 26, strokeLinecap: 'round' }),
        circle(720, 640, 78, { fill: C.steel, stroke: C.steel2, strokeWidth: 12 }),
        circle(720, 640, 50, { fill: '#E7F1F4', stroke: C.line, strokeWidth: 6 }),
        circle(698, 618, 14, { fill: '#FFFFFF', opacity: 0.8 }),
        rect(700, 548, 40, 30, { rx: 8, fill: C.steel2 }),
      ]),
  },
  'examination-gloves': {
    name: 'Medical Examination Gloves (box of 100)',
    focus: [640, 620],
    draw: () =>
      g([
        // box
        rect(180, 240, 520, 380, { rx: 30, fill: '#FFFFFF', stroke: C.line, strokeWidth: 6 }),
        rect(180, 240, 520, 120, { rx: 30, fill: C.navy3 }),
        rect(180, 330, 520, 30, { fill: C.navy3 }),
        rect(320, 270, 240, 60, { rx: 30, fill: '#FFFFFF', opacity: 0.9 }),
        path('M360,300 Q440,270 520,300', { fill: 'none', stroke: C.aqua2, strokeWidth: 10, strokeLinecap: 'round' }),
        gloveIcon(300, 500, 0.9, C.aqua),
        rect(400, 430, 240, 22, { rx: 11, fill: C.mist3 }),
        rect(400, 470, 180, 18, { rx: 9, fill: C.mist3 }),
        // glove in front
        g([gloveShape(C.aqua2)], { transform: 'translate(560,520) rotate(-20) scale(1.25)' }),
      ]),
  },
  'surgical-face-masks': {
    name: 'Surgical Face Masks (pack of 50)',
    focus: [560, 640],
    draw: () =>
      g([
        rect(140, 200, 480, 340, { rx: 30, fill: '#FFFFFF', stroke: C.line, strokeWidth: 6 }),
        rect(140, 200, 480, 100, { rx: 30, fill: C.teal }),
        rect(140, 270, 480, 30, { fill: C.teal }),
        rect(260, 230, 240, 40, { rx: 20, fill: '#FFFFFF', opacity: 0.85 }),
        maskShape(380, 420, 0.55),
        // mask in front
        g([maskShape(0, 0, 1.25)], { transform: 'translate(560,650) rotate(-6)' }),
      ]),
  },
  'digital-weighing-scale': {
    name: 'Digital Weighing Scale',
    focus: [500, 470],
    draw: () =>
      g([
        poly([[180, 560], [820, 560], [900, 720], [100, 720]], { fill: shade(C.mist3, -0.1) }),
        poly([[220, 300], [780, 300], [860, 650], [140, 650]], { fill: '#E9F6F8', stroke: C.line, strokeWidth: 6 }),
        poly([[220, 300], [780, 300], [860, 650], [140, 650]], { fill: 'url(#scale-glass)' }),
        poly([[260, 330], [420, 330], [330, 620], [180, 620]], { fill: '#FFFFFF', opacity: 0.35 }),
        rect(390, 380, 220, 90, { rx: 16, fill: C.ink }),
        text('64.2', { x: 485, y: 448, size: 62, font: 'figtree-700', fill: C.aqua, anchor: 'middle' }),
        text('kg', { x: 590, y: 425, size: 24, font: 'figtree-600', fill: C.aqua, anchor: 'end' }),
        rect(150, 650, 710, 22, { rx: 8, fill: C.steel2 }),
        circle(250, 690, 16, { fill: C.ink }),
        circle(750, 690, 16, { fill: C.ink }),
      ]),
    defs: linear('scale-glass', [[0, '#FFFFFF', 0.4], [1, C.aqua2, 0.3]]),
  },
  'hot-cold-therapy-pack': {
    name: 'Reusable Hot and Cold Therapy Pack',
    focus: [400, 470],
    draw: () =>
      g([
        rect(170, 260, 660, 440, { rx: 120, fill: 'url(#gel)', stroke: '#FFFFFF', strokeWidth: 18 }),
        rect(200, 290, 600, 380, { rx: 100, fill: 'none', stroke: '#FFFFFF', strokeWidth: 6, opacity: 0.6, strokeDasharray: '20 18' }),
        ...[[300, 380, 24], [360, 450, 16], [280, 520, 20], [640, 380, 22], [700, 470, 16], [600, 560, 26], [470, 360, 14], [520, 600, 18]].map(([x, y, r]) => circle(x, y, r, { fill: '#FFFFFF', opacity: 0.45 })),
        ellipse(330, 330, 90, 26, { fill: '#FFFFFF', opacity: 0.4, transform: 'rotate(-12 330 330)' }),
        // snowflake / heat icons
        g([limb([[0, -36], [0, 36]], 8, '#FFFFFF'), limb([[-31, -18], [31, 18]], 8, '#FFFFFF'), limb([[-31, 18], [31, -18]], 8, '#FFFFFF')], { transform: 'translate(700,620)' }),
        path('M300,640 C280,610 320,600 300,570 M340,640 C320,610 360,600 340,570', { fill: 'none', stroke: '#FFFFFF', strokeWidth: 8, strokeLinecap: 'round' }),
      ]),
    defs: linear('gel', [[0, '#F4A08A'], [0.48, '#F7C3B4'], [0.52, '#BDE7F3'], [1, '#7FCDEA']], { x1: 0, y1: 0, x2: 1, y2: 0 }),
  },
  'weekly-pill-organiser': {
    name: 'Weekly Pill Organiser',
    focus: [360, 520],
    draw: () => {
      const cols = [C.teal, C.aqua, C.navy3, C.teal2, C.aqua2, C.coral, C.amber];
      const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
      const parts = [rect(100, 380, 800, 260, { rx: 40, fill: '#FFFFFF', stroke: C.line, strokeWidth: 6 })];
      cols.forEach((c, i) => {
        const x = 130 + i * 106;
        parts.push(
          rect(x, 410, 92, 200, { rx: 22, fill: c, opacity: 0.88 }),
          rect(x, 410, 92, 46, { rx: 20, fill: shade(c, -0.12) }),
          text(days[i], { x: x + 46, y: 445, size: 32, font: 'figtree-700', fill: '#FFFFFF', anchor: 'middle' }),
          rect(x + 16, 500, 60, 14, { rx: 7, fill: '#FFFFFF', opacity: 0.45 }),
        );
      });
      return g(parts);
    },
  },
  'adjustable-walking-stick': {
    name: 'Adjustable Walking Stick',
    focus: [520, 260],
    draw: () =>
      g([
        // handle
        path('M380,190 C380,140 430,130 470,130 L640,130 C680,130 690,190 650,195 L520,200 L520,230 L470,230 L470,210 C420,215 380,230 380,190 Z', { fill: C.ink }),
        rect(500, 130, 140, 70, { rx: 34, fill: C.navy3 }),
        // upper shaft
        rect(476, 220, 40, 330, { rx: 18, fill: C.teal }),
        // collar
        rect(468, 540, 56, 34, { rx: 10, fill: C.steel2 }),
        // lower shaft with adjust holes
        rect(484, 570, 26, 260, { rx: 12, fill: C.steel }),
        ...Array.from({ length: 6 }, (_, i) => circle(497, 600 + i * 32, 6, { fill: C.steel2 })),
        rect(476, 820, 42, 60, { rx: 16, fill: C.ink }),
        // strap
        path('M620,195 C640,280 600,330 580,300', { fill: 'none', stroke: C.ink, strokeWidth: 10, strokeLinecap: 'round' }),
      ]),
  },
  'knee-support-sleeve': {
    name: 'Knee Support Sleeve',
    focus: [520, 480],
    draw: () =>
      g([
        path('M330,180 L670,180 C690,260 660,350 640,420 C700,500 700,600 650,690 L680,820 L320,820 L350,690 C300,600 300,500 360,420 C340,350 310,260 330,180 Z', { fill: C.navy2 }),
        path('M330,180 L670,180 L665,215 L335,215 Z', { fill: C.teal }),
        path('M320,820 L680,820 L676,785 L324,785 Z', { fill: C.teal }),
        ellipse(500, 500, 90, 104, { fill: C.navy, stroke: C.aqua, strokeWidth: 14 }),
        ellipse(500, 500, 46, 56, { fill: shade(C.navy, -0.2) }),
        path('M370,300 C420,330 580,330 630,300 M372,690 C420,670 580,670 628,690', { fill: 'none', stroke: C.aqua, strokeWidth: 6, opacity: 0.6, strokeDasharray: '16 12' }),
        path('M352,430 C330,500 330,580 360,650', { fill: 'none', stroke: '#FFFFFF', strokeWidth: 10, opacity: 0.25, strokeLinecap: 'round' }),
      ]),
  },
};

function P_heart(cx, cy, r, col) {
  return path(`M${cx},${cy + r * 0.85} C${cx - r * 1.6},${cy - r * 0.2} ${cx - r * 0.7},${cy - r * 1.4} ${cx},${cy - r * 0.45} C${cx + r * 0.7},${cy - r * 1.4} ${cx + r * 1.6},${cy - r * 0.2} ${cx},${cy + r * 0.85} Z`, { fill: col });
}

function gloveShape(col) {
  return g([
    path('M-70,160 L-70,10 C-100,-10 -120,-40 -110,-60 C-100,-80 -70,-60 -60,-40 L-60,-150 C-60,-175 -30,-175 -30,-150 L-30,-60 L-25,-60 L-25,-185 C-25,-210 5,-210 5,-185 L5,-60 L10,-60 L10,-170 C10,-195 40,-195 40,-170 L40,-55 L45,-55 L45,-130 C45,-155 75,-155 75,-130 L75,40 C75,90 60,120 60,160 Z', { fill: col, stroke: shade(col, -0.2), strokeWidth: 4 }),
    rect(-74, 150, 138, 30, { rx: 10, fill: shade(col, -0.12) }),
  ]);
}

function gloveIcon(x, y, s, col) {
  return g([circle(0, 0, 60, { fill: C.mist2 }), g([gloveShape(col)], { transform: 'scale(0.28)' })], { transform: `translate(${x},${y}) scale(${s})` });
}

function maskShape(x, y, s) {
  return g(
    [
      path('M-260,-40 C-320,-60 -330,40 -260,40', { fill: 'none', stroke: '#E5F3F8', strokeWidth: 10 }),
      path('M260,-40 C320,-60 330,40 260,40', { fill: 'none', stroke: '#E5F3F8', strokeWidth: 10 }),
      path('M-260,-90 Q0,-120 260,-90 L250,90 Q0,140 -250,90 Z', { fill: '#BFE6F2', stroke: '#9DD6EA', strokeWidth: 5 }),
      path('M-255,-35 Q0,-60 255,-35 M-252,20 Q0,-5 252,20 M-250,70 Q0,50 250,70', { fill: 'none', stroke: '#9DD6EA', strokeWidth: 5 }),
      rect(-80, -112, 160, 12, { rx: 6, fill: '#FFFFFF', opacity: 0.8 }),
    ],
    { transform: `translate(${x},${y}) scale(${s})` },
  );
}

// ---------------------------------------------------------------- views
function stage(view, gid) {
  if (view === 'detail') {
    return {
      defs: linear(`${gid}-bg`, [[0, '#EAF7F6'], [1, '#C9E9E6']]),
      back: rect(0, 0, S, S, { fill: `url(#${gid}-bg)` }) + circle(820, 180, 260, { fill: '#FFFFFF', opacity: 0.35 }),
    };
  }
  if (view === 'box') {
    return {
      defs: linear(`${gid}-bg`, [[0, '#F2F6FA'], [1, '#DCE6F0']]),
      back: rect(0, 0, S, S, { fill: `url(#${gid}-bg)` }) + rect(0, 800, S, 200, { fill: '#D3DFEA' }),
    };
  }
  return {
    defs: linear(`${gid}-bg`, [[0, '#F6FBFC'], [1, '#E0EFF1']]) + radial(`${gid}-pod`, [[0, '#FFFFFF'], [1, '#EAF4F6']]),
    back:
      rect(0, 0, S, S, { fill: `url(#${gid}-bg)` }) +
      path('M200,1000 L200,470 C200,290 335,170 500,170 C665,170 800,290 800,470 L800,1000 Z', { fill: '#FFFFFF', opacity: 0.55 }) +
      shadow(500, 838, 380, 44, 0.12) +
      ellipse(500, 820, 380, 64, { fill: `url(#${gid}-pod)` }),
  };
}

function packaging(name) {
  const lines = wrap(name, 16);
  return g([
    shadow(330, 800, 230, 22, 0.14),
    poly([[120, 300], [520, 300], [580, 250], [180, 250]], { fill: shade(C.ink, 0.2) }),
    poly([[520, 300], [580, 250], [580, 760], [520, 800]], { fill: shade(C.ink, -0.2) }),
    rect(120, 300, 400, 500, { fill: C.ink }),
    rect(120, 680, 400, 120, { fill: C.teal }),
    mark({ x: 160, y: 340, size: 86, bg: C.aqua, cross: C.ink, accent: '#FFFFFF' }),
    text('SaraDev', { x: 262, y: 382, size: 34, font: 'fraunces-600', fill: '#FFFFFF' }),
    text('Healthcare', { x: 264, y: 414, size: 18, font: 'figtree-600', fill: C.aqua2 }),
    ...lines.map((l, i) => text(l, { x: 160, y: 520 + i * 46, size: 38, font: 'figtree-700', fill: '#FFFFFF' })),
    text('Demo product', { x: 160, y: 752, size: 26, font: 'figtree-600', fill: '#FFFFFF' }),
  ]);
}

function wrap(str, max) {
  const words = str.replace(/\(.*\)/, '').trim().split(' ');
  const out = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) {
      out.push(cur.trim());
      cur = w;
    } else cur += ' ' + w;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.slice(0, 3);
}

/** Raw product art on a transparent 1000×1000 canvas (used to measure its bounding box). */
export function productArt(slug) {
  const p = PRODUCTS[slug];
  return doc(S, S, p.draw(), p.defs || '');
}

/**
 * bbox = { left, top, width, height } of the art in canvas px (measured by the build).
 * main: product sits on the podium; box: product in front of its packaging;
 * detail: close-up around the product's focus point.
 */
export function productImage(slug, view = 'main', bbox = { left: 150, top: 150, width: 700, height: 700 }) {
  const p = PRODUCTS[slug];
  const gid = `p-${slug}-${view}`;
  const st = stage(view, gid);
  const art = p.draw();
  const cx = bbox.left + bbox.width / 2;
  const bottom = bbox.top + bbox.height;
  let placed;
  if (view === 'detail') {
    const [fx, fy] = p.focus;
    const k = 1.75;
    placed = g([art], { transform: `translate(${500 - fx * k},${500 - fy * k}) scale(${k})` });
  } else if (view === 'box') {
    const k = Math.min(400 / bbox.width, 440 / bbox.height, 0.8);
    placed = packaging(p.name) + g([art], { transform: `translate(${700 - cx * k},${835 - bottom * k}) scale(${k})` });
  } else {
    const k = Math.min(600 / bbox.width, 600 / bbox.height, 1.15);
    placed = g([art], { transform: `translate(${500 - cx * k},${808 - bottom * k}) scale(${k})` });
  }
  return doc(S, S, st.back + placed, st.defs + (p.defs || ''));
}

