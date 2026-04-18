import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://www.mathpracticeonline.com',
  output: 'static',
  redirects: {
    '/addition-practice': '/addition',
    '/timed-drills': '/arithmetic-speed-drill',
    '/math-drills': '/arithmetic-speed-drill',
    '/speed-drill': '/arithmetic-speed-drill',
  },
  integrations: [
    react(),
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
