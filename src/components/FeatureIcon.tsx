import { CalendarCheck, Clock, HeartPulse, MapPin, MessageCircle, Phone, Search, ShieldCheck, ShoppingBag, Smile, Stethoscope, Users, type LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = { Search, CalendarCheck, MessageCircle, ShoppingBag, HeartPulse, Stethoscope, Clock, ShieldCheck, Phone, MapPin, Users, Smile };

/** Icons an admin can pick for the "Why choose us" points on the homepage. */
export const FEATURE_ICONS = Object.keys(ICONS);

export function FeatureIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? HeartPulse;
  return <Icon className={className} aria-hidden />;
}
