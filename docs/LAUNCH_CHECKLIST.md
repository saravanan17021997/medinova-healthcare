# SaraDev Healthcare: launch checklist

What to check before real patients and customers use the site, after every deploy, and from time to time. The site currently runs as a **demonstration**: fictional doctors, example prices, a placeholder address. Work through section 1 before you switch the demo notices off.

## 1. Before real customers use the site

**Content (all in the admin panel)**

- [ ] **Doctors:** replace or delete the 10 seeded demo profiles. For each real doctor, add qualifications, registration number, photo and bio, then untick **Demo profile**. A real profile cannot be published without qualifications.
- [ ] **Products and prices:** replace the 12 sample products with what you actually sell, with real prices and stock.
- [ ] **Facilities:** use your own photographs. Hide anything you do not have.
- [ ] **Homepage → Health essentials:** the introduction still says orders are simulated. Rewrite it.
- [ ] **Homepage → Hero slider:** upload your own images (landscape, ideally 1600 × 1200 px) and give each one an image description.
- [ ] **Site settings:**
  - [ ] Clinic name and phone number.
  - [ ] WhatsApp number, as 91 followed by the 10 digits.
  - [ ] A real email address. `hello@example.com` never delivers mail.
  - [ ] Opening hours.
  - [ ] The full address and map destination. Then switch on **This address has been confirmed**.
- [ ] Only when everything above is real: **Site settings → Show demo notices** off. This removes the banner, the footer note and the "(demo)" and "demo price" labels.

**Search engines (Vercel → Settings → Environment Variables, then redeploy)**

- [ ] `VITE_SITE_URL` = your public address, for example `https://saradevhealthcare.vercel.app`, or your own domain.
- [ ] `VITE_ALLOW_INDEXING` = `true`. Until then, `robots.txt` asks search engines to stay away.
- [ ] The sitemap is built from the published doctors, specialties and products in the database at each deploy. After publishing new profiles, redeploy so the sitemap includes them.

**Policies (not built yet, and not legal advice)**

- [ ] The site collects names, phone numbers, addresses and appointment notes. Before real use, add a privacy notice explaining what is collected, why, who can see it and how to ask for it to be deleted. Check what India's Digital Personal Data Protection Act 2023 requires of you, ideally with someone qualified to advise.
- [ ] Decide how long you keep old requests, messages and orders, and delete them on that schedule. Owners can delete them in the admin panel.

## 2. Supabase (shared with Money Map)

- [ ] Run `supabase/05_sd_verify_access.sql` and `supabase/06_sd_security_review.sql` in the SQL Editor. Every row must show `true` or `ok`.
- [ ] **Admin accounts:**
  - [ ] Each admin has their own login with a strong, unique password.
  - [ ] Add a **second owner**, so losing one login never locks you out.
  - [ ] Remove anyone who no longer needs access (**Admin users**).
- [ ] **Keys:** only the publishable (anon) key belongs in `VITE_SUPABASE_ANON_KEY`. The site refuses to start with a secret or `service_role` key. If a secret key was ever pasted anywhere public, rotate it in Supabase → Settings → API.
- [ ] **Sign-ups:** the authentication settings are shared with Money Map, so leave them as Money Map needs them. A new sign-up can never become a SaraDev admin; only an owner can add admins.
- [ ] **Backups:** check Database → Backups for what your plan includes. Free projects have no automatic restore points. Either upgrade, or export the `sd_` tables regularly (Table editor → Export to CSV).
- [ ] **Storage:** the `sd-media` bucket is public, so anyone with a link can open its images. Upload only pictures meant for the website, never documents or patient photos.

## 3. Vercel

- [ ] Environment variables for **Production**:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY` (the publishable key)
  - [ ] optionally `VITE_SITE_URL` and `VITE_ALLOW_INDEXING`
  - [ ] Add the same values to **Preview** if you use preview deployments.
- [ ] Do **not** set `SUPABASE_SERVICE_ROLE_KEY`. The site saves everything through the database functions and does not need it.
- [ ] Security headers come from `vercel.json`. Test changes locally first: `npm run build`, then `npm run serve:vercel`.

## 4. After every deploy (about 5 minutes)

1. The Vercel deployment shows **Ready** for the commit you pushed.
2. **Homepage:**
   - [ ] The slider runs, and the arrows, dots and Pause work.
   - [ ] On a phone, swiping works and nothing scrolls sideways.
3. **Store:**
   - [ ] Add an item and send an order. A reference `ORD-…` appears.
   - [ ] Find it in **Admin → Orders** and **cancel it**, so the stock goes back.
4. **Book an appointment:** send a request. It appears in **Admin → Appointments**. Delete it if it was a test.
5. **Contact:** send a message. It appears in **Admin → Messages**.
6. **Admin:** sign in and sign out. The dashboard counts look right.
7. **Headers:** open the site, then DevTools → Network → the first document → Response headers. `Content-Security-Policy` and `X-Frame-Options: DENY` must be there. Then check the Console: there must be no "Refused to load" messages.

## 5. Every month

- [ ] Run `06_sd_security_review.sql` again.
- [ ] Review **Admin users**.
- [ ] Run `npm audit`. Known follow-ups:
  - **vite 5 → 8:** fixes warnings that affect only the local `npm run dev` server, not the live site. Until then, do not start the dev server with `--host`, and stop it when you are not using it.
  - **react-router 6 → 7:** fixes an open-redirect warning. It is already blocked here: every database link is checked, and backslashes are refused.
- [ ] Answer or archive old messages and appointment requests. Cancel or complete old orders.

## Known limits

- **No online payment.** Orders are requests; the team calls to confirm and arrange payment. Payment status cannot be changed from the browser.
- **Spam protection** is a hidden bot trap only. A limit per phone number (for example, 5 per hour) can be added in the database if spam becomes a problem.
- **No email or WhatsApp alerts** for new orders or messages yet. The optional `/api/enquiry` endpoint can forward copies to n8n or Power Automate.
- **Hidden hero slides** are not shown, but their titles and image addresses are part of the public homepage data.
