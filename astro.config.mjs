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
      filter: (page) => {
        const redirectPaths = [
          '/addition-practice/',
          '/timed-drills/',
          '/math-drills/',
          '/speed-drill/',
          '/division-practice/',
          '/division-practice/facts/',
          '/division-practice/divide-by/',
          '/division-practice/remainders/',
          '/multiplication-practice/',
          '/multiplication-practice/1-12/',
          '/multiplication-practice/facts/',
          '/multiplication-practice/mixed/',
          '/multiplication-practice/times-tables/',
        ];
        return !redirectPaths.some((path) => page.endsWith(path));
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
