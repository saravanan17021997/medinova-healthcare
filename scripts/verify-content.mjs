// Stage 6 browser tests: site settings, menus, homepage sections and facilities,
// on the public site (database mode) and in the admin panel. Supabase is
// replaced by scripts/lib/mock-supabase.mjs inside the browser.
// Usage: BASE_URL=http://localhost:4181 node scripts/verify-content.mjs
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
const { db, files, log, OWNER } = mock;

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
const browser = await chromium.launch();
const consoleErrors = [];
async function open({ viewport = { width: 1280, height: 900 }, failCatalog = false, ctx: existing } = {}) {
  const ctx = existing ?? (await browser.newContext({ viewport }));
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource|status of 4\d\d|status of 503/.test(m.text()) && consoleErrors.push(m.text()));
  page.on('pageerror', (e) => consoleErrors.push(e.message));
  await mock.install(page, { failCatalog });
  return { ctx, page };
}
async function signIn(page) {
  await page.goto(BASE + '/admin/login');
  await page.getByLabel('Email').fill(OWNER.email);
  await page.getByLabel('Password', { exact: true }).fill(OWNER.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('heading', { name: 'Overview' }).waitFor();
}
const toast = (page, text) => page.getByRole('status').filter({ hasText: text }).first().waitFor({ timeout: 10000 });
const png = (w, h, c) => sharp({ create: { width: w, height: h, channels: 3, background: c } }).png().toBuffer();
const until = async (fn, msg, ms = 8000) => {
  const t = Date.now();
  while (!fn()) {
    if (Date.now() - t > ms) throw new Error(msg);
    await new Promise((r) => setTimeout(r, 100));
  }
};
const setting = (key) => db.sd_site_settings.find((r) => r.key === key);
const section = (key) => db.sd_page_sections.find((r) => r.key === key);
const snapshot = () => JSON.stringify({ s: db.sd_site_settings, n: db.sd_nav_links, p: db.sd_page_sections, f: db.sd_facilities });
const restore = (snap) => {
  const o = JSON.parse(snap);
  db.sd_site_settings = o.s; db.sd_nav_links = o.n; db.sd_page_sections = o.p; db.sd_facilities = o.f;
};
const headerLinks = (page) => page.locator('nav[aria-label="Main"] a').allTextContents();

// ======================================================= public (database mode)
await test('Header and footer menus come from the database', async () => {
  const snap = snapshot();
  db.sd_nav_links.find((r) => r.location === 'header' && r.label === 'Store').label = 'Shop';
  db.sd_nav_links.find((r) => r.location === 'header' && r.label === 'Contact').published = false;
  db.sd_nav_links.push({ id: 'x1', location: 'footer_social', label: 'Instagram', href: 'https://instagram.com/saradev', new_tab: true, sort_order: 1, published: true });
  const { page, ctx } = await open();
  await page.goto(BASE + '/');
  await page.locator('nav[aria-label="Main"]').getByRole('link', { name: 'Shop' }).waitFor();
  const links = await headerLinks(page);
  expect(!links.includes('Contact'), 'hidden link still shown: ' + links.join(','));
  const ig = page.getByRole('contentinfo').getByRole('link', { name: 'Instagram' });
  expect((await ig.getAttribute('target')) === '_blank', 'social link should open a new tab');
  expect((await page.getByRole('contentinfo').locator('h2:text("Explore") + ul a').count()) === 5, 'footer explore links');
  expect(log.calls.some((c) => c === 'GET /rest/v1/sd_site_settings') && log.calls.some((c) => c === 'GET /rest/v1/sd_nav_links'), 'did not read settings + menus');
  await ctx.close();
  restore(snap);
  return links.join(' · ') + ' + Instagram in the footer';
});

await test('Site settings drive the contact details, WhatsApp link and demo notices', async () => {
  const snap = snapshot();
  Object.assign(setting('contact').value, { phoneDisplay: '+91 90000 11111', phoneHref: '+919000011111', whatsappNumber: '919000011111', email: 'care@saradev.in' });
  Object.assign(setting('brand').value, { demo: false, shortName: 'SaraDev Care' });
  setting('footer').value.credit = '';
  const { page, ctx } = await open();
  await page.goto(BASE + '/contact');
  await page.locator('main').getByText('+91 90000 11111').waitFor();
  expect((await page.locator('main').getByRole('link', { name: 'Call now' }).getAttribute('href')) === 'tel:+919000011111', 'call link');
  const wa = await page.locator('main').getByRole('link', { name: 'Open WhatsApp' }).getAttribute('href');
  expect(wa.startsWith('https://wa.me/919000011111?text=Hello%20SaraDev%20Care'), 'WhatsApp link: ' + wa);
  expect((await page.locator('main').getByRole('link', { name: 'Write an email' }).getAttribute('href')) === 'mailto:care@saradev.in', 'email');
  expect(!(await page.getByText('This is a demonstration website.').count()), 'demo banner still shown');
  expect(!(await page.getByText('(demo number)').count()), '"(demo number)" still shown');
  expect(!(await page.getByText('Illustrations are original artwork').count()), 'cleared footer line still shown');
  await ctx.close();
  restore(snap);
  return 'tel:+919000011111, wa.me/919000011111 "Hello SaraDev Care", no demo notices';
});

await test('A confirmed address shows Get directions', async () => {
  const snap = snapshot();
  Object.assign(setting('location').value, { verified: true, name: 'SaraDev Clinic, Anna Nagar', addressLines: ['12 2nd Avenue', 'Anna Nagar, Chennai 600040'], mapsQuery: '12 2nd Avenue, Anna Nagar, Chennai' });
  const { page, ctx } = await open();
  await page.goto(BASE + '/contact');
  const dir = page.getByRole('link', { name: 'Get directions' });
  await dir.waitFor();
  expect((await dir.getAttribute('href')).includes('destination=12%202nd%20Avenue'), 'maps link');
  await page.getByText('Anna Nagar, Chennai 600040').first().waitFor();
  await page.goto(BASE + '/');
  await page.getByRole('heading', { name: 'Visit or contact us' }).waitFor();
  expect(!(await page.getByText('Location details are placeholders').count()), 'placeholder note still shown');
  await ctx.close();
  restore(snap);
});

await test('Homepage sections: saved text, order and hidden sections', async () => {
  const snap = snapshot();
  Object.assign(section('home.hero'), { heading: 'Care close to home', body: 'Book with our Anna Nagar team.', cta_label: 'Book a visit', cta2_label: null, cta2_href: null });
  section('home.essentials').published = false;
  section('home.why').sort_order = 2;
  section('home.specialties').sort_order = 3;
  section('home.appointment').items = ['Pick a specialty.', 'We call you back.'];
  const { page, ctx } = await open();
  await page.goto(BASE + '/');
  await page.getByRole('heading', { level: 1, name: 'Care close to home' }).waitFor();
  await page.getByText('Book with our Anna Nagar team.').waitFor();
  expect((await page.locator('main').getByRole('link', { name: 'Book a visit' }).count()) === 1, 'hero button');
  expect(!(await page.getByRole('link', { name: 'Explore services' }).count()), 'cleared second button still shown');
  expect(!(await page.getByRole('heading', { name: 'Everyday health essentials' }).count()), 'hidden section still shown');
  const order = await page.locator('[data-section]').evaluateAll((els) => els.map((e) => e.getAttribute('data-section')));
  expect(order[0] === 'home.why' && order[1] === 'home.specialties', 'order: ' + order.join(','));
  expect((await page.locator('[aria-labelledby="appointment-heading"] ol li').count()) === 2, 'steps');
  await ctx.close();
  restore(snap);
  return order.join(' → ');
});

await test('Unsafe links saved outside the admin panel are never rendered', async () => {
  const snap = snapshot();
  db.sd_nav_links.push({ id: 'bad1', location: 'header', label: 'Bad', href: 'javascript:alert(1)', new_tab: false, sort_order: 0, published: true });
  db.sd_nav_links.push({ id: 'bad2', location: 'footer_social', label: 'Plain', href: 'http://insecure.example', new_tab: true, sort_order: 2, published: true });
  Object.assign(section('home.hero'), { cta_href: '//evil.example', image_url: '//evil.example/x.png' });
  const { page, ctx } = await open();
  await page.goto(BASE + '/');
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.waitForLoadState('networkidle');
  const bad = await page.locator('a[href^="javascript"], a[href^="//"], a[href^="http:"], img[src^="//"]').count();
  expect(bad === 0, bad + ' unsafe links or images rendered');
  expect(!(await headerLinks(page)).includes('Bad'), 'bad menu link shown');
  await ctx.close();
  restore(snap);
});

await test('Facilities page reads the database; hidden ones are left out', async () => {
  const snap = snapshot();
  db.sd_facilities.find((f) => f.slug === 'laboratory').published = false;
  Object.assign(db.sd_facilities.find((f) => f.slug === 'patient-room'), { image_url: null, image_small_url: null });
  const { page, ctx } = await open();
  await page.goto(BASE + '/facilities');
  await page.locator('[data-testid="facility-card"]').first().waitFor();
  const n = await page.locator('[data-testid="facility-card"]').count();
  expect(n === 7, n + ' cards');
  expect(!(await page.getByRole('heading', { name: 'Laboratory' }).count()), 'hidden facility shown');
  await page.getByAltText('Patient rooms (photo coming soon)').waitFor();
  await ctx.close();
  restore(snap);
  return '7 of 8 shown; no image → placeholder';
});

await test('If the database cannot be reached the site still works with built-in content', async () => {
  const { page, ctx } = await open({ failCatalog: true });
  await page.goto(BASE + '/');
  await page.getByRole('heading', { level: 1, name: 'Healthcare that puts you first' }).waitFor();
  const links = await headerLinks(page);
  expect(links.join(',') === 'Specialties,Doctors,Facilities,Store,Contact', 'built-in menu: ' + links.join(','));
  await page.goto(BASE + '/facilities');
  await page.getByRole('heading', { name: 'Facilities could not be loaded' }).waitFor();
  await page.getByRole('button', { name: 'Try again' }).waitFor();
  await ctx.close();
  return 'built-in header, hero and footer; Facilities offers Try again';
});

await test('A returning visitor sees the last loaded details straight away', async () => {
  const snap = snapshot();
  Object.assign(setting('contact').value, { phoneDisplay: '044 4000 5000', phoneHref: '04440005000' });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  let { page } = await open({ ctx });
  await page.goto(BASE + '/');
  await page.locator('header').getByText('044 4000 5000').first().waitFor();
  await page.close();
  // next visit: the database is slow to answer, the saved copy is shown meanwhile
  ({ page } = await open({ ctx, failCatalog: true }));
  await page.goto(BASE + '/');
  await page.locator('header').getByText('044 4000 5000').first().waitFor({ timeout: 3000 });
  await ctx.close();
  restore(snap);
});

// ======================================================= admin
const { page, ctx: ctxA } = await open({ viewport: { width: 1360, height: 900 } });
await signIn(page);

await test('Admin menu: Homepage, Navigation, Facilities and Site settings are available', async () => {
  const nav = page.getByRole('navigation', { name: 'Admin' });
  for (const n of ['Homepage', 'Navigation', 'Facilities', 'Site settings']) await nav.getByRole('link', { name: n }).waitFor();
  expect((await nav.getByText('Soon').count()) === 0, 'no "Soon" items expected');
});

await test('Site settings: checks phone, WhatsApp and email before saving', async () => {
  await page.getByRole('navigation', { name: 'Admin' }).getByRole('link', { name: 'Site settings' }).click();
  await page.getByLabel('Full name').waitFor();
  expect((await page.getByLabel('Full name').inputValue()) === 'SaraDev Healthcare', 'name not loaded');
  await page.getByLabel(/^WhatsApp number/).fill('9876543210');
  await page.getByLabel('Email', { exact: true }).fill('hello@clinic');
  await page.getByLabel('Phone number').fill('call us');
  await page.getByRole('button', { name: 'Save settings' }).click();
  await page.getByText('Add the country code at the start').waitFor();
  await page.getByText('Enter an email address like').waitFor();
  await page.getByText('Enter a phone number using digits').waitFor();
  expect((await page.evaluate(() => document.activeElement?.id)) === 'st-phone', 'focus should move to the first problem');
  expect(setting('contact').value.email === 'hello@example.com', 'saved despite errors');
  return '10-digit WhatsApp, bad email and bad phone refused; focus moved';
});

await test('Site settings: save contact details, hours and address; other stored values are kept', async () => {
  setting('brand').value.logoNote = 'keep me';
  await page.reload();
  await page.getByLabel('Full name').waitFor();
  await page.getByLabel('Phone number').fill('+91 86680 26319');
  await page.getByText('The Call button dials +918668026319').waitFor();
  await page.getByLabel(/^WhatsApp number/).fill('+91 86680 26319');
  await page.getByRole('link', { name: 'Test this WhatsApp link' }).waitFor();
  await page.getByLabel('Email', { exact: true }).fill('care@saradev.in');
  await page.getByRole('button', { name: 'Remove row 3' }).click();
  await page.getByRole('button', { name: 'Add a row' }).click();
  await page.getByLabel('Days, row 3').fill('Sunday');
  await page.getByLabel('Times, row 3').fill('10:00 am to 1:00 pm');
  await page.getByRole('switch', { name: 'This address has been confirmed' }).click();
  await page.getByRole('button', { name: 'Save settings' }).click();
  await page.getByText('Replace the placeholder address before marking it as confirmed.').waitFor();
  await page.getByLabel('Address', { exact: true }).fill('12 2nd Avenue\nAnna Nagar, Chennai 600040');
  await page.getByLabel(/^Map destination/).fill('12 2nd Avenue, Anna Nagar, Chennai');
  if (SHOTS) await page.screenshot({ path: SHOTS + '/admin-settings.png', fullPage: true });
  await page.getByRole('button', { name: 'Save settings' }).click();
  await toast(page, 'Settings saved.');
  const c = setting('contact').value;
  expect(c.phoneDisplay === '+91 86680 26319' && c.phoneHref === '+918668026319' && c.whatsappNumber === '918668026319' && c.email === 'care@saradev.in', 'contact: ' + JSON.stringify(c));
  expect(JSON.stringify(setting('hours').value[2]) === '{"days":"Sunday","time":"10:00 am to 1:00 pm"}', 'hours: ' + JSON.stringify(setting('hours').value));
  expect(setting('location').value.verified === true && setting('location').value.addressLines.length === 2, 'location');
  expect(setting('brand').value.logoNote === 'keep me', 'unknown stored value was dropped');
  await page.getByText(/All changes saved\. Last saved/).waitFor();
  const { page: p2, ctx } = await open();
  await p2.goto(BASE + '/contact');
  await p2.getByRole('link', { name: 'Get directions' }).waitFor();
  expect((await p2.locator('main').getByRole('link', { name: 'Call now' }).getAttribute('href')) === 'tel:+918668026319', 'public call link');
  await ctx.close();
  return 'phone, WhatsApp (normalised to 918668026319), email, hours, confirmed address; website updated';
});

await test('Site settings: turning demo notices off removes them from the website', async () => {
  await page.getByRole('switch', { name: 'Show demo notices' }).click();
  await page.getByRole('button', { name: 'Save settings' }).click();
  await until(() => setting('brand').value.demo === false, 'not saved');
  await page.getByText(/All changes saved/).waitFor();
  const { page: p2, ctx } = await open();
  await p2.goto(BASE + '/');
  await p2.getByRole('heading', { level: 1 }).waitFor();
  await p2.waitForLoadState('networkidle');
  expect(!(await p2.getByText('This is a demonstration website.').count()), 'banner still shown');
  expect(!(await p2.getByText('(demo)').count()), '"(demo)" labels still shown');
  await ctx.close();
  await page.getByRole('switch', { name: 'Show demo notices' }).click();
  await page.getByRole('button', { name: 'Save settings' }).click();
  await until(() => setting('brand').value.demo === true, 'not turned back on');
});

await test('Homepage: the top section is pinned; hide a section and change the order', async () => {
  await page.getByRole('navigation', { name: 'Admin' }).getByRole('link', { name: 'Homepage' }).click();
  await page.locator('[data-testid="section-row"]').first().waitFor();
  const first = page.locator('[data-testid="section-row"]').first();
  await first.getByText('Top of the page').waitFor();
  expect(!(await first.getByRole('switch').count()), 'top section can be hidden');
  expect(!(await page.getByRole('button', { name: 'Move Specialties up' }).isEnabled()), 'can move above the top section');
  await page.locator('[data-testid="section-row"]').filter({ hasText: 'Health essentials' }).getByRole('switch').click();
  await toast(page, 'hidden from the homepage');
  expect(section('home.essentials').published === false, 'not hidden');
  await page.getByRole('button', { name: 'Move Why choose us up' }).click();
  await toast(page, 'moved up');
  const order = [...db.sd_page_sections].sort((a, b) => a.sort_order - b.sort_order).map((s) => s.key);
  expect(order.indexOf('home.why') < order.indexOf('home.essentials'), 'order not saved: ' + order.join(','));
  if (SHOTS) await page.screenshot({ path: SHOTS + '/admin-homepage.png' });
  await page.locator('[data-testid="section-row"]').filter({ hasText: 'Health essentials' }).getByRole('switch').click();
  await toast(page, 'is shown on the homepage');
  return order.join(' → ');
});

await test('Homepage: edit the top section; links are checked; the website shows the change', async () => {
  await page.getByRole('link', { name: 'Edit Top of the page' }).click();
  await page.getByLabel('Main headline').fill('Care close to home');
  await page.getByLabel(/^Introduction/).fill('Book with our Anna Nagar team in a few steps.');
  await page.locator('#sc-cta-href').fill('/nowhere');
  await page.locator('#sc-cta2-label').fill('');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByText('There is no page at /nowhere on this website.').waitFor();
  await page.getByText('Enter the button text, or clear the link to remove the button.').waitFor();
  await page.locator('#sc-cta-href').fill('/doctors');
  await page.locator('#sc-cta2-href').fill('');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await toast(page, 'Changes saved.');
  const h = section('home.hero');
  expect(h.heading === 'Care close to home' && h.cta_href === '/doctors' && h.cta2_label === null && h.cta2_href === null, JSON.stringify(h));
  const { page: p2, ctx } = await open();
  await p2.goto(BASE + '/');
  await p2.getByRole('heading', { level: 1, name: 'Care close to home' }).waitFor();
  expect((await p2.locator('main').getByRole('link', { name: 'Book an appointment' }).first().getAttribute('href')) === '/doctors', 'hero button link');
  expect(!(await p2.getByRole('link', { name: 'Explore services' }).count()), 'removed button still shown');
  await ctx.close();
  return '"/nowhere" refused; saved; second button removed';
});

await test('Homepage: replace the hero image (upload) and keep the built-in one as fallback', async () => {
  const before = section('home.hero').image_url;
  await page.locator('[data-testid="image-input"]').setInputFiles({ name: 'hero.png', mimeType: 'image/png', buffer: await png(1600, 1000, '#1b7f79') });
  await toast(page, 'Image replaced.');
  const h = section('home.hero');
  expect(h.image_url !== before && /\/sd-media\/sections\//.test(h.image_url), 'not uploaded: ' + h.image_url);
  expect(!('image_width' in h), 'wrote a width column that sd_page_sections does not have');
  const { page: p2, ctx } = await open();
  await p2.goto(BASE + '/');
  await p2.waitForFunction((u) => [...document.images].some((i) => i.src === u && i.complete && i.naturalWidth > 0), h.image_url);
  await ctx.close();
  await page.getByRole('button', { name: 'Remove', exact: true }).click();
  await page.getByRole('alertdialog').getByText('The homepage shows the built-in image until you add a new one.').waitFor();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Remove image' }).click();
  await toast(page, 'Image removed.');
  expect(section('home.hero').image_url === null && files.size === 0, 'image or file remains');
  return 'uploaded to sections/, shown on the homepage, removed with its file';
});

await test('Homepage: edit the appointment steps and the "why choose us" points', async () => {
  await page.goto(BASE + '/admin/homepage/home.appointment');
  await page.locator('[data-testid="step-row"]').first().waitFor();
  expect((await page.locator('[data-testid="step-row"]').count()) === 3, 'steps not loaded');
  await page.getByRole('button', { name: 'Remove step 3' }).click();
  await page.getByRole('button', { name: 'Add a step' }).click();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByText('Write this step, or remove it.').waitFor();
  await page.getByLabel('Step 3', { exact: true }).fill('We call you back the same day.');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await toast(page, 'Changes saved.');
  expect(section('home.appointment').items[2] === 'We call you back the same day.', JSON.stringify(section('home.appointment').items));
  await page.goto(BASE + '/admin/homepage/home.why');
  await page.locator('[data-testid="feature-row"]').first().waitFor();
  await page.getByLabel('Icon').first().selectOption('ShieldCheck');
  await page.getByRole('button', { name: 'Add a point' }).click();
  await page.locator('#sc-ftitle-4').fill('Clear prices');
  await page.locator('#sc-fbody-4').fill('Know what a visit costs before you come in.');
  if (SHOTS) await page.screenshot({ path: SHOTS + '/admin-section.png', fullPage: true });
  await page.getByRole('button', { name: 'Save changes' }).click();
  await toast(page, 'Changes saved.');
  const items = section('home.why').items;
  expect(items.length === 5 && items[0].icon === 'ShieldCheck' && items[4].title === 'Clear prices', JSON.stringify(items));
  const { page: p2, ctx } = await open();
  await p2.goto(BASE + '/');
  await p2.getByRole('heading', { name: 'Clear prices' }).waitFor();
  await p2.getByText('We call you back the same day.').waitFor();
  await ctx.close();
});

await test('Navigation: add a header link; invalid links are refused; the website shows it', async () => {
  await page.getByRole('navigation', { name: 'Admin' }).getByRole('link', { name: 'Navigation' }).click();
  const header = page.getByRole('region', { name: 'Header menu' });
  await header.locator('[data-testid="nav-row"]').first().waitFor();
  await header.getByRole('button', { name: 'Add link' }).click();
  const dlg = page.getByRole('dialog');
  await dlg.getByLabel('Text').fill('Book');
  await dlg.getByLabel('Goes to').fill('/booking');
  await dlg.getByRole('button', { name: 'Add link' }).click();
  await dlg.getByText('There is no page at /booking').waitFor();
  await dlg.getByLabel('Goes to').fill('javascript:alert(1)');
  await dlg.getByRole('button', { name: 'Add link' }).click();
  await dlg.getByText('Start with / for a page on this website').waitFor();
  await dlg.getByLabel('Goes to').fill('/appointment');
  await dlg.getByRole('button', { name: 'Add link' }).click();
  await toast(page, '“Book” was added.');
  const row = db.sd_nav_links.find((r) => r.label === 'Book');
  expect(row && row.location === 'header' && row.href === '/appointment' && row.sort_order === 6, JSON.stringify(row));
  await header.getByRole('button', { name: 'Move Book up' }).click();
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="menu-header"] [data-testid="nav-row"]')[4]?.textContent?.includes('Book'));
  const { page: p2, ctx } = await open();
  await p2.goto(BASE + '/');
  await p2.locator('nav[aria-label="Main"]').getByRole('link', { name: 'Book' }).waitFor();
  const links = await headerLinks(p2);
  expect(links.indexOf('Book') === 4, links.join(','));
  await ctx.close();
  return links.join(' · ');
});

await test('Navigation: the header menu is limited to 7 shown links', async () => {
  const header = page.getByRole('region', { name: 'Header menu' });
  await header.getByRole('button', { name: 'Add link' }).click();
  let dlg = page.getByRole('dialog');
  await dlg.getByLabel('Text').fill('Cart');
  await dlg.getByLabel('Goes to').fill('/cart');
  await dlg.getByRole('button', { name: 'Add link' }).click();
  await toast(page, '“Cart” was added.');
  await header.getByText('7 of up to 7 shown.').waitFor();
  await header.getByRole('button', { name: 'Add link' }).click();
  dlg = page.getByRole('dialog');
  expect(!(await dlg.getByRole('switch', { name: 'Shown on the website' }).isChecked()), 'should default to hidden when full');
  await dlg.getByRole('button', { name: 'Cancel' }).click();
  await header.locator('[data-testid="nav-row"]').filter({ hasText: 'Cart' }).getByRole('switch').click();
  await toast(page, 'is hidden');
  await header.locator('[data-testid="nav-row"]').filter({ hasText: 'Cart' }).getByRole('switch').click();
  await toast(page, '“Cart” is shown.');
  db.sd_nav_links.push({ id: 'p8', location: 'header', label: 'Extra', href: '/store', new_tab: false, sort_order: 9, published: false });
  await page.reload();
  await header.locator('[data-testid="nav-row"]').filter({ hasText: 'Extra' }).getByRole('switch').click();
  await page.getByRole('alert').filter({ hasText: 'can show up to 7 links' }).waitFor();
  expect(db.sd_nav_links.find((r) => r.label === 'Extra').published === false, 'limit not enforced');
  if (SHOTS) await page.screenshot({ path: SHOTS + '/admin-navigation.png', fullPage: true });
});

await test('A full header menu (7 links) still fits on one line at every width', async () => {
  const problems = [];
  for (const w of [390, 1024, 1280, 1536, 1920]) {
    const { page: p, ctx } = await open({ viewport: { width: w, height: 800 } });
    await p.goto(BASE + '/');
    await p.locator('nav[aria-label="Main"] a').nth(6).waitFor({ state: 'attached' });
    const r = await p.evaluate(() => {
      const row = document.querySelector('header > div');
      const shown = (e) => e && getComputedStyle(e).display !== 'none';
      const nav = document.querySelector('nav[aria-label="Main"]');
      const gap = shown(nav) ? row.lastElementChild.getBoundingClientRect().left - nav.getBoundingClientRect().right : null;
      const tall = [...row.querySelectorAll('a, button')].filter((e) => shown(e) && e.offsetParent && e.getBoundingClientRect().height > 44).length;
      return { gap, tall, over: row.scrollWidth - row.clientWidth, menuButton: shown(row.querySelector('[aria-controls="mobile-nav"]')) };
    });
    if (r.over > 0 || r.tall || (r.gap !== null && r.gap < 8) || (r.gap === null && !r.menuButton)) problems.push(`${w}: ${JSON.stringify(r)}`);
    await ctx.close();
  }
  expect(!problems.length, problems.join(' ; '));
  return 'menu button below 1280 px, full menu from 1280 px; with 7 links the phone number stays in the footer';
});

await test('Navigation: social links must be https; delete with confirmation', async () => {
  const social = page.getByRole('region', { name: 'Social media' });
  await social.getByRole('button', { name: 'Add link' }).click();
  const dlg = page.getByRole('dialog');
  await dlg.getByLabel('Text').fill('Instagram');
  await dlg.getByLabel('Web address').fill('instagram.com/saradev');
  await dlg.getByRole('button', { name: 'Add link' }).click();
  await dlg.getByText('Use a full web address starting with https://').waitFor();
  await dlg.getByLabel('Web address').fill('https://instagram.com/saradev');
  await dlg.getByRole('button', { name: 'Add link' }).click();
  await toast(page, '“Instagram” was added.');
  expect(db.sd_nav_links.find((r) => r.label === 'Instagram')?.new_tab === true, 'social link should open in a new tab');
  const { page: p2, ctx } = await open();
  await p2.goto(BASE + '/');
  await p2.getByRole('contentinfo').getByRole('link', { name: 'Instagram' }).waitFor();
  await ctx.close();
  await page.getByRole('region', { name: 'Header menu' }).getByRole('button', { name: 'Delete Extra' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete link' }).click();
  await toast(page, '“Extra” was deleted.');
  expect(!db.sd_nav_links.some((r) => r.label === 'Extra'), 'not deleted');
});

let facId;
await test('Facilities: add one with an image; it appears on the website in order', async () => {
  await page.getByRole('navigation', { name: 'Admin' }).getByRole('link', { name: 'Facilities' }).click();
  await page.locator('[data-testid="facility-row"]').first().waitFor();
  await page.getByRole('link', { name: 'Add facility' }).click();
  await page.getByLabel('Name').fill('Pharmacy');
  expect((await page.getByLabel('Short ID').inputValue()) === 'pharmacy', 'ID not suggested');
  await page.getByLabel(/^Description/).fill('Collect prescriptions on your way out.');
  await page.getByRole('switch', { name: 'Shown on the website' }).click();
  await page.getByRole('button', { name: 'Create facility' }).click();
  await toast(page, '“Pharmacy” was created.');
  await page.waitForURL(/\/admin\/facilities\/[0-9a-f-]{36}$/);
  facId = page.url().split('/').pop();
  await page.locator('[data-testid="image-input"]').setInputFiles({ name: 'pharmacy.webp', mimeType: 'image/webp', buffer: await sharp({ create: { width: 1200, height: 800, channels: 3, background: '#5bc0be' } }).webp().toBuffer() });
  await toast(page, 'Image added.');
  const f = db.sd_facilities.find((x) => x.id === facId);
  expect(f.image_width === 1200 && f.image_height === 800 && /facilities\//.test(f.image_url), JSON.stringify(f));
  await page.getByRole('link', { name: 'All facilities' }).click();
  await page.getByRole('button', { name: 'Move Pharmacy up' }).click();
  await page.waitForFunction(() => [...document.querySelectorAll('[data-testid="facility-row"]')].at(-2)?.textContent?.includes('Pharmacy'));
  const { page: p2, ctx } = await open();
  await p2.goto(BASE + '/facilities');
  await p2.getByRole('heading', { name: 'Pharmacy' }).waitFor();
  const names = await p2.locator('[data-testid="facility-card"] h2').allTextContents();
  expect(names.length === 9 && names[7] === 'Pharmacy', names.join(','));
  await ctx.close();
  return '9 facilities, Pharmacy 8th';
});

await test('Facilities: hide, then delete removes the image file', async () => {
  const path = decodeURIComponent(db.sd_facilities.find((x) => x.id === facId).image_url.split('/sd-media/')[1]);
  const row = page.locator('[data-testid="facility-row"]').filter({ hasText: 'Pharmacy' });
  await row.getByRole('switch').click();
  await toast(page, 'hidden from the website');
  await row.getByRole('button', { name: 'Delete Pharmacy' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete facility' }).click();
  await toast(page, '“Pharmacy” was deleted.');
  expect(!db.sd_facilities.some((x) => x.id === facId) && !files.has(path), 'row or file remains');
});

await test('Website admin pages on mobile: no sideways scrolling', async () => {
  const { page: m, ctx } = await open({ viewport: { width: 390, height: 844 } });
  await signIn(m);
  const over = [];
  for (const r of ['/admin/settings', '/admin/homepage', '/admin/homepage/home.hero', '/admin/homepage/home.why', '/admin/navigation', '/admin/facilities', `/admin/facilities/${db.sd_facilities[0].id}`]) {
    await m.goto(BASE + r);
    await m.waitForLoadState('networkidle');
    await m.waitForTimeout(300);
    const o = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (o > 0) over.push(`${r}: ${o}px`);
    if (SHOTS && r === '/admin/settings') await m.screenshot({ path: SHOTS + '/admin-settings-mobile.png' });
  }
  await m.goto(BASE + '/admin/navigation');
  await m.getByRole('region', { name: 'Header menu' }).getByRole('button', { name: 'Add link' }).click();
  const o = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (o > 0) over.push('link dialog: ' + o);
  expect(!over.length, over.join(', '));
  await ctx.close();
  return '7 pages + link dialog at 390 px';
});

await test('Public pages after the edits: no sideways scrolling, final screenshot', async () => {
  const over = [];
  for (const vp of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
    const { page: p, ctx } = await open({ viewport: vp });
    for (const r of ['/', '/facilities', '/contact']) {
      await p.goto(BASE + r);
      await p.waitForLoadState('networkidle');
      const o = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (o > 0) over.push(`${vp.width} ${r}: ${o}px`);
    }
    if (SHOTS && vp.width === 1280) {
      await p.goto(BASE + '/');
      await p.waitForLoadState('networkidle');
      await p.screenshot({ path: SHOTS + '/public-home.png', fullPage: true });
    }
    await ctx.close();
  }
  expect(!over.length, over.join(', '));
});

await test('Visitors never write content tables; no console errors', async () => {
  expect(log.writesByAnon === 0, `${log.writesByAnon} anonymous table writes`);
  expect(!consoleErrors.length, consoleErrors.slice(0, 3).join(' | '));
  return '0 anonymous writes, 0 console errors';
});

await ctxA.close();
await browser.close();
console.log(`\n${results.length - failed} of ${results.length} content tests passed.`);
fs.writeFileSync('scripts/verify-content.json', JSON.stringify(results, null, 2));
process.exit(failed ? 1 : 0);
