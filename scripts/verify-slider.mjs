// Hero image slider tests: the public slider (timing, arrows, dots, pause,
// keyboard, swipe, reduced motion, whole images) and the admin slider manager.
// Supabase is replaced by scripts/lib/mock-supabase.mjs inside the browser.
// Usage: BASE_URL=http://localhost:4181 node scripts/verify-slider.mjs
import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs';
import { loadData } from './lib/load-data.mjs';
import { createMockSupabase } from './lib/mock-supabase.mjs';

const BASE = (process.env.BASE_URL || 'http://localhost:4181').replace(/\/$/, '');
const SB = (process.env.SUPABASE_URL || 'https://test-project.supabase.co').replace(/\/$/, '');
const SHOTS = process.env.SHOTS || '';
const data = await loadData();
const mock = createMockSupabase({ SB, seed: data.products, care: { specialties: data.specialties.specialties, doctors: data.doctors.doctors } });
const { db, files, log, OWNER, EDITOR } = mock;
const hero = () => db.sd_page_sections.find((s) => s.key === 'home.hero');

const results = [];
let failed = 0;
const test = async (name, fn) => {
  try {
    const d = await fn();
    results.push({ name, pass: true, detail: d || '' });
    console.log('PASS', name, d ? '→ ' + d : '');
  } catch (e) {
    failed++;
    results.push({ name, pass: false, detail: e.message });
    console.log('FAIL', name, '→', e.message.split('\n')[0]);
  }
};
const expect = (c, m) => { if (!c) throw new Error(m); };
const until = async (fn, msg, ms = 8000) => {
  const t = Date.now();
  while (!(await fn())) {
    if (Date.now() - t > ms) throw new Error(msg);
    await new Promise((r) => setTimeout(r, 100));
  }
};
const browser = await chromium.launch();
const consoleErrors = [];
async function open({ viewport = { width: 1280, height: 900 }, reducedMotion, hasTouch = false } = {}) {
  const ctx = await browser.newContext({ viewport, reducedMotion, hasTouch, isMobile: hasTouch });
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource|status of 4\d\d|status of 503/.test(m.text()) && consoleErrors.push(m.text()));
  page.on('pageerror', (e) => consoleErrors.push(e.message));
  await mock.install(page);
  return { ctx, page };
}
async function signIn(page, who = OWNER) {
  await page.goto(BASE + '/admin/login');
  await page.getByLabel('Email').fill(who.email);
  await page.getByLabel('Password', { exact: true }).fill(who.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('heading', { name: 'Overview' }).waitFor();
}
const toast = (page, text) => page.getByRole('status').filter({ hasText: text }).first().waitFor({ timeout: 10000 });
const png = (w, h, c) => sharp({ create: { width: w, height: h, channels: 3, background: c } }).png().toBuffer();
// put three real images in storage so the public tests have files to load
const put = async (path, buf, type) => {
  files.set(path, { buf, type });
  return `${SB}/storage/v1/object/public/sd-media/${path}`;
};
const slider = (page) => page.locator('main [data-testid="hero-slider"]').first();
const active = (page) => slider(page).locator('[data-testid="hero-slide"][data-active]').getAttribute('aria-label');

const wide = await put('sections/seed/wide.png', await png(2000, 800, '#1b7f79'), 'image/png');
const tall = await put('sections/seed/tall.png', await png(800, 1200, '#5bc0be'), 'image/png');
const std = await put('sections/seed/std.png', await png(1600, 1200, '#0b2545'), 'image/png');
const SEED = [
  { id: 's1', image_url: wide, image_small_url: null, image_alt: 'Wide test image', image_width: 2000, image_height: 800, title: 'Care close to home', description: 'Our Anna Nagar clinic.', enabled: true },
  { id: 's2', image_url: tall, image_small_url: null, image_alt: '', image_width: 800, image_height: 1200, title: 'Friendly doctors', description: '', enabled: true },
  { id: 'hidden', image_url: std, image_small_url: null, image_alt: '', image_width: 1600, image_height: 1200, title: 'Draft slide', description: '', enabled: false },
  { id: 'bad', image_url: '//evil.example/x.png', image_small_url: null, image_alt: '', image_width: 10, image_height: 10, title: 'Unsafe', description: '', enabled: true },
  { id: 's3', image_url: std, image_small_url: null, image_alt: 'Standard test image', image_width: 1600, image_height: 1200, title: 'Book in minutes', description: 'Request a time online.', enabled: true },
];

// ======================================================= public
await test('With no slides, the homepage shows the main image on its own, whole', async () => {
  const { page, ctx } = await open();
  await page.goto(BASE + '/');
  const s = slider(page);
  await s.waitFor();
  expect((await s.locator('[data-testid="hero-slide"]').count()) === 1, 'expected one image');
  expect(!(await s.getByRole('button', { name: 'Next slide' }).count()) && !(await s.getByRole('button', { name: /Show slide/ }).count()), 'controls shown for one image');
  const fit = await s.locator('img').first().evaluate((i) => getComputedStyle(i).objectFit);
  expect(fit === 'contain', 'object-fit ' + fit);
  await ctx.close();
  return 'single main image, object-fit: contain, no arrows or dots';
});

await test('Slides from the database: only shown, safe ones, in order, with captions', async () => {
  hero().items = JSON.parse(JSON.stringify(SEED));
  const { page, ctx } = await open();
  await page.goto(BASE + '/');
  const s = slider(page);
  await s.getByRole('button', { name: 'Show slide 3 of 3' }).waitFor();
  expect((await s.locator('[data-testid="hero-slide"]').count()) === 3, 'slide count');
  expect((await active(page)) === '1 of 3: Care close to home', 'first slide: ' + (await active(page)));
  await s.getByTestId('hero-caption').getByText('Our Anna Nagar clinic.').waitFor();
  expect(!(await page.getByText('Draft slide').count()) && !(await page.locator('img[src^="//"]').count()), 'hidden or unsafe slide rendered');
  expect((await page.getByRole('heading', { level: 1 }).count()) === 1, 'the page heading is still there');
  if (SHOTS) await page.screenshot({ path: SHOTS + '/public-slider.png' });
  await ctx.close();
});

await test('It moves on by itself every 4.5 seconds and wraps around', async () => {
  const { page, ctx } = await open();
  await page.goto(BASE + '/');
  await slider(page).getByRole('button', { name: 'Show slide 3 of 3' }).waitFor();
  await page.mouse.move(5, 890);
  const t0 = Date.now();
  await until(async () => (await active(page))?.startsWith('2 of 3'), 'did not advance', 7000);
  const dt = Date.now() - t0;
  expect(dt > 3500 && dt < 6500, `advanced after ${dt} ms`);
  await until(async () => (await active(page))?.startsWith('3 of 3'), 'did not reach 3', 7000);
  await until(async () => (await active(page))?.startsWith('1 of 3'), 'did not wrap', 7000);
  await ctx.close();
  return `first change after ${(dt / 1000).toFixed(1)} s, then 2 → 3 → 1`;
});

await test('Arrows, dots and the keyboard change slides; hovering pauses; Pause stops it', async () => {
  const { page, ctx } = await open();
  await page.goto(BASE + '/');
  const s = slider(page);
  await s.getByRole('button', { name: 'Next slide' }).click();
  expect((await active(page)).startsWith('2 of 3'), 'next');
  await s.getByRole('button', { name: 'Previous slide' }).click();
  await s.getByRole('button', { name: 'Previous slide' }).click();
  expect((await active(page)).startsWith('3 of 3'), 'previous wraps to the last');
  await s.getByRole('button', { name: 'Show slide 2 of 3' }).click();
  expect((await active(page)).startsWith('2 of 3') && (await s.getByRole('button', { name: 'Show slide 2 of 3' }).getAttribute('aria-current')) === 'true', 'dot');
  // still hovering: no change
  await page.waitForTimeout(5500);
  expect((await active(page)).startsWith('2 of 3'), 'moved while hovered');
  await s.getByRole('button', { name: 'Pause slideshow' }).click();
  await page.mouse.move(5, 890);
  await page.waitForTimeout(5500);
  expect((await active(page)).startsWith('2 of 3'), 'moved while paused');
  await s.getByRole('button', { name: 'Play slideshow' }).focus();
  await page.keyboard.press('ArrowRight');
  expect((await active(page)).startsWith('3 of 3'), 'arrow key');
  await page.keyboard.press('ArrowLeft');
  expect((await active(page)).startsWith('2 of 3'), 'left key');
  await ctx.close();
  return 'next, previous (wraps), dot, hover pause, Pause button, ← → keys';
});

await test('Every image is shown whole and the frame never changes size', async () => {
  const { page, ctx } = await open();
  await page.goto(BASE + '/');
  const s = slider(page);
  await s.getByRole('button', { name: 'Pause slideshow' }).click();
  const sizes = [];
  for (let i = 1; i <= 3; i++) {
    await s.getByRole('button', { name: `Show slide ${i} of 3` }).click();
    await page.waitForTimeout(800);
    const r = await s.locator('[data-testid="hero-slide"][data-active] img').evaluate(async (img) => {
      if (!img.complete) await new Promise((ok) => (img.onload = ok));
      const box = img.getBoundingClientRect();
      const scale = Math.min(box.width / img.naturalWidth, box.height / img.naturalHeight);
      return { fit: getComputedStyle(img).objectFit, shownW: img.naturalWidth * scale, shownH: img.naturalHeight * scale, boxW: box.width, boxH: box.height, ratio: img.naturalWidth / img.naturalHeight, frame: img.closest('[data-testid="hero-slider"]').firstElementChild.getBoundingClientRect().height };
    });
    expect(r.fit === 'contain' && r.shownW <= r.boxW + 0.5 && r.shownH <= r.boxH + 0.5, 'cropped: ' + JSON.stringify(r));
    sizes.push(r);
  }
  expect(new Set(sizes.map((x) => Math.round(x.frame))).size === 1, 'frame height changed: ' + sizes.map((x) => x.frame).join(','));
  await ctx.close();
  return sizes.map((x) => `${x.ratio.toFixed(2)}:1 fits ${Math.round(x.shownW)}×${Math.round(x.shownH)}`).join(', ') + `; frame ${Math.round(sizes[0].frame)} px`;
});

await test('With "reduce motion" on, it does not move by itself', async () => {
  const { page, ctx } = await open({ reducedMotion: 'reduce' });
  await page.goto(BASE + '/');
  const s = slider(page);
  await s.getByRole('button', { name: 'Play slideshow' }).waitFor();
  await page.mouse.move(5, 890);
  await page.waitForTimeout(5500);
  expect((await active(page)).startsWith('1 of 3'), 'moved');
  await ctx.close();
});

await test('Phone: swipe to change slides; no sideways scrolling', async () => {
  const { page, ctx } = await open({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await page.goto(BASE + '/');
  const s = slider(page);
  await s.getByRole('button', { name: 'Pause slideshow' }).click();
  const frame = s.locator('> div').first();
  const b = await frame.boundingBox();
  const y = b.y + b.height / 2;
  await frame.dispatchEvent('pointerdown', { pointerType: 'touch', clientX: b.x + b.width * 0.8, clientY: y, isPrimary: true });
  await frame.dispatchEvent('pointerup', { pointerType: 'touch', clientX: b.x + b.width * 0.2, clientY: y + 5, isPrimary: true });
  expect((await active(page)).startsWith('2 of 3'), 'swipe left did not go forward');
  const o = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(o <= 0, `${o}px sideways scroll`);
  if (SHOTS) await page.screenshot({ path: SHOTS + '/public-slider-mobile.png' });
  await ctx.close();
});

// ======================================================= admin
hero().items = [];
const { page, ctx: ctxA } = await open({ viewport: { width: 1360, height: 900 } });
await signIn(page);

await test('Admin: the Homepage screen links to the slider; start from the current main image', async () => {
  await page.getByRole('navigation', { name: 'Admin' }).getByRole('link', { name: 'Homepage' }).click();
  await page.getByTestId('slider-link').getByText('No slides yet').waitFor();
  await page.getByTestId('slider-link').click();
  await page.getByRole('heading', { name: 'Hero image slider', level: 1 }).waitFor();
  expect(await page.getByRole('navigation', { name: 'Admin' }).getByRole('link', { name: 'Hero slider' }).evaluate((a) => a.className.includes('bg-white/10')), 'menu not highlighted');
  expect(!(await page.getByRole('navigation', { name: 'Admin' }).getByRole('link', { name: 'Homepage' }).evaluate((a) => a.className.includes('bg-white/10'))), 'Homepage also highlighted');
  await page.getByRole('button', { name: 'Start with the current main image' }).click();
  await toast(page, 'is now the first slide');
  const it = hero().items;
  expect(it.length === 1 && it[0].enabled === true && it[0].image_url === hero().image_url, JSON.stringify(it));
});

await test('Admin: upload several images at once; they arrive hidden; a wrong file is reported', async () => {
  await page.getByTestId('slides-input').setInputFiles([
    { name: 'wide.png', mimeType: 'image/png', buffer: await png(2000, 800, '#1b7f79') },
    { name: 'tall.jpg', mimeType: 'image/jpeg', buffer: await sharp({ create: { width: 800, height: 1200, channels: 3, background: '#5bc0be' } }).jpeg().toBuffer() },
    { name: 'clinic.webp', mimeType: 'image/webp', buffer: await sharp({ create: { width: 1600, height: 1200, channels: 3, background: '#0b2545' } }).webp().toBuffer() },
    { name: 'animation.gif', mimeType: 'image/gif', buffer: Buffer.from('GIF89a') },
  ]);
  await toast(page, '3 slides were added as hidden.');
  await page.getByRole('alert').getByText('“animation.gif” is not a JPEG, PNG, WebP or AVIF image.').waitFor();
  const it = hero().items;
  expect(it.length === 4 && it.slice(1).every((s) => s.enabled === false && /\/sd-media\/sections\/.+\/slides\//.test(s.image_url)), JSON.stringify(it.map((s) => [s.enabled, s.image_url])));
  expect(it[1].image_width === 2000 && it[1].image_height === 800 && it[2].image_height === 1200, 'sizes not stored');
  expect([...files.keys()].filter((k) => k.includes('/slides/')).length === 3, 'files not stored');
  await until(async () => (await page.getByLabel('Include hidden slides in the preview').isChecked()), 'preview should include the new hidden slides');
  await page.getByTestId('slider-preview').getByRole('button', { name: 'Show slide 4 of 4' }).waitFor();
  return '3 uploaded (PNG, JPEG, WebP), GIF refused, previewed while hidden';
});

await test('Admin: edit titles and descriptions, switch slides on, change the order', async () => {
  await page.getByRole('button', { name: 'Edit slide 2' }).click();
  const dlg = page.getByRole('dialog');
  await dlg.getByTestId('slide-dialog-image').waitFor();
  await dlg.getByText('2000 × 800 px').waitFor();
  await dlg.getByLabel(/^Title/).fill('Care close to home');
  await dlg.getByLabel(/^Description/).fill('Our new Anna Nagar clinic.');
  await dlg.getByLabel(/^Image description/).fill('The clinic entrance');
  await dlg.getByRole('switch', { name: 'Shown on the homepage' }).click();
  await dlg.getByRole('button', { name: 'Save slide' }).click();
  await toast(page, 'Slide saved.');
  const s2 = hero().items[1];
  expect(s2.title === 'Care close to home' && s2.description === 'Our new Anna Nagar clinic.' && s2.image_alt === 'The clinic entrance' && s2.enabled, JSON.stringify(s2));
  const row = (n) => page.locator('[data-testid="slide-row"]').nth(n);
  await row(3).getByRole('switch').click();
  await toast(page, 'is shown on the homepage');
  await page.getByRole('button', { name: 'Move slide 2 up' }).click();
  await toast(page, 'Slide moved up.');
  expect(hero().items[0].title === 'Care close to home', 'order: ' + hero().items.map((s) => s.title || '-').join(','));
  if (SHOTS) await page.screenshot({ path: SHOTS + '/admin-slider.png', fullPage: true });
  const { page: p2, ctx } = await open();
  await p2.goto(BASE + '/');
  await slider(p2).getByRole('button', { name: 'Show slide 3 of 3' }).waitFor();
  expect((await active(p2)) === '1 of 3: Care close to home', 'public first slide: ' + (await active(p2)));
  await ctx.close();
  return 'homepage shows 3 shown slides, the edited one first';
});

await test('Admin: replace an image; the old file is deleted, and an unsaved replacement is cleaned up', async () => {
  const before = hero().items[0].image_url;
  const oldPath = decodeURIComponent(before.split('/sd-media/')[1]);
  await page.getByRole('button', { name: 'Edit slide 1' }).click();
  let dlg = page.getByRole('dialog');
  await dlg.getByTestId('slide-replace-input').setInputFiles({ name: 'new.png', mimeType: 'image/png', buffer: await png(1600, 1200, '#f4a259') });
  await dlg.getByText('1600 × 1200 px').waitFor();
  await dlg.getByRole('button', { name: 'Save slide' }).click();
  await toast(page, 'Slide saved.');
  expect(hero().items[0].image_url !== before && !files.has(oldPath), 'old file kept or not replaced');
  const count = files.size;
  await page.getByRole('button', { name: 'Edit slide 1' }).click();
  dlg = page.getByRole('dialog');
  await dlg.getByTestId('slide-replace-input').setInputFiles({ name: 'oops.png', mimeType: 'image/png', buffer: await png(1200, 900, '#ff0000') });
  await dlg.getByText('1200 × 900 px').waitFor();
  await dlg.getByRole('button', { name: 'Cancel' }).click();
  await until(() => files.size === count, 'unsaved upload left behind');
});

await test('Admin: deleting a slide removes its file, but never the main image', async () => {
  const items = hero().items;
  const main = items.find((s) => s.image_url === hero().image_url);
  const n = items.indexOf(main) + 1;
  await page.getByRole('button', { name: `Delete slide ${n}` }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete slide' }).click();
  await toast(page, 'The slide was deleted.');
  expect(hero().items.length === 3 && hero().image_url === main.image_url, 'main image affected');
  const last = hero().items[2];
  const path = decodeURIComponent(last.image_url.split('/sd-media/')[1]);
  await page.getByRole('button', { name: 'Delete slide 3' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete slide' }).click();
  await until(() => hero().items.length === 2 && !files.has(path), 'file not removed');
});

await test('Admin: if someone else changed the slider meanwhile, nothing is overwritten', async () => {
  // another admin edits the homepage's top section after this page was loaded
  hero().heading = 'Changed elsewhere';
  hero().items = [...hero().items, { id: 'other', image_url: std, image_small_url: null, image_alt: '', image_width: 1600, image_height: 1200, title: 'Added by someone else', description: '', enabled: false }];
  hero().updated_at = new Date(Date.now() + 1000).toISOString();
  await page.locator('[data-testid="slide-row"]').first().getByRole('switch').click();
  await page.getByRole('alert').filter({ hasText: 'Someone else changed the slider' }).waitFor();
  await page.locator('[data-testid="slide-row"]').getByText('Added by someone else').waitFor();
  expect(hero().items.length === 3 && hero().items[0].enabled === true, 'the other change was overwritten');
  return 'save refused, latest version loaded';
});

await test('Admin: editing the top section’s text keeps the slides', async () => {
  const before = JSON.stringify(hero().items);
  await page.goto(BASE + '/admin/homepage/home.hero');
  await page.getByText('has no slides switched on').waitFor();
  await page.getByLabel('Main headline').fill('Healthcare that puts you first');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await toast(page, 'Changes saved.');
  expect(JSON.stringify(hero().items) === before, 'slides changed by the section form');
});

await test('Admin: the slider holds up to 8 slides', async () => {
  hero().items = Array.from({ length: 8 }, (_, i) => ({ id: 'f' + i, image_url: std, image_small_url: null, image_alt: '', image_width: 1600, image_height: 1200, title: 'Slide ' + (i + 1), description: '', enabled: true }));
  hero().updated_at = new Date().toISOString();
  await page.goto(BASE + '/admin/homepage/slider');
  await page.getByText('The slider is full.').waitFor();
  expect(await page.getByRole('button', { name: 'Upload images' }).isDisabled(), 'upload still allowed');
  await page.getByRole('heading', { name: 'Slides (8 of 8)' }).waitFor();
});

await test('Editors can manage the slider; visitors and non-admin accounts cannot', async () => {
  const { page: e, ctx } = await open();
  await signIn(e, EDITOR);
  await e.goto(BASE + '/admin/homepage/slider');
  await e.locator('[data-testid="slide-row"]').first().getByRole('switch').click();
  await toast(e, 'hidden from the homepage');
  expect(hero().items[0].enabled === false, 'editor change not saved');
  await ctx.close();
  const { page: v, ctx: c2 } = await open();
  await v.goto(BASE + '/');
  const statuses = await v.evaluate(async ({ sb, id }) => {
    const r = await fetch(`${sb}/rest/v1/sd_page_sections?id=eq.${id}`, { method: 'PATCH', headers: { apikey: 'anon', 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [] }) });
    return r.status;
  }, { sb: SB, id: hero().id });
  expect(statuses === 401 && hero().items.length === 8, 'anonymous change accepted: ' + statuses);
  await c2.close();
  const { page: o, ctx: c3 } = await open();
  await o.goto(BASE + '/admin/login');
  await o.getByLabel('Email').fill(mock.OTHER.email);
  await o.getByLabel('Password', { exact: true }).fill(mock.OTHER.password);
  await o.getByRole('button', { name: 'Sign in' }).click();
  await o.getByText(/not on the admin list|no admin access/i).first().waitFor();
  await c3.close();
  return 'editor saved a change; anonymous PATCH → 401; Money Map account has no admin access';
});

await test('Admin slider page and dialog on a phone: no sideways scrolling', async () => {
  const { page: m, ctx } = await open({ viewport: { width: 390, height: 844 } });
  await signIn(m);
  await m.goto(BASE + '/admin/homepage/slider');
  await m.locator('[data-testid="slide-row"]').first().waitFor();
  let o = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const over = o > 0 ? ['page ' + o] : [];
  await m.getByRole('button', { name: 'Edit slide 1' }).click();
  await m.getByRole('dialog').getByRole('button', { name: 'Save slide' }).waitFor();
  o = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (o > 0) over.push('dialog ' + o);
  if (SHOTS) await m.screenshot({ path: SHOTS + '/admin-slider-mobile.png' });
  expect(!over.length, over.join(', '));
  await ctx.close();
});

await test('No console errors', async () => {
  expect(!consoleErrors.length, consoleErrors.slice(0, 3).join(' | '));
});

await ctxA.close();
await browser.close();
console.log(`\n${results.length - failed} of ${results.length} slider tests passed.`);
fs.writeFileSync('scripts/verify-slider.json', JSON.stringify(results, null, 2));
process.exit(failed ? 1 : 0);
