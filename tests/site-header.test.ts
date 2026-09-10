import { readFileSync } from 'node:fs';
import { assert, test } from './harness';

const source = readFileSync('src/components/SiteHeader.astro', 'utf8');

export const tests = [
  test('Create Classroom Practice is added to the single staticLinks source shared by desktop and mobile, ordered before My Progress', () => {
    const staticLinksBlock = source.slice(source.indexOf('const staticLinks'), source.indexOf('];', source.indexOf('const staticLinks')));
    assert.ok(staticLinksBlock.includes("{ href: '/create/', label: 'Create Classroom Practice' }"));
    for (const existing of ["{ href: '/arithmetic-speed-drill', label: 'Speed Drill' }", "{ href: '/math-worksheets', label: 'Worksheets' }", "{ href: '/progress', label: 'My Progress' }"]) {
      assert.ok(staticLinksBlock.includes(existing), existing);
    }
    assert.equal((staticLinksBlock.match(/href: '\/create\/'/g) ?? []).length, 1);
    // Order: Speed Drill, Worksheets, Create Classroom Practice, My Progress.
    assert.ok(staticLinksBlock.indexOf("label: 'Worksheets'") < staticLinksBlock.indexOf('Create Classroom Practice'));
    assert.ok(staticLinksBlock.indexOf('Create Classroom Practice') < staticLinksBlock.indexOf("label: 'My Progress'"));
  }),
  test('header container is widened to max-w-7xl, independent of page content width', () => {
    assert.ok(source.includes('max-w-7xl mx-auto px-4 sm:px-6'));
    assert.equal(source.includes('max-w-5xl mx-auto'), false);
  }),
  test('desktop nav and hamburger trigger split at xl (1280px), not lg (1024px)', () => {
    assert.ok(source.includes('hidden xl:flex'));
    assert.ok(source.includes('block xl:hidden'));
    assert.equal(source.includes('lg:flex'), false);
    assert.equal(source.includes('lg:hidden'), false);
  }),
];
