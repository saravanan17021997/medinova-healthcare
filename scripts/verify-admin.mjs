// Browser tests for the admin panel (stage 3), run against `vite preview`.
// Supabase is replaced by a fake server inside the browser (page.route), so the
// tests never touch the real project, real accounts or real data.
// Usage: BASE_URL=http://localhost:4173 SUPABASE_URL=https://test-project.supabase.co node scripts/verify-admin.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = (process.env.BASE_URL || 'http://localhost:4173').replace(/\/$/, '');
const SB = (process.env.SUPABASE_URL || 'https://test-project.supabase.co').replace(/\/$/, '');
const MODE = process.env.MODE || 'configured'; // configured | unconfigured | secret-key
const SHOTS = process.env.SHOTS || '';

const OWNER = { id: '11111111-1111-1111-1111-111111111111', email: 'owner@example.com', password: 'correct-horse' };
const OTHER = { id: '33333333-3333-3333-3333-333333333333', email: 'moneymap.user@example.com', password: 'correct-horse' };
const DASH = {
  published_products: 12,
  low_stock: [{ id: 'p1', name: 'Stethoscope', sku: 'SD-DIA-001', stock: 3, low_stock_threshold: 5 }, { id: 'p2', name: 'Fingertip Pulse Oximeter', sku: 'SD-MON-003', stock: 0, low_stock_threshold: 5 }],
  orders_by_status: { pending: 2, confirmed: 1 },
  appointments_by_status: { new: 4, contacted: 1 },
  new_messages: 3,
  recent_activity: [{ id: 9, admin_email: 'owner@example.com', action: 'UPDATE', table_name: 'sd_products', record_id: 'p1', created_at: '2026-10-24T08:30:00Z' }],
};

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const EXP = Math.floor(Date.now() / 1000) + 3600; // fixed, so the same user always gets the same token
const jwt = (u) => `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: u.id, email: u.email, role: 'authenticated', aud: 'authenticated', exp: EXP })}.sig`;
const userObj = (u) => ({ id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email, email_confirmed_at: '2026-10-24T00:00:00Z', app_metadata: { provider: 'email' }, user_metadata: {}, created_at: '2026-10-24T00:00:00Z' });

const results = [];
const failures = [];
const test = async (name, fn) => {
  try {
    const detail = await fn();
    results.push({ name, pass: true, detail: detail || '' });
    console.log('PASS', name, detail ? '→ ' + detail : '');
  } catch (e) {
    results.push({ name, pass: false, detail: e.message });
    failures.push(name);
    console.log('FAIL', name, '→', e.message);
  }
};
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };

const browser = await chromium.launch();

async function newPage({ viewport = { width: 1280, height: 860 }, dashboardFails = false } = {}) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const log = { consoleErrors: [], supabaseCalls: [], dashboardCalls: 0 };
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource/.test(m.text()) && log.consoleErrors.push(m.text()));
  page.on('pageerror', (e) => log.consoleErrors.push(e.message));
  const tokenUser = (req) => {
    const t = (req.headers()['authorization'] || '').replace(/^Bearer /, '');
    return [OWNER, OTHER].find((u) => t === jwt(u)) || null;
  };
  await page.route(SB + '/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    log.supabaseCalls.push(req.method() + ' ' + url.pathname);
    const json = (status, body) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    if (url.pathname === '/auth/v1/token') {
      const body = JSON.parse(req.postData() || '{}');
      const u = [OWNER, OTHER].find((x) => x.email === body.email && x.password === body.password);
      if (!u) return json(400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
      return json(200, { access_token: jwt(u), token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'refresh-' + u.id, user: userObj(u) });
    }
    if (url.pathname === '/auth/v1/user') { const u = tokenUser(req); return u ? json(200, userObj(u)) : json(401, { msg: 'invalid JWT' }); }
    if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
    if (url.pathname === '/rest/v1/sd_admins') {
      const u = tokenUser(req);
      // mirrors the RLS policy: you only ever see your own row, and only if you are on the list
      return json(200, u && u.id === OWNER.id && url.searchParams.get('user_id') === 'eq.' + OWNER.id ? [{ role: 'owner' }] : []);
    }
    if (url.pathname === '/rest/v1/rpc/sd_admin_dashboard') {
      log.dashboardCalls++;
      const u = tokenUser(req);
      if (dashboardFails) return json(500, { message: 'Service temporarily unavailable', code: '500' });
      return u?.id === OWNER.id ? json(200, DASH) : json(400, { message: 'Admins only.', code: 'P0001' });
    }
    return json(404, { message: 'not mocked: ' + url.pathname });
  });
  return { ctx, page, log };
}

const signIn = async (page, u, password = u.password) => {
  await page.getByLabel('Email').fill(u.email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
};

if (MODE === 'unconfigured') {
  await test('Without Supabase settings, /admin/login explains what to add', async () => {
    const { page, ctx } = await newPage();
    await page.goto(BASE + '/admin/login');
    await page.getByRole('heading', { name: 'Admin panel is not connected' }).waitFor();
    expect(await page.getByText('VITE_SUPABASE_ANON_KEY').isVisible(), 'setting name not shown');
    await page.goto(BASE + '/admin/dashboard');
    await page.getByRole('heading', { name: 'Admin panel is not connected' }).waitFor();
    await ctx.close();
    return 'login and dashboard both show the setup message';
  });
} else if (MODE === 'secret-key') {
  await test('A service_role key is refused and never used', async () => {
    const { page, ctx, log } = await newPage();
    await page.goto(BASE + '/admin/login');
    await page.getByRole('heading', { name: 'Unsafe key detected' }).waitFor();
    expect(log.supabaseCalls.length === 0, 'Supabase was called with a secret key');
    await ctx.close();
    return 'shows "Unsafe key detected", 0 calls to Supabase';
  });
} else {
  await test('Signed-out visitor opening /admin/dashboard is sent to /admin/login', async () => {
    const { page, ctx, log } = await newPage();
    await page.goto(BASE + '/admin/dashboard');
    await page.waitForURL('**/admin/login');
    await page.getByRole('heading', { name: 'Sign in to the admin panel' }).waitFor();
    expect(log.dashboardCalls === 0, 'dashboard data was requested while signed out');
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots === 'noindex, nofollow', 'robots meta is ' + robots);
    expect(!(await page.getByText(/sign up|create account|register/i).count()), 'a sign-up option is shown');
    await ctx.close();
    return 'redirected, no data requested, noindex set, no sign-up link';
  });

  await test('/admin redirects to /admin/login when signed out', async () => {
    const { page, ctx } = await newPage();
    await page.goto(BASE + '/admin');
    await page.waitForURL('**/admin/login');
    await ctx.close();
  });

  await test('Empty sign-in shows field errors and focuses the first one', async () => {
    const { page, ctx, log } = await newPage();
    await page.goto(BASE + '/admin/login');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.getByText('Enter your email address, like name@example.com.').waitFor();
    await page.getByText('Enter your password.').waitFor();
    const focused = await page.evaluate(() => document.activeElement?.id);
    expect(focused === 'admin-email', 'focused ' + focused);
    expect(!log.supabaseCalls.some((c) => c.includes('/token')), 'sent an empty sign-in to Supabase');
    await ctx.close();
    return 'two errors, email field focused, nothing sent';
  });

  await test('Wrong password shows a clear error and clears the password', async () => {
    const { page, ctx } = await newPage();
    await page.goto(BASE + '/admin/login');
    await signIn(page, OWNER, 'wrong-password');
    await page.getByRole('alert').filter({ hasText: 'Email or password is incorrect.' }).waitFor();
    expect((await page.getByLabel('Password', { exact: true }).inputValue()) === '', 'password not cleared');
    expect(page.url().endsWith('/admin/login'), 'left the login page');
    await ctx.close();
    return '"Email or password is incorrect."';
  });

  await test('Show/hide password toggle works', async () => {
    const { page, ctx } = await newPage();
    await page.goto(BASE + '/admin/login');
    const pw = page.getByLabel('Password', { exact: true });
    await pw.fill('abc');
    await page.getByRole('button', { name: 'Show password' }).click();
    expect((await pw.getAttribute('type')) === 'text', 'not shown');
    await page.getByRole('button', { name: 'Hide password' }).click();
    expect((await pw.getAttribute('type')) === 'password', 'not hidden');
    await ctx.close();
  });

  let ownerCtx;
  await test('Owner signs in and lands on the page they asked for, with real dashboard figures', async () => {
    const { page, ctx, log } = await newPage();
    ownerCtx = { page, ctx, log };
    await page.goto(BASE + '/admin/dashboard');
    await page.waitForURL('**/admin/login');
    await signIn(page, OWNER);
    await page.waitForURL('**/admin/dashboard');
    await page.getByRole('heading', { name: 'Overview' }).waitFor();
    await page.getByText('Fingertip Pulse Oximeter').waitFor();
    const text = await page.locator('#admin-main').innerText();
    for (const s of ['Published products', '12', 'Low stock', 'Orders', '2 pending', 'Appointment requests', '4 new', 'New messages', 'SD-DIA-001', 'Updated Products']) expect(text.includes(s), 'missing: ' + s);
    expect((await page.title()) === 'Dashboard | SaraDev Admin', 'title ' + (await page.title()));
    expect(log.dashboardCalls === 1, 'dashboard calls ' + log.dashboardCalls);
    if (SHOTS) await page.screenshot({ path: SHOTS + '/admin-dashboard-desktop.png', fullPage: true });
    return 'figures match the database response exactly';
  });

  await test('Session persists after reloading the page', async () => {
    const { page } = ownerCtx;
    await page.reload();
    await page.getByRole('heading', { name: 'Overview' }).waitFor();
    expect(page.url().endsWith('/admin/dashboard'), 'url ' + page.url());
    const stored = await page.evaluate(() => Boolean(localStorage.getItem('saradev-admin-auth')));
    expect(stored, 'no stored session');
  });

  await test('Header shows the signed-in email and role; Refresh reloads data', async () => {
    const { page, log } = ownerCtx;
    await page.locator('header').getByText(OWNER.email).waitFor();
    expect(await page.locator('header').getByText('owner', { exact: true }).isVisible(), 'role not shown');
    const before = log.dashboardCalls;
    await page.getByRole('button', { name: 'Refresh' }).click();
    await page.waitForTimeout(400);
    expect(log.dashboardCalls === before + 1, 'refresh did not reload');
  });

  await test('Unbuilt sections are visibly disabled, not broken links', async () => {
    const { page } = ownerCtx;
    const disabled = await page.locator('aside [aria-disabled="true"]').count();
    expect(disabled === 9, 'disabled items ' + disabled);
    expect((await page.locator('aside a[href="/admin/dashboard"]').count()) === 1, 'dashboard link missing');
    return '9 sections marked "Soon"';
  });

  await test('Unknown admin page shows a friendly message inside the layout', async () => {
    const { page } = ownerCtx;
    await page.goto(BASE + '/admin/products');
    await page.getByRole('heading', { name: 'This admin page does not exist yet' }).waitFor();
  });

  await test('Sign out ends the session and protects the dashboard again', async () => {
    const { page, ctx, log } = ownerCtx;
    await page.goto(BASE + '/admin/dashboard');
    await page.getByRole('heading', { name: 'Overview' }).waitFor();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await page.waitForURL('**/admin/login');
    const stored = await page.evaluate(() => localStorage.getItem('saradev-admin-auth'));
    expect(!stored, 'session still stored');
    expect(log.supabaseCalls.some((c) => c.includes('/auth/v1/logout')), 'logout not sent to Supabase');
    await page.goto(BASE + '/admin/dashboard');
    await page.waitForURL('**/admin/login');
    expect(ownerCtx.log.consoleErrors.length === 0, 'console errors: ' + ownerCtx.log.consoleErrors.join(' | '));
    await ctx.close();
    return 'logout sent, stored session removed, dashboard redirects to login';
  });

  await test('A logged-in user who is not on the admin list is refused (e.g. a Money Map user)', async () => {
    const { page, ctx, log } = await newPage();
    await page.goto(BASE + '/admin/login');
    await signIn(page, OTHER);
    await page.getByRole('heading', { name: 'This account has no admin access' }).waitFor();
    expect(log.dashboardCalls === 0, 'dashboard data requested for a non-admin');
    expect(!(await page.getByText('Published products').count()), 'dashboard visible');
    await page.getByRole('button', { name: 'Sign out' }).click();
    await page.waitForURL('**/admin/login');
    await ctx.close();
    return 'no-access page, no dashboard request, sign out works';
  });

  await test('If the database refuses the dashboard, the page says so and offers Try again', async () => {
    const { page, ctx } = await newPage({ dashboardFails: true });
    await page.goto(BASE + '/admin/login');
    await signIn(page, OWNER);
    await page.getByRole('alert').filter({ hasText: 'The dashboard could not be loaded' }).waitFor();
    await page.getByRole('button', { name: 'Try again' }).waitFor();
    await ctx.close();
  });

  await test('Mobile (390px): menu button opens the sidebar, Escape closes it, no sideways scroll', async () => {
    const { page, ctx } = await newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(BASE + '/admin/login');
    const ov1 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(ov1 <= 0, 'login overflow ' + ov1);
    await page.waitForLoadState('networkidle');
    if (SHOTS) await page.screenshot({ path: SHOTS + '/admin-login-mobile.png' });
    await signIn(page, OWNER);
    await page.getByRole('heading', { name: 'Overview' }).waitFor();
    await page.getByText('Fingertip Pulse Oximeter').waitFor();
    expect(!(await page.locator('aside').isVisible()), 'desktop sidebar visible on mobile');
    const ov2 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(ov2 <= 0, 'dashboard overflow ' + ov2);
    if (SHOTS) await page.screenshot({ path: SHOTS + '/admin-dashboard-mobile.png', fullPage: true });
    await page.getByRole('button', { name: 'Open menu' }).click();
    const dlg = page.getByRole('dialog', { name: 'Admin menu' });
    await dlg.getByRole('link', { name: 'Dashboard' }).waitFor();
    expect(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')) === 'Close menu', 'focus not moved into menu');
    await page.waitForTimeout(300); // let the slide-in finish
    if (SHOTS) await page.screenshot({ path: SHOTS + '/admin-menu-mobile.png' });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(350);
    expect(!(await dlg.isVisible()), 'menu still open after Escape');
    expect(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')) === 'Open menu', 'focus not returned');
    await ctx.close();
    return 'no overflow; focus moves in and back out';
  });

  await test('Keyboard: skip link is the first stop on admin pages', async () => {
    const { page, ctx } = await newPage();
    await page.goto(BASE + '/admin/login');
    await signIn(page, OWNER);
    await page.getByRole('heading', { name: 'Overview' }).waitFor();
    await page.keyboard.press('Tab');
    const t = await page.evaluate(() => document.activeElement?.textContent?.trim());
    expect(t === 'Skip to content', 'first tab stop: ' + t);
    await ctx.close();
  });

  await test('Public website is unaffected: no Supabase traffic and no admin code on public pages', async () => {
    const { page, ctx, log } = await newPage();
    const scripts = [];
    page.on('request', (r) => r.resourceType() === 'script' && scripts.push(new URL(r.url()).pathname));
    for (const r of ['/', '/store', '/doctors', '/appointment']) await page.goto(BASE + r, { waitUntil: 'networkidle' });
    expect(log.supabaseCalls.length === 0, 'Supabase called from public pages: ' + log.supabaseCalls.join(', '));
    expect(!scripts.some((s) => /AdminApp/.test(s)), 'admin code downloaded on public pages');
    expect(!(await page.getByRole('link', { name: /admin/i }).count()), 'public page links to admin');
    await ctx.close();
    return 'public pages loaded without contacting Supabase or downloading the admin bundle';
  });
}

await browser.close();
const pass = results.filter((r) => r.pass).length;
console.log(`\n${pass} of ${results.length} admin tests passed (${MODE}).`);
fs.writeFileSync(`scripts/verify-admin-${MODE}.json`, JSON.stringify(results, null, 2));
process.exit(failures.length ? 1 : 0);
