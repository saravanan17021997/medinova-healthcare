// Browser tests for the glass homepage hero: badge, floating highlight cards,
// figures, layout and motion on the public site (database mode), and the
// Admin -> Homepage -> Hero highlights editor. Supabase is replaced by
// scripts/lib/mock-supabase.mjs inside the browser.
// Usage: BASE_URL=http://localhost:4181 node scripts/verify-hero.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import { loadData } from './lib/load-data.mjs';
import { createMockSupabase } from './lib/mock-supabase.mjs';

const BASE = (process.env.BASE_URL || 'http://localhost:4181').replace(/\/$/, '');
const SB = (process.env.SUPABASE_URL || 'https://test-project.supabase.co').replace(/\/$/, '');
const data = await loadData();
const mock = createMockSupabase({ SB, seed: data.products, care: { specialties: data.specialties.specialties, doctors: data.doctors.doctors } });
const { db, log, OWNER, EDITOR } = mock;

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
async function open({ viewport = { width: 1440, height: 900 }, reducedMotion } = {}) {
  const ctx = await browser.newContext({ viewport, reducedMotion });
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
const heroRow = () => db.sd_site_settings.find((r) => r.key === 'home_hero');
const heroSection = () => db.sd_page_sections.find((s) => s.key === 'home.hero');
const published = (t) => db[t].filter((r) => r.published !== false).length;
const home = async (page) => {
  await page.goto(BASE + '/');
  await page.getByTestId('hero-stats').waitFor();
  await page.waitForLoadState('networkidle');
};
const statTexts = (page) => page.getByTestId('hero-stats').locator('li').evaluateAll((ls) => ls.map((l) => l.innerText.replace(/\s+/g, ' ').trim()));

// one wide picture, like the clinic's own team photo
const wide = { id: 'w1', enabled: true, image_url: '/images/hero/hospital-exterior.webp', image_alt: 'The clinic', image_width: 1600, image_height: 1000, title: '', description: '' };
heroSection().heading = 'Healthcare that puts you first SaraDev';
heroSection().items = [wide];

await test('Without saved highlights the hero shows the suggested badge, four cards and live counts', async () => {
  expect(!heroRow(), 'test setup: a home_hero row already exists');
  const { page, ctx } = await open();
  await home(page);
  expect((await page.getByTestId('hero-badge').innerText()).includes('Trusted Healthcare Partner'), 'badge missing');
  const cards = await page.getByTestId('hero-highlights').locator('li').allInnerTexts();
  expect(cards.length === 4 && cards[0].includes('Experienced Doctors') && cards[3].includes('Modern Facilities'), `cards: ${cards.join(' | ')}`);
  await until(async () => !(await page.getByTestId('hero-stats').locator('[aria-busy="true"]').count()), 'figures still loading');
  const stats = await statTexts(page);
  const want = [`${published('sd_specialties')} Specialties`, `${published('sd_doctors')} Doctor profiles`, `${published('sd_facilities')} Facilities`, `${published('sd_products')} Health essentials`];
  expect(JSON.stringify(stats) === JSON.stringify(want), `figures ${JSON.stringify(stats)} expected ${JSON.stringify(want)}`);
  const hrefs = await page.getByTestId('hero-stats').locator('a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs.join() === '/specialties,/doctors,/facilities,/store', `figure links ${hrefs}`);
  await ctx.close();
  return stats.join(', ');
});

await test('The headline keeps its admin text, with the short name in the brand gradient', async () => {
  const { page, ctx } = await open();
  await home(page);
  const h1 = page.locator('h1');
  expect((await h1.innerText()).replace(/\s+/g, ' ') === 'Healthcare that puts you first SaraDev', 'headline text changed');
  const accent = h1.locator('.text-brand-gradient');
  expect((await accent.count()) === 1 && (await accent.innerText()) === 'SaraDev', 'brand name not picked out');
  const clip = await accent.evaluate((e) => getComputedStyle(e).backgroundClip || getComputedStyle(e).webkitBackgroundClip);
  expect(clip === 'text', `background-clip ${clip}`);
  await ctx.close();
});

await test('Both hero buttons still lead to their pages; the header button too', async () => {
  const { page, ctx } = await open();
  await home(page);
  const hero = page.locator('section').first();
  await hero.getByRole('link', { name: 'Book an appointment' }).click();
  await page.waitForURL('**/appointment');
  await page.goBack();
  await page.locator('section').first().getByRole('link', { name: 'Explore services' }).click();
  await page.waitForURL('**/specialties');
  await page.locator('header').getByRole('link', { name: 'Book an appointment' }).click();
  await page.waitForURL('**/appointment');
  await ctx.close();
});

await test('Wide screens: cards float around the frame without covering the headline or buttons', async () => {
  const out = [];
  for (const width of [1280, 1440, 1920]) {
    const { page, ctx } = await open({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await home(page);
    const boxes = await page.evaluate(() => {
      const r = (el) => { const b = el.getBoundingClientRect(); return { x: b.x, y: b.y, r: b.right, b: b.bottom }; };
      const left = document.querySelector('h1').parentElement;
      return {
        text: [...left.querySelectorAll('h1, p, a')].map(r),
        cards: [...document.querySelectorAll('[data-testid="hero-highlights"] li')].map((li) => ({ ...r(li), pos: getComputedStyle(li).position })),
        vw: document.documentElement.clientWidth,
      };
    });
    const hit = (a, b) => a.x < b.r && b.x < a.r && a.y < b.b && b.y < a.b;
    expect(boxes.cards.every((c) => c.pos === 'absolute'), `${width}: cards are not floating`);
    expect(boxes.cards.every((c) => c.x >= 0 && c.r <= boxes.vw), `${width}: a card leaves the screen`);
    const clash = boxes.cards.some((c) => boxes.text.some((t) => hit(c, t)));
    expect(!clash, `${width}: a card covers the headline, text or buttons`);
    out.push(width);
    await ctx.close();
  }
  return out.join(', ') + ' px';
});

await test('Smaller screens: cards become a grid under the image; nothing scrolls sideways', async () => {
  const over = [];
  for (const vp of [{ width: 360, height: 760 }, { width: 390, height: 844 }, { width: 820, height: 1180 }, { width: 1024, height: 768 }]) {
    const { page, ctx } = await open({ viewport: vp });
    await home(page);
    const pos = await page.getByTestId('hero-highlights').locator('li').first().evaluate((li) => getComputedStyle(li).position);
    if (pos === 'absolute') over.push(`${vp.width}: cards still floating`);
    const o = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (o > 0) over.push(`${vp.width}: ${o}px sideways`);
    await ctx.close();
  }
  expect(!over.length, over.join(', '));
});

await test('One image: the frame floats. Several slides: the frame and its buttons stay still', async () => {
  const one = await open();
  await home(one.page);
  const anim = (p) => p.getByTestId('hero-slider').evaluate((el) => { let e = el; while (e && !e.classList.contains('float-frame')) e = e.parentElement; return e ? getComputedStyle(e).animationName : 'none'; });
  expect((await anim(one.page)) === 'float-frame', 'single image frame does not float');
  await one.ctx.close();
  heroSection().items = [wide, { ...wide, id: 'w2' }, { ...wide, id: 'w3' }];
  const many = await open();
  await home(many.page);
  expect((await anim(many.page)) === 'none', 'frame with slider buttons is moving');
  await many.page.getByRole('button', { name: 'Next slide' }).click({ timeout: 4000 });
  await many.page.getByRole('button', { name: 'Show slide 3 of 3' }).click({ timeout: 4000 });
  await many.ctx.close();
  heroSection().items = [wide];
});

await test('Reduce motion: nothing in the hero drifts and the glass sheen is off', async () => {
  const { page, ctx } = await open({ reducedMotion: 'reduce' });
  await home(page);
  const moving = await page.evaluate(() => {
    const hero = document.querySelector('section');
    return [...hero.querySelectorAll('*')].filter((e) => { const s = getComputedStyle(e); return s.animationName !== 'none' && !e.className?.baseVal?.includes?.('animate-pulse') && !String(e.className).includes('animate-pulse') && parseFloat(s.animationDuration) > 0.01; }).map((e) => String(e.className).slice(0, 40));
  });
  expect(!moving.length, `still moving: ${moving.slice(0, 3).join(' | ')}`);
  const sheen = await page.locator('.sheen').first().evaluate((e) => getComputedStyle(e, '::after').display);
  expect(sheen === 'none', `sheen display ${sheen}`);
  await ctx.close();
});

await test('Decorations are hidden from screen readers and never take clicks', async () => {
  const { page, ctx } = await open();
  await home(page);
  const bad = await page.evaluate(() => {
    const hero = document.querySelector('section');
    return [...hero.querySelectorAll('svg, .orb, [class*="radial-gradient"]')].filter((e) => !e.closest('[aria-hidden="true"]') && !e.closest('a, button')).length;
  });
  expect(bad === 0, `${bad} decorative elements exposed`);
  const plus = page.locator('span[aria-hidden="true"].rounded-full').filter({ has: page.locator('svg.lucide-plus') });
  expect((await plus.count()) === 1, 'plus mark missing');
  expect((await plus.evaluate((e) => getComputedStyle(e).pointerEvents)) === 'none', 'plus mark takes clicks');
  await ctx.close();
});

await test('Admin: an editor changes the badge, a card and a figure; the homepage follows', async () => {
  const { page, ctx } = await open();
  await signIn(page, EDITOR);
  await page.getByRole('link', { name: 'Hero highlights' }).first().click();
  await page.getByRole('heading', { name: 'Hero highlights' }).waitFor();
  await page.getByText('Showing the suggested wording. Save to keep your own.').waitFor();
  await page.getByLabel('Badge text').fill('Caring since 2010');
  await page.getByLabel('Text, card 1').fill('Friendly team');
  await page.getByLabel('Text, card 4').fill('');
  await page.getByLabel('Figure 4 shows').selectOption('custom');
  await page.getByLabel('Figure', { exact: true }).fill('10,000+');
  await page.locator('#hh-slabel-3').fill('Happy patients');
  await page.getByLabel('Icon, figure 4').selectOption('Smile');
  await page.getByRole('button', { name: 'Save highlights' }).click();
  await toast(page, 'Hero highlights saved');
  const v = heroRow()?.value;
  expect(v && v.badge === 'Caring since 2010' && v.highlights.length === 3 && v.highlights[0].text === 'Friendly team', `saved ${JSON.stringify(v)}`);
  expect(v.stats[3].source === 'custom' && v.stats[3].value === '10,000+' && v.stats[3].label === 'Happy patients', 'custom figure not saved');
  await page.goto(BASE + '/');
  await page.getByTestId('hero-stats').waitFor();
  // the last content this browser saw shows first; the saved change follows as soon as it loads
  await until(async () => (await page.getByTestId('hero-badge').innerText()).includes('Caring since 2010'), 'badge not updated');
  await until(async () => { const c = await page.getByTestId('hero-highlights').locator('li').allInnerTexts(); return c.length === 3 && c[0].includes('Friendly team'); }, 'cards not updated');
  await until(async () => (await statTexts(page)).includes('10,000+ Happy patients'), 'custom figure not shown');
  const custom = page.getByTestId('hero-stats').locator('li').last();
  expect((await custom.locator('a').count()) === 0, 'an entered figure should not be a link');
  await ctx.close();
  return '3 cards, custom figure shown';
});

await test('Admin: a label without a figure is refused, focus moves to it, nothing is saved', async () => {
  const before = JSON.stringify(heroRow());
  const { page, ctx } = await open();
  await signIn(page);
  await page.goto(BASE + '/admin/homepage/highlights');
  await page.getByLabel('Figure', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Save highlights' }).click();
  await page.getByText('Enter the figure, or clear the label to hide this card.').waitFor();
  await until(async () => page.evaluate(() => document.activeElement?.id === 'hh-svalue-3'), 'focus not on the figure');
  expect(JSON.stringify(heroRow()) === before, 'something was saved');
  await ctx.close();
});

await test('Admin: emptying everything hides the badge, cards and figures', async () => {
  const keep = heroRow().value;
  const { page, ctx } = await open();
  await signIn(page);
  await page.goto(BASE + '/admin/homepage/highlights');
  await page.getByLabel('Badge text').fill('');
  for (let i = 1; i <= 4; i++) await page.getByLabel(`Text, card ${i}`).fill('');
  for (let i = 0; i < 4; i++) await page.locator(`#hh-slabel-${i}`).fill('');
  await page.getByLabel('Figure', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Save highlights' }).click();
  await toast(page, 'Hero highlights saved');
  await page.goto(BASE + '/');
  await page.locator('h1').waitFor();
  await page.waitForLoadState('networkidle');
  const left = await page.evaluate(() => ['hero-badge', 'hero-highlights', 'hero-stats'].filter((t) => document.querySelector(`[data-testid="${t}"]`)));
  expect(!left.length, `still shown: ${left}`);
  expect((await page.locator('h1').innerText()).includes('SaraDev'), 'headline lost');
  heroRow().value = keep;
  await ctx.close();
});

await test('A malformed saved value cannot break the hero or inject markup', async () => {
  const keep = heroRow().value;
  heroRow().value = { badge: 42, highlights: 'nope', stats: [{ source: 'evil', icon: '<img src=x onerror=alert(1)>', value: '<b>9</b>', label: 'Odd' }, { source: 'doctors', label: 'x'.repeat(500) }] };
  const { page, ctx } = await open();
  await home(page);
  expect(!(await page.getByTestId('hero-badge').count()) && !(await page.getByTestId('hero-highlights').count()), 'bad badge or cards shown');
  const stats = await statTexts(page);
  expect(stats[0] === '<b>9</b> Odd', `custom figure ${stats[0]}`);
  expect(!(await page.locator('[data-testid="hero-stats"] b, [data-testid="hero-stats"] img').count()), 'markup was rendered');
  expect(stats[1].length < 60, 'long label not cut');
  heroRow().value = keep;
  await ctx.close();
});

await test('Visitors cannot change the highlights', async () => {
  const { page, ctx } = await open();
  await page.goto(BASE + '/');
  const status = await page.evaluate(async (sb) => {
    const r = await fetch(`${sb}/rest/v1/sd_site_settings?on_conflict=key`, { method: 'POST', headers: { apikey: 'anon', 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify([{ key: 'home_hero', value: { badge: 'hacked' } }]) });
    return r.status;
  }, SB);
  expect(status === 401 || status === 403, `anonymous write returned ${status}`);
  expect(heroRow().value.badge !== 'hacked', 'value changed');
  log.writesByAnon = 0;
  await ctx.close();
});

await test('No console errors', async () => {
  expect(!consoleErrors.length, consoleErrors.slice(0, 3).join(' | '));
});

await browser.close();
console.log(`\n${results.length - failed} of ${results.length} hero tests passed.`);
fs.writeFileSync('scripts/verify-hero.json', JSON.stringify(results, null, 2));
process.exit(failed ? 1 : 0);
