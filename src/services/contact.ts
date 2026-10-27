import { liveSite } from '@/config/live';

/** WhatsApp click-to-chat link. With no configured number, WhatsApp asks which chat to use. */
export function whatsappUrl(text: string) {
  const number = liveSite().contact.whatsappNumber.replace(/\D/g, '');
  const q = `text=${encodeURIComponent(text)}`;
  return number ? `https://wa.me/${number}?${q}` : `https://wa.me/?${q}`;
}

export const telUrl = () => `tel:${liveSite().contact.phoneHref}`;

/** Google Maps directions, only from a verified, configured destination. */
export function directionsUrl() {
  const { verified, mapsQuery } = liveSite().location;
  if (!verified || !mapsQuery) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsQuery)}`;
}
