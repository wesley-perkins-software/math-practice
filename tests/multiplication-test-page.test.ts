import { assert, test } from './harness';
import { readFileSync, existsSync } from 'node:fs';
const source = (p: string) => readFileSync(p, 'utf8');

export const tests = [
  test('the canonical /multiplication/test/ route exists as a single index page', () => {
    assert.ok(existsSync('src/pages/multiplication/test/index.astro'));
    // No sibling test-family pages — one canonical page only.
    for (const forbidden of [
      'src/pages/times-tables/test/index.astro',
      'src/pages/multiplication/one-minute-test/index.astro',
      'src/pages/multiplication/times-tables/test/index.astro',
    ]) {
      assert.equal(existsSync(forbidden), false, `${forbidden} must not exist — only one canonical Test page is allowed`);
    }
  }),
  test('the Multiplication Test page is self-canonical with the correct H1 and title direction', () => {
    const page = source('src/pages/multiplication/test/index.astro');
    assert.ok(page.includes("canonical={`${SITE}/multiplication/test`}"));
    assert.ok(page.includes('>Multiplication Test</h1>'));
    assert.ok(page.includes('title="Multiplication Test'));
  }),
  test('the Test page mounts the runner immediately after the H1 via pilotLayout (tool above the fold)', () => {
    const page = source('src/pages/multiplication/test/index.astro');
    assert.ok(page.includes('pilotLayout'));
    assert.ok(page.includes('<MultiplicationTestRunner slot="widget" client:load />'));
  }),
  test('the Test page carries FAQPage and LearningResource structured data, matching the existing multiplication hub convention', () => {
    const page = source('src/pages/multiplication/test/index.astro');
    assert.ok(page.includes('"@type": "FAQPage"'));
    assert.ok(page.includes('"@type": "LearningResource"'));
  }),
  test('the sitemap filter does not exclude the Test route', () => {
    const config = source('astro.config.mjs');
    assert.equal(config.includes("'/multiplication/test/'"), false, 'the Test route must not be added to the sitemap exclusion list');
  }),
  test('contextual internal links to the Test page distinguish it from practice and the Speed Drill', () => {
    for (const [file, needle] of [
      ['src/pages/multiplication/facts.astro', "href: '/multiplication/test/'"],
      ['src/pages/multiplication/times-tables/index.astro', "href: '/multiplication/test/'"],
      ['src/pages/multiplication/index.astro', "href: '/multiplication/test/'"],
      ['src/pages/arithmetic-speed-drill.astro', "href: '/multiplication/test/'"],
      ['src/pages/for-teachers.astro', "href: '/multiplication/test/'"],
    ] as const) {
      assert.ok(source(file).includes(needle), `${file} must link to the Multiplication Test`);
    }
    assert.ok(source('src/pages/multiplication/facts.astro').includes('Take a Multiplication Test'));
  }),
  test('for-teachers gets only a contextual line, not a new hero/callout section', () => {
    const page = source('src/pages/for-teachers.astro');
    const idx = page.indexOf("href: '/multiplication/test/'");
    assert.ok(idx > -1);
    // It's one entry in the existing `links` array, not new markup elsewhere on the page.
    assert.equal((page.match(/Multiplication Test/g) || []).length, 1, 'the Test should appear exactly once on /for-teachers/, as a single link entry');
  }),
];
