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
// Then set VITE_ENQUIRY_API_ENABLED=true so the site starts calling this endpoint.

const KINDS = new Set(['appointment', 'contact', 'product', 'order']);
const MAX_BYTES = 20_000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST.' });
  }

  const body = typeof req.body === 'string' ? safeJson(req.body) : req.body;
  if (!body || !KINDS.has(body.kind) || typeof body.payload !== 'object') {
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
