# MediNova Healthcare: demonstration website

A responsive healthcare website with a doctor directory, appointment requests, a small health-essentials store with cart and checkout (saved to the database when Supabase is set up, a demo otherwise), and a complete local image library.

Stack: React 18, Vite 5, TypeScript, Tailwind CSS 3, React Router 6 and Lucide icons. Fonts (Fraunces and Figtree) are self-hosted.

> **MediNova is a fictional brand.** Every doctor profile, product, price, phone number and address is demonstration content, and the site says so on every page. Before using it for a real organisation, replace the content with verified details (see *Going live*).

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # image check → sitemap → type check → production build in dist/
npm run preview    # serve dist/ on http://localhost:4173
```

Node 18.18 or later is required (tested on Node 22).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Runs `check:images` and `sitemap`, then `tsc -b` and `vite build`. **Fails if any image is missing, unreadable, the wrong size or hotlinked.** |
| `npm run preview` | Serves the production build |
| `npm run images` | Re-renders every image in `public/images` and the icons from code (`scripts/images/`) |
| `npm run check:images` | Verifies every image referenced by pages, components, CSS, `index.html`, the web manifest and the data files |
| `npm run sitemap` | Writes `public/sitemap.xml` and `public/robots.txt` |
| `npm run verify` | Browser test in Chromium (Playwright), run against `npm run preview`. It loads every route at desktop, tablet, mobile and 2× desktop; checks for broken images, failed requests, console errors, horizontal overflow and missing alt text; runs 13 interaction tests; and decodes every generated image. Writes `scripts/verify-report.json`. Use `BASE_URL=…` to test another server, and `--screenshots=dir` to save screenshots. |
| `npm run manifest` | Regenerates `IMAGE_MANIFEST.md` (from a fresh disk check plus the verify report) and `IMAGE_PROMPTS.md` |

## What's included

- **Pages:** home, specialties (plus 10 detail pages), doctors (directory with search and filters, plus 10 profiles), facilities, appointment, store (search, category and price filters, sort), product detail (3-image gallery), cart, demo checkout, order confirmation, contact, and a 404 page.
- **Appointment request:**
  - The form is validated and accessible, with an error summary that receives focus.
  - The doctor list filters by the chosen specialty, and a doctor profile can prefill the form.
  - With Supabase set up, it saves the request to the database and shows a reference. Without it, it produces a WhatsApp message and a simulated confirmation, or sends to `/api/enquiry` when that is enabled.
- **Store:** 12 demo products with INR prices labelled "demo price".
  - The cart is saved in the browser.
  - Checkout collects **no card details** and creates a `DEMO-` reference only.
  - No prescription medicines.
- **Contact:**
  - Click-to-call and WhatsApp buttons.
  - Directions and an address appear only when `location.verified` is set to `true` in `src/config/site.ts`. Until then, a placeholder panel is shown.
- **Testimonials:** turned off (`features.testimonials: false`), and the data file is empty, so no testimonials are invented.
- **SEO and accessibility:**
  - Per-page titles and descriptions, Open Graph and Twitter cards, JSON-LD, `sitemap.xml` and `robots.txt`.
  - A skip link, visible focus and semantic landmarks.
  - Reduced-motion support and alt text on every meaningful image.

## Admin panel

Work in progress, built in stages.
- **Stage 3:** sign-in, protected admin pages and a live dashboard.
- **Stage 4:** products, categories and product images. The public store reads them from the database.
- **Stage 5:** doctors, specialties and appointment requests. The public pages read doctors and specialties from the database, and the appointment form saves requests to it.
- **Stage 6:** homepage sections, header and footer menus, facilities and site settings (name, contact details, hours, address, demo notices).
- **Stage 7 (current):** checkout and the contact form save to the database; Orders, Messages and Admin users screens.
- **Next:** stage 8, a final security review and the production checklist.

| Route | What it does |
|---|---|
| `/admin/login` | Email and password sign-in through Supabase Auth. There is no public sign-up. |
| `/admin`, `/admin/dashboard` | Admins only. Signed-out visitors are sent to the login page; signed-in accounts that are not on the admin list see "no admin access". |
| `/admin/products` | Search by name or SKU; filter by category, status and stock; sort; 20 per page; publish or hide with one switch; delete with confirmation |
| `/admin/products/new`, `/admin/products/:id` | Name, web address, SKU, category, price, sale price, stock, low-stock alert, texts, featured and published. Images: upload with progress, replace, reorder, describe, remove. |
| `/admin/categories` | Add, edit, reorder and hide categories. A category that still has products cannot be deleted. |
| `/admin/appointments` | Requests from the website. Filter by status (with counts), search by name, phone or reference, 20 per page. Open one to call, WhatsApp or email the patient, change the status and keep team notes. Only an owner can delete a request. |
| `/admin/doctors` | Search by name or role; filter by specialty and status (shown, hidden, demo, verified); show or hide with one switch; delete with confirmation |
| `/admin/doctors/new`, `/admin/doctors/:id` | Name, web address, role, specialty, qualifications, registration number, bio, languages, consultation modes, usual days, areas of focus, photo, demo flag and published. A verified profile must have qualifications before it can be published. |
| `/admin/specialties` | Add, edit, reorder and hide specialties, with an icon, image and reasons to visit. A specialty that still has doctors cannot be deleted. |
| `/admin/homepage` | The homepage sections in display order. Reorder or hide any section except the top one, which is always first. |
| `/admin/homepage/slider` | The hero image slider: upload several images at once, preview (optionally including hidden slides), edit each slide's title, description and image description, replace its image, reorder, show or hide, and delete. Up to 8 slides. |
| `/admin/homepage/:section` | Heading and text, buttons (with link checks), the appointment steps, the "why choose us" points with icons, and the section image. |
| `/admin/navigation` | Header menu (up to 7 shown), footer links (up to 8) and social media links (up to 6, `https://` only). Add, edit, reorder, show or hide, delete. |
| `/admin/facilities` | Add, edit, reorder and hide facilities, with an image for each. |
| `/admin/settings` | Clinic name and tagline, phone, WhatsApp, email, opening hours, address and directions, demo notices and the footer line. |
| `/admin/orders` | Orders from the store. Filter by status with counts, search by name, phone or reference, 20 per page. Open one for its items, totals, address, Call and WhatsApp links, status and team notes. Cancelling (after a confirmation) puts the items back in stock and cannot be undone. Payment status is shown but cannot be changed here. Owners can delete delivered or cancelled orders. |
| `/admin/messages` | Messages from the contact page. Opening a new message marks it Read. Reply by phone, WhatsApp or email, then mark it Replied or Archived, with team notes. Owners can delete. |
| `/admin/users` | Owners only (hidden from editors). Add an admin by the email of an existing Supabase login, change roles, remove access. The last owner cannot be removed or made an editor. |

**How the store reads the catalogue**
- With `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set, the Store, product pages, cart, checkout and home page read categories, products and images from Supabase. They use a plain REST call with the publishable key, so the public site does not download the Supabase library.
- Row Level Security returns only published rows. A hidden product, or a product in a hidden category, never reaches the website.
- The catalogue loads only on pages that show products, and always fresh on page load, so admin changes appear after a refresh.
- Sale prices, "Only N left" and "Out of stock" are shown. Quantities cannot go above the stock.
- If a cart item is sold out, hidden or deleted, checkout is blocked until it is fixed. The database order function (`sd_place_order`) checks the same rules again.
- If Supabase cannot be reached, the store says so and offers Try again. It never shows old prices.
- Without the two settings (for example, a local copy with no `.env`), the built-in sample catalogue in `src/data/products.ts` is used.
- Uploaded images go to the `sd-media` bucket under `products/<product id>/`. Deleting or replacing an image also deletes its file.

**How doctors and appointments work**
- The home page, Specialties, Doctors, doctor profiles, the footer and the appointment form read published specialties and doctors from Supabase. A doctor whose specialty is hidden is not shown.
- Seeded doctors are marked as demo profiles and keep the "Demo profile" notice. Untick **Demo profile** only once the details are real and checked.
- The appointment form saves the request through the database function `sd_submit_appointment`. It checks the name, phone, date (today to six months ahead) and that the chosen doctor is published and in the chosen specialty. The visitor sees a reference such as `APT-261027-1A2B3C`.
- Visitors can create a request but cannot read any. Only admins can see requests.
- A request is not a booking. The team calls the patient and sets the status: New, Contacted, Confirmed, Completed or Cancelled.
- Doctor photos go to `doctors/<doctor id>/` and specialty images to `specialties/<specialty id>/` in the `sd-media` bucket.

**How orders and messages work**
- Checkout sends the cart to the database function `sd_place_order`. It reads every price (including sale prices) and stock level from the database itself, checks the product is still shown, caps each product at 10, and lowers the stock, all in one step: if anything fails, nothing is saved. The customer sees a reference such as `ORD-261027-1A2B3C`.
- No card details are collected and there is no payment gateway. The order is a request; the team calls to confirm it and arrange payment. Payment status starts as "Not paid", and the browser is not allowed to change it (only status and notes can be updated), so nobody can mark an order as paid by hand.
- If a price changed while the customer was shopping, the confirmation shows the database total and says so. If stock ran out, the order is refused with the amount left and nothing is saved.
- The contact form sends the message to `sd_submit_contact`, which needs a phone number or an email. The visitor sees a reference such as `MSG-261027-1A2B3C`.
- Visitors can send orders and messages but never read them. Both forms have a hidden field that automated form fillers tend to complete; those submissions are quietly dropped.
- Without the Supabase settings, checkout and the contact form keep their earlier demo behaviour.

**How the hero image slider works**
- Slides are stored in the existing `home.hero` row of `sd_page_sections`, in its `items` list, so no new table was needed. Each slide has an image, title, description, image description, width, height and a shown/hidden switch. Images go to `sections/<hero id>/slides/` in the `sd-media` bucket.
- The homepage shows the slides that are switched on, in order. Each image is shown whole (never cropped or stretched) inside a fixed 4:3 frame, so the page does not jump. It changes every 4.5 seconds with a cross-fade, and has arrows, dots, a Pause button, left and right arrow keys and swipe on phones.
- It pauses while the pointer or keyboard focus is on it and while the browser tab is hidden. With "reduce motion" switched on in the visitor's device settings, it does not move by itself.
- With no slides switched on, the top of the page shows its main image, as before.
- New uploads start hidden. Saving only succeeds if nobody else changed the section since the page was opened; otherwise the latest version is loaded, so one admin cannot overwrite another's change. A deleted or replaced slide's file is deleted too, unless another slide or the main image still uses it.
- Hidden slides are not shown, but because the list is part of the public homepage data, their titles and image addresses can be seen by someone reading the page's network requests. Do not put anything private in a hidden slide.

**How site content works**
- Every page reads the site settings and menus; the homepage also reads its sections, and the Facilities page its facilities. Only published rows reach the website.
- Each value is checked before it is used. Anything missing or malformed, and every link that is not a page on the site, `https://`, `mailto:` or `tel:`, is ignored and the built-in value from `src/config/site.ts` is used instead.
- If the database cannot be reached, the header, footer and homepage show the built-in content, and the Facilities page offers Try again.
- The browser keeps the last loaded settings, menus and sections, so a returning visitor sees the current phone number straight away. Fresh content is still loaded on every visit.
- The phone number is stored twice: as typed (shown on the site) and as digits for the Call button. The WhatsApp number is stored as the country code and number, digits only.
- "Show demo notices" controls the banner, the footer note and the "(demo)" labels. Demo doctor profiles and demo product prices have their own notices.
- With more than 5 header links, the menu button is used below 1280 px wide; with 7 links the phone number is left out of the header (it is still in the phone menu and the footer).
- Homepage and facility images go to `sections/<id>/` and `facilities/<id>/` in the `sd-media` bucket.

**How access works**
- Supabase Auth signs the person in. The `sd_admins` table is the allow-list: its `user_id` is the Auth user's id, with `role` set to `owner` or `editor`.
- The screens check that list only to decide what to show. The real protection is in the database: Row Level Security on every `sd_` table, plus `sd_admin_dashboard()`, which refuses anyone not on the list.
- The browser only gets the **publishable (anon) key**. If a `service_role` or `sb_secret_` key is pasted into `VITE_SUPABASE_ANON_KEY`, the admin panel refuses to start.
- `/admin` is excluded from search engines (`X-Robots-Tag` header, `noindex` meta, `Disallow: /admin` in robots.txt) and is never cached.
- The admin code and the Supabase library are a separate download, fetched only when someone opens `/admin`.

**Database** (`supabase/` folder, run in Supabase → SQL Editor, in order)
1. `01_sd_schema.sql`: tables, Row Level Security, functions
2. `02_sd_seed.sql`: copies the current website content
3. `03_sd_storage.sql`: the `sd-media` image bucket
4. `04_sd_first_admin.sql`: makes your login the first owner
5. `05_sd_verify_access.sql`: read-only security check; every row should say `true`

All objects use the `sd_` prefix, so other apps in the same Supabase project are not touched.

**Setup**
1. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` (local) and in Vercel → Settings → Environment Variables.
2. Restart `npm run dev`, or redeploy.
3. Open `/admin/login`.

**Tests:** `npm run verify:admin` (sign-in and dashboard), `npm run verify:catalog` (products, categories, images and the database-backed store) `npm run verify:care` (doctors, specialties, appointment requests and the public pages that use them) and `npm run verify:content` (site settings, menus, homepage sections and facilities) and `npm run verify:orders` (checkout, the contact form, orders, messages and admin users) and `npm run verify:slider` (the hero image slider and its admin screen) run the browser tests. They use a fake Supabase inside the browser, so they never touch real accounts or data. Build with test values first, then preview:

```bash
VITE_SUPABASE_URL=https://test-project.supabase.co VITE_SUPABASE_ANON_KEY=<any anon-role JWT> npx vite build --outDir dist-test
npx vite preview --outDir dist-test --port 4181
BASE_URL=http://localhost:4181 npm run verify:admin
BASE_URL=http://localhost:4181 npm run verify:catalog
BASE_URL=http://localhost:4181 npm run verify:care
BASE_URL=http://localhost:4181 npm run verify:content
BASE_URL=http://localhost:4181 npm run verify:orders
BASE_URL=http://localhost:4181 npm run verify:slider
```

## Images

All 94 assets (165 files including responsive variants) are **original illustrations generated in code**, stored locally under `public/`:

| Folder | Contents |
|---|---|
| `public/images/hero/` | 7 hero and banner scenes, 1600×1000, plus 800px versions |
| `public/images/specialties/` | 10 specialty images, 1200×900, plus 600px versions |
| `public/images/doctors/` | 10 portraits for the fictional profiles, 800×1000, plus 400px versions |
| `public/images/facilities/` | 8 facility scenes, 1200×800, plus 600px versions |
| `public/images/products/` | 36 product images (main, close-up and box for each of 12 products), 1000×1000, plus 500px versions |
| `public/images/illustrations/` | 8 state illustrations (empty cart, no results, order placed, error, and others) as SVG |
| `public/images/icons/` | 6 store category icons as SVG |
| `public/images/branding/` | Logo, white logo and logo mark as SVG |
| `public/` | `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icons/icon-192.png`, `icons/icon-512.png`, `og-image.png` |

- **[IMAGE_MANIFEST.md](IMAGE_MANIFEST.md)** lists each file's section, usage, description, dimensions, format, size, alt text, source, licence and verification status.
- **[IMAGE_PROMPTS.md](IMAGE_PROMPTS.md)** has optional prompts and briefs for replacing the illustrations with licensed photographs.

The `Img` component serves responsive `srcset` sizes, lazy-loads images below the fold, sets intrinsic width and height to avoid layout shift, and shows a labelled fallback if a file ever fails to load.

## Environment variables

Copy `.env.example` to `.env` for local work, or add the variables in **Vercel → Project → Settings → Environment Variables**.

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SITE_URL` | browser | Canonical URL for the sitemap, Open Graph and JSON-LD |
| `VITE_ALLOW_INDEXING` | browser | `true` allows search engines. The default `false` adds `noindex` and `Disallow: /`, because the content is fictional. |
| `VITE_SUPABASE_URL` | browser | Supabase project URL, used by the admin panel |
| `VITE_SUPABASE_ANON_KEY` | browser | Supabase **publishable (anon)** key. Public by design. Never the service_role or secret key. |
| `VITE_WHATSAPP_NUMBER` | browser | International format without `+`. If empty, WhatsApp asks which chat to use. |
| `VITE_ENQUIRY_API_ENABLED` | browser | `true` sends forms to `/api/enquiry` instead of demo mode |
| `VITE_CHATBOT_ENABLED`, `VITE_CHATBOT_URL` | browser | Optional chatbot iframe launcher |
| `VITE_CATALOGUE_API_ENABLED`, `VITE_CATALOGUE_API_URL` | browser | Reserved for a future read-only catalogue API |
| `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET` | **server only** | n8n Webhook trigger. The secret is sent as the `X-MediNova-Secret` header. |
| `POWER_AUTOMATE_URL` | **server only** | Power Automate "When an HTTP request is received" flow |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_TABLE` | **server only** | Inserts each enquiry as a row (default table `enquiries`) |

Anything starting with `VITE_` is bundled into the browser code, so **never put a secret in a `VITE_` variable**. Webhook URLs and keys are read only by `api/enquiry.js`, a Vercel serverless function.

### Integrations

All integrations are off by default, and the site works fully in demo mode.

1. Configure at least one server-side destination (n8n, Power Automate or Supabase).
2. Set `VITE_ENQUIRY_API_ENABLED=true` and redeploy.
3. Forms then POST `{ kind, payload }` to `/api/enquiry`, which adds a `MN-` reference and a timestamp and forwards the record. `kind` is one of `appointment`, `contact`, `product` or `order`.
4. Send email from your n8n or Power Automate flow (for example a Gmail, Outlook or SMTP node), so mail credentials stay in that service.

A suggested Supabase table:

```sql
create table public.enquiries (
  id bigint generated always as identity primary key,
  reference text not null,
  kind text not null check (kind in ('appointment','contact','product','order')),
  payload jsonb not null,
  submitted_at timestamptz not null,
  source text
);
alter table public.enquiries enable row level security; -- the service role bypasses RLS; no public policies needed
```

## Deploying to Vercel

1. Push this folder to a Git repository and import it in Vercel. Alternatively, run `npx vercel` from the folder.
2. Vercel detects Vite from `vercel.json`:
   - Build command `npm run build`, output folder `dist`.
   - SPA rewrites send every route except `/api/*` to `index.html`.
   - Cache headers for `/assets` and `/images`, plus basic security headers.
3. Add the environment variables, then deploy.
4. Check the deployment with `BASE_URL=https://<your-deployment> npm run verify`.

### Custom domain

1. In Vercel, go to **Project → Settings → Domains** and add your domain, for example `medinova.example`.
2. At your domain registrar, create the DNS records Vercel shows. This is usually an `A` record for the apex domain and a `CNAME` for `www` pointing to Vercel's target. Use the exact values Vercel displays.
3. Wait for DNS to propagate. Vercel issues the HTTPS certificate automatically.
4. Set `VITE_SITE_URL` to the final domain, then redeploy so the canonical links, sitemap and share previews use it.

No domain has been bought and no deployment has been made as part of this project.

## Going live checklist

- [ ] Replace the fictional doctors in `src/data/doctors.ts` with verified practitioners (name, qualifications, registration number, languages, days), each with their consent and a real photo.
- [ ] Replace the demo products and prices in `src/data/products.ts`, or connect a real catalogue. Keep prescription medicines out of the store unless you meet the legal requirements for selling them.
- [ ] Set the real phone number, email and WhatsApp number. Set `location.verified: true` with the real address and a Maps query in `src/config/site.ts`.
- [ ] Remove or reword the demo notices (`src/config/site.ts`, the "Fictional demo profile" badges and the "demo price" labels) only once the content is real.
- [ ] Replace illustrations with licensed photographs if you want photos. Run `npm run build`, then `npm run manifest`.
- [ ] Set `VITE_ALLOW_INDEXING=true` and `VITE_SITE_URL`.
- [ ] Turn on testimonials only with real, consented patient feedback.
- [ ] Add a privacy policy covering what enquiry forms collect and where it goes.

## Project structure

```
api/enquiry.js            Vercel function: forwards enquiries server-side
public/                   Images, icons, manifest, sitemap, robots
scripts/images/           Image generator (scenes, people, props, brand), inventory, manifest and prompt writers
scripts/check-images.mjs  Build-time image reference check
scripts/verify-site.mjs   Playwright verification
src/config/site.ts        Brand, contact and feature settings
src/data/                 Specialties, doctors, facilities, products (typed)
src/components/ layouts/ pages/ services/ state/
```

## Build and test results

Recorded on 23 October 2026 in a Linux container on Node 22.

- `npm run build`: passed. The image check found 165 referenced files (147 raster, 18 SVG), all present, readable and at their declared dimensions. Type check clean. Vite production build succeeded.
- Image-check negative tests: removing one product image, or adding one remote image URL, made the build fail with `MISSING` and `REMOTE` errors as intended.
- `npm run verify` against the production build:
  - 43 routes × 4 viewport passes = 172 page views, with 1,412 images rendered.
  - **0 failures:** no broken images, no image fallbacks, no failed requests, no console errors, no horizontal overflow and no missing alt text.
  - **13 of 13 interaction tests passed:** skip link, cart maths and persistence, demo checkout, appointment validation and WhatsApp message, doctor-profile prefill, contact form, product WhatsApp links, store filters and empty states, doctor filters, image fallback, mobile menu, product gallery, and direct decode of all 165 image files.
- The same `npm run verify` run against the development server (`npm run dev`) also gave 0 failures and 13 of 13 tests passing, and all 165 image files were served with image content types.
