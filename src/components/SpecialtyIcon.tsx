import { Baby, Bone, Brain, Eye, Flower2, HeartPulse, Microscope, ScanFace, Smile, Stethoscope, type LucideProps } from 'lucide-react';

const ICONS = { Baby, Bone, Brain, Eye, Flower2, HeartPulse, Microscope, ScanFace, Smile, Stethoscope };

/** Icon names an admin can choose for a specialty. */
export const SPECIALTY_ICONS = Object.keys(ICONS);

export function SpecialtyIcon({ name, ...p }: { name: string } & LucideProps) {
  const Icon = ICONS[name as keyof typeof ICONS] ?? Stethoscope;
  return <Icon aria-hidden {...p} />;
}
