// Branding: logo lockups, mark, favicon and the Open Graph share image.
import { C, doc, rect, circle, path, g, linear } from '../lib/svg.mjs';
import { mark, lockup } from '../lib/brand.mjs';
import { text } from '../lib/text.mjs';

export function logo() {
  const l = lockup({ x: 0, y: 0, height: 64 });
  return doc(Math.ceil(l.width), 64, l.svg, '', { title: 'SaraDev Healthcare' });
}

export function logoWhite() {
  const l = lockup({ x: 0, y: 0, height: 64, dark: true });
  return doc(Math.ceil(l.width), 64, l.svg, '', { title: 'SaraDev Healthcare' });
}

export function logoMark() {
  return doc(64, 64, mark({ x: 0, y: 0, size: 64 }), '', { title: 'SaraDev' });
}

/** Favicon: the mark on a rounded tile so it reads at 16–32 px. */
export function favicon() {
  return doc(64, 64, rect(0, 0, 64, 64, { rx: 14, fill: C.ink }) + mark({ x: 6, y: 5, size: 52, bg: C.ink, cross: '#FFFFFF', accent: C.aqua }), '', { title: 'SaraDev' });
}

/** Square app icon (PWA / Apple touch) with safe padding. */
export function appIcon() {
  return doc(512, 512, rect(0, 0, 512, 512, { fill: C.ink }) + mark({ x: 96, y: 88, size: 320, bg: C.ink, cross: '#FFFFFF', accent: C.aqua }));
}

/** 1200×630 social preview. `heroSvg` is the homepage hero illustration (inner markup reused in an arch). */
export function ogImage(heroInner) {
  const defs =
    linear('og-bg', [[0, C.ink], [1, C.navy]], { x1: 0, y1: 0, x2: 1, y2: 1 }) +
    `<clipPath id="og-arch"><path d="M760,630 L760,250 C760,130 845,60 960,60 C1075,60 1160,130 1160,250 L1160,630 Z"/></clipPath>`;
  const l = lockup({ x: 80, y: 80, height: 64, dark: true });
  const body = [
    rect(0, 0, 1200, 630, { fill: 'url(#og-bg)' }),
    circle(1020, 120, 300, { fill: C.teal, opacity: 0.18 }),
    `<g clip-path="url(#og-arch)"><rect x="760" y="60" width="400" height="570" fill="#EEF6F7"/><g transform="translate(464,40) scale(0.62)">${heroInner}</g></g>`,
    path('M760,630 L760,250 C760,130 845,60 960,60 C1075,60 1160,130 1160,250 L1160,630', { fill: 'none', stroke: C.aqua, strokeWidth: 4, opacity: 0.6 }),
    l.svg,
    text('Better Care.', { x: 80, y: 290, size: 58, font: 'fraunces-600', fill: '#FFFFFF' }),
    text('Connected Healthcare.', { x: 80, y: 360, size: 58, font: 'fraunces-600', fill: '#FFFFFF' }),
    text('Services, doctors, appointments and essentials.', { x: 80, y: 428, size: 24, font: 'figtree-500', fill: C.aqua2 }),
    rect(80, 500, 268, 46, { rx: 23, fill: C.amber }),
    text('Demonstration website', { x: 214, y: 531, size: 22, font: 'figtree-700', fill: C.ink, anchor: 'middle' }),
  ].join('');
  return doc(1200, 630, body, defs);
}
