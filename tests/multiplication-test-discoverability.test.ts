import { readFileSync } from 'node:fs';
import { assert, test } from './harness';
import { OPERATION_MENUS, operationMenuEntries } from '../src/data/practiceNav';

const multiplicationHub = readFileSync('src/pages/multiplication/index.astro', 'utf8');
const divisionHub = readFileSync('src/pages/division/index.astro', 'utf8');
const chartPage = readFileSync('src/pages/multiplication-chart/index.astro', 'utf8');

export const tests = [
  test('Multiplication Test is a core option in the header dropdown, after Times Tables and Mixed Multiplication Facts', () => {
    const entries = operationMenuEntries(OPERATION_MENUS.multiplication);
    const labels = entries.map((e) => e.label);
    assert.deepEqual(labels, ['Times Tables', 'Mixed Multiplication Facts', 'Multiplication Test']);
    const testEntry = entries.find((e) => e.label === 'Multiplication Test');
    assert.ok(testEntry && testEntry.type === 'link' && testEntry.href === '/multiplication/test/');
  }),

  test('Multiplication Chart is not added to the multiplication dropdown (it is a reference resource, not a mode)', () => {
    const labels = operationMenuEntries(OPERATION_MENUS.multiplication).map((e) => e.label);
    assert.equal(labels.some((l) => l.toLowerCase().includes('chart')), false);
  }),

  test('multiplication and division "Facts" nav/card labels distinguish mixed practice from Times Tables / Divide By', () => {
    assert.equal(OPERATION_MENUS.multiplication.items.find((i) => i.href === '/multiplication/facts/')?.label, 'Mixed Multiplication Facts');
    assert.equal(OPERATION_MENUS.division.items.find((i) => i.href === '/division/facts/')?.label, 'Mixed Division Facts');
  }),

  test('multiplication hub promotes the Test to a primary "Choose a Practice Mode" card alongside Times Tables and Facts', () => {
    const modesBlock = multiplicationHub.slice(multiplicationHub.indexOf('const modes'), multiplicationHub.indexOf('const relatedLinks'));
    assert.ok(modesBlock.includes("href: '/multiplication/test/'"), 'Test should be one of the primary mode cards');
    assert.ok(modesBlock.includes("label: 'Multiplication Test'"));
    assert.ok(modesBlock.includes("label: 'Mixed Multiplication Facts'"));
  }),

  test('multiplication hub no longer duplicates the Test link in the secondary "Related Practice" list', () => {
    const relatedBlock = multiplicationHub.slice(multiplicationHub.indexOf('const relatedLinks'), multiplicationHub.indexOf('const faqItems'));
    assert.equal(relatedBlock.includes("href: '/multiplication/test/'"), false);
  }),

  test('division hub card label distinguishes mixed Division Facts from Divide By', () => {
    const modesBlock = divisionHub.slice(divisionHub.indexOf('const modes'), divisionHub.indexOf('const relatedLinks'));
    assert.ok(modesBlock.includes("label: 'Mixed Division Facts'"));
  }),

  test('canonical Facts URLs are unchanged by the label refinement', () => {
    assert.ok(multiplicationHub.includes("href: '/multiplication/facts/'"));
    assert.ok(divisionHub.includes("href: '/division/facts/'"));
  }),

  test('Multiplication Chart "Related Practice" section no longer has a dangling aria-labelledby reference', () => {
    assert.equal(chartPage.includes('aria-labelledby="related-heading"'), false);
    assert.equal(chartPage.includes('id="related-heading"'), false);
    assert.ok(chartPage.includes('<InternalLinks title="Related Practice" links={relatedLinks} />'), 'InternalLinks should still render the related links');
  }),
];
