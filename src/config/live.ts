import { site, type SiteConfig } from './site';

// The site settings currently in use: the built-in values from site.ts until
// the ones saved in the admin panel have loaded. Components read them through
// useSite() so they re-render; plain functions (WhatsApp links, page titles)
// call liveSite().
let current: SiteConfig = site;

export const liveSite = () => current;
export const setLiveSite = (next: SiteConfig) => {
  current = next;
};
/** The greeting that starts every pre-written WhatsApp message. */
export const hello = () => `Hello ${current.shortName}`;
