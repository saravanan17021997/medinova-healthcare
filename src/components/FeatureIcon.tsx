import { Activity, BadgeCheck, Building2, CalendarCheck, HeartHandshake, Package, Clock, HeartPulse, MapPin, MessageCircle, Phone, Search, ShieldCheck, ShoppingBag, Smile, Stethoscope, Users, type LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = { Search, CalendarCheck, MessageCircle, ShoppingBag, HeartPulse, Stethoscope, Clock, ShieldCheck, Phone, MapPin, Users, Smile, Activity, Building2, HeartHandshake, BadgeCheck, Package };

/** Icons an admin can pick for the "Why choose us" points and the hero highlights on the homepage. */
export const FEATURE_ICONS = Object.keys(ICONS);
/** A readable name for an icon in the admin pickers: "HeartHandshake" -> "Heart handshake", "Building2" -> "Building". */
export const iconLabel = (n: string) => n.replace(/\d+$/, '').replace(/([a-z])([A-Z])/g, (_, a: string, b: string) => `${a} ${b.toLowerCase()}`);

export function FeatureIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? HeartPulse;
  return <Icon className={className} aria-hidden />;
}
