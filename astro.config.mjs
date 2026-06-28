import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://mathpracticeonline.com',
  output: 'static',
  redirects: {
    '/addition-practice': '/addition',
    '/timed-drills': '/arithmetic-speed-drill',
    '/math-drills': '/arithmetic-speed-drill',
    '/speed-drill': '/arithmetic-speed-drill',
  },
  integrations: [
    react(),
    sitemap({
      filter: (page) => ![
        'https://mathpracticeonline.com/addition-practice/',
        'https://mathpracticeonline.com/timed-drills/',
        'https://mathpracticeonline.com/math-drills/',
        'https://mathpracticeonline.com/speed-drill/',
      ].includes(page),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
