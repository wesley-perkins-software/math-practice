import { readFileSync } from 'node:fs';
import { assert, test } from './harness';

const source = readFileSync('src/components/SiteHeader.astro', 'utf8');

export const tests = [
  test('Create Classroom Practice is added to the single staticLinks source shared by desktop and mobile, ordered before My Progress', () => {
    const staticLinksBlock = source.slice(source.indexOf('const staticLinks'), source.indexOf('];', source.indexOf('const staticLinks')));
    assert.ok(staticLinksBlock.includes("{ href: '/create/', label: 'Create Classroom Practice' }"));
    for (const existing of ["{ href: '/arithmetic-speed-drill/', label: 'Speed Drill' }", "{ href: '/math-worksheets/', label: 'Worksheets' }", "{ href: '/progress/', label: 'My Progress' }"]) {
      assert.ok(staticLinksBlock.includes(existing), existing);
    }
    assert.equal((staticLinksBlock.match(/href: '\/create\/'/g) ?? []).length, 1);
    // Order: Speed Drill, Worksheets, Create Classroom Practice, My Progress.
    assert.ok(staticLinksBlock.indexOf("label: 'Worksheets'") < staticLinksBlock.indexOf('Create Classroom Practice'));
    assert.ok(staticLinksBlock.indexOf('Create Classroom Practice') < staticLinksBlock.indexOf("label: 'My Progress'"));
  }),
  test('header container is widened to the measured 1320px breathing-room width, independent of page content width', () => {
    assert.ok(source.includes('max-w-[1320px] mx-auto px-4 sm:px-6'));
    assert.equal(source.includes('max-w-5xl mx-auto'), false);
    assert.equal(source.includes('max-w-7xl mx-auto'), false);
  }),
  test('desktop nav and hamburger trigger split at the same 1320px breakpoint, not lg/xl', () => {
    assert.ok(source.includes('hidden min-[1320px]:flex'));
    assert.ok(source.includes('block min-[1320px]:hidden'));
    assert.equal(source.includes('lg:flex'), false);
    assert.equal(source.includes('lg:hidden'), false);
    assert.equal(source.includes('xl:flex'), false);
    assert.equal(source.includes('xl:hidden'), false);
  }),
  test('brand icon and wordmark are modestly enlarged, not left at the old undersized values', () => {
    assert.ok(source.includes('w-8 h-8 rounded-lg bg-[#4F46E5]'), 'brand icon should be w-8 h-8 (up from w-7 h-7)');
    assert.equal(source.includes('w-7 h-7 rounded-lg bg-[#4F46E5]'), false);
    assert.ok(/width="16" height="16" fill="white"/.test(source), 'brand glyph svg should be 16x16 (up from 14x14)');
    assert.equal(source.includes('width="14" height="14" fill="white"'), false);
    // Wordmark: exactly one step up from text-base — asserted as "not text-base" plus "no wrapping"
    // (whitespace-nowrap) rather than pinning an exact class, since visual QA may land on text-lg or text-[17px].
    assert.ok(/text-(lg|\[17px\]) font-bold text-white tracking-tight whitespace-nowrap/.test(source), 'wordmark should be enlarged beyond text-base while staying on one line');
    assert.equal(/text-base font-bold text-white tracking-tight/.test(source), false);
  }),
];
