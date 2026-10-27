// Stage 7 browser tests: checkout and contact form saving to the database, and
// the Orders, Messages and Admin users screens. Supabase is replaced by
// scripts/lib/mock-supabase.mjs inside the browser.
// Usage: BASE_URL=http://localhost:4181 node scripts/verify-orders.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import { loadData } from './lib/load-data.mjs';
import { createMockSupabase } from './lib/mock-supabase.mjs';

const BASE = (process.env.BASE_URL || 'http://localhost:4181').replace(/\/$/, '');
const SB = (process.env.SUPABASE_URL || 'https://test-project.supabase.co').replace(/\/$/, '');
const SHOTS = process.env.SHOTS || '';
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
const inr = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const browser = await chromium.launch();
const consoleErrors = [];
async function open({ viewport = { width: 1280, height: 900 }, cart } = {}) {
  const ctx = await browser.newContext({ viewport });
  if (cart) await ctx.addInitScript((c) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('medinova-demo-cart', JSON.stringify(c)); sessionStorage.setItem('seeded', '1'); } }, cart);
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
const errorToast = (page, text) => page.getByRole('alert').filter({ hasText: text }).first().waitFor({ timeout: 10000 });
const prod = (slug) => db.sd_products.find((p) => p.slug === slug);
const [A, B, C] = db.sd_products.filter((p) => p.published).slice(0, 3).map((p) => p.slug);
async function fillCheckout(page, d = {}) {
  const v = { name: 'Ravi Kumar', phone: '98765 43210', email: 'ravi@example.com', address: '12 2nd Avenue, Anna Nagar', city: 'Chennai', pin: '600040', ...d };
  await page.getByLabel('Full name').fill(v.name);
  await page.getByLabel('Mobile number').fill(v.phone);
  await page.getByLabel(/^Email/).fill(v.email);
  await page.getByLabel('Address').fill(v.address);
  await page.getByLabel('Town or city').fill(v.city);
  await page.getByLabel('PIN code').fill(v.pin);
}

// ======================================================= public: checkout
await test('Checkout saves the order; the database sets the total; stock goes down; cart is emptied', async () => {
  prod(B).discount_price = prod(B).price - 100;
  const sA = prod(A).stock, sB = prod(B).stock;
  const expected = prod(A).price * 2 + (prod(B).price - 100);
  const { page, ctx } = await open({ cart: [{ slug: A, qty: 2 }, { slug: B, qty: 1 }] });
  await page.goto(BASE + '/checkout');
  await page.getByRole('heading', { name: 'Checkout', exact: true }).waitFor();
  await page.getByText('No payment is taken online and no card details are requested.').waitFor();
  expect((await page.locator('input[autocomplete^="cc-"], input[name*="card" i]').count()) === 0, 'card fields present');
  await fillCheckout(page);
  if (SHOTS) await page.screenshot({ path: SHOTS + '/checkout.png', fullPage: true });
  await page.getByRole('button', { name: 'Send order' }).click();
  await page.getByRole('heading', { name: 'Order received' }).waitFor();
  const ref = await page.getByTestId('order-ref').innerText();
  expect(/^ORD-\d{6}-[0-9A-F]{6}$/.test(ref), 'reference ' + ref);
  expect((await page.getByTestId('confirm-total').innerText()) === inr(expected), 'total shown ' + (await page.getByTestId('confirm-total').innerText()));
  await page.getByText('The team will call you on 98765 43210').waitFor();
  expect((await page.getByRole('link', { name: 'Ask about this order' }).getAttribute('href')).includes(encodeURIComponent(ref)), 'WhatsApp link without reference');
  const o = db.sd_orders.find((x) => x.reference === ref);
  expect(o && o.subtotal === expected && o.item_count === 3 && o.payment_status === 'unpaid' && o.status === 'pending', JSON.stringify(o));
  expect(db.sd_order_items.filter((i) => i.order_id === o.id).length === 2, 'items not saved');
  expect(prod(A).stock === sA - 2 && prod(B).stock === sB - 1, 'stock not reduced');
  await page.locator('header').getByRole('link', { name: 'Cart, 0 items' }).waitFor();
  if (SHOTS) await page.screenshot({ path: SHOTS + '/order-received.png' });
  await ctx.close();
  return `${ref}, ${inr(expected)} (sale price applied by the database)`;
});

await test('A price change while shopping: the confirmation shows the current total', async () => {
  const { page, ctx } = await open({ cart: [{ slug: C, qty: 1 }] });
  await page.goto(BASE + '/checkout');
  await page.getByRole('button', { name: 'Send order' }).waitFor();
  const old = prod(C).price;
  prod(C).price = old + 250;
  await fillCheckout(page);
  await page.getByRole('button', { name: 'Send order' }).click();
  await page.getByRole('heading', { name: 'Order received' }).waitFor();
  expect((await page.getByTestId('confirm-total').innerText()) === inr(old + 250), 'stale total shown');
  await page.getByText('A price changed while you were shopping').waitFor();
  await ctx.close();
  prod(C).price = old;
  return `${inr(old)} in the cart → ${inr(old + 250)} charged as the current price`;
});

await test('Stock ran out before sending: the order is refused and nothing is saved', async () => {
  const before = db.sd_orders.length;
  const keep = prod(A).stock;
  const { page, ctx } = await open({ cart: [{ slug: A, qty: 3 }] });
  try {
  await page.goto(BASE + '/checkout');
  await page.getByRole('button', { name: 'Send order' }).waitFor();
  prod(A).stock = 1;
  await fillCheckout(page);
  await page.getByRole('button', { name: 'Send order' }).click();
  await page.locator('#order-error').getByText(`Only 1 left of ${prod(A).name}.`).waitFor();
  await until(async () => page.evaluate(() => document.activeElement?.id === 'order-error'), 'focus not moved to the problem', 3000);
  expect(db.sd_orders.length === before, 'an order was saved');
  await page.locator('#order-error').getByRole('link', { name: 'Review your cart' }).click();
  await page.getByText('Fix the items marked in your cart before checking out.').waitFor();
  } finally {
    await ctx.close();
    prod(A).stock = keep;
  }
});

await test('Checkout: missing details are caught before anything is sent', async () => {
  const before = log.calls.filter((c) => c.includes('sd_place_order')).length;
  const { page, ctx } = await open({ cart: [{ slug: A, qty: 1 }] });
  await page.goto(BASE + '/checkout');
  await page.getByRole('button', { name: 'Send order' }).click();
  await page.getByText('Enter your full name.').waitFor();
  await page.getByText('Enter a 6-digit PIN code.').waitFor();
  expect(await page.evaluate(() => document.activeElement?.id === 'co-name'), 'focus not on the first problem');
  expect(log.calls.filter((c) => c.includes('sd_place_order')).length === before, 'request was sent');
  await ctx.close();
});

await test('Checkout: a double click sends one order; a bot-filled hidden field sends none', async () => {
  let before = db.sd_orders.length;
  let { page, ctx } = await open({ cart: [{ slug: A, qty: 1 }] });
  await page.goto(BASE + '/checkout');
  await fillCheckout(page);
  await page.getByRole('button', { name: 'Send order' }).dblclick();
  await page.getByRole('heading', { name: 'Order received' }).waitFor();
  await page.waitForTimeout(500);
  expect(db.sd_orders.length === before + 1, `${db.sd_orders.length - before} orders from a double click`);
  await ctx.close();
  before = db.sd_orders.length;
  ({ page, ctx } = await open({ cart: [{ slug: A, qty: 1 }] }));
  await page.goto(BASE + '/checkout');
  await fillCheckout(page);
  await page.locator('#co-website').fill('http://spam.example', { force: true });
  await page.getByRole('button', { name: 'Send order' }).click();
  await page.getByRole('heading', { name: 'Order received' }).waitFor();
  expect(db.sd_orders.length === before, 'honeypot order saved');
  await ctx.close();
});

await test('Checkout: if the database cannot be reached, the cart is kept and the visitor is told', async () => {
  log.failOrders = true;
  const { page, ctx } = await open({ cart: [{ slug: A, qty: 1 }] });
  await page.goto(BASE + '/checkout');
  await fillCheckout(page);
  await page.getByRole('button', { name: 'Send order' }).click();
  await page.locator('#order-error').getByText('Your order was not sent').waitFor();
  await page.locator('header').getByRole('link', { name: 'Cart, 1 item' }).waitFor();
  log.failOrders = false;
  await ctx.close();
});

// ======================================================= public: contact form
await test('Contact form saves the message and shows a reference', async () => {
  const { page, ctx } = await open();
  await page.goto(BASE + '/contact');
  await page.getByLabel('Your name').fill('Meera Iyer');
  await page.getByLabel('Phone').fill('91234 56780');
  await page.getByLabel(/^Email/).fill('meera@example.com');
  await page.getByLabel('Message').fill('Is the clinic open on Sunday mornings?');
  await page.getByRole('button', { name: 'Send message' }).click();
  await page.getByRole('heading', { name: 'Message sent' }).waitFor();
  const ref = await page.getByTestId('message-ref').innerText();
  expect(/^MSG-/.test(ref), ref);
  const m = db.sd_contact_messages.find((x) => x.reference === ref);
  expect(m && m.phone === '9123456780' && m.status === 'new' && m.message === 'Is the clinic open on Sunday mornings?', JSON.stringify(m));
  expect(!(await page.getByRole('link', { name: 'Send on WhatsApp' }).count()), 'demo WhatsApp fallback still offered');
  await ctx.close();
  return ref;
});

await test('Contact form: a failed send keeps what was typed; the hidden field stops bots', async () => {
  log.failMessages = true;
  let { page, ctx } = await open();
  await page.goto(BASE + '/contact');
  await page.getByLabel('Your name').fill('Arun');
  await page.getByLabel('Phone').fill('9988776655');
  await page.getByLabel('Message').fill('Hello there');
  await page.getByRole('button', { name: 'Send message' }).click();
  await page.locator('#contact-error').waitFor();
  expect((await page.getByLabel('Message').inputValue()) === 'Hello there', 'message lost');
  log.failMessages = false;
  await ctx.close();
  const before = db.sd_contact_messages.length;
  ({ page, ctx } = await open());
  await page.goto(BASE + '/contact');
  await page.getByLabel('Your name').fill('Bot');
  await page.getByLabel('Phone').fill('9988776655');
  await page.getByLabel('Message').fill('Buy now');
  await page.locator('#c-website').fill('x', { force: true });
  await page.getByRole('button', { name: 'Send message' }).click();
  await page.getByRole('heading', { name: 'Message sent' }).waitFor();
  expect(db.sd_contact_messages.length === before, 'bot message saved');
  await ctx.close();
});

// seed a few more for the admin screens
db.sd_contact_messages.push({ id: 'm-old', reference: 'MSG-261020-AAAAAA', name: 'Old Enquiry', phone: null, email: 'old@example.com', message: 'Do you sell wheelchairs?', status: 'replied', admin_notes: null, created_at: '2026-10-20T05:00:00Z', updated_at: '2026-10-20T05:00:00Z' });

// ======================================================= admin: owner
const { page, ctx: ctxA } = await open({ viewport: { width: 1360, height: 900 } });
await signIn(page);

await test('Dashboard: order and message counts link to their screens', async () => {
  const card = page.getByRole('link', { name: /New messages/ });
  await card.waitFor();
  expect((await card.innerText()).includes('1'), 'new message count');
  await page.locator('#admin-main').getByRole('link', { name: /^Orders/ }).click();
  await page.waitForURL('**/admin/orders?status=pending');
  await page.locator('[data-testid="order-row"]').first().waitFor();
  expect((await page.getByRole('group', { name: 'Filter by status' }).getByRole('button', { pressed: true }).innerText()).startsWith('New'), 'New filter not applied');
});

let ref1;
await test('Orders: search by phone, open, see items and totals, confirm with notes', async () => {
  await page.getByRole('group', { name: 'Filter by status' }).getByRole('button', { name: /^All/ }).click();
  await page.getByLabel('Search orders').fill('43210');
  const first = db.sd_orders[0];
  ref1 = first.reference;
  await page.locator('[data-testid="order-row"]').filter({ hasText: first.reference }).click();
  const dlg = page.getByRole('dialog');
  await dlg.getByRole('heading', { name: 'Ravi Kumar' }).waitFor();
  expect((await dlg.locator('[data-testid="order-item"]').count()) === 2, 'items');
  expect((await dlg.getByTestId('order-total').innerText()) === inr(first.subtotal), 'total');
  expect((await dlg.getByTestId('payment-status').innerText()) === 'Not paid', 'payment');
  expect((await dlg.getByRole('link', { name: 'WhatsApp' }).getAttribute('href')).startsWith('https://wa.me/919876543210?text=Hello%20Ravi%20Kumar'), 'WhatsApp');
  expect(!(await dlg.getByLabel(/payment/i).count()), 'a payment control is shown');
  await dlg.getByLabel('Status').selectOption('confirmed');
  await dlg.getByLabel(/Team notes/).fill('Called. Cash on delivery, Thursday.');
  if (SHOTS) await page.screenshot({ path: SHOTS + '/admin-order.png' });
  await dlg.getByRole('button', { name: 'Save' }).click();
  await toast(page, 'saved: Confirmed');
  expect(first.status === 'confirmed' && first.admin_notes === 'Called. Cash on delivery, Thursday.', 'not saved');
  return ref1;
});

await test('Orders: payment status cannot be changed, even by a direct request', async () => {
  const res = await page.evaluate(async ({ sb, id }) => {
    const token = JSON.parse(localStorage.getItem('saradev-admin-auth')).access_token;
    const r = await fetch(`${sb}/rest/v1/sd_orders?id=eq.${id}`, { method: 'PATCH', headers: { apikey: 'x', Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ payment_status: 'paid' }) });
    return r.status;
  }, { sb: SB, id: db.sd_orders[0].id });
  expect(res === 403 && db.sd_orders[0].payment_status === 'unpaid', 'status ' + res);
  return 'PATCH payment_status → 403, still unpaid';
});

await test('Orders: cancelling asks first, returns the items to stock and cannot be undone', async () => {
  const o = db.sd_orders[0];
  const items = db.sd_order_items.filter((i) => i.order_id === o.id);
  const before = items.map((i) => db.sd_products.find((p) => p.id === i.product_id).stock);
  const dlg = page.getByRole('dialog');
  await dlg.getByRole('button', { name: 'Delete' }).click();
  await errorToast(page, 'Only delivered or cancelled orders can be deleted.');
  await dlg.getByLabel('Status').selectOption('cancelled');
  await dlg.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('alertdialog').getByText('back into stock').waitFor();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Cancel order' }).click();
  await toast(page, 'was cancelled. Its items are back in stock.');
  const after = items.map((i) => db.sd_products.find((p) => p.id === i.product_id).stock);
  expect(after.every((s, k) => s === before[k] + items[k].qty), `stock ${before} → ${after}`);
  expect(await dlg.getByLabel('Status').isDisabled(), 'status still editable');
  await dlg.getByText('A cancelled order cannot be reopened.').waitFor();
});

await test('Orders: an owner deletes a cancelled order (with confirmation)', async () => {
  const o = db.sd_orders[0];
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete order' }).click();
  await until(() => !db.sd_orders.includes(o), 'order not deleted');
  expect(!db.sd_orders.includes(o) && !db.sd_order_items.some((i) => i.order_id === o.id), 'order or items remain');
});

await test('Messages: opening a new message marks it read; reply links; save Replied with notes', async () => {
  await page.getByRole('navigation', { name: 'Admin' }).getByRole('link', { name: 'Messages' }).click();
  const row = page.locator('[data-testid="message-row"]').filter({ hasText: 'Meera Iyer' });
  await row.waitFor();
  await row.click();
  const dlg = page.getByRole('dialog');
  await dlg.getByTestId('message-text').filter({ hasText: 'Is the clinic open on Sunday mornings?' }).waitFor();
  const m = db.sd_contact_messages.find((x) => x.name === 'Meera Iyer');
  await until(() => m.status === 'read', 'not marked read');
  await dlg.getByLabel('Status').filter({ hasText: 'Read' }).waitFor();
  expect((await dlg.getByRole('link', { name: 'Email' }).getAttribute('href')).startsWith('mailto:meera@example.com?subject=Re%3A%20your%20message%20MSG-'), 'email link');
  expect((await dlg.getByRole('link', { name: 'WhatsApp' }).getAttribute('href')).startsWith('https://wa.me/919123456780'), 'WhatsApp link');
  await dlg.getByLabel('Status').selectOption('replied');
  await dlg.getByLabel(/Team notes/).fill('Told her 9 am to 1 pm.');
  if (SHOTS) await page.screenshot({ path: SHOTS + '/admin-message.png' });
  await dlg.getByRole('button', { name: 'Save' }).click();
  await toast(page, 'saved: Replied');
  expect(m.status === 'replied' && m.admin_notes === 'Told her 9 am to 1 pm.', 'not saved');
  await page.keyboard.press('Escape');
});

await test('Messages: filter by status and search the text', async () => {
  await page.getByRole('group', { name: 'Filter by status' }).getByRole('button', { name: /^Replied/ }).click();
  expect((await page.locator('[data-testid="message-row"]').count()) === 2, 'replied filter');
  await page.getByLabel('Search messages').fill('wheelchair');
  await page.locator('[data-testid="message-row"]').filter({ hasText: 'Old Enquiry' }).waitFor();
  expect((await page.locator('[data-testid="message-row"]').count()) === 1, 'search');
  await page.locator('[data-testid="message-row"]').first().click();
  expect(!(await page.getByRole('dialog').getByRole('link', { name: 'WhatsApp' }).count()), 'WhatsApp shown without a phone');
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete message' }).click();
  await until(() => !db.sd_contact_messages.some((x) => x.id === 'm-old'), 'not deleted');
  await toast(page, 'MSG-261020-AAAAAA was deleted');
});

await test('Admin users: the only owner is protected; adding checks the email and the login', async () => {
  await page.getByRole('navigation', { name: 'Admin' }).getByRole('link', { name: 'Admin users' }).click();
  const ownerRow = page.locator('[data-testid="admin-row"]').filter({ hasText: OWNER.email });
  await ownerRow.getByText('You').waitFor();
  expect(await ownerRow.getByRole('combobox').isDisabled(), 'only owner can be demoted');
  await ownerRow.getByRole('button', { name: `Remove ${OWNER.email}` }).click();
  await errorToast(page, 'This is the only owner.');
  await page.getByLabel('Email').fill('not-an-email');
  await page.getByRole('button', { name: 'Add admin' }).click();
  await page.getByText('Enter the email address they sign in with.').waitFor();
  await page.getByLabel('Email').fill('nobody@example.com');
  await page.getByRole('button', { name: 'Add admin' }).click();
  await page.getByText('Create their login first').waitFor();
  await page.getByLabel('Email').fill(EDITOR.email);
  await page.getByRole('button', { name: 'Add admin' }).click();
  await page.getByText('is already an editor').waitFor();
  await page.getByLabel('Email').fill('NewHire@Example.com');
  await page.getByRole('button', { name: 'Add admin' }).click();
  await toast(page, 'newhire@example.com can now sign in');
  await page.locator('[data-testid="admin-row"]').filter({ hasText: 'newhire@example.com' }).waitFor();
  expect(db.sd_admins.find((a) => a.email === 'newhire@example.com')?.role === 'editor', 'not added');
  if (SHOTS) await page.screenshot({ path: SHOTS + '/admin-users.png', fullPage: true });
  return 'bad email, missing login and duplicate refused; newhire added as editor';
});

await test('Admin users: promote, remove an editor, and step down with a warning', async () => {
  await page.getByLabel('Role for newhire@example.com').selectOption('owner');
  await toast(page, 'newhire@example.com is now an owner.');
  const ownerRow = page.locator('[data-testid="admin-row"]').filter({ hasText: OWNER.email });
  await until(() => db.sd_admins.filter((a) => a.role === 'owner').length === 2, 'not promoted');
  await page.waitForFunction(() => !document.querySelector('[aria-label="Role for owner@example.com"]')?.disabled);
  await page.getByRole('button', { name: `Remove ${EDITOR.email}` }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Remove access' }).click();
  await toast(page, `${EDITOR.email} no longer has admin access.`);
  expect(!db.sd_admins.some((a) => a.email === EDITOR.email), 'editor not removed');
  await ownerRow.getByRole('combobox').selectOption('editor');
  await page.getByRole('alertdialog', { name: 'Make yourself an editor?' }).getByRole('button', { name: 'Make me an editor' }).click();
  await page.getByRole('heading', { name: 'Only owners can manage admin users' }).waitFor({ timeout: 10000 });
  expect(!(await page.getByRole('navigation', { name: 'Admin' }).getByRole('link', { name: 'Admin users' }).count()), 'menu still shows Admin users');
  // put things back for the next tests
  db.sd_admins.find((a) => a.email === OWNER.email).role = 'owner';
  db.sd_admins.push({ id: EDITOR.id, user_id: EDITOR.id, email: EDITOR.email, role: 'editor', created_at: '2026-10-25T05:00:00Z' });
});

// ======================================================= admin: editor
await test('Editor: no Admin users menu or screen; cannot delete orders or messages', async () => {
  const { page: e, ctx } = await open();
  await signIn(e, EDITOR);
  expect(!(await e.getByRole('navigation', { name: 'Admin' }).getByRole('link', { name: 'Admin users' }).count()), 'editor sees Admin users');
  await e.goto(BASE + '/admin/users');
  await e.getByRole('heading', { name: 'Only owners can manage admin users' }).waitFor();
  await e.goto(BASE + '/admin/orders');
  await e.locator('[data-testid="order-row"]').first().click();
  await e.getByRole('dialog').getByLabel('Status').waitFor();
  expect(!(await e.getByRole('dialog').getByRole('button', { name: 'Delete' }).count()), 'editor sees Delete on orders');
  await e.keyboard.press('Escape');
  await e.goto(BASE + '/admin/messages');
  await e.locator('[data-testid="message-row"]').first().click();
  await e.getByRole('dialog').getByLabel('Status').waitFor();
  expect(!(await e.getByRole('dialog').getByRole('button', { name: 'Delete' }).count()), 'editor sees Delete on messages');
  await ctx.close();
});

await test('Order, message and admin screens on mobile: no sideways scrolling', async () => {
  const { page: m, ctx } = await open({ viewport: { width: 390, height: 844 } });
  await signIn(m);
  const over = [];
  for (const r of ['/admin/orders', '/admin/messages', '/admin/users']) {
    await m.goto(BASE + r);
    await m.waitForLoadState('networkidle');
    await m.waitForTimeout(300);
    const o = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (o > 0) over.push(`${r}: ${o}px`);
  }
  await m.goto(BASE + '/admin/orders');
  await m.locator('[data-testid="order-row"]').first().click();
  await m.getByRole('dialog').getByLabel('Status').waitFor();
  const o = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (o > 0) over.push('order detail: ' + o);
  if (SHOTS) await m.screenshot({ path: SHOTS + '/admin-order-mobile.png' });
  await ctx.close();
  const { page: p, ctx: c2 } = await open({ viewport: { width: 390, height: 844 }, cart: [{ slug: A, qty: 1 }] });
  await p.goto(BASE + '/checkout');
  await p.getByRole('button', { name: 'Send order' }).waitFor();
  const o2 = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (o2 > 0) over.push('checkout: ' + o2);
  await c2.close();
  expect(!over.length, over.join(', '));
  return '3 pages, order detail and checkout at 390 px';
});

await test('Visitors only write through the order and message functions; no console errors', async () => {
  expect(log.writesByAnon === 0, `${log.writesByAnon} anonymous table writes`);
  expect(!consoleErrors.length, consoleErrors.slice(0, 3).join(' | '));
  return `${log.ordersByAnon} orders and ${log.messagesByAnon} messages via functions, 0 direct writes`;
});

await ctxA.close();
await browser.close();
console.log(`\n${results.length - failed} of ${results.length} order and message tests passed.`);
fs.writeFileSync('scripts/verify-orders.json', JSON.stringify(results, null, 2));
process.exit(failed ? 1 : 0);
