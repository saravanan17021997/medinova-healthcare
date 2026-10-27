// End-to-end verification against a running build (npm run build && npm run preview).
// Usage: BASE_URL=http://localhost:4173 node scripts/verify-site.mjs [--screenshots=dir]
// Checks every route at desktop, tablet and mobile sizes for broken or failed
// images and horizontal overflow, then tests forms, cart maths, checkout,
// filters, WhatsApp links and the image error fallback.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { loadData, root } from './lib/load-data.mjs';

const BASE = (process.env.BASE_URL || 'http://localhost:4173').replace(/\/$/, '');
const shotsArg = process.argv.find((a) => a.startsWith('--screenshots='));
const SHOTS = shotsArg ? shotsArg.split('=')[1] : null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

const VIEWPORTS = { desktop: { width: 1440, height: 900 }, tablet: { width: 834, height: 1112 }, mobile: { width: 390, height: 844 } };
// A high-density pass proves the large srcset variants are chosen and load too.
const CRAWLS = { ...Object.fromEntries(Object.entries(VIEWPORTS).map(([k, v]) => [k, { viewport: v, dpr: 1 }])), 'desktop-2x': { viewport: VIEWPORTS.desktop, dpr: 2 } };
const { specialties, doctors, products } = await loadData();
const ROUTES = ['/', '/specialties', '/doctors', '/facilities', '/appointment', '/store', '/cart', '/checkout', '/order-confirmation', '/contact', '/this-page-does-not-exist', ...specialties.specialties.map((s) => `/specialties/${s.slug}`), ...doctors.doctors.map((d) => `/doctors/${d.slug}`), ...products.products.map((p) => `/store/${p.slug}`)];
const SHOT_ROUTES = new Set(['/', '/specialties', '/specialties/cardiology', '/doctors', '/doctors/nisha-varghese', '/facilities', '/appointment', '/store', '/store/blood-pressure-monitor', '/contact', '/this-page-does-not-exist']);

const report = { base: BASE, startedAt: new Date().toISOString(), routes: [], tests: [], imagesLoaded: new Set(), imagesDecoded: new Set(), failures: [] };
const fail = (msg) => report.failures.push(msg);

const browser = await chromium.launch();

async function scrollThrough(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(200);
}

async function imageAudit(page) {
  return page.evaluate(() => {
    const imgs = [...document.images].map((i) => ({ src: i.currentSrc || i.src, alt: i.getAttribute('alt'), complete: i.complete, w: i.naturalWidth, lazy: i.loading }));
    const fallbacks = [...document.querySelectorAll('[data-image-fallback]')].map((e) => e.getAttribute('data-image-fallback'));
    const overflow = document.documentElement.scrollWidth - window.innerWidth;
    return { imgs, fallbacks, overflow };
  });
}

// ---------------------------------------------------------------- route crawl
for (const [vpName, { viewport: vp, dpr }] of Object.entries(CRAWLS)) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dpr });
  for (const route of ROUTES) {
    const page = await ctx.newPage();
    const badRequests = [];
    const consoleErrors = [];
    page.on('requestfailed', (r) => badRequests.push(`${r.url()} (${r.failure()?.errorText})`));
    page.on('response', (r) => {
      if (r.status() >= 400 && r.request().resourceType() === 'image') badRequests.push(`${r.url()} (HTTP ${r.status()})`);
    });
    page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
    page.on('pageerror', (e) => consoleErrors.push(e.message));
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await scrollThrough(page);
    const a = await imageAudit(page);
    const broken = a.imgs.filter((i) => !i.complete || i.w === 0);
    a.imgs.filter((i) => i.w > 0).forEach((i) => report.imagesLoaded.add(new URL(i.src).pathname));
    const entry = { viewport: vpName, route, images: a.imgs.length, broken: broken.map((b) => b.src), fallbacks: a.fallbacks, badRequests, consoleErrors, overflowPx: a.overflow };
    report.routes.push(entry);
    if (broken.length) fail(`[${vpName}] ${route}: ${broken.length} broken image(s): ${broken.map((b) => b.src).join(', ')}`);
    if (a.fallbacks.length) fail(`[${vpName}] ${route}: image fallback shown for ${a.fallbacks.join(', ')}`);
    if (badRequests.length) fail(`[${vpName}] ${route}: failed requests: ${badRequests.join(', ')}`);
    if (consoleErrors.length) fail(`[${vpName}] ${route}: console errors: ${consoleErrors.join(' | ')}`);
    if (a.overflow > 1) fail(`[${vpName}] ${route}: page is ${a.overflow}px wider than the viewport`);
    const missingAlt = a.imgs.filter((i) => i.alt === null);
    if (missingAlt.length) fail(`[${vpName}] ${route}: ${missingAlt.length} image(s) without an alt attribute`);
    if (SHOTS && dpr === 1 && SHOT_ROUTES.has(route)) {
      const name = (route === '/' ? 'home' : route.slice(1).replace(/\//g, '_')) + `-${vpName}.jpg`;
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: path.join(SHOTS, name), fullPage: true, type: 'jpeg', quality: 70 });
    }
    await page.close();
  }
  await ctx.close();
}

// ---------------------------------------------------------------- interaction tests
const ctx = await browser.newContext({ viewport: VIEWPORTS.desktop });
const page = await ctx.newPage();
const recordImages = async (pg) => {
  const seen = await pg.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth > 0).map((i) => i.currentSrc || i.src));
  seen.forEach((u) => report.imagesLoaded.add(new URL(u).pathname));
};
const test = async (name, fn) => {
  try {
    const detail = await fn();
    await recordImages(page);
    report.tests.push({ name, pass: true, detail });
  } catch (e) {
    report.tests.push({ name, pass: false, detail: e.message });
    fail(`TEST FAILED: ${name}: ${e.message}`);
  }
};
const expect = (cond, msg) => {
  if (!cond) throw new Error(msg);
};
const text = (sel) => page.locator(sel).first().innerText();
const inr = (n) => '₹' + n.toLocaleString('en-IN');

await test('Skip link is the first keyboard stop', async () => {
  await page.goto(BASE + '/');
  await page.keyboard.press('Tab');
  const t = await page.evaluate(() => document.activeElement?.textContent?.trim());
  expect(t === 'Skip to content', `first focus was "${t}"`);
  return 'Tab from page load focuses "Skip to content"';
});

await test('Cart: quantities, subtotal, update and remove', async () => {
  await page.goto(BASE + '/store/digital-thermometer');
  await page.getByRole('button', { name: 'Increase quantity' }).click();
  await page.getByRole('button', { name: 'Increase quantity' }).click();
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await page.goto(BASE + '/store/blood-pressure-monitor');
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await page.goto(BASE + '/cart');
  const s1 = await text('[data-testid="subtotal"]');
  expect(s1 === inr(3 * 299 + 1899), `subtotal ${s1}, expected ${inr(3 * 299 + 1899)}`);
  const badge = await page.getByRole('link', { name: /Cart, 4 items/ }).count();
  expect(badge === 1, 'header badge does not show 4 items');
  await page.getByRole('group', { name: 'Quantity of Digital Blood Pressure Monitor' }).getByRole('button', { name: 'Increase quantity' }).click();
  const s2 = await text('[data-testid="subtotal"]');
  expect(s2 === inr(3 * 299 + 2 * 1899), `after update subtotal ${s2}`);
  await page.getByRole('button', { name: 'Remove Digital Thermometer' }).click();
  const s3 = await text('[data-testid="subtotal"]');
  expect(s3 === inr(2 * 1899), `after remove subtotal ${s3}`);
  await page.reload();
  const s4 = await text('[data-testid="subtotal"]');
  expect(s4 === inr(2 * 1899), 'cart did not persist across reload');
  return `${s1} → ${s2} → ${s3}; persists after reload`;
});

await test('Demo checkout: validation, simulated confirmation, cart cleared', async () => {
  await page.goto(BASE + '/checkout');
  await page.getByRole('button', { name: 'Place demo order' }).click();
  const invalid = await page.locator('[aria-invalid="true"]').count();
  expect(invalid >= 5, `expected at least 5 invalid fields, got ${invalid}`);
  const cardFields = await page.locator('input[autocomplete^="cc-"], input[name*="card" i]').count();
  expect(cardFields === 0, 'checkout contains payment card fields');
  await page.fill('#co-name', 'Test Customer');
  await page.fill('#co-phone', '9876543210');
  await page.fill('#co-address', '1 Test Road');
  await page.fill('#co-city', 'Chennai');
  await page.fill('#co-pin', '600001');
  await page.getByRole('button', { name: 'Place demo order' }).click();
  await page.waitForURL('**/order-confirmation');
  const total = await text('[data-testid="confirm-total"]');
  expect(total === inr(2 * 1899), `confirmation total ${total}`);
  const ref = await text('[data-testid="order-ref"]');
  expect(/^DEMO-/.test(ref), `reference ${ref}`);
  expect((await page.getByText('Simulated order').count()) === 1, 'missing "Simulated order" label');
  expect((await page.getByRole('link', { name: /Cart, 0 items/ }).count()) === 1, 'cart not cleared');
  return `${invalid} validation errors on empty submit; confirmation ${ref} for ${total}; cart emptied`;
});

await test('Appointment: validation, doctor filtered by specialty, WhatsApp message', async () => {
  await page.goto(BASE + '/appointment');
  await page.getByRole('button', { name: 'Send appointment request' }).click();
  const alert = page.getByRole('alert');
  expect((await alert.count()) === 1, 'no error summary');
  const items = await alert.locator('li').count();
  expect(items === 5, `expected 5 errors, got ${items}`);
  const focused = await page.evaluate(() => document.activeElement?.getAttribute('role'));
  expect(focused === 'alert', 'error summary did not receive focus');
  await page.fill('#name', 'Asha Test');
  await page.fill('#phone', '98765 43210');
  await page.selectOption('#specialty', 'cardiology');
  const opts = await page.locator('#doctor option').allInnerTexts();
  expect(opts.length === 2 && opts[1] === 'Nisha Varghese', `doctor options: ${opts.join(', ')}`);
  await page.selectOption('#doctor', 'nisha-varghese');
  const d = new Date(Date.now() + 2 * 86400000);
  await page.fill('#date', d.toISOString().slice(0, 10));
  await page.getByLabel('Afternoon (12 pm to 4 pm)').check();
  await page.getByRole('button', { name: 'Send appointment request' }).click();
  await page.getByRole('heading', { name: 'Your request is ready to send' }).waitFor();
  const href = await page.getByRole('link', { name: 'Send on WhatsApp' }).getAttribute('href');
  expect(href.startsWith('https://wa.me/?text='), `whatsapp href ${href}`);
  const msg = decodeURIComponent(href.split('text=')[1]);
  expect(msg.includes('Asha Test') && msg.includes('Cardiology') && msg.includes('Nisha Varghese') && msg.includes('Afternoon'), `message: ${msg}`);
  return `5 errors on empty submit, summary focused; prefilled WhatsApp message has ${msg.split('\n').length} lines`;
});

await test('Appointment prefill from a doctor profile', async () => {
  await page.goto(BASE + '/doctors/rahul-iyer');
  await page.getByRole('link', { name: 'Request an appointment' }).first().click();
  await page.waitForURL('**/appointment?**');
  expect((await page.inputValue('#specialty')) === 'orthopaedics', 'specialty not prefilled');
  expect((await page.inputValue('#doctor')) === 'rahul-iyer', 'doctor not prefilled');
  return 'specialty and doctor carried over from the profile';
});

await test('Contact form validation and demo result', async () => {
  await page.goto(BASE + '/contact');
  await page.getByRole('button', { name: 'Send message' }).click();
  const invalid = await page.locator('[aria-invalid="true"]').count();
  expect(invalid === 3, `expected 3 invalid fields, got ${invalid}`);
  await page.fill('#c-name', 'Ravi');
  await page.fill('#c-email', 'ravi@example.com');
  await page.fill('#c-message', 'Do you have parking?');
  await page.getByRole('button', { name: 'Send message' }).click();
  await page.getByRole('heading', { name: 'Message ready' }).waitFor();
  return 'name, contact method and message required; demo result shown';
});

await test('Product enquiry WhatsApp links', async () => {
  await page.goto(BASE + '/store');
  const hrefs = await page.locator('a[aria-label^="Ask about"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs.length === products.products.length, `found ${hrefs.length} enquiry links`);
  const msg = decodeURIComponent(hrefs[0].split('text=')[1]);
  expect(/question about the .+ \(demo product\)/.test(msg), `message: ${msg}`);
  return `${hrefs.length} product enquiry links, e.g. "${msg}"`;
});

await test('Store filters, sorting and empty states', async () => {
  await page.goto(BASE + '/store?category=protective');
  expect((await page.locator('article').count()) === 2, 'protective should list 2 products');
  await page.goto(BASE + '/store?sort=price-asc');
  const first = await page.locator('article h3').first().innerText();
  expect(first.includes('Surgical Face Masks'), `cheapest first was ${first}`);
  await page.goto(BASE + '/store?category=protective&min=2000');
  await page.getByRole('heading', { name: 'Nothing in this range' }).waitFor();
  const cat = await page.locator('img[src$="illustration-empty-catalogue.svg"]').evaluate((i) => i.naturalWidth);
  expect(cat > 0, 'empty catalogue illustration did not load');
  await page.goto(BASE + '/store?q=zzzz');
  await page.getByRole('heading', { name: 'No products match your search' }).waitFor();
  return 'category filter, price sort, empty catalogue and empty search illustrations';
});

await test('Doctor directory filters', async () => {
  await page.goto(BASE + '/doctors?language=Tamil');
  const n = await page.locator('a[href^="/doctors/"]').count();
  expect(n === 2, `Tamil speakers: ${n}`);
  await page.goto(BASE + '/doctors?language=Tamil&day=Fri');
  await page.getByRole('heading', { name: 'No profiles match these filters' }).waitFor();
  return 'language filter returns 2 profiles; empty state shown when no match';
});

await test('Graceful fallback when an image fails to load', async () => {
  const p2 = await ctx.newPage();
  await p2.route('**/images/hero/medinova-hero-healthcare-team*.webp', (r) => r.abort());
  await p2.goto(BASE + '/', { waitUntil: 'networkidle' });
  const fb = await p2.locator('[data-image-fallback]').count();
  expect(fb >= 1, 'no fallback rendered');
  const label = await p2.locator('[data-image-fallback]').first().getAttribute('aria-label');
  expect(label && label.length > 10, 'fallback lost its accessible label');
  await p2.close();
  return `fallback rendered with aria-label "${label}"`;
});

await test('Mobile menu opens, traps nothing off-screen and closes with Escape', async () => {
  const m = await browser.newPage({ viewport: VIEWPORTS.mobile });
  await m.goto(BASE + '/');
  await m.getByRole('button', { name: 'Open menu' }).click();
  await m.getByRole('dialog', { name: 'Menu' }).getByRole('link', { name: 'Store' }).waitFor();
  await m.keyboard.press('Escape');
  await m.waitForTimeout(300);
  const expanded = await m.getByRole('button', { name: 'Open menu' }).getAttribute('aria-expanded');
  expect(expanded === 'false', 'menu did not close');
  await m.close();
  return 'opens from the header, closes on Escape';
});

await test('Product gallery: thumbnails swap the main image and each view loads', async () => {
  await page.goto(BASE + '/store/stethoscope', { waitUntil: 'networkidle' });
  const seen = [];
  for (const label of ['Show image 2 of 3', 'Show image 3 of 3', 'Show image 1 of 3']) {
    await page.getByRole('button', { name: label }).click();
    await page.waitForLoadState('networkidle');
    const main = page.locator('section img[fetchpriority="high"]').first();
    await main.evaluate((i) => (i.complete ? null : new Promise((r) => (i.onload = r))));
    const info = await main.evaluate((i) => ({ src: new URL(i.currentSrc || i.src).pathname, w: i.naturalWidth }));
    expect(info.w > 0, `${label}: main image did not load`);
    seen.push(info.src);
    await recordImages(page);
  }
  expect(new Set(seen).size === 3, `expected 3 different images, got ${seen.join(', ')}`);
  return seen.join(' → ');
});

// Every generated file, decoded by Chromium from the production server.
const outputsAll = JSON.parse(fs.readFileSync(path.join(root, 'scripts/images/output.json'), 'utf8')).assets.flatMap((a) => a.outputs.map((o) => '/' + o.file));
await test(`Every generated asset (${outputsAll.length} files) is served by the build and decodes in the browser`, async () => {
  const p3 = await ctx.newPage();
  await p3.goto(BASE + '/this-route-is-blank-on-purpose');
  const results = await p3.evaluate(async (urls) => {
    const load = (u) =>
      new Promise((resolve) => {
        const im = new Image();
        im.onload = () => resolve({ u, ok: im.naturalWidth > 0, w: im.naturalWidth, h: im.naturalHeight });
        im.onerror = () => resolve({ u, ok: false });
        im.src = u;
      });
    return Promise.all(urls.map(load));
  }, outputsAll);
  await p3.close();
  const bad = results.filter((r) => !r.ok);
  report.directDecode = results;
  results.filter((r) => r.ok).forEach((r) => report.imagesDecoded.add(r.u));
  expect(bad.length === 0, `${bad.length} file(s) failed to decode: ${bad.map((b) => b.u).join(', ')}`);
  return `${results.length} of ${outputsAll.length} decoded`;
});

await browser.close();

// ---------------------------------------------------------------- summary
const outputs = JSON.parse(fs.readFileSync(path.join(root, 'scripts/images/output.json'), 'utf8')).assets.flatMap((a) => a.outputs.map((o) => '/' + o.file));
const pageImages = outputs.filter((o) => o.startsWith('/images/'));
const neverLoaded = pageImages.filter((o) => !report.imagesLoaded.has(o));
const summary = {
  routesChecked: ROUTES.length,
  pageViews: report.routes.length,
  imagesRendered: report.routes.reduce((a, r) => a + r.images, 0),
  uniqueImageFilesLoaded: report.imagesLoaded.size,
  pageImageFilesGenerated: pageImages.length,
  pageImageFilesNeverShownOnAPage: neverLoaded,
  allGeneratedFilesDecodedInBrowser: report.imagesDecoded.size,
  tests: report.tests,
  failures: report.failures,
};
fs.writeFileSync(path.join(root, 'scripts/verify-report.json'), JSON.stringify({ ...report, imagesLoaded: [...report.imagesLoaded].sort(), imagesDecoded: [...report.imagesDecoded].sort(), summary }, null, 2));
console.log(JSON.stringify(summary, null, 2));
process.exit(report.failures.length ? 1 : 0);
