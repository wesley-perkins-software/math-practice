import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://mathpracticeonline.com',
  output: 'static',
  redirects: {
    '/addition-practice': '/addition',
    '/subtraction-practice': '/subtraction',
    '/timed-drills': '/arithmetic-speed-drill',
    '/math-drills': '/arithmetic-speed-drill',
    '/speed-drill': '/arithmetic-speed-drill',
    '/addition/2-digit-no-carrying': '/addition/2-digit-without-regrouping',
    '/addition/2-digit-with-carrying': '/addition/2-digit-with-regrouping',
    '/subtraction/2-digit-no-borrowing': '/subtraction/2-digit-without-regrouping',
    '/subtraction/2-digit-with-borrowing': '/subtraction/2-digit-with-regrouping',
  },
  integrations: [
    react(),
    sitemap({
      filter: (page) => {
        const redirectPaths = [
          '/addition-practice/',
          '/subtraction-practice/',
          '/timed-drills/',
          '/math-drills/',
          '/speed-drill/',
          '/addition/2-digit-no-carrying/',
          '/addition/2-digit-with-carrying/',
          '/subtraction/2-digit-no-borrowing/',
          '/subtraction/2-digit-with-borrowing/',
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
        return !page.endsWith('/practice/') && !redirectPaths.some((path) => page.endsWith(path));
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
