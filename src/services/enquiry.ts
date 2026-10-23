import { integrations, type EnquiryKind } from '@/integrations';

export type EnquiryResult =
  | { mode: 'demo' }
  | { mode: 'sent'; reference?: string }
  | { mode: 'error'; message: string };

/**
 * Sends an enquiry through the server-side endpoint when integrations are
 * enabled. In demo mode nothing leaves the browser.
 */
export async function submitEnquiry(kind: EnquiryKind, payload: Record<string, unknown>): Promise<EnquiryResult> {
  if (!integrations.enquiries.enabled) return { mode: 'demo' };
  try {
    const res = await fetch(integrations.enquiries.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, payload, submittedAt: new Date().toISOString() }),
    });
    if (!res.ok) return { mode: 'error', message: `The enquiry service answered with status ${res.status}. Try again, or contact us by phone or WhatsApp.` };
    const data = (await res.json().catch(() => ({}))) as { reference?: string };
    return { mode: 'sent', reference: data.reference };
  } catch {
    return { mode: 'error', message: 'The enquiry could not be sent because the connection failed. Check your internet connection and try again.' };
  }
}
