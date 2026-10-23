import type { Specialty } from '@/types';
import { img } from './img';

// Demonstration categories only. Replace with the services a real customer
// has confirmed before publishing.
const s = (slug: string, alt: string) => img(`/images/specialties/specialty-${slug}.webp`, alt, 1200, 900, 600);

export const specialties: Specialty[] = [
  {
    slug: 'general-medicine',
    name: 'General medicine',
    summary: 'Everyday health concerns, check-ups and ongoing care.',
    description: 'General medicine is usually the first stop for new symptoms, routine check-ups and long-term conditions. A general physician can assess you, arrange tests and refer you to a specialist when needed.',
    reasons: ['Fever, cough or a new symptom', 'Routine health check-ups', 'Managing a long-term condition', 'Help deciding which specialist to see'],
    icon: 'Stethoscope',
    image: s('general-medicine', 'A general physician at a desk with a stethoscope and notes'),
  },
  {
    slug: 'cardiology',
    name: 'Cardiology',
    summary: 'Heart and blood vessel health.',
    description: 'Cardiology looks after the heart and circulation. Visits often include a conversation about symptoms and history, and tests such as an ECG when the doctor recommends them.',
    reasons: ['Chest discomfort or palpitations', 'High blood pressure follow-up', 'Breathlessness on exertion', 'Family history of heart conditions'],
    icon: 'HeartPulse',
    image: s('cardiology', 'An illustrated heart next to a heart-rhythm monitor'),
  },
  {
    slug: 'orthopaedics',
    name: 'Orthopaedics',
    summary: 'Bones, joints, muscles and sports injuries.',
    description: 'Orthopaedics covers the bones, joints, ligaments and muscles that keep you moving, from sprains and fractures to long-standing joint pain.',
    reasons: ['Joint or back pain', 'Sports and exercise injuries', 'Stiffness that limits movement', 'Follow-up after a fracture'],
    icon: 'Bone',
    image: s('orthopaedics', 'A knee X-ray on a lightbox beside a joint model and crutch'),
  },
  {
    slug: 'dermatology',
    name: 'Dermatology',
    summary: 'Skin, hair and nail conditions.',
    description: 'Dermatology deals with the skin, hair and nails. A dermatologist can examine changes in your skin and talk you through suitable next steps.',
    reasons: ['Rashes, itching or irritation', 'Changes in a mole or spot', 'Acne or persistent breakouts', 'Hair or nail concerns'],
    icon: 'ScanFace',
    image: s('dermatology', 'Layers of skin under a magnifying glass'),
  },
  {
    slug: 'paediatrics',
    name: 'Paediatrics',
    summary: 'Care for babies, children and teenagers.',
    description: 'Paediatrics focuses on the health and development of children, from newborn check-ups through to adolescence.',
    reasons: ['Growth and development checks', 'Childhood illnesses', 'Vaccination questions', 'Advice for parents and carers'],
    icon: 'Baby',
    image: s('paediatrics', 'A child beside a height chart, a teddy bear and toy blocks'),
  },
  {
    slug: 'neurology',
    name: 'Neurology',
    summary: 'The brain, spine and nervous system.',
    description: 'Neurology covers conditions of the brain, spinal cord and nerves. Appointments usually start with a detailed history and examination.',
    reasons: ['Frequent or severe headaches', 'Numbness or tingling', 'Dizziness or balance problems', 'Memory or concentration concerns'],
    icon: 'Brain',
    image: s('neurology', 'An illustrated brain with connected nerve pathways'),
  },
  {
    slug: 'ophthalmology',
    name: 'Ophthalmology',
    summary: 'Eye health and vision.',
    description: 'Ophthalmology looks after the eyes and vision, from routine eye checks to conditions that need a specialist’s attention.',
    reasons: ['Blurred or changing vision', 'Red, painful or dry eyes', 'Routine eye examinations', 'Advice on glasses or lenses'],
    icon: 'Eye',
    image: s('ophthalmology', 'An eye-test chart, an illustrated eye and glasses'),
  },
  {
    slug: 'dentistry',
    name: 'Dentistry',
    summary: 'Teeth, gums and oral health.',
    description: 'Dentistry covers check-ups, cleaning and treatment for the teeth and gums, as well as advice on keeping your mouth healthy.',
    reasons: ['Toothache or sensitivity', 'Routine check-ups and cleaning', 'Bleeding or sore gums', 'Advice on dental care'],
    icon: 'Smile',
    image: s('dentistry', 'A tooth model with a toothbrush and dental mirror'),
  },
  {
    slug: 'gynaecology',
    name: 'Gynaecology',
    summary: 'Women’s health at every stage of life.',
    description: 'Gynaecology focuses on women’s reproductive health, including routine screening, menstrual concerns and advice through different life stages.',
    reasons: ['Period-related concerns', 'Routine screening', 'Questions about contraception', 'Menopause support'],
    icon: 'Flower2',
    image: s('gynaecology', 'A doctor beside an ultrasound unit in a women’s health clinic'),
  },
  {
    slug: 'diagnostics',
    name: 'Diagnostics and laboratory',
    summary: 'Tests that help your doctor understand what’s going on.',
    description: 'Diagnostic and laboratory services carry out the tests your doctor requests, such as blood tests and imaging, and share the results with your care team.',
    reasons: ['Blood and urine tests', 'Tests requested by your doctor', 'Routine screening panels', 'Imaging appointments'],
    icon: 'Microscope',
    image: s('diagnostics', 'Laboratory equipment: a microscope, sample tubes and petri dishes'),
  },
];

export const specialtyBySlug = (slug: string) => specialties.find((x) => x.slug === slug);
