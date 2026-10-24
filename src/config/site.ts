// Central configuration. Everything a customer would change lives here.
// Values marked "demo" are placeholders and must be replaced with verified
// details before the site is used for a real organisation.

export const site = {
  name: 'SARADEV Healthcare',
  shortName: 'node_modules, dist, *.md, package-lock.json',
  tagline: 'Better Care. Connected Healthcare.',
  /** Public URL, used for canonical links and social previews. Set VITE_SITE_URL on Vercel. */
  url: (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') || '',
  demoNotice: 'This is a demonstration website. Doctors, products and prices are fictional: no real appointments, orders or medical services.',

  contact: {
    // demo: "+91 00000 00000" is not a dialable Indian number.
    phoneDisplay: '8668026319',
    phoneHref: '8668026319',
    /** International format without "+", e.g. "919876543210". Empty opens WhatsApp's contact picker. */
    whatsappNumber: (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) || '',
    // demo: example.com is reserved for documentation and never delivers mail.
    email: 'hello@example.com',
    hours: [
      { days: 'Monday to Friday', time: '8:00 am to 8:00 pm' },
      { days: 'Saturday', time: '9:00 am to 2:00 pm' },
      { days: 'Sunday', time: 'Closed' },
    ],
  },

  location: {
    /** Set to true only once the address below has been verified with the customer. */
    verified: false,
    name: 'node_modules, dist, *.md, package-lock.json demo clinic',
    addressLines: ['Your clinic address goes here', 'City, State, PIN code'],
    /** Destination for Google Maps directions, e.g. a full address or "lat,lng". Used only when verified. */
    mapsQuery: '',
  },

  features: {
    /** Only enable with authentic, authorised testimonials. */
    testimonials: false,
  },

  /** Optional credit line in the footer. */
  credit: '',
};

export type SiteConfig = typeof site;
