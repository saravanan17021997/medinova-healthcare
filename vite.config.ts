import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Injects the public site URL into index.html so Open Graph images use an
// absolute address (social platforms ignore relative og:image paths).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const siteUrl = (env.VITE_SITE_URL || '').replace(/\/$/, '');
  const robots = String(env.VITE_ALLOW_INDEXING).toLowerCase() === 'true' ? 'index, follow' : 'noindex, nofollow';
  return {
    plugins: [
      react(),
      {
        name: 'medinova-site-url',
        transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', siteUrl).replaceAll('__ROBOTS__', robots),
      },
    ],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  };
});
