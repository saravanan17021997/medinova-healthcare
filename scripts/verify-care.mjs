// Stage 5 browser tests: doctors, specialties and appointment requests, on the
// public site (database mode) and in the admin panel. Supabase is replaced by
// scripts/lib/mock-supabase.mjs inside the browser.
// Usage: BASE_URL=http://localhost:4181 node scripts/verify-care.mjs
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
const isoIn = (days) => new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);
const png = (w, h, c) => sharp({ create: { width: w, height: h, channels: 3, background: c } }).png().toBuffer();

// ======================================================= public (database mode)
await test('Doctors and specialties pages read the database', async () => {
  const { page, ctx } = await open();
  await page.goto(BASE + '/doctors');
  await page.getByText('Showing 10 of 10 profiles').waitFor();
  await page.goto(BASE + '/specialties/cardiology');
  await page.getByRole('heading', { name: 'Cardiology', level: 1 }).waitFor();
  await page.getByRole('heading', { name: 'Nisha Varghese' }).waitFor();
  expect(log.calls.includes('GET /rest/v1/sd_doctors') && log.calls.includes('GET /rest/v1/sd_specialties'), 'did not read the database');
  await ctx.close();
  return '10 profiles; cardiology lists Nisha Varghese';
});

await test('Old capitalised profile link /doctors/Saravanan still works', async () => {
  const { page, ctx } = await open();
  await page.goto(BASE + '/doctors/Saravanan');
  await page.getByRole('heading', { name: 'Saravanan', level: 1 }).waitFor();
  await ctx.close();
});

await test('Appointment request is saved to the database with a reference', async () => {
  const { page, ctx } = await open();
  await page.goto(BASE + '/appointment?specialty=cardiology&doctor=nisha-varghese');
  await page.waitForFunction(() => document.querySelector('#doctor')?.value === 'nisha-varghese');
  await page.getByRole('button', { name: 'Send appointment request' }).click();
  await page.getByText('Check these').waitFor();
  await page.getByLabel('Patient name').fill('Ravi Kumar');
  await page.getByLabel('Contact number').fill('98765 43210');
  await page.getByLabel('Preferred date').fill(isoIn(3));
  await page.getByLabel('Morning (9 am to 12 pm)').check();
  await page.getByLabel(/Anything we should know/).fill('First visit');
  await page.getByRole('button', { name: 'Send appointment request' }).click();
  await page.getByRole('heading', { name: 'Request sent' }).waitFor();
  const ref = await page.getByTestId('appointment-ref').innerText();
  const row = db.sd_appointments.find((a) => a.reference === ref);
  expect(/^APT-\d{6}-[0-9A-F]{6}$/.test(ref) && row, 'no saved row for ' + ref);
  expect(row.patient_name === 'Ravi Kumar' && row.phone === '9876543210' && row.doctor_name === 'Nisha Varghese' && row.status === 'new', 'row wrong: ' + JSON.stringify(row));
  expect(await page.getByText('stored securely and only the clinic team can see it').isVisible(), 'privacy note missing');
  if (SHOTS) await page.screenshot({ path: SHOTS + '/appointment-saved.png' });
  await ctx.close();
  return `${ref} saved; specialty and doctor prefilled from the link`;
});

await test('If the database refuses a request, the visitor sees why (and nothing is saved)', async () => {
  const { page, ctx } = await open();
  await page.goto(BASE + '/appointment?specialty=dermatology');
  await page.waitForFunction(() => document.querySelector('#specialty')?.value === 'dermatology');
  db.sd_specialties.find((s) => s.slug === 'dermatology').published = false; // admin hides it meanwhile
  const before = db.sd_appointments.length;
  await page.getByLabel('Patient name').fill('Meena');
  await page.getByLabel('Contact number').fill('9876543210');
  await page.getByLabel('Preferred date').fill(isoIn(2));
  await page.getByLabel('Evening (4 pm to 7 pm)').check();
  await page.getByRole('button', { name: 'Send appointment request' }).click();
  await page.getByRole('alert').filter({ hasText: 'Choose a specialty from the list.' }).waitFor();
  db.sd_specialties.find((s) => s.slug === 'dermatology').published = true;
  expect(db.sd_appointments.length === before, 'a refused request was saved');
  await ctx.close();
});

await test('A hidden spam-trap field stops bots without saving anything', async () => {
  const { page, ctx } = await open();
  await page.goto(BASE + '/appointment');
  await page.waitForFunction(() => document.querySelectorAll('#specialty option').length > 2);
  const before = db.sd_appointments.length;
  await page.locator('#website').fill('http://spam.example', { force: true });
  await page.getByLabel('Patient name').fill('Bot');
  await page.getByLabel('Contact number').fill('9876543210');
  await page.getByLabel('Specialty').selectOption('dentistry');
  await page.getByLabel('Preferred date').fill(isoIn(1));
  await page.getByLabel('Morning (9 am to 12 pm)').check();
  await page.getByRole('button', { name: 'Send appointment request' }).click();
  await page.getByRole('heading', { name: 'Your request is ready to send' }).waitFor();
  expect(db.sd_appointments.length === before, 'bot request was saved');
  await ctx.close();
});

await test('Visitors cannot read appointment requests', async () => {
  const { page, ctx } = await open();
  await page.goto(BASE + '/');
  const status = await page.evaluate(async (sb) => (await fetch(sb + '/rest/v1/sd_appointments?select=*', { headers: { apikey: 'anon' } })).status, SB);
  expect(status === 401, 'anonymous read returned ' + status);
  await ctx.close();
  return 'anonymous read refused (401)';
});

await test('Database down: doctors page says so and offers Try again', async () => {
  const { page, ctx } = await open({ failCatalog: true });
  await page.goto(BASE + '/doctors');
  await page.getByRole('alert').filter({ hasText: 'This is not available right now' }).waitFor();
  await ctx.close();
});

// ======================================================= admin: doctors
let ctxA, page, docId;
await test('Admin: doctors list (10), filter by specialty and demo status', async () => {
  ({ ctx: ctxA, page } = await open());
  await signIn(page);
  await page.getByRole('link', { name: 'Doctors' }).click();
  await page.waitForURL('**/admin/doctors');
  await page.getByText('10 profiles').waitFor();
  await page.getByLabel('Specialty').selectOption({ label: 'Cardiology' });
  await page.getByText('1 profile').waitFor();
  await page.getByLabel('Specialty').selectOption('');
  await page.getByLabel('Status').selectOption('real');
  await page.getByText('No profiles match these filters').waitFor();
  await page.getByLabel('Status').selectOption('');
  if (SHOTS) await page.screenshot({ path: SHOTS + '/admin-doctors.png', fullPage: true });
});

await test('Admin: a verified profile needs qualifications before it is published', async () => {
  await page.getByRole('link', { name: 'Add doctor' }).click();
  await page.getByLabel('Name', { exact: true }).fill('Dr. Lakshmi Raman');
  expect((await page.getByLabel('Web address (slug)').inputValue()) === 'dr-lakshmi-raman', 'slug not generated');
  await page.getByLabel('Specialty').selectOption({ label: 'Paediatrics' });
  await page.getByRole('switch', { name: /Shown on the website/ }).click();
  await page.getByRole('button', { name: 'Create profile' }).click();
  await page.getByText('A verified profile needs its qualifications before it is published.').waitFor();
});

await test('Admin: create a verified doctor with qualifications, bio and availability', async () => {
  await page.getByLabel('Qualifications').fill('MBBS, MD (Paediatrics)');
  await page.getByLabel('Registration number').fill('TNMC 123456');
  await page.getByLabel('Role').fill('Paediatric consultant');
  await page.getByLabel('Biography').fill('Dr. Raman has looked after children for twelve years.\n\nShe speaks Tamil and English.');
  await page.getByLabel('Languages').fill('English, Tamil');
  for (const d of ['Mon', 'Wed', 'Sat']) await page.getByLabel(d, { exact: true }).check();
  await page.getByLabel('Video').check();
  await page.getByRole('button', { name: 'Create profile' }).click();
  await toast(page, 'profile was created');
  await page.waitForURL(/\/admin\/doctors\/[0-9a-f-]{36}$/);
  docId = page.url().split('/').pop();
  const row = db.sd_doctors.find((d) => d.id === docId);
  expect(row && row.is_demo === false && row.published && JSON.stringify(row.availability) === '["Mon","Wed","Sat"]' && JSON.stringify(row.modes) === '["In person","Video"]' && JSON.stringify(row.languages) === '["English","Tamil"]', 'row wrong ' + JSON.stringify(row));
  return 'verified, published, Mon/Wed/Sat, in person + video';
});

await test('Admin: upload a doctor photo; it shows on the website profile', async () => {
  await page.getByTestId('photo-input').setInputFiles({ name: 'lakshmi.png', mimeType: 'image/png', buffer: await png(800, 1000, '#0E7C7B') });
  await toast(page, 'Image added.');
  await page.getByTestId('photo-preview').waitFor();
  const row = db.sd_doctors.find((d) => d.id === docId);
  expect(row.photo_url.includes('/sd-media/doctors/' + docId) && row.photo_width === 800 && row.photo_height === 1000, 'photo not saved');
  const { page: p2, ctx } = await open();
  await p2.goto(BASE + '/doctors/dr-lakshmi-raman');
  await p2.getByRole('heading', { name: 'Dr. Lakshmi Raman', level: 1 }).waitFor();
  const text = await p2.locator('main').innerText();
  expect(text.includes('MBBS, MD (Paediatrics)') && text.includes('Registration number: TNMC 123456') && text.includes('twelve years'), 'details missing');
  expect(!text.includes('Fictional demo profile'), 'verified profile shows the demo label');
  const w = await p2.locator('main img[fetchpriority="high"]').evaluate((i) => (i.complete ? i.naturalWidth : new Promise((r) => (i.onload = () => r(i.naturalWidth)))));
  expect(w === 800, 'photo not shown, width ' + w);
  if (SHOTS) await p2.screenshot({ path: SHOTS + '/doctor-profile-verified.png' });
  await p2.goto(BASE + '/appointment?specialty=paediatrics');
  await p2.waitForFunction(() => [...document.querySelectorAll('#doctor option')].some((o) => o.textContent === 'Dr. Lakshmi Raman'));
  await ctx.close();
  return 'photo 800×1000, qualifications, registration, bio, no demo label, bookable';
});

await test('Admin: hiding a doctor removes the profile from the website', async () => {
  await page.goto(BASE + '/admin/doctors?q=lakshmi');
  await page.getByRole('switch', { name: 'Shown' }).click();
  await toast(page, 'is hidden from the website');
  const { page: p2, ctx } = await open();
  await p2.goto(BASE + '/doctors');
  await p2.getByText('Showing 10 of 10 profiles').waitFor();
  await ctx.close();
  await page.getByRole('switch', { name: 'Hidden' }).click();
  await toast(page, 'is now shown on the website');
});

// ======================================================= admin: specialties
let specId;
await test('Admin: specialties list with doctor counts; create one with reasons and an image', async () => {
  await page.getByRole('link', { name: 'Specialties' }).click();
  await page.waitForURL('**/admin/specialties');
  await page.getByText('/paediatrics · 2 doctors').waitFor();
  await page.getByRole('link', { name: 'Add specialty' }).click();
  await page.getByLabel('Name', { exact: true }).fill('ENT');
  await page.getByLabel('Short summary').fill('Ear, nose and throat care.');
  await page.getByLabel('Description', { exact: true }).fill('Hearing, sinus and throat problems.');
  await page.getByLabel(/Common reasons to visit/).fill('Ear pain\nBlocked nose\n');
  await page.getByLabel('Icon').selectOption('Stethoscope');
  await page.getByRole('switch', { name: /Shown on the website/ }).click();
  await page.getByRole('button', { name: 'Create specialty' }).click();
  await toast(page, 'was created');
  await page.waitForURL(/\/admin\/specialties\/[0-9a-f-]{36}$/);
  specId = page.url().split('/').pop();
  await page.getByTestId('image-input').setInputFiles({ name: 'ent.png', mimeType: 'image/png', buffer: await png(1200, 900, '#5BC0BE') });
  await toast(page, 'Image added.');
  const row = db.sd_specialties.find((s) => s.id === specId);
  expect(row && row.slug === 'ent' && JSON.stringify(row.reasons) === '["Ear pain","Blocked nose"]' && row.image_width === 1200 && row.published, 'row wrong ' + JSON.stringify(row));
  const { page: p2, ctx } = await open();
  await p2.goto(BASE + '/specialties/ent');
  await p2.getByRole('heading', { name: 'ENT', level: 1 }).waitFor();
  await p2.getByText('No profiles are listed for this specialty yet.').waitFor();
  await p2.goto(BASE + '/appointment');
  await p2.waitForFunction(() => [...document.querySelectorAll('#specialty option')].some((o) => o.textContent === 'ENT'));
  await ctx.close();
  return 'created, image 1200×900, on the website and in the appointment form';
});

await test('Admin: a specialty with doctors cannot be deleted; an empty one can', async () => {
  await page.goto(BASE + '/admin/specialties');
  await page.getByRole('button', { name: 'Delete Cardiology' }).click();
  await page.getByRole('alert').filter({ hasText: 'has 1 doctor profile' }).waitFor();
  expect(db.sd_specialties.some((s) => s.slug === 'cardiology'), 'deleted a specialty in use');
  const imgPath = decodeURIComponent(db.sd_specialties.find((s) => s.id === specId).image_url.split('/sd-media/')[1]);
  await page.getByRole('button', { name: 'Delete ENT' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete specialty' }).click();
  await toast(page, 'was deleted');
  expect(!db.sd_specialties.some((s) => s.id === specId) && !files.has(imgPath), 'specialty or its image remains');
});

await test('Admin: hiding a specialty hides it and its doctors from the website', async () => {
  const row = page.locator('[data-testid="specialty-row"]').filter({ hasText: 'Dentistry' });
  await row.getByRole('switch').click();
  await toast(page, 'hidden from the website');
  const { page: p2, ctx } = await open();
  await p2.goto(BASE + '/doctors');
  await p2.getByText('Showing 10 of 10 profiles').waitFor(); // 11 profiles minus the dentist
  await p2.goto(BASE + '/specialties/dentistry');
  await p2.getByRole('heading', { name: 'This page doesn’t exist' }).waitFor();
  await ctx.close();
  await row.getByRole('switch').click();
  await toast(page, 'is shown on the website');
  return 'dentistry and its dentist hidden, then restored';
});

await test('Admin: edit a specialty description; the website shows the change', async () => {
  await page.goto(BASE + '/admin/specialties');
  await page.getByRole('link', { name: 'Edit Cardiology' }).click();
  await page.getByLabel('Description', { exact: true }).fill('Heart and blood vessel care, from check-ups to follow-up.');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await toast(page, 'Changes saved.');
  const { page: p2, ctx } = await open();
  await p2.goto(BASE + '/specialties/cardiology');
  await p2.getByText('Heart and blood vessel care, from check-ups to follow-up.').waitFor();
  await ctx.close();
});

// ======================================================= admin: appointments
await test('Admin: appointment requests list, search by phone, open and update status with notes', async () => {
  await page.getByRole('link', { name: 'Appointments' }).click();
  await page.waitForURL('**/admin/appointments');
  await page.locator('[data-testid="appointment-row"]').first().waitFor();
  await page.getByRole('group', { name: 'Filter by status' }).getByRole('button', { name: /^New/ }).click();
  await page.getByLabel('Search requests').fill('43210');
  await page.locator('[data-testid="appointment-row"]').filter({ hasText: 'Ravi Kumar' }).click();
  const dlg = page.getByRole('dialog');
  await dlg.getByRole('heading', { name: 'Ravi Kumar' }).waitFor();
  expect((await dlg.getByRole('link', { name: 'WhatsApp' }).getAttribute('href')).startsWith('https://wa.me/919876543210'), 'WhatsApp link wrong');
  expect((await dlg.getByRole('link', { name: 'Call' }).getAttribute('href')) === 'tel:9876543210', 'call link wrong');
  await dlg.getByText('First visit').waitFor();
  await dlg.getByLabel('Status').selectOption('contacted');
  await dlg.getByLabel(/Team notes/).fill('Called, will confirm Thursday 10 am.');
  await dlg.getByRole('button', { name: 'Save' }).click();
  await toast(page, 'saved: Contacted');
  const row = db.sd_appointments.find((a) => a.patient_name === 'Ravi Kumar');
  expect(row.status === 'contacted' && row.admin_notes === 'Called, will confirm Thursday 10 am.', 'not saved');
  if (SHOTS) await page.screenshot({ path: SHOTS + '/admin-appointment.png' });
  await page.keyboard.press('Escape');
  await page.getByRole('group', { name: 'Filter by status' }).getByRole('button', { name: /^Contacted/ }).click();
  await page.locator('[data-testid="appointment-row"]').filter({ hasText: 'Ravi Kumar' }).waitFor();
  return 'search by phone, call/WhatsApp links, status + notes saved, filter by status';
});

await test('Admin: owner can delete a request (with confirmation)', async () => {
  await page.getByLabel('Search requests').fill('');
  await page.getByRole('group', { name: 'Filter by status' }).getByRole('button', { name: /^All/ }).click();
  await page.locator('[data-testid="appointment-row"]').filter({ hasText: 'Ravi Kumar' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete request' }).click();
  await toast(page, 'was deleted');
  expect(!db.sd_appointments.some((a) => a.patient_name === 'Ravi Kumar'), 'still there');
});

await test('Admin: deleting a doctor removes the profile and photo; past requests keep the name', async () => {
  // a request for the new doctor first
  const { page: p2, ctx } = await open();
  await p2.goto(BASE + '/appointment?specialty=paediatrics&doctor=dr-lakshmi-raman');
  await p2.waitForFunction(() => document.querySelector('#doctor')?.value === 'dr-lakshmi-raman');
  await p2.getByLabel('Patient name').fill('Asha');
  await p2.getByLabel('Contact number').fill('9123456780');
  await p2.getByLabel('Preferred date').fill(isoIn(5));
  await p2.getByLabel('Afternoon (12 pm to 4 pm)').check();
  await p2.getByRole('button', { name: 'Send appointment request' }).click();
  await p2.getByRole('heading', { name: 'Request sent' }).waitFor();
  await ctx.close();
  const photoPath = decodeURIComponent(db.sd_doctors.find((d) => d.id === docId).photo_url.split('/sd-media/')[1]);
  await page.goto(BASE + `/admin/doctors/${docId}`);
  await page.getByRole('button', { name: 'Delete profile' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete profile' }).click();
  await toast(page, 'profile was deleted');
  const appt = db.sd_appointments.find((a) => a.patient_name === 'Asha');
  expect(!db.sd_doctors.some((d) => d.id === docId) && !files.has(photoPath), 'profile or photo remains');
  expect(appt.doctor_id === null && appt.doctor_name === 'Dr. Lakshmi Raman', 'request lost the doctor name');
  return 'profile + photo gone; request keeps "Dr. Lakshmi Raman"';
});

await test('Admin care pages on mobile: no sideways scrolling', async () => {
  const { page: m, ctx } = await open({ viewport: { width: 390, height: 844 } });
  await signIn(m);
  const over = [];
  for (const r of ['/admin/doctors', '/admin/doctors/new', `/admin/doctors/${db.sd_doctors[0].id}`, '/admin/specialties', `/admin/specialties/${db.sd_specialties[0].id}`, '/admin/appointments']) {
    await m.goto(BASE + r);
    await m.waitForLoadState('networkidle');
    await m.waitForTimeout(300);
    const o = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (o > 0) over.push(`${r}: ${o}px`);
  }
  await m.locator('[data-testid="appointment-row"]').first().click();
  await m.getByRole('dialog').getByLabel('Status').waitFor();
  const o = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (o > 0) over.push('appointment detail: ' + o);
  if (SHOTS) await m.screenshot({ path: SHOTS + '/admin-appointment-mobile.png' });
  expect(!over.length, over.join(', '));
  await ctx.close();
  return '6 pages + detail panel at 390 px';
});

await test('No anonymous writes except the appointment function; no console errors', async () => {
  expect(log.writesByAnon === 0, `${log.writesByAnon} anonymous table writes`);
  expect(!consoleErrors.length, consoleErrors.slice(0, 3).join(' | '));
  return `${log.appointmentsByAnon} requests via sd_submit_appointment, 0 direct writes, 0 console errors`;
});

await ctxA.close();
await browser.close();
console.log(`\n${results.length - failed} of ${results.length} care tests passed.`);
fs.writeFileSync('scripts/verify-care.json', JSON.stringify(results, null, 2));
process.exit(failed ? 1 : 0);
