// Integration switchboard. Everything is OFF by default so the demo runs with
// no paid services. Browser code only ever sees public values: webhook URLs,
// API keys and secrets stay on the server (see /api/enquiry.js).

const env = import.meta.env;
const flag = (v: unknown) => String(v ?? '').toLowerCase() === 'true';

export const integrations = {
  /**
   * Enquiries (appointments, contact, product questions, demo orders) are POSTed
   * to this same-origin endpoint, which forwards them server-side to n8n,
   * Microsoft Power Automate, Supabase or an email service.
   */
  enquiries: {
    enabled: flag(env.VITE_ENQUIRY_API_ENABLED),
    endpoint: '/api/enquiry',
  },
  /** Optional AI chatbot embed (for example a Chatbase or custom bot iframe URL). Public by design. */
  chatbot: {
    enabled: flag(env.VITE_CHATBOT_ENABLED) && Boolean(env.VITE_CHATBOT_URL),
    url: (env.VITE_CHATBOT_URL as string | undefined) || '',
  },
  /** Future inventory and order APIs: read-only product data could be fetched from here. */
  catalogue: {
    enabled: flag(env.VITE_CATALOGUE_API_ENABLED),
    endpoint: (env.VITE_CATALOGUE_API_URL as string | undefined) || '',
  },
};

export type EnquiryKind = 'appointment' | 'contact' | 'product' | 'order';
