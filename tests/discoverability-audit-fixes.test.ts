import { readFileSync } from 'node:fs';
import { assert, test } from './harness';

const source = (p: string) => readFileSync(p, 'utf8');

export const tests = [
  test('shared footer (HubLayout, PracticeLayout) links to /daily-review/, matching the homepage footer', () => {
    for (const p of ['src/layouts/HubLayout.astro', 'src/layouts/PracticeLayout.astro']) {
      const s = source(p);
      assert.ok(s.includes('href="/daily-review/"'), p);
      assert.ok(s.includes('>Daily Review<'), p);
      // Exactly one footer entry, not a duplicate.
      assert.equal((s.match(/href="\/daily-review\/"/g) ?? []).length, 1, p);
    }
    // Homepage's own footer already had it before this fix — still true.
    assert.ok(source('src/pages/index.astro').includes('href="/daily-review/"'));
  }),

  test('multiplication hub Related Practice links to the Arithmetic Speed Drill', () => {
    const s = source('src/pages/multiplication/index.astro');
    assert.ok(s.includes("href: '/arithmetic-speed-drill/'"));
    assert.ok(s.includes('Try the 60-Second Speed Drill'));
  }),

  test('division hub Related Practice links to the Arithmetic Speed Drill', () => {
    const s = source('src/pages/division/index.astro');
    assert.ok(s.includes("href: '/arithmetic-speed-drill/'"));
    assert.ok(s.includes('Try the 60-Second Speed Drill'));
  }),

  test('homepage links to the Multiplication Chart from the Complete Math Practice Online Index', () => {
    const s = source('src/pages/index.astro');
    const indexStart = s.indexOf('Complete Math Practice Online Index');
    const indexSection = s.slice(indexStart, s.indexOf('Frequently Asked Questions', indexStart));
    assert.ok(indexSection.includes('href="/multiplication-chart/"'));
    assert.ok(indexSection.includes('>Multiplication Chart<'));
  }),

  test('no accidental global-nav additions: SiteHeader is untouched by this pass', () => {
    const s = source('src/components/SiteHeader.astro');
    assert.equal(s.includes('/daily-review/'), false);
    assert.equal(s.includes('/multiplication-chart/'), false);
  }),

  test('Divide By hub deliberately left without an FAQ — no FAQPage schema, no faqItems', () => {
    const s = source('src/pages/division/divide-by/index.astro');
    assert.equal(s.includes('FAQPage'), false);
    assert.equal(s.includes('faqItems'), false);
  }),

  test('Daily Review, Speed Drill, and Multiplication Chart links use trailing-slash hrefs, matching site convention', () => {
    assert.ok(source('src/layouts/HubLayout.astro').includes('href="/daily-review/"'));
    assert.ok(source('src/pages/multiplication/index.astro').includes("href: '/arithmetic-speed-drill/'"));
    assert.ok(source('src/pages/index.astro').includes('href="/multiplication-chart/"'));
  }),
];
