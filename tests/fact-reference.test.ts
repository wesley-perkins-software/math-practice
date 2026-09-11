import { readFileSync } from 'node:fs';
import { assert, test } from './harness';
import { getMultiplicationFacts, getDivisionFacts } from '../src/engine/factReference';

const source = (p: string) => readFileSync(p, 'utf8');

export const tests = [
  test('getMultiplicationFacts produces exactly 12 ascending facts with correct products for every base 1–12', () => {
    for (let base = 1; base <= 12; base++) {
      const facts = getMultiplicationFacts(base);
      assert.equal(facts.length, 12, `base ${base}`);
      assert.equal(facts[0].display, `${base} × 1 = ${base}`, `base ${base} first fact`);
      assert.equal(facts[11].display, `${base} × 12 = ${base * 12}`, `base ${base} last fact`);
      facts.forEach((fact, i) => {
        const n = i + 1;
        assert.equal(fact.display, `${base} × ${n} = ${base * n}`, `base ${base}, n ${n}`);
      });
    }
  }),
  test('getMultiplicationFacts uses the × symbol, never a plain x', () => {
    for (const fact of getMultiplicationFacts(7)) {
      assert.ok(fact.display.includes('×'));
      assert.ok(!fact.display.includes('x'));
    }
  }),
  test('getDivisionFacts produces exactly 12 ascending facts with exact-multiple dividends for every base 1–12', () => {
    for (let base = 1; base <= 12; base++) {
      const facts = getDivisionFacts(base);
      assert.equal(facts.length, 12, `base ${base}`);
      assert.equal(facts[0].display, `${base} ÷ ${base} = 1`, `base ${base} first fact`);
      assert.equal(facts[11].display, `${base * 12} ÷ ${base} = 12`, `base ${base} last fact`);
      facts.forEach((fact, i) => {
        const n = i + 1;
        const dividend = base * n;
        assert.equal(fact.display, `${dividend} ÷ ${base} = ${n}`, `base ${base}, quotient ${n}`);
        assert.equal(dividend % base, 0, `dividend ${dividend} must be an exact multiple of ${base}`);
      });
    }
  }),
  test('getDivisionFacts uses the ÷ symbol', () => {
    for (const fact of getDivisionFacts(7)) {
      assert.ok(fact.display.includes('÷'));
    }
  }),
  test('the FactReferenceList component exists and is presentational only (no hydration directive, no state)', () => {
    const s = source('src/components/FactReferenceList.astro');
    assert.ok(!/client:(load|idle|visible|media|only)/.test(s), 'component must not use a client hydration directive');
    assert.ok(!s.includes('useState'), 'component must not introduce React-style state');
  }),
  test('the FactReferenceList component is not imported by or coupled to the Multiplication Chart', () => {
    const chartComponent = source('src/components/MultiplicationChart.tsx');
    const chartEngine = source('src/engine/multiplicationChart.ts');
    assert.ok(!chartComponent.includes('FactReferenceList'), 'MultiplicationChart.tsx must not import FactReferenceList');
    assert.ok(!chartEngine.includes('factReference'), 'multiplicationChart.ts must not import factReference');
    const factReferenceComponent = source('src/components/FactReferenceList.astro');
    assert.ok(!factReferenceComponent.includes('MultiplicationChart'), 'FactReferenceList.astro must not import MultiplicationChart');
    const factReferenceEngine = source('src/engine/factReference.ts');
    assert.ok(!factReferenceEngine.includes('multiplicationChart'), 'factReference.ts must not import multiplicationChart');
  }),
  test('the Times Table leaf wires in FactReferenceList with the correct heading and props', () => {
    const s = source('src/pages/multiplication/times-tables/[table].astro');
    assert.ok(s.includes("import FactReferenceList from '@/components/FactReferenceList.astro';"));
    assert.ok(s.includes('<FactReferenceList'));
    assert.ok(s.includes('operation="multiplication"'));
    assert.ok(s.includes('base={tableNumber}'));
    assert.ok(s.includes('`${tableNumber} Times Table Facts`'));
  }),
  test('the Divide By leaf wires in FactReferenceList with the correct heading and props', () => {
    const s = source('src/pages/division/divide-by/[divisor].astro');
    assert.ok(s.includes("import FactReferenceList from '@/components/FactReferenceList.astro';"));
    assert.ok(s.includes('<FactReferenceList'));
    assert.ok(s.includes('operation="division"'));
    assert.ok(s.includes('base={divisor}'));
    assert.ok(s.includes('`Divide by ${divisor} Facts`'));
  }),
  test('the Times Table FAQ no longer duplicates the full 12-fact list as prose', () => {
    const s = source('src/pages/multiplication/times-tables/[table].astro');
    assert.ok(!s.includes('tableList'), 'the redundant tableList string should be removed now that the visible reference section covers this');
    assert.ok(s.includes('Times Table Facts reference section'), 'the FAQ answer should point to the visible reference section instead');
  }),
];
