import { readFileSync } from 'node:fs';
import { assert, test } from './harness';

const source = (p: string) => readFileSync(p, 'utf8');

const multFacts = source('src/pages/multiplication/facts.astro');
const divFacts = source('src/pages/division/facts.astro');

export const tests = [
  test('multiplication facts page H1 reads "Mixed Multiplication Facts", matching the nav/hub label', () => {
    assert.ok(multFacts.includes('>Mixed Multiplication Facts</h1>'));
    assert.equal(multFacts.includes('>Multiplication Facts</h1>'), false);
  }),

  test('division facts page H1 reads "Mixed Division Facts", matching the nav/hub label', () => {
    assert.ok(divFacts.includes('>Mixed Division Facts</h1>'));
    assert.equal(divFacts.includes('>Division Facts</h1>'), false);
  }),

  test('canonical URLs are unchanged by the H1 refinement', () => {
    assert.ok(multFacts.includes("canonical={`${SITE}/multiplication/facts`}"));
    assert.ok(divFacts.includes("canonical={`${SITE}/division/facts`}"));
  }),

  test('established SEO title/meta terminology ("Multiplication Facts"/"Division Facts") is preserved even though the H1 is now "Mixed"', () => {
    assert.ok(multFacts.includes('title="Multiplication Facts Practice'));
    assert.ok(divFacts.includes('title="Division Facts Practice'));
    // JSON-LD LearningResource name stays the established search term too — schema is left alone deliberately.
    assert.ok(multFacts.includes('"name": "Multiplication Facts Practice"'));
    assert.ok(divFacts.includes('"name": "Division Facts Practice"'));
  }),

  test('breadcrumbs use the shorter "Mixed Facts" leaf, coherent with the "Mixed ..." H1 without repeating the operation name', () => {
    assert.ok(multFacts.includes("{ label: 'Mixed Facts' }"));
    assert.ok(divFacts.includes("{ label: 'Mixed Facts' }"));
  }),
];
