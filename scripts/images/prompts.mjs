// Writes IMAGE_PROMPTS.md: optional photo-generation / photo-brief prompts for every
// slot that currently holds an original illustration. Usage: node scripts/images/prompts.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = JSON.parse(fs.readFileSync(path.join(root, 'scripts/images/output.json'), 'utf8'));

const STYLE = 'Bright, natural daylight; clean and modern; palette of navy (#0B2545), teal (#0E7C7B), aqua (#5BC0BE) and white; calm, reassuring mood; realistic skin tones; shallow depth of field; no text, logos, brand names or watermarks; no visible patient data on screens.';
const NEG = 'Avoid: blood, needles in skin, distressed patients, stethoscopes worn incorrectly, extra fingers, distorted hands or faces, fake text, recognisable real hospitals or brands, celebrity likeness.';
const SECTION = {
  'A. Hero': { size: '1600×1000 (16:10)', lens: 'Wide editorial photograph, 35 mm, eye level, generous negative space on the left for a headline.' },
  'B. Specialties': { size: '1200×900 (4:3)', lens: 'Still-life or in-context photograph, 50 mm, centred subject, soft background.' },
  'C. Doctors': { size: '800×1000 (4:5)', lens: 'Head-and-shoulders portrait, 85 mm, plain light aqua backdrop, friendly direct gaze, subject centred with headroom.' },
  'D. Facilities': { size: '1200×800 (3:2)', lens: 'Architectural interior photograph, 24 mm, verticals corrected, tidy and uncluttered.' },
  'E. Products': { size: '1000×1000 (1:1)', lens: 'Studio product photograph on a white podium, soft shadow, light aqua seamless background, centred with even margins.' },
};

let md = `# MediNova photo prompts (optional upgrade)

Every image slot already has a **finished original illustration** (see [IMAGE_MANIFEST.md](IMAGE_MANIFEST.md)), so none of these prompts is needed for the site to work. Use them only if you want photographs instead, either as briefs for a photographer or as prompts for an image generator whose output you are licensed to use commercially.

**Rules for real photographs**
- People must be **your own staff or models with signed consent**. Do not present AI-generated people as real doctors. Fictional profiles stay labelled "Fictional demo profile".
- Never use images from other hospitals' websites, scraped galleries or watermarked stock.
- Keep the filename and dimensions shown, export WebP at about 80% quality, and also export the \`-sm\` variant at half width. Run \`npm run build\`: the image check will reject a file with the wrong size.

**Shared style:** ${STYLE}

**Shared negative prompt:** ${NEG}

`;
for (const [section, spec] of Object.entries(SECTION)) {
  const assets = out.assets.filter((a) => a.section === section);
  md += `## ${section} (${assets.length}), ${spec.size}\n\nFraming: ${spec.lens}\n\n`;
  for (const a of assets) {
    let subject = a.description.replace(/\.$/, '');
    if (section === 'C. Doctors') {
      const field = (a.description.match(/\(([^)]+)\)/) || [, 'general medicine'])[1].toLowerCase();
      subject = `Portrait of a consenting staff member who practises ${field}, in a clean white coat or scrubs, with a warm, professional expression. Replace the fictional name "${(a.description.match(/"([^"]+)"/) || [, ''])[1]}" with the real person's verified details at the same time`;
    }
    if (section === 'A. Hero' || section === 'D. Facilities') subject += ', in a modern Indian clinic';
    md += `### \`${a.file}\`\n- **Used on:** ${a.usage}\n- **Prompt:** ${subject}. ${spec.lens} ${STYLE}\n- **Alt text to keep:** ${a.alt || '(decorative)'}\n\n`;
  }
}
md += `## Illustrations, icons and branding\n\nThese are final vector artwork and are not meant to be replaced with photographs: the logo, favicon, app icons, share image, state illustrations and category icons.\n`;
fs.writeFileSync(path.join(root, 'IMAGE_PROMPTS.md'), md);
console.log('IMAGE_PROMPTS.md written:', Object.keys(SECTION).map((s) => out.assets.filter((a) => a.section === s).length).reduce((a, b) => a + b), 'photo slots');
