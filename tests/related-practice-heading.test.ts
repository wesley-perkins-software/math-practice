import { readFileSync } from 'node:fs';
import { assert, test } from './harness';

const source = (p: string) => readFileSync(p, 'utf8');

// These 5 pages previously wrapped <InternalLinks> in their own
// <section aria-labelledby="related-heading"><h2 id="related-heading">Related Practice</h2>...
// even though InternalLinks itself renders a "Related Practice" <h2> by default —
// producing two visible "Related Practice" headings back to back. The fix removes
// the redundant page-level wrapper and lets InternalLinks own the single heading.
const fixedPages = [
  'src/pages/addition/index.astro',
  'src/pages/subtraction/index.astro',
  'src/pages/multiplication/index.astro',
  'src/pages/multiplication/times-tables/index.astro',
  'src/pages/division/index.astro',
];

export const tests = [
  test('operation hubs and the times-tables hub no longer render a duplicate page-level "Related Practice" heading', () => {
    for (const p of fixedPages) {
      const s = source(p);
      assert.equal(s.includes('id="related-heading"'), false, `${p} still has the redundant related-heading id`);
      assert.equal(s.includes('>Related Practice<'), false, `${p} still hand-renders a "Related Practice" heading`);
    }
  }),

  test('operation hubs and the times-tables hub still render InternalLinks for their related-practice links', () => {
    for (const p of fixedPages) {
      const s = source(p);
      assert.ok(s.includes('<InternalLinks client:load links={relatedLinks} />'), `${p} should still render InternalLinks`);
    }
  }),

  test('InternalLinks itself is the single source of the "Related Practice" heading (unchanged by this fix)', () => {
    const s = source('src/components/InternalLinks.tsx');
    assert.ok(s.includes("title = 'Related Practice'"));
    assert.equal((s.match(/Related Practice/g) ?? []).length, 1);
  }),

  test('link contents, order, and card styling are unchanged — only the wrapping section/heading was removed', () => {
    // multiplication hub: same relatedLinks entries in the same order as before this fix,
    // scoped to the relatedLinks array itself (the modes array above it reuses one of the same hrefs).
    const s = source('src/pages/multiplication/index.astro');
    const relatedLinksBlock = s.slice(s.indexOf('const relatedLinks'), s.indexOf('const faqItems'));
    const order = ['/multiplication/test/', '/multiplication/times-tables/', '/arithmetic-speed-drill/', '/division/facts/', '/3rd-grade-math-practice/', '/math-worksheets/multiplication-worksheets/', '/division/'];
    let cursor = -1;
    for (const href of order) {
      const idx = relatedLinksBlock.indexOf(`href: '${href}'`);
      assert.ok(idx > cursor, `${href} missing or out of order`);
      cursor = idx;
    }
  }),
];
