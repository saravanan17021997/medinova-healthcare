// Section C: fictional demo doctor portraits (800 × 1000, 4:5).
// Same crop, same backdrop, a unique person per profile.
import { C, SKIN, HAIR, doc, rect, circle, path, linear, radial } from '../lib/svg.mjs';
import { person } from '../lib/people.mjs';

const W = 800;
const H = 1000;

export const DOCTOR_LOOKS = {
  'arjun-mehta': { skin: SKIN.s3, hairStyle: 'short', hairColor: HAIR.dark, top: 'coat', shirt: C.aqua2, tie: C.navy2, steth: true },
  'nisha-varghese': { skin: SKIN.s2, hairStyle: 'bun', hairColor: HAIR.black, top: 'coat', shirt: '#F2C4CB', steth: true },
  'rahul-iyer': { skin: SKIN.s4, hairStyle: 'sidepart', hairColor: HAIR.black, beard: true, top: 'scrubs', topColor: C.navy3, lanyard: true },
  'fatima-sheikh': { skin: SKIN.s2, hijab: C.teal, top: 'coat', shirt: C.navy3, steth: true },
  'kavya-reddy': { skin: SKIN.s3, hairStyle: 'curlylong', hairColor: HAIR.dark, top: 'scrubs', topColor: C.aqua, lanyard: true },
  'daniel-thomas': { skin: SKIN.s1, hairStyle: 'grey', hairColor: HAIR.grey, glasses: true, beard: true, top: 'coat', shirt: C.navy2, tie: C.teal },
  'priya-nair': { skin: SKIN.s4, hairStyle: 'long', hairColor: HAIR.black, glasses: true, top: 'coat', shirt: C.aqua3, steth: true },
  'vikram-singh': { skin: SKIN.s3, hairStyle: 'buzz', hairColor: HAIR.black, beard: true, top: 'scrubs', topColor: C.teal },
  'anita-das': { skin: SKIN.s5, hairStyle: 'bob', hairColor: HAIR.black, top: 'coat', shirt: C.coral, steth: true },
  'samuel-okafor': { skin: SKIN.s6, hairStyle: 'short', hairColor: HAIR.black, glasses: true, top: 'coat', shirt: C.aqua2 },
};

export function portrait(slug) {
  const look = DOCTOR_LOOKS[slug];
  const defs =
    linear('dp-bg', [[0, '#F5FAFB'], [1, C.aqua3]]) +
    radial('dp-glow', [[0, '#FFFFFF', 0.95], [1, '#FFFFFF', 0]]);
  const body = [
    rect(0, 0, W, H, { fill: 'url(#dp-bg)' }),
    circle(400, 420, 360, { fill: 'url(#dp-glow)' }),
    path('M120,1000 L120,520 C120,330 245,210 400,210 C555,210 680,330 680,520 L680,1000 Z', { fill: C.aqua, opacity: 0.16 }),
    person({ x: 400, y: 2140, h: 2000, detail: true, arms: { l: 'down', r: 'down' }, ...look }),
  ].join('');
  return doc(W, H, body, defs);
}

// Named exports for the preview tool.
export const arjun = () => portrait('arjun-mehta');
export const nisha = () => portrait('nisha-varghese');
export const rahul = () => portrait('rahul-iyer');
export const fatima = () => portrait('fatima-sheikh');
export const kavya = () => portrait('kavya-reddy');
export const daniel = () => portrait('daniel-thomas');
export const priya = () => portrait('priya-nair');
export const vikram = () => portrait('vikram-singh');
export const anita = () => portrait('anita-das');
export const samuel = () => portrait('samuel-okafor');
