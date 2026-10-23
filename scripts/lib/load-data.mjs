// Loads the app's TypeScript data modules in Node (via esbuild, which ships
// with Vite) so build scripts read exactly what the website uses.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export async function loadData() {
  const outDir = path.join(root, 'node_modules/.cache/medinova');
  fs.mkdirSync(outDir, { recursive: true });
  const entry = path.join(outDir, 'entry.ts');
  fs.writeFileSync(
    entry,
    ['specialties', 'doctors', 'facilities', 'products', 'img'].map((m) => `export * as ${m} from '${path.join(root, 'src/data', m)}';`).join('\n'),
  );
  const outfile = path.join(outDir, `data-${Date.now()}.mjs`);
  await build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile,
    logLevel: 'silent',
    alias: { '@': path.join(root, 'src') },
    define: { 'import.meta.env': '{}' },
  });
  const mod = await import(pathToFileURL(outfile).href);
  fs.rmSync(outfile, { force: true });
  return mod;
}

export { root };
