// Rooms, furniture and medical equipment in the MediNova illustration style.
import { C, g, rect, circle, ellipse, path, line, poly, limb, shadow, linear, rng } from './svg.mjs';
import { shade } from './people.mjs';
import { mark } from './brand.mjs';

// ---------------------------------------------------------------- rooms
export function room(w, h, { wall = C.mist, wall2 = '#FFFFFF', floorY = h * 0.78, floor = C.mist3, floor2 = C.mist2, gid = 'room' } = {}) {
  const defs =
    linear(`${gid}-wall`, [[0, wall2], [1, wall]]) +
    linear(`${gid}-floor`, [[0, floor], [1, floor2]]);
  const body = [
    rect(0, 0, w, floorY, { fill: `url(#${gid}-wall)` }),
    rect(0, floorY, w, h - floorY, { fill: `url(#${gid}-floor)` }),
    rect(0, floorY - 10, w, 10, { fill: shade(wall, -0.06) }),
    line(0, floorY, w, floorY, { stroke: shade(floor, -0.12), strokeWidth: 2 }),
  ].join('');
  return { defs, body };
}

export function windowPane(x, y, w, h, { arch = false, cols = 2, rows = 1, gid = 'win', frame = '#FFFFFF', scene = 'trees' } = {}) {
  const r = arch ? w / 2 : 10;
  const shape = arch
    ? `M${x},${y + h} L${x},${y + r} A${r},${r} 0 0 1 ${x + w},${y + r} L${x + w},${y + h} Z`
    : `M${x + 10},${y} L${x + w - 10},${y} Q${x + w},${y} ${x + w},${y + 10} L${x + w},${y + h - 10} Q${x + w},${y + h} ${x + w - 10},${y + h} L${x + 10},${y + h} Q${x},${y + h} ${x},${y + h - 10} L${x},${y + 10} Q${x},${y} ${x + 10},${y} Z`;
  const defs = linear(`${gid}-sky`, [[0, C.sky], [1, C.sky2]]);
  const clip = `<clipPath id="${gid}-clip"><path d="${shape}"/></clipPath>`;
  const inside = [];
  inside.push(rect(x, y, w, h, { fill: `url(#${gid}-sky)` }));
  const R = rng(Math.round(x * 7 + y * 3 + w));
  if (scene === 'trees' || scene === 'city') {
    // distant buildings / trees silhouettes
    if (scene === 'city') {
      for (let i = 0; i < 6; i++) {
        const bw = w * (0.12 + R() * 0.12);
        const bx = x + (i / 6) * w + R() * 10 - 10;
        const bh = h * (0.25 + R() * 0.35);
        inside.push(rect(bx, y + h - bh, bw, bh, { fill: '#D4E9F1' }));
      }
    }
    for (let i = 0; i < 5; i++) {
      const cx = x + (i + 0.5) * (w / 5) + (R() - 0.5) * 20;
      const rr = w * (0.09 + R() * 0.07);
      inside.push(circle(cx, y + h - rr * 0.6, rr, { fill: i % 2 ? '#A9DCC6' : '#93D1B8', opacity: 0.85 }));
    }
    inside.push(ellipse(x + w * 0.3, y + h * 0.22, w * 0.12, h * 0.035, { fill: '#FFFFFF', opacity: 0.8 }));
  }
  const mullions = [];
  for (let i = 1; i < cols; i++) mullions.push(rect(x + (w / cols) * i - 3, y, 6, h, { fill: frame }));
  for (let j = 1; j < rows; j++) mullions.push(rect(x, y + (h / rows) * j - 3, w, 6, { fill: frame }));
  const body = g([
    `<g clip-path="url(#${gid}-clip)">${inside.join('')}${mullions.join('')}</g>`,
    path(shape, { fill: 'none', stroke: frame, strokeWidth: 10 }),
    rect(x - 12, y + h, w + 24, 10, { rx: 4, fill: shade(frame, -0.06) }),
  ]);
  return { defs: defs + clip, body };
}

// ---------------------------------------------------------------- nature
export function plant(x, y, s = 1, { variant = 'bushy', pot = C.wood2, leaf = C.leaf } = {}) {
  const k = s;
  const leaves = [];
  const L = (cx, cy, rx, ry, rot, col) => ellipse(cx, cy, rx, ry, { fill: col, transform: `rotate(${rot} ${cx} ${cy})` });
  if (variant === 'tall') {
    leaves.push(limb([[0, 0], [-2, -120]], 4, C.leaf2));
    [[-22, -60, -35], [24, -78, 35], [-20, -98, -30], [18, -116, 30], [-12, -132, -15]].forEach(([dx, dy, r], i) =>
      leaves.push(L(dx, dy, 26, 10, r, i % 2 ? leaf : C.leaf2)),
    );
  } else if (variant === 'monstera') {
    [[-30, -50, -40], [30, -55, 40], [0, -80, 0], [-25, -88, -25], [26, -92, 25]].forEach(([dx, dy, r], i) => {
      leaves.push(limb([[0, -10], [dx * 0.8, dy + 15]], 3, C.leaf2));
      leaves.push(L(dx, dy, 22, 30, r, i % 2 ? leaf : C.leaf3));
    });
  } else {
    [[-24, -34], [22, -38], [0, -54], [-14, -62], [16, -64], [-30, -52], [30, -56], [2, -76]].forEach(([dx, dy], i) =>
      leaves.push(circle(dx, dy, 20 - (i % 3) * 2, { fill: [leaf, C.leaf2, C.leaf3][i % 3] })),
    );
  }
  return g(
    [
      shadow(0, 2, 40, 7, 0.12),
      ...leaves,
      path('M-28,-26 L28,-26 L22,0 L-22,0 Z', { fill: pot }),
      rect(-31, -32, 62, 9, { rx: 3, fill: shade(pot, 0.12) }),
    ],
    { transform: `translate(${x},${y}) scale(${k})` },
  );
}

// ---------------------------------------------------------------- furniture
export function desk(x, y, w, { h = 18, top = C.wood, panel = '#FFFFFF', depth = 90, panelColor } = {}) {
  return g([
    shadow(x + w / 2, y + depth + 4, w * 0.52, 10, 0.12),
    rect(x + 10, y + h, w - 20, depth - h, { rx: 6, fill: panelColor || panel, stroke: C.line, strokeWidth: 2 }),
    rect(x, y, w, h, { rx: 6, fill: top }),
    rect(x, y + h - 5, w, 5, { fill: shade(top, -0.15) }),
  ]);
}

export function tableTop(x, y, w, { top = C.wood, h = 16, legs = true, legH = 120 } = {}) {
  return g([
    legs ? rect(x + 20, y + h, 10, legH, { fill: shade(top, -0.3) }) : '',
    legs ? rect(x + w - 30, y + h, 10, legH, { fill: shade(top, -0.3) }) : '',
    rect(x, y, w, h, { rx: 6, fill: top }),
    rect(x, y + h - 4, w, 4, { fill: shade(top, -0.16) }),
  ]);
}

export function officeChair(x, y, s = 1, { color = C.navy2, back = true } = {}) {
  return g(
    [
      shadow(0, 0, 46, 8, 0.12),
      limb([[0, -40], [0, -6]], 8, C.steel2),
      limb([[-34, -2], [34, -2]], 6, C.steel2),
      circle(-34, -2, 5, { fill: C.ink }),
      circle(34, -2, 5, { fill: C.ink }),
      back ? rect(-34, -150, 68, 96, { rx: 24, fill: color }) : '',
      rect(-40, -56, 80, 20, { rx: 9, fill: shade(color, 0.1) }),
    ],
    { transform: `translate(${x},${y}) scale(${s})` },
  );
}

export function waitingChair(x, y, s = 1, { color = C.teal, frame = C.steel2 } = {}) {
  return g(
    [
      shadow(0, 0, 40, 6, 0.1),
      rect(-36, -60, 6, 60, { fill: frame }),
      rect(30, -60, 6, 60, { fill: frame }),
      rect(-38, -128, 76, 74, { rx: 18, fill: color }),
      rect(-42, -64, 84, 18, { rx: 8, fill: shade(color, 0.12) }),
    ],
    { transform: `translate(${x},${y}) scale(${s})` },
  );
}

export function sofa(x, y, w, { color = C.aqua, seat = 86 } = {}) {
  // y = floor line; seat = height of the seat cushion top above the floor
  const top = y - seat;
  return g([
    shadow(x + w / 2, y, w * 0.55, 9, 0.12),
    rect(x, top - 150, w, 170, { rx: 30, fill: shade(color, -0.08) }),
    rect(x + 18, top, w - 36, 56, { rx: 16, fill: color }),
    rect(x + 18, top + 40, w - 36, seat - 62, { rx: 10, fill: shade(color, -0.18) }),
    rect(x - 14, top - 40, 40, seat + 18, { rx: 18, fill: shade(color, -0.12) }),
    rect(x + w - 26, top - 40, 40, seat + 18, { rx: 18, fill: shade(color, -0.12) }),
    rect(x + 16, y - 22, 10, 22, { fill: C.wood3 }),
    rect(x + w - 26, y - 22, 10, 22, { fill: C.wood3 }),
  ]);
}

export function cabinet(x, y, w, h, { color = '#FFFFFF', drawers = 3, handle = C.steel2 } = {}) {
  const parts = [shadow(x + w / 2, y + h, w * 0.55, 8, 0.1), rect(x, y, w, h, { rx: 8, fill: color, stroke: C.line, strokeWidth: 2 })];
  const dh = h / drawers;
  for (let i = 0; i < drawers; i++) {
    if (i) parts.push(line(x + 6, y + dh * i, x + w - 6, y + dh * i, { stroke: C.line, strokeWidth: 2 }));
    parts.push(rect(x + w / 2 - 16, y + dh * i + dh / 2 - 3, 32, 6, { rx: 3, fill: handle }));
  }
  return g(parts);
}

export function shelf(x, y, w, { rows = 3, gap = 70, color = C.wood2, items = true, seed = 3 } = {}) {
  const R = rng(seed);
  const parts = [];
  for (let i = 0; i < rows; i++) {
    const sy = y + i * gap;
    parts.push(rect(x, sy, w, 8, { rx: 3, fill: color }));
    if (!items) continue;
    let cx = x + 12;
    while (cx < x + w - 40) {
      const t = R();
      const col = [C.aqua, C.teal, '#FFFFFF', C.aqua2, C.navy3, C.amber][Math.floor(R() * 6)];
      if (t < 0.45) {
        const bw = 26 + R() * 22, bh = 30 + R() * 22;
        parts.push(rect(cx, sy - bh, bw, bh, { rx: 4, fill: col, stroke: C.line, strokeWidth: col === '#FFFFFF' ? 1.5 : 0 }));
        cx += bw + 8;
      } else {
        const bh = 34 + R() * 16;
        parts.push(rect(cx, sy - bh, 18, bh, { rx: 6, fill: col }), rect(cx + 3, sy - bh - 6, 12, 7, { rx: 2, fill: C.steel2 }));
        cx += 26;
      }
    }
  }
  return g(parts);
}

export function door(x, y, w, h, { color = '#FFFFFF', glass = true, sign = null } = {}) {
  return g([
    rect(x - 8, y - 8, w + 16, h + 8, { rx: 6, fill: C.line }),
    rect(x, y, w, h, { rx: 4, fill: color, stroke: C.line, strokeWidth: 2 }),
    glass ? rect(x + w * 0.22, y + h * 0.1, w * 0.56, h * 0.26, { rx: 6, fill: C.sky, opacity: 0.8 }) : '',
    rect(x + w * 0.8, y + h * 0.52, 8, 26, { rx: 4, fill: C.steel2 }),
    sign ? signPlate(x + w / 2, y - 34, sign) : '',
  ]);
}

export function signPlate(cx, cy, icon = 'cross', { color = C.teal, w = 70 } = {}) {
  return g([rect(cx - w / 2, cy - 16, w, 32, { rx: 10, fill: color }), icons(icon, cx, cy, 11, '#FFFFFF')]);
}

/** Simple pictograms (no text) used on signs and screens. */
export function icons(name, cx, cy, r = 10, col = '#FFFFFF') {
  switch (name) {
    case 'cross':
      return g([rect(cx - r * 0.3, cy - r, r * 0.6, r * 2, { rx: r * 0.3, fill: col }), rect(cx - r, cy - r * 0.3, r * 2, r * 0.6, { rx: r * 0.3, fill: col })]);
    case 'heart':
      return path(`M${cx},${cy + r * 0.85} C${cx - r * 1.6},${cy - r * 0.2} ${cx - r * 0.7},${cy - r * 1.4} ${cx},${cy - r * 0.45} C${cx + r * 0.7},${cy - r * 1.4} ${cx + r * 1.6},${cy - r * 0.2} ${cx},${cy + r * 0.85} Z`, { fill: col });
    case 'arrow':
      return path(`M${cx - r},${cy} L${cx + r * 0.6},${cy} M${cx + r * 0.1},${cy - r * 0.6} L${cx + r * 0.8},${cy} L${cx + r * 0.1},${cy + r * 0.6}`, { fill: 'none', stroke: col, strokeWidth: r * 0.32, strokeLinecap: 'round', strokeLinejoin: 'round' });
    case 'person':
      return g([circle(cx, cy - r * 0.55, r * 0.35, { fill: col }), path(`M${cx - r * 0.65},${cy + r * 0.85} Q${cx},${cy - r * 0.3} ${cx + r * 0.65},${cy + r * 0.85} Z`, { fill: col })]);
    case 'flask':
      return path(`M${cx - r * 0.25},${cy - r} L${cx + r * 0.25},${cy - r} L${cx + r * 0.25},${cy - r * 0.2} L${cx + r * 0.8},${cy + r * 0.8} L${cx - r * 0.8},${cy + r * 0.8} L${cx - r * 0.25},${cy - r * 0.2} Z`, { fill: col });
    case 'drop':
      return path(`M${cx},${cy - r} C${cx + r * 0.9},${cy} ${cx + r * 0.7},${cy + r} ${cx},${cy + r} C${cx - r * 0.7},${cy + r} ${cx - r * 0.9},${cy} ${cx},${cy - r} Z`, { fill: col });
    default:
      return circle(cx, cy, r * 0.6, { fill: col });
  }
}

export function clock(cx, cy, r = 26) {
  return g([
    circle(cx, cy, r, { fill: '#FFFFFF', stroke: C.navy, strokeWidth: 4 }),
    limb([[cx, cy], [cx, cy - r * 0.6]], 3, C.navy),
    limb([[cx, cy], [cx + r * 0.42, cy + r * 0.12]], 3, C.teal),
    circle(cx, cy, 3, { fill: C.navy }),
  ]);
}

export function wallArt(x, y, w, h, { variant = 0 } = {}) {
  const inner = [];
  if (variant === 0) {
    inner.push(rect(x + 8, y + 8, w - 16, h - 16, { fill: C.aqua3 }));
    inner.push(circle(x + w * 0.35, y + h * 0.4, w * 0.18, { fill: C.aqua }));
    inner.push(path(`M${x + 8},${y + h - 8} Q${x + w * 0.5},${y + h * 0.45} ${x + w - 8},${y + h - 8} Z`, { fill: C.teal }));
  } else if (variant === 1) {
    inner.push(rect(x + 8, y + 8, w - 16, h - 16, { fill: '#FCEFE6' }));
    inner.push(circle(x + w * 0.62, y + h * 0.5, w * 0.24, { fill: C.coral, opacity: 0.6 }));
    inner.push(rect(x + w * 0.18, y + h * 0.25, w * 0.2, h * 0.5, { rx: 6, fill: C.navy3, opacity: 0.8 }));
  } else {
    inner.push(rect(x + 8, y + 8, w - 16, h - 16, { fill: C.mist2 }));
    inner.push(path(`M${x + 14},${y + h * 0.6} C${x + w * 0.3},${y + h * 0.2} ${x + w * 0.6},${y + h * 0.9} ${x + w - 14},${y + h * 0.4}`, { fill: 'none', stroke: C.teal, strokeWidth: 6, strokeLinecap: 'round' }));
  }
  return g([shadow(x + w / 2, y + h + 6, w * 0.4, 4, 0.06), rect(x, y, w, h, { rx: 6, fill: '#FFFFFF', stroke: C.line, strokeWidth: 2 }), ...inner]);
}

export function pendantLamp(cx, top, drop = 120, { color = C.navy, r = 34 } = {}) {
  return g([
    line(cx, top, cx, top + drop, { stroke: C.steel2, strokeWidth: 2 }),
    path(`M${cx - r},${top + drop + r * 0.7} A${r},${r} 0 0 1 ${cx + r},${top + drop + r * 0.7} Z`, { fill: color }),
    ellipse(cx, top + drop + r * 0.72, r * 0.7, 6, { fill: '#FFF4D6' }),
  ]);
}

export function ceilingLights(w, y = 0, n = 3) {
  return g(Array.from({ length: n }, (_, i) => rect(((i + 0.5) * w) / n - 90, y, 180, 12, { rx: 6, fill: '#FFFFFF', opacity: 0.9 })));
}

export function rug(cx, cy, rx, ry, color = C.aqua3) {
  return ellipse(cx, cy, rx, ry, { fill: color, opacity: 0.8 });
}

// ---------------------------------------------------------------- screens
export function screenContent(kind, x, y, w, h) {
  const p = [];
  const pad = w * 0.07;
  if (kind === 'ecg') {
    const mid = y + h * 0.55;
    const pts = [];
    const n = 5;
    for (let i = 0; i < n; i++) {
      const bx = x + pad + ((w - 2 * pad) / n) * i;
      const sw = (w - 2 * pad) / n;
      pts.push([bx, mid], [bx + sw * 0.35, mid], [bx + sw * 0.42, mid - h * 0.08], [bx + sw * 0.48, mid + h * 0.06], [bx + sw * 0.54, mid - h * 0.34], [bx + sw * 0.6, mid + h * 0.12], [bx + sw * 0.66, mid], [bx + sw, mid]);
    }
    p.push(limb(pts, Math.max(2, w * 0.012), C.aqua));
    p.push(rect(x + pad, y + h * 0.12, w * 0.22, h * 0.09, { rx: 3, fill: C.teal2 }));
    p.push(rect(x + w - pad - w * 0.16, y + h * 0.12, w * 0.16, h * 0.16, { rx: 4, fill: '#1B5A86' }));
  } else if (kind === 'chart') {
    const bars = [0.35, 0.55, 0.45, 0.7, 0.6, 0.85];
    bars.forEach((b, i) => {
      const bw = (w - 2 * pad) / (bars.length * 1.6);
      p.push(rect(x + pad + i * bw * 1.6, y + h - pad - (h - 2 * pad) * b * 0.7, bw, (h - 2 * pad) * b * 0.7, { rx: 3, fill: i === 3 ? C.aqua : C.teal2 }));
    });
    p.push(rect(x + pad, y + pad, w * 0.3, h * 0.08, { rx: 3, fill: '#FFFFFF', opacity: 0.85 }));
  } else if (kind === 'ui') {
    p.push(rect(x + pad, y + pad, w * 0.3, h * 0.1, { rx: 3, fill: C.aqua }));
    for (let i = 0; i < 3; i++) p.push(rect(x + pad, y + pad + h * (0.22 + i * 0.18), w - 2 * pad, h * 0.11, { rx: 4, fill: '#FFFFFF', opacity: 0.18 + i * 0.06 }));
    p.push(circle(x + w - pad - h * 0.07, y + pad + h * 0.05, h * 0.06, { fill: C.amber }));
  } else if (kind === 'xray') {
    p.push(rect(x, y, w, h, { fill: '#10263E' }));
    const cx = x + w / 2;
    p.push(limb([[cx - w * 0.06, y + h * 0.1], [cx - w * 0.04, y + h * 0.48]], w * 0.07, '#DCEAF2'));
    p.push(limb([[cx + w * 0.05, y + h * 0.52], [cx + w * 0.07, y + h * 0.9]], w * 0.065, '#DCEAF2'));
    p.push(ellipse(cx, y + h * 0.5, w * 0.1, h * 0.06, { fill: '#C5DAE6' }));
    p.push(circle(cx + w * 0.12, y + h * 0.46, w * 0.035, { fill: '#C5DAE6' }));
  } else if (kind === 'brain') {
    p.push(rect(x, y, w, h, { fill: '#10263E' }));
    p.push(ellipse(x + w / 2, y + h / 2, w * 0.28, h * 0.32, { fill: '#2A6E9C' }));
    p.push(path(`M${x + w * 0.3},${y + h * 0.45} Q${x + w * 0.42},${y + h * 0.3} ${x + w * 0.52},${y + h * 0.45} T${x + w * 0.7},${y + h * 0.48}`, { fill: 'none', stroke: C.aqua, strokeWidth: 3 }));
    p.push(path(`M${x + w * 0.32},${y + h * 0.6} Q${x + w * 0.46},${y + h * 0.7} ${x + w * 0.62},${y + h * 0.58}`, { fill: 'none', stroke: C.aqua2, strokeWidth: 3 }));
  } else if (kind === 'calendar') {
    p.push(rect(x + pad, y + pad, w - 2 * pad, h * 0.16, { rx: 4, fill: C.teal2 }));
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 5; c++)
        p.push(rect(x + pad + c * ((w - 2 * pad) / 5) + 3, y + h * 0.32 + r * h * 0.2, (w - 2 * pad) / 5 - 6, h * 0.14, { rx: 3, fill: r === 1 && c === 2 ? C.aqua : '#FFFFFF', opacity: r === 1 && c === 2 ? 1 : 0.22 }));
  } else if (kind === 'scan') {
    p.push(rect(x, y, w, h, { fill: '#0E2238' }));
    p.push(ellipse(x + w * 0.5, y + h * 0.52, w * 0.3, h * 0.34, { fill: 'none', stroke: '#7FC8E8', strokeWidth: 3 }));
    p.push(ellipse(x + w * 0.5, y + h * 0.52, w * 0.18, h * 0.2, { fill: '#3B7DA8', opacity: 0.8 }));
    p.push(rect(x + pad, y + pad, w * 0.2, h * 0.07, { rx: 2, fill: C.aqua }));
  }
  return g(p);
}

export function monitor(x, y, w, h, { kind = 'ui', stand = true, frame = C.ink } = {}) {
  return g([
    stand ? rect(x + w / 2 - 6, y + h, 12, h * 0.22, { fill: C.steel2 }) : '',
    stand ? rect(x + w / 2 - w * 0.18, y + h + h * 0.2, w * 0.36, 8, { rx: 4, fill: C.steel2 }) : '',
    rect(x, y, w, h, { rx: 10, fill: frame }),
    rect(x + 8, y + 8, w - 16, h - 16, { rx: 5, fill: C.screen }),
    screenContent(kind, x + 8, y + 8, w - 16, h - 16),
  ]);
}

export function laptop(x, y, w, { kind = 'ui' } = {}) {
  const h = w * 0.62;
  return g([
    rect(x, y, w, h, { rx: 8, fill: C.ink }),
    rect(x + 7, y + 7, w - 14, h - 14, { rx: 4, fill: C.screen }),
    screenContent(kind, x + 7, y + 7, w - 14, h - 14),
    path(`M${x - w * 0.08},${y + h} L${x + w * 1.08},${y + h} L${x + w},${y + h + 12} L${x},${y + h + 12} Z`, { fill: C.steel }),
  ]);
}

// ---------------------------------------------------------------- clinical
export function examBed(x, y, w, { color = C.aqua, paper = true } = {}) {
  return g([
    shadow(x + w / 2, y + 120, w * 0.55, 10, 0.12),
    rect(x + 20, y + 24, 14, 96, { fill: C.steel2 }),
    rect(x + w - 34, y + 24, 14, 96, { fill: C.steel2 }),
    rect(x, y, w, 34, { rx: 12, fill: color }),
    path(`M${x},${y + 4} Q${x - 8},${y - 52} ${x + 40},${y - 60} L${x + 70},${y - 58} L${x + 76},${y + 2} Z`, { fill: shade(color, -0.1) }),
    paper ? rect(x + 70, y - 3, w - 110, 10, { rx: 4, fill: '#FFFFFF', opacity: 0.85 }) : '',
    rect(x + 40, y + 34, w - 80, 12, { rx: 4, fill: C.steel }),
  ]);
}

export function hospitalBed(x, y, w, { blanket = C.aqua, frame = C.steel2, pillow = '#FFFFFF' } = {}) {
  return g([
    shadow(x + w / 2, y + 130, w * 0.55, 10, 0.12),
    rect(x - 10, y - 110, 22, 240, { rx: 10, fill: frame }),
    rect(x + w - 12, y - 50, 22, 180, { rx: 10, fill: frame }),
    rect(x, y + 10, w, 30, { rx: 8, fill: '#FFFFFF', stroke: C.line, strokeWidth: 2 }),
    rect(x + 20, y + 40, 12, 70, { fill: frame }),
    rect(x + w - 32, y + 40, 12, 70, { fill: frame }),
    circle(x + 26, y + 118, 10, { fill: C.ink }),
    circle(x + w - 26, y + 118, 10, { fill: C.ink }),
    rect(x + 10, y - 30, 110, 44, { rx: 18, fill: pillow, stroke: C.line, strokeWidth: 2 }),
    blanket === 'none' ? '' : rect(x + 90, y - 8, w - 96, 40, { rx: 14, fill: blanket }),
    blanket === 'none' ? '' : rect(x + 90, y - 8, w - 96, 12, { rx: 6, fill: shade(blanket, 0.25) }),
  ]);
}

export function ivStand(x, y, h = 360) {
  return g([
    shadow(x, y, 40, 6, 0.12),
    limb([[x, y - 10], [x, y - h]], 6, C.steel2),
    limb([[x - 34, y - 4], [x + 34, y - 4]], 6, C.steel2),
    limb([[x - 26, y - h], [x + 26, y - h]], 5, C.steel2),
    rect(x + 10, y - h + 8, 34, 52, { rx: 10, fill: '#E6F6FB', stroke: C.aqua2, strokeWidth: 2 }),
    rect(x + 14, y - h + 30, 26, 26, { rx: 8, fill: C.aqua2, opacity: 0.7 }),
    path(`M${x + 27},${y - h + 60} C${x + 30},${y - h + 140} ${x + 70},${y - h + 160} ${x + 90},${y - h + 200}`, { fill: 'none', stroke: C.aqua2, strokeWidth: 2.5 }),
  ]);
}

export function vitalsMonitor(x, y, { h = 380, w = 150 } = {}) {
  return g([
    shadow(x + w / 2, y, 54, 7, 0.12),
    limb([[x + w / 2, y - 12], [x + w / 2, y - h + 100]], 8, C.steel2),
    limb([[x + w / 2 - 40, y - 6], [x + w / 2 + 40, y - 6]], 8, C.steel2),
    monitor(x, y - h, w, w * 0.72, { kind: 'ecg', stand: false }),
  ]);
}

export function microscope(x, y, s = 1, { color = '#FFFFFF' } = {}) {
  return g(
    [
      shadow(0, 0, 70, 9, 0.14),
      rect(-60, -22, 120, 22, { rx: 10, fill: C.navy2 }),
      path('M18,-22 C40,-60 40,-120 6,-150 L-12,-136 C14,-112 16,-70 -2,-22 Z', { fill: color, stroke: C.line, strokeWidth: 2 }),
      rect(-40, -82, 70, 12, { rx: 5, fill: C.navy3 }),
      rect(-26, -170, 28, 70, { rx: 10, fill: color, stroke: C.line, strokeWidth: 2, transform: 'rotate(-28 -12 -135)' }),
      rect(-50, -196, 22, 34, { rx: 8, fill: C.ink, transform: 'rotate(-28 -39 -179)' }),
      rect(-14, -104, 14, 26, { rx: 4, fill: C.steel2 }),
      circle(30, -80, 10, { fill: C.teal }),
    ],
    { transform: `translate(${x},${y}) scale(${s})` },
  );
}

export function tubeRack(x, y, s = 1, { colors = [C.coral, C.aqua, C.amber, C.teal2, C.rose] } = {}) {
  const tubes = colors.map((c, i) =>
    g([
      rect(-62 + i * 28, -96, 18, 92, { rx: 9, fill: '#F4FBFD', stroke: C.line, strokeWidth: 2 }),
      rect(-62 + i * 28, -54 + (i % 2) * 10, 18, 50 - (i % 2) * 10, { rx: 9, fill: c, opacity: 0.85 }),
      rect(-64 + i * 28, -104, 22, 12, { rx: 3, fill: [C.navy2, C.teal, C.navy3, C.amber, C.coral][i % 5] }),
    ]),
  );
  return g([shadow(0, 0, 90, 8, 0.12), ...tubes, rect(-80, -40, 160, 14, { rx: 4, fill: C.navy2 }), rect(-80, -8, 160, 10, { rx: 4, fill: C.navy2 }), rect(-80, -40, 10, 40, { fill: C.navy2 }), rect(70, -40, 10, 40, { fill: C.navy2 })], { transform: `translate(${x},${y}) scale(${s})` });
}

export function flask(x, y, s = 1, { liquid = C.aqua } = {}) {
  return g(
    [
      shadow(0, 0, 44, 6, 0.12),
      path('M-12,-110 L12,-110 L12,-62 L44,-6 Q46,0 38,0 L-38,0 Q-46,0 -44,-6 L-12,-62 Z', { fill: '#F4FBFD', stroke: C.line, strokeWidth: 2 }),
      path('M-30,-26 L30,-26 L42,-6 Q44,-2 38,-2 L-38,-2 Q-44,-2 -42,-6 Z', { fill: liquid, opacity: 0.8 }),
      rect(-16, -118, 32, 10, { rx: 4, fill: C.steel2 }),
      circle(-8, -14, 4, { fill: '#FFFFFF', opacity: 0.6 }),
    ],
    { transform: `translate(${x},${y}) scale(${s})` },
  );
}

export function centrifuge(x, y, s = 1) {
  return g(
    [
      shadow(0, 0, 80, 8, 0.12),
      rect(-70, -70, 140, 70, { rx: 16, fill: '#FFFFFF', stroke: C.line, strokeWidth: 2 }),
      path('M-70,-60 Q-70,-100 0,-100 Q70,-100 70,-60 Z', { fill: C.mist2, stroke: C.line, strokeWidth: 2 }),
      rect(-40, -42, 50, 18, { rx: 4, fill: C.screen }),
      rect(-34, -37, 22, 8, { rx: 2, fill: C.aqua }),
      circle(36, -33, 8, { fill: C.teal }),
    ],
    { transform: `translate(${x},${y}) scale(${s})` },
  );
}

export function scanner(x, y, w) {
  // CT / MRI gantry with a patient table sliding into the bore
  const r = w * 0.34;
  const cx = x + r + 30;
  const cy = y - r - 50;
  const bedY = cy + r * 0.12;
  return g([
    shadow(x + w / 2, y + 4, w * 0.55, 12, 0.14),
    rect(cx - r - 20, cy - r * 0.15, (r + 20) * 2, y - (cy - r * 0.15), { rx: 30, fill: '#FFFFFF', stroke: C.line, strokeWidth: 2 }),
    circle(cx, cy, r, { fill: '#FFFFFF', stroke: C.line, strokeWidth: 3 }),
    circle(cx, cy, r * 0.5, { fill: C.mist2 }),
    circle(cx, cy, r * 0.4, { fill: shade(C.mist2, -0.08) }),
    path(`M${cx - r * 0.7},${cy - r * 0.72} A${r},${r} 0 0 1 ${cx + r * 0.7},${cy - r * 0.72}`, { fill: 'none', stroke: C.teal, strokeWidth: 10, strokeLinecap: 'round' }),
    rect(cx - r * 0.28, cy + r * 0.62, r * 0.56, 14, { rx: 6, fill: C.aqua }),
    // table pedestal
    path(`M${cx + r * 0.7},${y} L${cx + r * 0.85},${bedY + 30} L${x + w - 40},${bedY + 30} L${x + w - 20},${y} Z`, { fill: C.mist2, stroke: C.line, strokeWidth: 2 }),
    // table top entering the bore
    rect(cx - r * 0.25, bedY, x + w - (cx - r * 0.25), 30, { rx: 14, fill: C.steel }),
    rect(cx + r * 0.6, bedY - 14, x + w - (cx + r * 0.6) - 10, 18, { rx: 9, fill: C.aqua2 }),
    rect(x + w - 120, bedY - 30, 90, 24, { rx: 12, fill: '#FFFFFF', stroke: C.line, strokeWidth: 2 }),
  ]);
}

export function receptionDesk(x, y, w, { h = 150, top = C.wood, front = C.navy } = {}) {
  return g([
    shadow(x + w / 2, y + h, w * 0.55, 12, 0.14),
    rect(x, y, w, h, { rx: 18, fill: front }),
    rect(x + 24, y + 30, w - 48, h - 52, { rx: 12, fill: shade(front, 0.12) }),
    rect(x - 14, y - 16, w + 28, 22, { rx: 9, fill: top }),
    mark({ x: x + w / 2 - 28, y: y + h / 2 - 30, size: 56, bg: C.aqua, cross: C.ink, accent: '#FFFFFF' }),
  ]);
}

export function bench(x, y, w, { top = C.wood, legs = '#FFFFFF' } = {}) {
  return g([
    shadow(x + w / 2, y + 160, w * 0.52, 10, 0.12),
    rect(x + 10, y + 18, w - 20, 142, { rx: 8, fill: legs, stroke: C.line, strokeWidth: 2 }),
    ...Array.from({ length: Math.floor((w - 20) / 120) }, (_, i) =>
      g([line(x + 10 + (i + 1) * 120, y + 22, x + 10 + (i + 1) * 120, y + 156, { stroke: C.line, strokeWidth: 2 }), rect(x + 10 + i * 120 + 44, y + 40, 32, 6, { rx: 3, fill: C.steel2 })]),
    ),
    rect(x, y, w, 20, { rx: 6, fill: top }),
  ]);
}

export function cart(x, y, s = 1) {
  return g(
    [
      shadow(0, 0, 60, 7, 0.12),
      rect(-50, -150, 100, 14, { rx: 5, fill: C.steel2 }),
      rect(-46, -136, 92, 110, { rx: 10, fill: '#FFFFFF', stroke: C.line, strokeWidth: 2 }),
      rect(-38, -122, 76, 26, { rx: 6, fill: C.aqua3 }),
      rect(-38, -88, 76, 26, { rx: 6, fill: C.mist2 }),
      rect(-38, -54, 76, 22, { rx: 6, fill: C.aqua3 }),
      circle(-34, -10, 9, { fill: C.ink }),
      circle(34, -10, 9, { fill: C.ink }),
    ],
    { transform: `translate(${x},${y}) scale(${s})` },
  );
}

export function infusionPump(x, y, s = 1) {
  return g(
    [
      rect(-40, -70, 80, 70, { rx: 10, fill: '#FFFFFF', stroke: C.line, strokeWidth: 2 }),
      rect(-30, -60, 60, 26, { rx: 4, fill: C.screen }),
      rect(-24, -54, 26, 8, { rx: 2, fill: C.aqua }),
      circle(-18, -18, 6, { fill: C.teal }),
      circle(0, -18, 6, { fill: C.aqua2 }),
      circle(18, -18, 6, { fill: C.coral }),
    ],
    { transform: `translate(${x},${y}) scale(${s})` },
  );
}

export function defibrillator(x, y, s = 1) {
  return g(
    [
      shadow(0, 0, 70, 7, 0.12),
      rect(-70, -110, 140, 110, { rx: 16, fill: C.amber }),
      rect(-56, -96, 80, 56, { rx: 6, fill: C.screen }),
      screenContent('ecg', -56, -96, 80, 56),
      icons('heart', 48, -70, 12, '#FFFFFF'),
      rect(-56, -30, 112, 16, { rx: 6, fill: shade(C.amber, -0.15) }),
    ],
    { transform: `translate(${x},${y}) scale(${s})` },
  );
}
