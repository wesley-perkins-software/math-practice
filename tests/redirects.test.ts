import { readFileSync } from 'node:fs';
import { assert, test } from './harness';

const redirects = readFileSync('public/_redirects', 'utf8');
const redirectLines = redirects.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));

const astroConfig = readFileSync('astro.config.mjs', 'utf8');

export const tests = [
  test('every legacy alias rule in public/_redirects is forced, since each collides with a generated static page', () => {
    // The /sitemap.xml rule has no colliding static file, so it doesn't need force.
    const aliasLines = redirectLines.filter((l) => !l.startsWith('/sitemap.xml'));
    assert.ok(aliasLines.length > 0);
    for (const line of aliasLines) {
      assert.ok(/\s301!$/.test(line), `expected forced 301! redirect, got: ${line}`);
    }
  }),
  test('every legacy alias redirect targets a final canonical trailing-slash destination directly (no chain)', () => {
    // /sitemap.xml -> /sitemap-index.xml is a file-to-file mapping, not a page route.
    const pageLines = redirectLines.filter((l) => !l.startsWith('/sitemap.xml'));
    assert.ok(pageLines.length > 0);
    for (const line of pageLines) {
      const [, to] = line.split(/\s+/);
      assert.ok(to.endsWith('/'), `redirect destination must be trailing-slash canonical: ${line}`);
    }
  }),
  test('astro.config.mjs redirects (the static-output fallback pages) also target trailing-slash canonical destinations', () => {
    const redirectsBlock = astroConfig.slice(astroConfig.indexOf('redirects: {'), astroConfig.indexOf('},', astroConfig.indexOf('redirects: {')));
    const destinations = [...redirectsBlock.matchAll(/:\s*'([^']+)'/g)].map((m) => m[1]);
    assert.ok(destinations.length > 0);
    for (const dest of destinations) {
      assert.ok(dest.endsWith('/'), `astro.config.mjs redirect destination must be trailing-slash canonical: ${dest}`);
    }
  }),
  test('multiplication-practice legacy pages redirect (via Astro.redirect) to trailing-slash canonical destinations', () => {
    for (const file of ['1-12', 'facts', 'index', 'mixed', 'times-tables']) {
      const source = readFileSync(`src/pages/multiplication-practice/${file}.astro`, 'utf8');
      const match = source.match(/Astro\.redirect\('([^']+)'/);
      assert.ok(match, `${file}.astro must call Astro.redirect`);
      assert.ok(match![1].endsWith('/'), `${file}.astro redirects to a non-canonical path: ${match![1]}`);
    }
  }),
  test('the bare /multiplication-practice legacy route (historically labeled a "hub" per docs/seo/SEO_AEO_GEO_AUDIT.md) redirects to the multiplication hub, matching the division-practice/ -> division/ pattern', () => {
    assert.ok(
      redirectLines.includes('/multiplication-practice/ /multiplication/ 301!'),
      'public/_redirects must send /multiplication-practice/ to the hub, not to /multiplication/facts/',
    );
    const source = readFileSync('src/pages/multiplication-practice/index.astro', 'utf8');
    assert.ok(source.includes("Astro.redirect('/multiplication/', 301)"));
  }),
  test('division-practice legacy fallback pages meta-refresh and canonicalize to trailing-slash destinations', () => {
    for (const file of ['divide-by', 'facts', 'index', 'remainders']) {
      const source = readFileSync(`src/pages/division-practice/${file}.astro`, 'utf8');
      const refresh = source.match(/http-equiv="refresh" content="0;url=([^"]+)"/);
      const canonical = source.match(/rel="canonical" href="https:\/\/mathpracticeonline\.com([^"]+)"/);
      assert.ok(refresh && refresh[1].endsWith('/'), `${file}.astro meta-refresh target must be trailing-slash canonical`);
      assert.ok(canonical && canonical[1].endsWith('/'), `${file}.astro canonical tag must be trailing-slash canonical`);
      assert.equal(refresh![1], canonical![1], `${file}.astro refresh target and canonical must agree`);
      assert.ok(source.includes('noindex'), `${file}.astro must stay noindex`);
    }
  }),
];
