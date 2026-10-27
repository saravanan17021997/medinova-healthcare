// A small in-browser stand-in for Supabase (Auth, PostgREST and Storage), used
// only by the automated tests. It mirrors the rules of supabase/01_sd_schema.sql
// that the admin panel and store rely on:
//   * visitors (anon) see only published categories/products/images and cannot write
//   * only the owner account can write
//   * unique slug / SKU, sale price < price, stock >= 0, a category in use cannot be deleted
//   * storage accepts JPEG/PNG/WebP/AVIF up to 5 MB, admins only
//   * site settings are public; menus, homepage sections and facilities only when published
//   * menu and button links must match the database check (/page, https://, mailto:, tel:)
import { randomUUID } from 'node:crypto';
import { contentSeed } from './content-seed.mjs';

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const EXP = Math.floor(Date.now() / 1000) + 3600;

export function createMockSupabase({ SB, seed, care, content = contentSeed }) {
  const OWNER = { id: '11111111-1111-1111-1111-111111111111', email: 'owner@example.com', password: 'correct-horse' };
  const OTHER = { id: '33333333-3333-3333-3333-333333333333', email: 'moneymap.user@example.com', password: 'correct-horse' };
  const users = [OWNER, OTHER];
  const jwt = (u) => `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: u.id, email: u.email, role: 'authenticated', exp: EXP })}.sig`;
  const userObj = (u) => ({ id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email, email_confirmed_at: '2026-10-24T00:00:00Z', app_metadata: {}, user_metadata: {}, created_at: '2026-10-24T00:00:00Z' });
  const now = () => new Date().toISOString();

  // ---------------------------------------------------------------- data
  const db = { sd_categories: [], sd_products: [], sd_product_images: [], sd_specialties: [], sd_doctors: [], sd_appointments: [], sd_site_settings: [], sd_nav_links: [], sd_page_sections: [], sd_facilities: [] };
  const clone = (x) => JSON.parse(JSON.stringify(x));
  content.settings.forEach((r) => db.sd_site_settings.push({ id: randomUUID(), ...clone(r), updated_at: now() }));
  content.nav.forEach((r) => db.sd_nav_links.push({ id: randomUUID(), ...clone(r), created_at: now(), updated_at: now() }));
  content.sections.forEach((r) => db.sd_page_sections.push({ id: randomUUID(), ...clone(r), created_at: now(), updated_at: now() }));
  content.facilities.forEach((r) => db.sd_facilities.push({ id: randomUUID(), ...clone(r), created_at: now(), updated_at: now() }));
  if (care) {
    care.specialties.forEach((s, i) => db.sd_specialties.push({ id: randomUUID(), slug: s.slug, name: s.name, summary: s.summary, description: s.description, reasons: s.reasons, icon: s.icon, image_url: s.image.src, image_small_url: s.image.src.replace(/\.webp$/, '-sm.webp'), image_alt: s.image.alt, image_width: s.image.width, image_height: s.image.height, sort_order: i + 1, published: true, created_at: now(), updated_at: now() }));
    care.doctors.forEach((d, i) => db.sd_doctors.push({ id: randomUUID(), slug: d.slug.toLowerCase(), name: d.name, specialty_id: db.sd_specialties.find((s) => s.slug === d.specialtySlug).id, role: d.role, qualifications: null, registration_no: null, bio: null, languages: d.languages, availability: d.availability, modes: d.modes, focus: d.focus, photo_url: d.image.src, photo_small_url: d.image.src.replace(/\.webp$/, '-sm.webp'), photo_alt: d.image.alt, photo_width: d.image.width, photo_height: d.image.height, is_demo: true, sort_order: i + 1, published: true, created_at: now(), updated_at: now() }));
  }
  seed.categories.forEach((c, i) => db.sd_categories.push({ id: randomUUID(), slug: c.slug, name: c.name, description: c.description, icon_url: c.icon, sort_order: i + 1, published: true, created_at: now(), updated_at: now() }));
  const code = { monitoring: 'MON', 'first-aid': 'AID', protective: 'PRO', diagnostic: 'DIA', storage: 'STO', mobility: 'MOB' };
  const n = {};
  seed.products.forEach((p, i) => {
    n[p.categorySlug] = (n[p.categorySlug] || 0) + 1;
    const id = randomUUID();
    db.sd_products.push({
      id, slug: p.slug, sku: `SD-${code[p.categorySlug]}-${String(n[p.categorySlug]).padStart(3, '0')}`, name: p.name,
      category_id: db.sd_categories.find((c) => c.slug === p.categorySlug).id, price: p.price, discount_price: null, stock: 20, low_stock_threshold: 5,
      summary: p.summary, description: p.description, features: p.features, in_the_box: p.inTheBox, featured: !!p.featured, published: true, is_demo: true,
      sort_order: i + 1, created_at: now(), updated_at: new Date(Date.now() - (100 - i) * 60000).toISOString(),
    });
    p.images.forEach((im, k) => db.sd_product_images.push({ id: randomUUID(), product_id: id, url: im.src, small_url: im.src.replace(/\.webp$/, '-sm.webp'), storage_path: null, alt: im.alt, width: im.width, height: im.height, sort_order: k + 1, created_at: now() }));
  });
  const files = new Map(); // storage path -> { buf, type }
  const log = { calls: [], writesByAnon: 0 };

  // ---------------------------------------------------------------- helpers
  const splitTop = (s) => {
    const out = []; let depth = 0; let cur = '';
    for (const ch of s) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
    }
    if (cur) out.push(cur);
    return out.map((x) => x.trim()).filter(Boolean);
  };
  const REL = { sd_products: { sd_product_images: 'product_id' }, sd_categories: { sd_products: 'category_id' }, sd_specialties: { sd_doctors: 'specialty_id' } };
  const PRIVATE = new Set(['sd_appointments']);

  const visible = (table, row, admin) => {
    if (admin) return true;
    if (PRIVATE.has(table)) return false;
    if (table === 'sd_site_settings') return true;
    if (table === 'sd_product_images') return db.sd_products.some((p) => p.id === row.product_id && p.published);
    return row.published === true;
  };

  function project(table, row, select, admin) {
    if (!select || select === '*') return { ...row };
    const out = {};
    for (const part of splitTop(select)) {
      const m = part.match(/^(?:(\w+):)?(\w+)\((.*)\)$/);
      if (m) {
        const [, alias, rel, inner] = m;
        const fk = REL[table]?.[rel];
        const children = db[rel].filter((r) => r[fk] === row.id && visible(rel, r, admin));
        out[alias || rel] = inner.trim() === 'count' ? [{ count: children.length }] : children.map((c) => project(rel, c, inner, admin));
      } else if (part === '*') Object.assign(out, row);
      else out[part] = row[part];
    }
    return out;
  }

  function applyQuery(table, url, admin) {
    let rows = db[table].filter((r) => visible(table, r, admin));
    for (const [k, v] of url.searchParams) {
      if (['select', 'order', 'limit', 'offset', 'columns', 'on_conflict'].includes(k)) continue;
      const m = v.match(/^(eq|neq)\.(.*)$/);
      if (!m) continue;
      const want = m[2] === 'true' ? true : m[2] === 'false' ? false : m[2];
      rows = rows.filter((r) => (m[1] === 'eq' ? String(r[k]) === String(want) : String(r[k]) !== String(want)));
    }
    const order = url.searchParams.get('order');
    if (order) {
      const keys = order.split(',').map((o) => { const [col, dir] = o.split('.'); return { col, desc: dir === 'desc' }; });
      rows = [...rows].sort((a, b) => {
        for (const { col, desc } of keys) {
          if (a[col] === b[col]) continue;
          const r = a[col] > b[col] ? 1 : -1;
          return desc ? -r : r;
        }
        return 0;
      });
    }
    const limit = Number(url.searchParams.get('limit'));
    if (limit) rows = rows.slice(0, limit);
    return rows;
  }

  const err = (status, code, message, details = null) => ({ status, body: { code, message, details, hint: null } });

  function checkRow(table, row, id) {
    const others = db[table].filter((r) => r.id !== id);
    if ('slug' in row && others.some((r) => r.slug === row.slug)) return err(409, '23505', `duplicate key value violates unique constraint "${table}_slug_key"`, `Key (slug)=(${row.slug}) already exists.`);
    if (table === 'sd_doctors') {
      if (!(row.availability ?? []).every((d) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].includes(d))) return err(400, '23514', 'new row for relation "sd_doctors" violates check constraint "sd_doctors_availability_check"');
      if (!(row.modes ?? []).every((m) => ['In person', 'Video'].includes(m))) return err(400, '23514', 'new row for relation "sd_doctors" violates check constraint "sd_doctors_modes_check"');
    }
    const HREF = /^(\/([^/]|$)|https:\/\/|mailto:|tel:)/;
    const check = (name) => err(400, '23514', `new row for relation "${table}" violates check constraint "${table}_${name}_check"`);
    if (table === 'sd_nav_links') {
      if (!['header', 'footer_explore', 'footer_social'].includes(row.location)) return check('location');
      if (!row.label || row.label.length > 60) return check('label');
      if (!HREF.test(row.href ?? '')) return check('href');
    }
    if (table === 'sd_page_sections') {
      if ('key' in row && others.some((r) => r.key === row.key)) return err(409, '23505', 'duplicate key value violates unique constraint "sd_page_sections_key_key"');
      for (const c of ['cta_href', 'cta2_href']) if (row[c] != null && !HREF.test(row[c])) return check(c);
      if ((row.heading ?? '').length > 200) return check('heading');
      if (!Array.isArray(row.items)) return check('items');
    }
    if (table === 'sd_site_settings') {
      if (!/^[a-z0-9_.]{1,60}$/.test(row.key ?? '')) return check('key');
      if (others.some((r) => r.key === row.key)) return err(409, '23505', 'duplicate key value violates unique constraint "sd_site_settings_pkey"');
    }
    if (table === 'sd_appointments' && !['new', 'contacted', 'confirmed', 'completed', 'cancelled'].includes(row.status)) return err(400, '23514', 'new row for relation "sd_appointments" violates check constraint "sd_appointments_status_check"');
    if (table === 'sd_products') {
      if (others.some((r) => r.sku === row.sku)) return err(409, '23505', 'duplicate key value violates unique constraint "sd_products_sku_key"', `Key (sku)=(${row.sku}) already exists.`);
      if (row.discount_price !== null && row.discount_price !== undefined && !(row.discount_price >= 0 && row.discount_price < row.price)) return err(400, '23514', 'new row for relation "sd_products" violates check constraint "sd_products_check"');
      if (row.stock < 0) return err(400, '23514', 'new row for relation "sd_products" violates check constraint "sd_products_stock_check"');
      if (!db.sd_categories.some((c) => c.id === row.category_id)) return err(409, '23503', 'insert or update on table "sd_products" violates foreign key constraint');
    }
    return null;
  }

  const DEFAULTS = {
    sd_products: { discount_price: null, stock: 0, low_stock_threshold: 5, summary: '', description: '', features: [], in_the_box: [], featured: false, published: false, is_demo: true, sort_order: 0 },
    sd_categories: { description: '', icon_url: null, sort_order: 0, published: true },
    sd_product_images: { small_url: null, storage_path: null, alt: '', width: null, height: null, sort_order: 0 },
    sd_specialties: { summary: '', description: '', reasons: [], icon: 'Stethoscope', image_url: null, image_small_url: null, image_alt: '', image_width: null, image_height: null, sort_order: 0, published: true },
    sd_nav_links: { new_tab: false, sort_order: 0, published: true },
    sd_facilities: { description: '', image_url: null, image_small_url: null, image_alt: '', image_width: null, image_height: null, sort_order: 0, published: true },
    sd_site_settings: {},
    sd_doctors: { specialty_id: null, role: '', qualifications: null, registration_no: null, bio: null, languages: [], availability: [], modes: [], focus: [], photo_url: null, photo_small_url: null, photo_alt: '', photo_width: null, photo_height: null, is_demo: true, sort_order: 0, published: false },
  };

  async function rest(route, req, url, admin) {
    const table = url.pathname.replace('/rest/v1/', '');
    const accept = req.headers()['accept'] || '';
    const single = accept.includes('vnd.pgrst.object');
    const prefer = req.headers()['prefer'] || '';
    const select = url.searchParams.get('select');
    const send = (status, rows) => {
      if (single) {
        if (rows.length !== 1) return route.fulfill({ status: 406, contentType: 'application/json', body: JSON.stringify({ code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned', details: `The result contains ${rows.length} rows` }) });
        return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(rows[0]) });
      }
      return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(rows) });
    };
    const fail = (e) => route.fulfill({ status: e.status, contentType: 'application/json', body: JSON.stringify(e.body) });
    if (!db[table]) return fail(err(404, '42P01', `relation "${table}" does not exist`));
    const method = req.method();

    if (PRIVATE.has(table) && !admin) return fail(err(401, '42501', `permission denied for table ${table}`));
    if (method === 'GET') return send(200, applyQuery(table, url, admin).map((r) => project(table, r, select, admin)));
    if (!admin) {
      log.writesByAnon++;
      return fail(err(401, '42501', `new row violates row-level security policy for table "${table}"`));
    }
    const body = req.postData() ? JSON.parse(req.postData()) : null;
    const ret = prefer.includes('return=representation');

    if (method === 'POST') {
      const list = Array.isArray(body) ? body : [body];
      const created = [];
      const onConflict = url.searchParams.get('on_conflict');
      for (const b of list) {
        const existing = onConflict && prefer.includes('resolution=merge-duplicates') ? db[table].find((r) => r[onConflict] === b[onConflict]) : null;
        if (existing) {
          const next = { ...existing, ...b, updated_at: now() };
          const e = checkRow(table, next, existing.id);
          if (e) return fail(e);
          Object.assign(existing, next);
          created.push(existing);
          continue;
        }
        const row = { id: randomUUID(), ...DEFAULTS[table], ...b, created_at: now(), updated_at: now() };
        const e = checkRow(table, row, row.id);
        if (e) return fail(e);
        db[table].push(row);
        created.push(row);
      }
      return ret ? send(201, created.map((r) => project(table, r, select, admin))) : route.fulfill({ status: 201, body: '' });
    }
    if (method === 'PATCH') {
      const targets = applyQuery(table, url, admin);
      for (const t of targets) {
        const next = { ...t, ...body, updated_at: now() };
        const e = checkRow(table, next, t.id);
        if (e) return fail(e);
      }
      targets.forEach((t) => Object.assign(t, body, { updated_at: now() }));
      return ret ? send(200, targets.map((r) => project(table, r, select, admin))) : route.fulfill({ status: 204, body: '' });
    }
    if (method === 'DELETE') {
      const targets = applyQuery(table, url, admin);
      if (table === 'sd_categories' && targets.some((c) => db.sd_products.some((p) => p.category_id === c.id)))
        return fail(err(409, '23503', 'update or delete on table "sd_categories" violates foreign key constraint "sd_products_category_id_fkey" on table "sd_products"'));
      db[table] = db[table].filter((r) => !targets.includes(r));
      if (table === 'sd_products') db.sd_product_images = db.sd_product_images.filter((i) => !targets.some((t) => t.id === i.product_id));
      // real schema: ON DELETE SET NULL
      if (table === 'sd_specialties') db.sd_doctors.forEach((d) => targets.some((t) => t.id === d.specialty_id) && (d.specialty_id = null));
      if (table === 'sd_doctors') db.sd_appointments.forEach((a) => targets.some((t) => t.id === a.doctor_id) && (a.doctor_id = null));
      return ret ? send(200, targets.map((r) => project(table, r, select, admin))) : route.fulfill({ status: 204, body: '' });
    }
    return fail(err(405, 'PGRST000', 'method not allowed'));
  }

  // ---------------------------------------------------------------- install on a page
  async function install(page, { failCatalog = false } = {}) {
    const tokenUser = (req) => {
      const t = (req.headers()['authorization'] || '').replace(/^Bearer /, '');
      return users.find((u) => t === jwt(u)) || null;
    };
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': '*' };
    await page.route(SB + '/**', async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      log.calls.push(`${req.method()} ${url.pathname}`);
      const json = (status, body) => route.fulfill({ status, contentType: 'application/json', headers: cors, body: JSON.stringify(body) });
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
      const u = tokenUser(req);
      const admin = u?.id === OWNER.id;

      if (url.pathname === '/auth/v1/token') {
        const b = JSON.parse(req.postData() || '{}');
        const found = users.find((x) => x.email === b.email && x.password === b.password);
        if (!found) return json(400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
        return json(200, { access_token: jwt(found), token_type: 'bearer', expires_in: 3600, expires_at: EXP, refresh_token: 'r-' + found.id, user: userObj(found) });
      }
      if (url.pathname === '/auth/v1/user') return u ? json(200, userObj(u)) : json(401, { msg: 'invalid JWT' });
      if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204, headers: cors });

      if (url.pathname === '/rest/v1/sd_admins') return json(200, admin && url.searchParams.get('user_id') === 'eq.' + OWNER.id ? [{ role: 'owner' }] : []);
      if (url.pathname === '/rest/v1/rpc/sd_admin_dashboard') {
        if (!admin) return json(400, { message: 'Admins only.', code: 'P0001' });
        const pub = db.sd_products.filter((p) => p.published);
        return json(200, { published_products: pub.length, low_stock: pub.filter((p) => p.stock <= p.low_stock_threshold).map(({ id, name, sku, stock, low_stock_threshold }) => ({ id, name, sku, stock, low_stock_threshold })), orders_by_status: {}, appointments_by_status: db.sd_appointments.reduce((m, a) => ({ ...m, [a.status]: (m[a.status] || 0) + 1 }), {}), new_messages: 0, recent_activity: [] });
      }
      if (url.pathname === '/rest/v1/rpc/sd_submit_appointment') {
        if (failCatalog) return json(503, { message: 'Service unavailable' });
        const b = JSON.parse(req.postData() || '{}');
        const fail = (m) => json(400, { code: 'P0001', message: m });
        const spec = db.sd_specialties.find((s) => s.slug === b.p_specialty_slug && s.published);
        if (!spec) return fail('Choose a specialty from the list.');
        let doc = null;
        if (b.p_doctor_slug) {
          doc = db.sd_doctors.find((d) => d.slug === b.p_doctor_slug && d.published);
          if (!doc || doc.specialty_id !== spec.id) return fail('Choose a doctor who works in the selected specialty.');
        }
        const phone = String(b.p_phone || '').replace(/[\s()-]/g, '');
        if (!/^\+?[0-9]{8,15}$/.test(phone)) return fail('Enter a 10-digit mobile number, or an international number starting with +.');
        if (!b.p_name || b.p_name.trim().length < 2) return fail('Enter a name (2 to 100 characters).');
        const today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
        if (b.p_preferred_date && b.p_preferred_date < today) return fail('Choose a date from today up to six months ahead.');
        const reference = 'APT-' + today.slice(2).replace(/-/g, '') + '-' + randomUUID().slice(0, 6).toUpperCase();
        db.sd_appointments.push({ id: randomUUID(), reference, patient_name: b.p_name.trim(), phone, email: b.p_email || null, specialty_id: spec.id, doctor_id: doc?.id ?? null, specialty_name: spec.name, doctor_name: doc?.name ?? null, preferred_date: b.p_preferred_date, time_of_day: b.p_time_of_day, notes: b.p_notes || null, status: 'new', admin_notes: null, created_at: now(), updated_at: now() });
        log.appointmentsByAnon = (log.appointmentsByAnon || 0) + (u ? 0 : 1);
        return json(200, reference);
      }
      if (url.pathname.startsWith('/rest/v1/')) {
        if (failCatalog && !u) return json(503, { message: 'Service unavailable' });
        return rest(route, req, url, admin);
      }

      // storage
      const pub = url.pathname.match(/^\/storage\/v1\/object\/public\/sd-media\/(.+)$/);
      if (pub) {
        const f = files.get(decodeURIComponent(pub[1]));
        return f ? route.fulfill({ status: 200, contentType: f.type, headers: cors, body: f.buf }) : json(404, { message: 'Object not found' });
      }
      const obj = url.pathname.match(/^\/storage\/v1\/object\/sd-media\/(.+)$/);
      if (obj && req.method() === 'POST') {
        if (!admin) return json(403, { statusCode: '403', error: 'Unauthorized', message: 'new row violates row-level security policy' });
        const type = req.headers()['content-type'];
        const buf = req.postDataBuffer() ?? Buffer.alloc(0);
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(type)) return json(415, { statusCode: '415', message: `mime type ${type} is not supported` });
        if (buf.length > 5 * 1024 * 1024) return json(413, { statusCode: '413', message: 'The object exceeded the maximum allowed size' });
        const path = decodeURIComponent(obj[1]);
        if (files.has(path)) return json(409, { statusCode: '409', message: 'The resource already exists' });
        files.set(path, { buf, type });
        return json(200, { Key: 'sd-media/' + path });
      }
      if (url.pathname === '/storage/v1/object/sd-media' && req.method() === 'DELETE') {
        if (!admin) return json(403, { message: 'Unauthorized' });
        const { prefixes = [] } = JSON.parse(req.postData() || '{}');
        prefixes.forEach((p) => files.delete(p));
        return json(200, prefixes.map((name) => ({ name })));
      }
      return json(404, { message: 'not mocked: ' + req.method() + ' ' + url.pathname });
    });
  }

  return { db, files, log, install, OWNER, OTHER };
}
