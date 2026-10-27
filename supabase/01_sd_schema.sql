-- =====================================================================
-- SaraDev Healthcare: admin panel schema (step 1 of 4)
-- ---------------------------------------------------------------------
-- Safe to run in a Supabase project that already holds other apps:
--   * every table, function, trigger and policy starts with "sd_"
--   * nothing existing is altered or dropped
--   * re-running this file is harmless (IF NOT EXISTS / DROP ... IF EXISTS
--     only on sd_ objects)
-- Run in: Supabase Dashboard -> SQL Editor -> New query -> Run
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Helper functions (prefixed, so the other app's functions are untouched)
-- ---------------------------------------------------------------------
create or replace function public.sd_new_reference(p_prefix text)
returns text language sql volatile set search_path = public as $$
  select p_prefix || '-' || to_char(now() at time zone 'Asia/Kolkata', 'YYMMDD') || '-'
         || upper(substr(md5(gen_random_uuid()::text), 1, 6));
$$;

create or replace function public.sd_set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. Admin allow-list (being logged in grants nothing by itself)
-- ---------------------------------------------------------------------
create table if not exists public.sd_admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  role       text not null default 'editor' check (role in ('owner', 'editor')),
  created_at timestamptz not null default now()
);

create or replace function public.sd_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.sd_admins where user_id = auth.uid());
$$;

create or replace function public.sd_is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.sd_admins where user_id = auth.uid() and role = 'owner');
$$;

-- Never allow the last owner to be removed or demoted.
create or replace function public.sd_protect_last_owner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.role = 'owner'
     and (tg_op = 'DELETE' or new.role <> 'owner')
     and (select count(*) from public.sd_admins where role = 'owner') <= 1 then
    raise exception 'You cannot remove or demote the last owner. Add another owner first.';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists sd_admins_protect_last_owner on public.sd_admins;
create trigger sd_admins_protect_last_owner
  before update or delete on public.sd_admins
  for each row execute function public.sd_protect_last_owner();

-- ---------------------------------------------------------------------
-- 3. Catalogue: categories, products, product images
-- ---------------------------------------------------------------------
create table if not exists public.sd_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null check (char_length(name) between 1 and 80),
  description text not null default '' check (char_length(description) <= 500),
  icon_url    text check (icon_url is null or icon_url ~ '^(/|https://)'),
  sort_order  integer not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.sd_products (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sku                 text not null unique check (sku ~ '^[A-Z0-9][A-Z0-9-]{1,39}$'),
  name                text not null check (char_length(name) between 1 and 120),
  category_id         uuid not null references public.sd_categories (id) on delete restrict,
  price               numeric(10, 2) not null check (price >= 0 and price <= 1000000),
  discount_price      numeric(10, 2) check (discount_price is null or (discount_price >= 0 and discount_price < price)),
  stock               integer not null default 0 check (stock >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  summary             text not null default '' check (char_length(summary) <= 200),
  description         text not null default '' check (char_length(description) <= 4000),
  features            text[] not null default '{}',
  in_the_box          text[] not null default '{}',
  featured            boolean not null default false,
  published           boolean not null default false,
  is_demo             boolean not null default true,
  sort_order          integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists sd_products_category_idx on public.sd_products (category_id);
create index if not exists sd_products_published_idx on public.sd_products (published);

create table if not exists public.sd_product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.sd_products (id) on delete cascade,
  url          text not null check (url ~ '^(/|https://)'),
  small_url    text check (small_url is null or small_url ~ '^(/|https://)'),
  storage_path text,
  alt          text not null default '' check (char_length(alt) <= 200),
  width        integer check (width is null or width > 0),
  height       integer check (height is null or height > 0),
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);
create index if not exists sd_product_images_product_idx on public.sd_product_images (product_id, sort_order);

-- ---------------------------------------------------------------------
-- 4. Care content: specialties, doctors, facilities
-- ---------------------------------------------------------------------
create table if not exists public.sd_specialties (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name              text not null check (char_length(name) between 1 and 80),
  summary           text not null default '' check (char_length(summary) <= 200),
  description       text not null default '' check (char_length(description) <= 4000),
  reasons           text[] not null default '{}',
  icon              text not null default 'Stethoscope' check (icon ~ '^[A-Za-z0-9]{1,40}$'),
  image_url         text check (image_url is null or image_url ~ '^(/|https://)'),
  image_small_url   text check (image_small_url is null or image_small_url ~ '^(/|https://)'),
  image_alt         text not null default '',
  image_width       integer,
  image_height      integer,
  sort_order        integer not null default 0,
  published         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.sd_doctors (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name              text not null check (char_length(name) between 1 and 100),
  specialty_id      uuid references public.sd_specialties (id) on delete set null,
  role              text not null default '' check (char_length(role) <= 100),
  qualifications    text check (qualifications is null or char_length(qualifications) <= 300),
  registration_no   text check (registration_no is null or char_length(registration_no) <= 60),
  bio               text check (bio is null or char_length(bio) <= 4000),
  languages         text[] not null default '{}',
  availability      text[] not null default '{}'
                    check (availability <@ array['Mon','Tue','Wed','Thu','Fri','Sat','Sun']::text[]),
  modes             text[] not null default '{}'
                    check (modes <@ array['In person','Video']::text[]),
  focus             text[] not null default '{}',
  photo_url         text check (photo_url is null or photo_url ~ '^(/|https://)'),
  photo_small_url   text check (photo_small_url is null or photo_small_url ~ '^(/|https://)'),
  photo_alt         text not null default '',
  photo_width       integer,
  photo_height      integer,
  is_demo           boolean not null default true,
  sort_order        integer not null default 0,
  published         boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists sd_doctors_specialty_idx on public.sd_doctors (specialty_id);

create table if not exists public.sd_facilities (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name              text not null check (char_length(name) between 1 and 100),
  description       text not null default '' check (char_length(description) <= 2000),
  image_url         text check (image_url is null or image_url ~ '^(/|https://)'),
  image_small_url   text check (image_small_url is null or image_small_url ~ '^(/|https://)'),
  image_alt         text not null default '',
  image_width       integer,
  image_height      integer,
  sort_order        integer not null default 0,
  published         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 5. Website content: settings, navigation, page sections
-- ---------------------------------------------------------------------
-- Key/value settings: brand, contact, hours, location, social, footer, features.
create table if not exists public.sd_site_settings (
  key        text primary key check (key ~ '^[a-z0-9_.]{1,60}$'),
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- Links only allow site paths, https, mailto and tel (blocks javascript: links).
create table if not exists public.sd_nav_links (
  id          uuid primary key default gen_random_uuid(),
  location    text not null check (location in ('header', 'footer_explore', 'footer_social')),
  label       text not null check (char_length(label) between 1 and 60),
  href        text not null check (href ~ '^(/([^/]|$)|https://|mailto:|tel:)'),
  new_tab     boolean not null default false,
  sort_order  integer not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.sd_page_sections (
  id               uuid primary key default gen_random_uuid(),
  key              text not null unique check (key ~ '^[a-z0-9_.]{1,60}$'),
  heading          text not null default '' check (char_length(heading) <= 200),
  body             text not null default '' check (char_length(body) <= 4000),
  image_url        text check (image_url is null or image_url ~ '^(/|https://)'),
  image_small_url  text check (image_small_url is null or image_small_url ~ '^(/|https://)'),
  image_alt        text not null default '',
  cta_label        text check (cta_label is null or char_length(cta_label) <= 60),
  cta_href         text check (cta_href is null or cta_href ~ '^(/([^/]|$)|https://|mailto:|tel:)'),
  cta2_label       text check (cta2_label is null or char_length(cta2_label) <= 60),
  cta2_href        text check (cta2_href is null or cta2_href ~ '^(/([^/]|$)|https://|mailto:|tel:)'),
  items            jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  sort_order       integer not null default 0,
  published        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 6. Submissions from visitors (personal data: admins only can read)
-- ---------------------------------------------------------------------
create table if not exists public.sd_appointments (
  id             uuid primary key default gen_random_uuid(),
  reference      text not null unique default public.sd_new_reference('APT'),
  patient_name   text not null check (char_length(patient_name) between 2 and 100),
  phone          text not null check (phone ~ '^\+?[0-9]{8,15}$'),
  email          text check (email is null or email ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'),
  specialty_id   uuid references public.sd_specialties (id) on delete set null,
  doctor_id      uuid references public.sd_doctors (id) on delete set null,
  specialty_name text,
  doctor_name    text,
  preferred_date date,
  time_of_day    text check (time_of_day is null or char_length(time_of_day) <= 40),
  notes          text check (notes is null or char_length(notes) <= 300),
  status         text not null default 'new'
                 check (status in ('new', 'contacted', 'confirmed', 'completed', 'cancelled')),
  admin_notes    text check (admin_notes is null or char_length(admin_notes) <= 2000),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists sd_appointments_status_idx on public.sd_appointments (status, created_at desc);

create table if not exists public.sd_contact_messages (
  id          uuid primary key default gen_random_uuid(),
  reference   text not null unique default public.sd_new_reference('MSG'),
  name        text not null check (char_length(name) between 2 and 100),
  phone       text check (phone is null or phone ~ '^\+?[0-9]{8,15}$'),
  email       text check (email is null or email ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'),
  message     text not null check (char_length(message) between 1 and 2000),
  status      text not null default 'new' check (status in ('new', 'read', 'replied', 'archived')),
  admin_notes text check (admin_notes is null or char_length(admin_notes) <= 2000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  check (phone is not null or email is not null)
);
create index if not exists sd_contact_messages_status_idx on public.sd_contact_messages (status, created_at desc);

-- Orders. No card data is ever stored. payment_status can only be changed by
-- a trusted backend (service role), never from the admin panel in the browser.
create table if not exists public.sd_orders (
  id             uuid primary key default gen_random_uuid(),
  reference      text not null unique default public.sd_new_reference('ORD'),
  customer_name  text not null check (char_length(customer_name) between 2 and 100),
  phone          text not null check (phone ~ '^\+?[0-9]{8,15}$'),
  email          text check (email is null or email ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'),
  address        text not null check (char_length(address) between 3 and 300),
  city           text not null check (char_length(city) between 2 and 80),
  pin            text not null check (pin ~ '^[1-9][0-9]{5}$'),
  status         text not null default 'pending'
                 check (status in ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'refunded')),
  subtotal       numeric(12, 2) not null check (subtotal >= 0),
  item_count     integer not null check (item_count > 0),
  admin_notes    text check (admin_notes is null or char_length(admin_notes) <= 2000),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists sd_orders_status_idx on public.sd_orders (status, created_at desc);

create table if not exists public.sd_order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.sd_orders (id) on delete cascade,
  product_id   uuid references public.sd_products (id) on delete set null,
  product_name text not null,
  sku          text,
  unit_price   numeric(10, 2) not null check (unit_price >= 0),
  qty          integer not null check (qty between 1 and 10),
  line_total   numeric(12, 2) not null check (line_total >= 0)
);
create index if not exists sd_order_items_order_idx on public.sd_order_items (order_id);

-- ---------------------------------------------------------------------
-- 7. Audit history (written by triggers only)
-- ---------------------------------------------------------------------
create table if not exists public.sd_audit_log (
  id          bigint generated always as identity primary key,
  admin_id    uuid,
  admin_email text,
  action      text not null,
  table_name  text not null,
  record_id   text,
  before      jsonb,
  after       jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists sd_audit_log_created_idx on public.sd_audit_log (created_at desc);

create or replace function public.sd_audit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_new jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  v_old jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
begin
  -- Log admins and the SQL Editor / trusted backend. Skip side effects of a
  -- visitor's order (e.g. stock going down), which would otherwise flood the log.
  if coalesce(auth.role(), '') = 'anon' or (auth.uid() is not null and not public.sd_is_admin()) then
    return coalesce(new, old);
  end if;
  insert into public.sd_audit_log (admin_id, admin_email, action, table_name, record_id, before, after)
  values (
    auth.uid(),
    (select email from auth.users where id = auth.uid()),
    tg_op,
    tg_table_name,
    coalesce(v_new ->> 'id', v_old ->> 'id', v_new ->> 'user_id', v_old ->> 'user_id', v_new ->> 'key', v_old ->> 'key'),
    v_old,
    v_new
  );
  return coalesce(new, old);
end;
$$;

-- ---------------------------------------------------------------------
-- 8. Order safety: cancelled is final, and cancelling returns the stock
-- ---------------------------------------------------------------------
create or replace function public.sd_order_status_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'cancelled' and new.status <> 'cancelled' then
    raise exception 'A cancelled order cannot be reopened.';
  end if;
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    update public.sd_products p
       set stock = p.stock + i.qty
      from public.sd_order_items i
     where i.order_id = new.id and i.product_id = p.id;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 9. Triggers: updated_at and audit history
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['sd_categories','sd_products','sd_specialties','sd_doctors','sd_facilities',
                           'sd_site_settings','sd_nav_links','sd_page_sections',
                           'sd_appointments','sd_contact_messages','sd_orders']
  loop
    execute format('drop trigger if exists %I on public.%I', t || '_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.sd_set_updated_at()', t || '_updated_at', t);
  end loop;

  -- full history for content managed by admins
  foreach t in array array['sd_admins','sd_categories','sd_products','sd_product_images','sd_specialties',
                           'sd_doctors','sd_facilities','sd_site_settings','sd_nav_links','sd_page_sections']
  loop
    execute format('drop trigger if exists %I on public.%I', t || '_audit', t);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.sd_audit()', t || '_audit', t);
  end loop;

  -- visitor submissions: only admin changes are logged, not the public insert
  foreach t in array array['sd_appointments','sd_contact_messages','sd_orders']
  loop
    execute format('drop trigger if exists %I on public.%I', t || '_audit', t);
    execute format('create trigger %I after update or delete on public.%I for each row execute function public.sd_audit()', t || '_audit', t);
  end loop;
end $$;

drop trigger if exists sd_orders_status_guard on public.sd_orders;
create trigger sd_orders_status_guard
  before update of status on public.sd_orders
  for each row execute function public.sd_order_status_guard();

create or replace function public.sd_clean_phone(p text)
returns text language plpgsql immutable set search_path = public as $$
declare v text := regexp_replace(coalesce(p, ''), '[\s()-]', '', 'g');
begin
  if v !~ '^\+?[0-9]{8,15}$' then
    raise exception 'Enter a 10-digit mobile number, or an international number starting with +.';
  end if;
  return v;
end;
$$;

create or replace function public.sd_check_email(p text)
returns text language plpgsql immutable set search_path = public as $$
declare v text := nullif(trim(coalesce(p, '')), '');
begin
  if v is not null and v !~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' then
    raise exception 'Enter an email address like name@example.com, or leave it empty.';
  end if;
  return lower(v);
end;
$$;

create or replace function public.sd_check_name(p text)
returns text language plpgsql immutable set search_path = public as $$
declare v text := trim(coalesce(p, ''));
begin
  if char_length(v) not between 2 and 100 then raise exception 'Enter a name (2 to 100 characters).'; end if;
  return v;
end;
$$;

-- ---------------------------------------------------------------------
-- 10. Public actions (visitors call these; they cannot write tables directly)
-- ---------------------------------------------------------------------
create or replace function public.sd_submit_appointment(
  p_name text, p_phone text, p_specialty_slug text, p_time_of_day text,
  p_email text default null, p_doctor_slug text default null,
  p_preferred_date date default null, p_notes text default null)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_spec  public.sd_specialties%rowtype;
  v_doc   public.sd_doctors%rowtype;
  v_name  text := public.sd_check_name(p_name);
  v_phone text := public.sd_clean_phone(p_phone);
  v_email text := public.sd_check_email(p_email);
  v_today date := (now() at time zone 'Asia/Kolkata')::date;
  v_ref   text;
begin
  if char_length(coalesce(p_notes, '')) > 300 then raise exception 'Keep the note to 300 characters or fewer.'; end if;
  select * into v_spec from public.sd_specialties where slug = p_specialty_slug and published;
  if not found then raise exception 'Choose a specialty from the list.'; end if;

  if nullif(trim(p_doctor_slug), '') is not null then
    select * into v_doc from public.sd_doctors where slug = p_doctor_slug and published;
    if not found or v_doc.specialty_id is distinct from v_spec.id then
      raise exception 'Choose a doctor who works in the selected specialty.';
    end if;
  end if;

  if p_preferred_date is not null and (p_preferred_date < v_today or p_preferred_date > v_today + 180) then
    raise exception 'Choose a date from today up to six months ahead.';
  end if;

  insert into public.sd_appointments (patient_name, phone, email, specialty_id, doctor_id, specialty_name,
                                      doctor_name, preferred_date, time_of_day, notes)
  values (v_name, v_phone, v_email, v_spec.id, v_doc.id, v_spec.name,
          v_doc.name, p_preferred_date, nullif(trim(p_time_of_day), ''), nullif(trim(p_notes), ''))
  returning reference into v_ref;
  return v_ref;
end;
$$;

create or replace function public.sd_submit_contact(
  p_name text, p_message text, p_phone text default null, p_email text default null)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_ref   text;
  v_phone text := case when nullif(trim(coalesce(p_phone, '')), '') is null then null else public.sd_clean_phone(p_phone) end;
  v_email text := public.sd_check_email(p_email);
begin
  if v_phone is null and v_email is null then raise exception 'Add a phone number or an email address so we can reply.'; end if;
  if char_length(trim(coalesce(p_message, ''))) not between 1 and 2000 then raise exception 'Write a message (up to 2000 characters).'; end if;
  insert into public.sd_contact_messages (name, phone, email, message)
  values (public.sd_check_name(p_name), v_phone, v_email, trim(p_message))
  returning reference into v_ref;
  return v_ref;
end;
$$;

-- Prices and availability are always taken from the database, never from the browser.
-- p_items: [{"slug": "digital-thermometer", "qty": 2}, ...]
create or replace function public.sd_place_order(
  p_name text, p_phone text, p_address text, p_city text, p_pin text,
  p_items jsonb, p_email text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_line     record;
  v_prod     public.sd_products%rowtype;
  v_price    numeric(10, 2);
  v_order_id uuid;
  v_ref      text;
  v_subtotal numeric(12, 2) := 0;
  v_count    integer := 0;
begin
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) not between 1 and 20 then
    raise exception 'The cart must contain between 1 and 20 different products.';
  end if;
  if char_length(trim(coalesce(p_address, ''))) not between 3 and 300 then raise exception 'Enter a delivery address.'; end if;
  if char_length(trim(coalesce(p_city, ''))) not between 2 and 80 then raise exception 'Enter a town or city.'; end if;
  if trim(coalesce(p_pin, '')) !~ '^[1-9][0-9]{5}$' then raise exception 'Enter a 6-digit PIN code.'; end if;

  insert into public.sd_orders (customer_name, phone, email, address, city, pin, subtotal, item_count)
  values (public.sd_check_name(p_name), public.sd_clean_phone(p_phone), public.sd_check_email(p_email),
          trim(p_address), trim(p_city), trim(p_pin), 0, 1)
  returning id, reference into v_order_id, v_ref;

  for v_line in
    select e ->> 'slug' as slug, sum((e ->> 'qty')::int) as qty
      from jsonb_array_elements(p_items) e
     group by e ->> 'slug'
  loop
    if v_line.qty is null or v_line.qty < 1 or v_line.qty > 10 then
      raise exception 'Quantity must be between 1 and 10 for each product.';
    end if;

    select * into v_prod from public.sd_products where slug = v_line.slug and published for update;
    if not found then
      raise exception 'A product in your cart is no longer available: %', v_line.slug;
    end if;
    if v_prod.stock < v_line.qty then
      raise exception 'Only % left of %.', v_prod.stock, v_prod.name;
    end if;

    v_price := coalesce(v_prod.discount_price, v_prod.price);
    insert into public.sd_order_items (order_id, product_id, product_name, sku, unit_price, qty, line_total)
    values (v_order_id, v_prod.id, v_prod.name, v_prod.sku, v_price, v_line.qty, v_price * v_line.qty);
    update public.sd_products set stock = stock - v_line.qty where id = v_prod.id;

    v_subtotal := v_subtotal + v_price * v_line.qty;
    v_count := v_count + v_line.qty;
  end loop;

  update public.sd_orders set subtotal = v_subtotal, item_count = v_count where id = v_order_id;
  return jsonb_build_object('reference', v_ref, 'subtotal', v_subtotal, 'item_count', v_count);
end;
$$;

-- ---------------------------------------------------------------------
-- 11. Admin actions
-- ---------------------------------------------------------------------
-- Real figures only, for the admin dashboard.
create or replace function public.sd_admin_dashboard()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.sd_is_admin() then raise exception 'Admins only.'; end if;
  return jsonb_build_object(
    'published_products', (select count(*) from public.sd_products where published),
    'low_stock', coalesce((select jsonb_agg(x) from (
        select id, name, sku, stock, low_stock_threshold from public.sd_products
         where published and stock <= low_stock_threshold order by stock limit 20) x), '[]'::jsonb),
    'orders_by_status', coalesce((select jsonb_object_agg(status, n) from (
        select status, count(*) n from public.sd_orders group by status) x), '{}'::jsonb),
    'appointments_by_status', coalesce((select jsonb_object_agg(status, n) from (
        select status, count(*) n from public.sd_appointments group by status) x), '{}'::jsonb),
    'new_messages', (select count(*) from public.sd_contact_messages where status = 'new'),
    'recent_activity', coalesce((select jsonb_agg(x) from (
        select id, admin_email, action, table_name, record_id, created_at
          from public.sd_audit_log order by created_at desc limit 10) x), '[]'::jsonb)
  );
end;
$$;

-- Owners add admins by email. The person must already have a login
-- (create it in Dashboard -> Authentication -> Users -> Add user).
create or replace function public.sd_add_admin(p_email text, p_role text default 'editor')
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.sd_is_owner() then raise exception 'Only an owner can add admins.'; end if;
  if p_role not in ('owner', 'editor') then raise exception 'Role must be owner or editor.'; end if;
  select id into v_id from auth.users where lower(email) = lower(trim(p_email));
  if v_id is null then
    raise exception 'No login exists for %. Create the user in Authentication first.', p_email;
  end if;
  insert into public.sd_admins (user_id, email, role) values (v_id, lower(trim(p_email)), p_role)
  on conflict (user_id) do update set role = excluded.role;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 12. Row Level Security
-- ---------------------------------------------------------------------
alter table public.sd_admins           enable row level security;
alter table public.sd_categories       enable row level security;
alter table public.sd_products         enable row level security;
alter table public.sd_product_images   enable row level security;
alter table public.sd_specialties      enable row level security;
alter table public.sd_doctors          enable row level security;
alter table public.sd_facilities       enable row level security;
alter table public.sd_site_settings    enable row level security;
alter table public.sd_nav_links        enable row level security;
alter table public.sd_page_sections    enable row level security;
alter table public.sd_appointments     enable row level security;
alter table public.sd_contact_messages enable row level security;
alter table public.sd_orders           enable row level security;
alter table public.sd_order_items      enable row level security;
alter table public.sd_audit_log        enable row level security;

-- Public content: visitors read published rows; admins read and edit everything.
do $$
declare t text;
begin
  foreach t in array array['sd_categories','sd_products','sd_specialties','sd_doctors','sd_facilities',
                           'sd_nav_links','sd_page_sections']
  loop
    execute format('drop policy if exists %I on public.%I', 'sd_public_read', t);
    execute format('create policy %I on public.%I for select to anon, authenticated using (published)', 'sd_public_read', t);
    execute format('drop policy if exists %I on public.%I', 'sd_admin_all', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.sd_is_admin()) with check (public.sd_is_admin())', 'sd_admin_all', t);
  end loop;
end $$;

drop policy if exists sd_public_read on public.sd_product_images;
create policy sd_public_read on public.sd_product_images for select to anon, authenticated
  using (exists (select 1 from public.sd_products p where p.id = product_id and p.published));
drop policy if exists sd_admin_all on public.sd_product_images;
create policy sd_admin_all on public.sd_product_images for all to authenticated
  using (public.sd_is_admin()) with check (public.sd_is_admin());

drop policy if exists sd_public_read on public.sd_site_settings;
create policy sd_public_read on public.sd_site_settings for select to anon, authenticated using (true);
drop policy if exists sd_admin_all on public.sd_site_settings;
create policy sd_admin_all on public.sd_site_settings for all to authenticated
  using (public.sd_is_admin()) with check (public.sd_is_admin());

-- Admin list: you can see your own row (so the app knows you are an admin);
-- admins see the list; only owners change it.
drop policy if exists sd_admins_read on public.sd_admins;
create policy sd_admins_read on public.sd_admins for select to authenticated
  using (user_id = auth.uid() or public.sd_is_admin());
drop policy if exists sd_admins_owner_write on public.sd_admins;
create policy sd_admins_owner_write on public.sd_admins for all to authenticated
  using (public.sd_is_owner()) with check (public.sd_is_owner());

-- Personal data: admins only. Visitors insert through the functions above.
do $$
declare t text;
begin
  foreach t in array array['sd_appointments','sd_contact_messages','sd_orders','sd_order_items']
  loop
    execute format('drop policy if exists %I on public.%I', 'sd_admin_read', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.sd_is_admin())', 'sd_admin_read', t);
  end loop;
  foreach t in array array['sd_appointments','sd_contact_messages','sd_orders']
  loop
    execute format('drop policy if exists %I on public.%I', 'sd_admin_update', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.sd_is_admin()) with check (public.sd_is_admin())', 'sd_admin_update', t);
    execute format('drop policy if exists %I on public.%I', 'sd_owner_delete', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.sd_is_owner())', 'sd_owner_delete', t);
  end loop;
end $$;

drop policy if exists sd_admin_read on public.sd_audit_log;
create policy sd_admin_read on public.sd_audit_log for select to authenticated using (public.sd_is_admin());

-- ---------------------------------------------------------------------
-- 13. Table and function permissions (on top of RLS)
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['sd_admins','sd_categories','sd_products','sd_product_images','sd_specialties',
                           'sd_doctors','sd_facilities','sd_site_settings','sd_nav_links','sd_page_sections',
                           'sd_appointments','sd_contact_messages','sd_orders','sd_order_items','sd_audit_log']
  loop
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;

  foreach t in array array['sd_categories','sd_products','sd_product_images','sd_specialties','sd_doctors',
                           'sd_facilities','sd_site_settings','sd_nav_links','sd_page_sections']
  loop
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

grant select, insert, update, delete on public.sd_admins to authenticated;
grant select, update, delete on public.sd_appointments, public.sd_contact_messages to authenticated;
grant select, delete on public.sd_orders to authenticated;
grant update (status, admin_notes) on public.sd_orders to authenticated;  -- not payment_status
grant select on public.sd_order_items, public.sd_audit_log to authenticated;

revoke all on function public.sd_new_reference(text) from public, anon, authenticated;
revoke all on function public.sd_clean_phone(text) from public, anon, authenticated;
revoke all on function public.sd_check_email(text) from public, anon, authenticated;
revoke all on function public.sd_check_name(text) from public, anon, authenticated;
revoke all on function public.sd_set_updated_at() from public, anon, authenticated;
revoke all on function public.sd_protect_last_owner() from public, anon, authenticated;
revoke all on function public.sd_audit() from public, anon, authenticated;
revoke all on function public.sd_order_status_guard() from public, anon, authenticated;

revoke all on function public.sd_is_admin() from public;
revoke all on function public.sd_is_owner() from public;
grant execute on function public.sd_is_admin(), public.sd_is_owner() to anon, authenticated;

revoke all on function public.sd_submit_appointment(text, text, text, text, text, text, date, text) from public;
revoke all on function public.sd_submit_contact(text, text, text, text) from public;
revoke all on function public.sd_place_order(text, text, text, text, text, jsonb, text) from public;
grant execute on function public.sd_submit_appointment(text, text, text, text, text, text, date, text) to anon, authenticated;
grant execute on function public.sd_submit_contact(text, text, text, text) to anon, authenticated;
grant execute on function public.sd_place_order(text, text, text, text, text, jsonb, text) to anon, authenticated;

revoke all on function public.sd_admin_dashboard() from public, anon;
revoke all on function public.sd_add_admin(text, text) from public, anon;
grant execute on function public.sd_admin_dashboard(), public.sd_add_admin(text, text) to authenticated;

-- Done. Next: 02_sd_seed.sql
