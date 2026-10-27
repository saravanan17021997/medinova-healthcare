// Vercel serverless function: POST /api/enquiry
// Receives appointment, contact, product and demo-order enquiries from the site
// and forwards them server-side, so webhook URLs and keys never reach the browser.
//
// Configure any of these in Vercel → Project → Settings → Environment Variables:
//   N8N_WEBHOOK_URL            n8n "Webhook" trigger URL
//   N8N_WEBHOOK_SECRET         optional; sent as the X-MediNova-Secret header
//   POWER_AUTOMATE_URL         "When an HTTP request is received" flow URL
//   SUPABASE_URL               https://<project>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY  service role key (server only) for inserting rows
//   SUPABASE_TABLE             table name, default "enquiries"
//   ALLOWED_ORIGINS            optional, comma-separated extra sites allowed to post here
// Then set VITE_ENQUIRY_API_ENABLED=true so the site starts calling this endpoint.
//
// Note: with the Supabase settings in place the website already saves appointments,
// messages and orders through the sd_ database functions. This endpoint is only for
// sending copies to n8n or Power Automate. You do not need the service role key for
// that, and it is safer not to set it. Never put it in a VITE_ variable.

const KINDS = new Set(['appointment', 'contact', 'product', 'order']);
const MAX_BYTES = 20_000;

/** Only this website (and any extra sites listed in ALLOWED_ORIGINS) may post enquiries. */
function allowedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  let host;
  try {
    host = new URL(origin).host;
  } catch {
    return false;
  }
  if (host === req.headers['x-forwarded-host'] || host === req.headers.host) return true;
  const extra = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  return extra.includes(origin);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST.' });
  }
  if (!allowedOrigin(req)) return res.status(403).json({ error: 'Enquiries can only be sent from this website.' });
  if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) return res.status(415).json({ error: 'Send JSON.' });

  const body = typeof req.body === 'string' ? safeJson(req.body) : req.body;
  if (!body || !KINDS.has(body.kind) || !body.payload || typeof body.payload !== 'object' || Array.isArray(body.payload)) {
    return res.status(400).json({ error: 'Expected { kind, payload }.' });
  }
  if (JSON.stringify(body).length > MAX_BYTES) return res.status(413).json({ error: 'Enquiry too large.' });

  const reference = `MN-${Date.now().toString(36).toUpperCase()}`;
  const record = { reference, kind: body.kind, payload: body.payload, submitted_at: new Date().toISOString(), source: 'medinova-website' };

  const targets = [];
  const { N8N_WEBHOOK_URL, N8N_WEBHOOK_SECRET, POWER_AUTOMATE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_TABLE = 'enquiries' } = process.env;

  if (N8N_WEBHOOK_URL) {
    targets.push(post(N8N_WEBHOOK_URL, record, N8N_WEBHOOK_SECRET ? { 'X-MediNova-Secret': N8N_WEBHOOK_SECRET } : {}));
  }
  if (POWER_AUTOMATE_URL) targets.push(post(POWER_AUTOMATE_URL, record));
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    targets.push(
      post(`${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${encodeURIComponent(SUPABASE_TABLE)}`, record, {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: 'return=minimal',
      }),
    );
  }

  if (targets.length === 0) return res.status(503).json({ error: 'No enquiry destination is configured.' });

  const results = await Promise.allSettled(targets);
  const ok = results.some((r) => r.status === 'fulfilled' && r.value.ok);
  if (!ok) return res.status(502).json({ error: 'The enquiry could not be delivered.' });
  return res.status(200).json({ reference });
}

function post(url, data, headers = {}) {
  return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(data) });
}

function safeJson(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
