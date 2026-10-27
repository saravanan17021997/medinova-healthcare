// Stage 4 browser tests: admin product and category management, image uploads,
// and the public store reading the catalogue from the database.
// Supabase is replaced by scripts/lib/mock-supabase.mjs inside the browser.
// Usage: BASE_URL=http://localhost:4181 SUPABASE_URL=https://test-project.supabase.co node scripts/verify-catalog.mjs
import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs';
import { loadData } from './lib/load-data.mjs';
import { createMockSupabase } from './lib/mock-supabase.mjs';

const BASE = (process.env.BASE_URL || 'http://localhost:4181').replace(/\/$/, '');
const SB = (process.env.SUPABASE_URL || 'https://test-project.supabase.co').replace(/\/$/, '');
const SHOTS = process.env.SHOTS || '';
const { products } = await loadData();
const mock = createMockSupabase({ SB, seed: products });
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
const inr = (n) => '₹' + n.toLocaleString('en-IN');

const png = (w, h, color) => sharp({ create: { width: w, height: h, channels: 3, background: color } }).png().toBuffer();
const imgA = await png(800, 800, '#5BC0BE');
const imgB = await png(900, 900, '#0B2545');
const big = Buffer.alloc(6 * 1024 * 1024, 1);

const browser = await chromium.launch();
const consoleErrors = [];
async function open({ viewport = { width: 1280, height: 900 }, failCatalog = false } = {}) {
  const ctx = await browser.newContext({ viewport });
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
const alertToast = (page, text) => page.getByRole('alert').filter({ hasText: text }).first().waitFor({ timeout: 10000 });

// ======================================================= public store from the database
await test('Store lists the published products from the database (12)', async () => {
  const { page, ctx } = await open();
  await page.goto(BASE + '/store');
  await page.getByText('12 products').waitFor();
  expect(log.calls.some((c) => c === 'GET /rest/v1/sd_products'), 'store did not read the database');
  if (SHOTS) await page.screenshot({ path: SHOTS + '/store-db.png' });
  await ctx.close();
  return 'read via REST with the publishable key';
});

await test('A REST failure shows "store not available" with Try again, not stale prices', async () => {
  const { page, ctx } = await open({ failCatalog: true });
  await page.goto(BASE + '/store');
  await page.getByRole('alert').filter({ hasText: 'The store is not available right now' }).waitFor();
  expect(!(await page.getByText('Digital Thermometer').count()), 'showed products while the database was down');
  await page.goto(BASE + '/store/stethoscope');
  await page.getByRole('button', { name: 'Try again' }).waitFor();
  await ctx.close();
});

// ======================================================= admin: products
let ctxA, page;
await test('Admin: products list shows all 12, search and filters work', async () => {
  ({ ctx: ctxA, page } = await open());
  await signIn(page);
  await page.getByRole('link', { name: 'Products' }).click();
  await page.waitForURL('**/admin/products');
  await page.getByText('Showing 1–12 of 12 products').waitFor();
  await page.getByLabel('Search products').fill('thermo');
  await page.getByText('Showing 1–1 of 1 product').waitFor();
  await page.getByLabel('Search products').fill('SD-MON');
  await page.getByText('of 4 products').waitFor();
  await page.getByLabel('Search products').fill('');
  await page.getByLabel('Category').selectOption({ label: 'Protective supplies' });
  await page.getByText('of 2 products').waitFor();
  await page.getByLabel('Category').selectOption('');
  await page.getByLabel('Status').selectOption('draft');
  await page.getByText('No products match these filters').waitFor();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.getByText('of 12 products').waitFor();
  if (SHOTS) await page.screenshot({ path: SHOTS + '/admin-products.png', fullPage: true });
  return 'search by name and SKU, category, status, clear';
});

await test('Admin: new product validates every field before saving', async () => {
  await page.getByRole('link', { name: 'Add product' }).click();
  await page.waitForURL('**/admin/products/new');
  await page.getByRole('button', { name: 'Create product' }).click();
  for (const t of ['Enter the product name.', 'Use 2–40 capital letters', 'Enter a price in rupees']) await page.getByText(t).first().waitFor();
  const focused = await page.evaluate(() => document.activeElement?.id);
  expect(focused === 'pf-name', 'first error not focused: ' + focused);
  await page.getByLabel('Product name').fill('Infrared Ear Thermometer');
  expect((await page.getByLabel('Web address (slug)').inputValue()) === 'infrared-ear-thermometer', 'slug not generated');
  await page.getByLabel('SKU').fill('sd-mon-001'); // duplicate of an existing SKU, typed in lowercase
  expect((await page.getByLabel('SKU').inputValue()) === 'SD-MON-001', 'SKU not uppercased');
  await page.getByLabel('Price (₹)', { exact: true }).fill('1299');
  await page.getByLabel('Sale price (₹)').fill('1500');
  await page.getByRole('button', { name: 'Create product' }).click();
  await page.getByText('The sale price must be lower than the price.').waitFor();
  return 'name, SKU, price, sale price; slug auto-filled; SKU uppercased';
});

let newId;
await test('Admin: duplicate SKU is refused by the database with a clear message', async () => {
  await page.getByLabel('Sale price (₹)').fill('999');
  await page.getByLabel('In stock').fill('3');
  await page.getByLabel('Short summary').fill('Reads in one second.');
  await page.getByRole('button', { name: 'Create product' }).click();
  await page.getByText('That SKU is already used by another product.').first().waitFor();
  expect(page.url().endsWith('/admin/products/new'), 'navigated despite the error');
});

await test('Admin: product is created, then opens for images', async () => {
  await page.getByLabel('SKU').fill('SD-MON-010');
  await page.getByLabel('Features').fill('One-second reading\nBacklit display\n\n');
  await page.getByRole('switch', { name: /Published in the store/ }).click();
  await page.getByRole('button', { name: 'Create product' }).click();
  await toast(page, 'was created');
  await page.waitForURL(/\/admin\/products\/[0-9a-f-]{36}$/);
  newId = page.url().split('/').pop();
  const row = db.sd_products.find((p) => p.id === newId);
  expect(row && row.price === 1299 && row.discount_price === 999 && row.stock === 3 && row.published === true, 'saved row wrong: ' + JSON.stringify(row));
  expect(JSON.stringify(row.features) === '["One-second reading","Backlit display"]', 'features not split by line');
  await page.getByRole('heading', { name: 'Images' }).waitFor();
  await page.getByText('No images yet').waitFor();
  return 'price 1299, sale 999, stock 3, features split, published';
});

await test('Admin: image upload shows progress, saves to storage and appears', async () => {
  await page.locator('#add-images').setInputFiles([{ name: 'front.png', mimeType: 'image/png', buffer: imgA }, { name: 'side.png', mimeType: 'image/png', buffer: imgB }]);
  await toast(page, '2 images added.');
  await page.locator('[data-testid="image-item"]').nth(1).waitFor();
  const imgs = db.sd_product_images.filter((i) => i.product_id === newId).sort((a, b) => a.sort_order - b.sort_order);
  expect(imgs.length === 2 && imgs[0].width === 800 && imgs[1].width === 900, 'image rows wrong ' + JSON.stringify(imgs));
  expect(imgs.every((i) => files.has(i.storage_path) && i.url.includes('/storage/v1/object/public/sd-media/products/' + newId)), 'files not in storage');
  const loaded = await page.locator('[data-testid="image-item"] img').evaluateAll((els) => els.map((e) => e.naturalWidth));
  expect(loaded.every((w) => w > 0), 'thumbnails did not load');
  expect(await page.getByText('Main image').isVisible(), 'main image badge missing');
  return '2 files stored, sizes read (800 and 900 px), thumbnails load';
});

await test('Admin: wrong file type and files over 5 MB are refused before upload', async () => {
  const before = files.size;
  await page.locator('#add-images').setInputFiles([{ name: 'anim.gif', mimeType: 'image/gif', buffer: Buffer.from('GIF89a') }, { name: 'huge.png', mimeType: 'image/png', buffer: big }]);
  await page.getByText('“anim.gif” is not a JPEG, PNG, WebP or AVIF image.').waitFor();
  await page.getByText('“huge.png” is 6.0 MB. The limit is 5 MB.').waitFor();
  expect(files.size === before, 'a refused file was uploaded');
});

await test('Admin: reorder, edit description, replace and remove an image', async () => {
  const before = db.sd_product_images.filter((i) => i.product_id === newId).sort((a, b) => a.sort_order - b.sort_order).map((i) => i.id);
  await page.getByRole('button', { name: 'Move image 2 earlier' }).click();
  await page.waitForTimeout(400);
  const after = db.sd_product_images.filter((i) => i.product_id === newId).sort((a, b) => a.sort_order - b.sort_order).map((i) => i.id);
  expect(after[0] === before[1] && after[1] === before[0], 'order not swapped');
  const altInput = page.locator('[data-testid="image-item"] input').first();
  await altInput.fill('Ear thermometer from the side');
  await altInput.blur();
  await toast(page, 'Description saved.');
  expect(db.sd_product_images.find((i) => i.id === after[0]).alt === 'Ear thermometer from the side', 'alt not saved');
  const oldPath = db.sd_product_images.find((i) => i.id === after[1]).storage_path;
  await page.getByRole('button', { name: 'Replace image 2' }).click();
  await page.locator('input[type=file]').nth(1).setInputFiles({ name: 'new.png', mimeType: 'image/png', buffer: await png(700, 700, '#F2B134') });
  await toast(page, 'Image replaced.');
  const replaced = db.sd_product_images.find((i) => i.id === after[1]);
  expect(replaced.width === 700 && !files.has(oldPath) && files.has(replaced.storage_path), 'replace did not swap files');
  await page.getByRole('button', { name: 'Remove image 2' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Remove image' }).click();
  await toast(page, 'Image removed.');
  expect(db.sd_product_images.filter((i) => i.product_id === newId).length === 1 && !files.has(replaced.storage_path), 'remove did not delete row and file');
  if (SHOTS) await page.screenshot({ path: SHOTS + '/admin-product-form.png', fullPage: true });
  return 'order swapped, alt saved, old file deleted on replace, file deleted on remove';
});

await test('Public store shows the new product with sale price, "Only 3 left" and the uploaded image', async () => {
  const { page: p2, ctx } = await open();
  await p2.goto(BASE + '/store/infrared-ear-thermometer');
  await p2.getByRole('heading', { name: 'Infrared Ear Thermometer' }).waitFor();
  const text = await p2.locator('main').innerText();
  expect(text.includes(inr(999)) && text.includes(inr(1299)) && text.includes('Save 23%') && text.includes('Only 3 left'), 'price/stock text wrong');
  const w = await p2.locator('main img[fetchpriority="high"]').evaluate((i) => (i.complete ? i.naturalWidth : new Promise((r) => (i.onload = () => r(i.naturalWidth)))));
  expect(w === 900, 'uploaded main image not shown (expected the 900 px image moved to first place), width ' + w);
  // stock caps the quantity
  await p2.getByRole('button', { name: 'Increase quantity' }).click();
  await p2.getByRole('button', { name: 'Increase quantity' }).click();
  expect(await p2.getByRole('button', { name: 'Increase quantity' }).isDisabled(), 'quantity can exceed stock');
  await p2.getByRole('button', { name: 'Add to cart' }).click();
  await p2.goto(BASE + '/cart');
  await p2.getByTestId('subtotal').filter({ hasText: inr(2997) }).waitFor();
  if (SHOTS) await p2.screenshot({ path: SHOTS + '/store-product-db.png' });
  await ctx.close();
  return '₹999 (was ₹1,299), Save 23%, Only 3 left, quantity capped at 3, cart ₹2,997';
});

await test('Admin: hiding a product in the list removes it from the store at once', async () => {
  await page.goto(BASE + '/admin/products?q=infrared');
  await page.getByRole('switch', { name: 'Published' }).click();
  await toast(page, 'is hidden from the store');
  const { page: p2, ctx } = await open();
  await p2.goto(BASE + '/store');
  await p2.getByText('12 products').waitFor();
  await p2.goto(BASE + '/store/infrared-ear-thermometer');
  await p2.getByRole('heading', { name: 'This page doesn’t exist' }).waitFor();
  await ctx.close();
  await page.getByRole('switch', { name: 'Hidden' }).click();
  await toast(page, 'is now visible in the store');
  return 'hidden → 404 in store; shown again';
});

await test('Cart: sold-out and removed products block checkout', async () => {
  const { page: p2, ctx } = await open();
  await p2.goto(BASE + '/store/infrared-ear-thermometer');
  await p2.getByRole('button', { name: 'Add to cart' }).click();
  await p2.goto(BASE + '/store/stethoscope');
  await p2.getByRole('button', { name: 'Add to cart' }).click();
  // admin sells out the thermometer and deletes the stethoscope
  db.sd_products.find((x) => x.id === newId).stock = 0;
  const steth = db.sd_products.find((x) => x.slug === 'stethoscope');
  await p2.goto(BASE + '/cart');
  await p2.getByText('Out of stock. Remove it to continue.').waitFor();
  expect(await p2.getByText('Fix the items marked in your cart before checking out.').isVisible(), 'checkout not blocked');
  steth.published = false;
  await p2.reload();
  await p2.getByText('An item in your cart is no longer available.').waitFor();
  await p2.goto(BASE + '/checkout');
  await p2.getByRole('heading', { name: 'Some items in your cart need attention' }).waitFor();
  await p2.goto(BASE + '/store/infrared-ear-thermometer');
  await p2.getByRole('button', { name: 'Out of stock' }).waitFor();
  expect(await p2.getByRole('button', { name: 'Out of stock' }).isDisabled(), 'can add a sold-out product');
  steth.published = true;
  db.sd_products.find((x) => x.id === newId).stock = 3;
  await ctx.close();
  return 'out-of-stock line, unavailable line, checkout refused, add-to-cart disabled';
});

await test('Admin: editing price and stock updates the store after a refresh', async () => {
  await page.goto(BASE + `/admin/products/${newId}`);
  await page.getByLabel('Price (₹)', { exact: true }).fill('1199');
  await page.getByLabel('Sale price (₹)').fill('');
  await page.getByText('You have unsaved changes.').waitFor();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await toast(page, 'Changes saved.');
  const row = db.sd_products.find((p) => p.id === newId);
  expect(row.price === 1199 && row.discount_price === null, 'edit not saved');
  const { page: p2, ctx } = await open();
  await p2.goto(BASE + '/store/infrared-ear-thermometer');
  await p2.getByText(inr(1199)).first().waitFor();
  expect(!(await p2.getByText('Save ').count()), 'old discount still shown');
  await ctx.close();
});

// ======================================================= admin: categories
await test('Admin: categories list with product counts; add, edit and reorder', async () => {
  await page.getByRole('link', { name: 'Categories' }).click();
  await page.waitForURL('**/admin/categories');
  await page.locator('[data-testid="category-row"]').nth(5).waitFor();
  expect(await page.getByText('/monitoring · 5 products').isVisible(), 'count wrong');
  await page.getByRole('button', { name: 'Add category' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Baby care');
  expect((await page.getByRole('dialog').getByLabel('Web address (slug)').inputValue()) === 'baby-care', 'slug not generated');
  await page.getByRole('dialog').getByRole('button', { name: 'Create category' }).click();
  await toast(page, 'Category “Baby care” created.');
  await page.getByText('/baby-care · 0 products').waitFor();
  await page.getByRole('button', { name: 'Edit Baby care' }).click();
  await page.getByRole('dialog').getByLabel('Name').fill('Baby and child care');
  await page.getByRole('dialog').getByRole('button', { name: 'Save category' }).click();
  await toast(page, 'Category saved.');
  await page.getByText('Baby and child care').waitFor();
  const before = db.sd_categories.slice().sort((a, b) => a.sort_order - b.sort_order).map((c) => c.slug);
  await page.getByRole('button', { name: 'Move Baby and child care up' }).click();
  await page.waitForTimeout(500);
  const after = db.sd_categories.slice().sort((a, b) => a.sort_order - b.sort_order).map((c) => c.slug);
  expect(after.indexOf('baby-care') === before.indexOf('baby-care') - 1, 'not moved up: ' + after.join(','));
  if (SHOTS) await page.screenshot({ path: SHOTS + '/admin-categories.png', fullPage: true });
  return 'counts shown; created, renamed, moved up';
});

await test('Admin: a category with products cannot be deleted; an empty one can', async () => {
  await page.getByRole('button', { name: 'Delete Protective supplies' }).click();
  await alertToast(page, 'has 2 products. Move them to another category first');
  expect(db.sd_categories.some((c) => c.slug === 'protective'), 'category was deleted');
  await page.getByRole('button', { name: 'Delete Baby and child care' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete category' }).click();
  await toast(page, 'deleted');
  expect(!db.sd_categories.some((c) => c.slug === 'baby-care'), 'empty category not deleted');
});

await test('Admin: hiding a category hides its products from the store', async () => {
  const row = page.locator('[data-testid="category-row"]').filter({ hasText: 'Protective supplies' });
  await row.getByRole('switch').click();
  await toast(page, 'are hidden from the store');
  const { page: p2, ctx } = await open();
  await p2.goto(BASE + '/store');
  await p2.getByText('11 products').waitFor();
  expect(!(await p2.getByRole('button', { name: /Protective supplies/ }).count()), 'hidden category still offered');
  await ctx.close();
  await row.getByRole('switch').click();
  await toast(page, 'is shown in the store');
  return '13 published products → 11 shown (2 protective hidden), category chip gone';
});

await test('Admin: deleting a product removes it, its image files and its store page', async () => {
  await page.goto(BASE + '/admin/products?q=infrared');
  const paths = db.sd_product_images.filter((i) => i.product_id === newId).map((i) => i.storage_path);
  await page.getByRole('button', { name: 'Delete Infrared Ear Thermometer' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete product' }).click();
  await toast(page, 'was deleted');
  expect(!db.sd_products.some((p) => p.id === newId) && !db.sd_product_images.some((i) => i.product_id === newId), 'rows remain');
  expect(paths.every((p) => !files.has(p)), 'files remain');
  return 'row, image rows and files gone';
});

await test('Admin pages on mobile: no sideways scrolling', async () => {
  const { page: m, ctx } = await open({ viewport: { width: 390, height: 844 } });
  await signIn(m);
  const over = [];
  for (const r of ['/admin/products', '/admin/products/new', `/admin/products/${db.sd_products[0].id}`, '/admin/categories']) {
    await m.goto(BASE + r);
    await m.waitForLoadState('networkidle');
    await m.waitForTimeout(300);
    const o = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (o > 0) over.push(`${r}: ${o}px`);
    if (SHOTS && r === '/admin/products') await m.screenshot({ path: SHOTS + '/admin-products-mobile.png', fullPage: true });
    if (SHOTS && r.includes(db.sd_products[0].id)) await m.screenshot({ path: SHOTS + '/admin-form-mobile.png', fullPage: true });
  }
  expect(!over.length, over.join(', '));
  await ctx.close();
  return '4 admin pages at 390 px';
});

await test('Visitors cannot write: no anonymous write reached the database', async () => {
  expect(log.writesByAnon === 0, `${log.writesByAnon} anonymous write attempts`);
  expect(!consoleErrors.length, 'console errors: ' + consoleErrors.slice(0, 3).join(' | '));
  return '0 anonymous writes, 0 console errors';
});

await ctxA.close();
await browser.close();
console.log(`\n${results.length - failed} of ${results.length} catalogue tests passed.`);
fs.writeFileSync('scripts/verify-catalog.json', JSON.stringify(results, null, 2));
process.exit(failed ? 1 : 0);
