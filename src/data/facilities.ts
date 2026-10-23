import type { Facility } from '@/types';
import { img } from './img';

// Illustrative facilities. For a real customer, only show facilities that
// have been verified, ideally with their own photographs.
const f = (slug: string, alt: string) => img(`/images/facilities/${slug}.webp`, alt, 1200, 800, 600);

export const facilities: Facility[] = [
  { slug: 'reception-waiting-area', name: 'Reception and waiting area', description: 'A calm space to check in, with seating, drinking water and a screen showing your place in the queue.', image: f('reception-waiting-area', 'A calm waiting area with seated visitors') },
  { slug: 'consultation-room', name: 'Consultation rooms', description: 'Private rooms with an examination bed, privacy curtain and space for a family member to join you.', image: f('consultation-room', 'A consultation room with an examination bed and desk') },
  { slug: 'hospital-corridor', name: 'Clear, signposted corridors', description: 'Wide corridors with handrails and colour-coded signs to help you find your way.', image: f('hospital-corridor', 'A hospital corridor with doors and handrails') },
  { slug: 'patient-room', name: 'Patient rooms', description: 'Rooms with an adjustable bed, a chair for visitors and plenty of natural light.', image: f('patient-room', 'A patient resting in a bed while a visitor sits nearby') },
  { slug: 'laboratory', name: 'Laboratory', description: 'Where samples are processed and tests are run, so results can reach your care team.', image: f('laboratory', 'A laboratory technician working at a bench') },
  { slug: 'diagnostic-imaging', name: 'Diagnostic imaging', description: 'Scanning rooms where trained staff carry out imaging tests your doctor has requested.', image: f('diagnostic-imaging', 'A diagnostic imaging scanner with a technician') },
  { slug: 'medical-equipment', name: 'Medical equipment', description: 'Monitoring and support equipment, maintained and checked by the clinical engineering team.', image: f('medical-equipment', 'Medical equipment including a monitor, infusion pumps and a defibrillator') },
  { slug: 'staff-at-work', name: 'Care teams', description: 'Nurses and doctors working together so information follows you from one visit to the next.', image: f('staff-at-work', 'A nurse and a doctor working at a nurses’ station') },
];
