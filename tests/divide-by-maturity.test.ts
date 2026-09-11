import { assert, test } from './harness';
import { readFileSync } from 'node:fs';
import { DIVIDE_BY_FACTS } from '../src/data/generated-practice/divideBy';

const DIVIDE_BY_SOURCE_PATH = 'src/pages/division/divide-by/[divisor].astro';
const source = () => readFileSync(DIVIDE_BY_SOURCE_PATH, 'utf8');

export const tests = [
  test('the rollout-era divisor <= 5 gate on matureFaqItems is gone', () => {
    const s = source();
    assert.equal(s.includes('fact && divisor <= 5'), false, 'matureFaqItems must no longer be gated to divisors 1-5 only');
    assert.ok(s.includes('const matureFaqItems = fact ?'), 'matureFaqItems should be conditioned on fact alone, matching the Times Table leaf pattern');
  }),
  test('every divide-by fact bank entry (1-12) has the fields the mature FAQ reads from it', () => {
    assert.equal(DIVIDE_BY_FACTS.length, 12);
    for (const entry of DIVIDE_BY_FACTS) {
      assert.ok(entry.faqDifferentiator?.question?.trim().length > 0, `n=${entry.n}: faqDifferentiator.question must be non-empty`);
      assert.ok(entry.faqDifferentiator?.answer?.trim().length > 0, `n=${entry.n}: faqDifferentiator.answer must be non-empty`);
    }
  }),
  test('divisors 7-12 have hand-written EXPANDED_INTRO entries instead of falling back to the generic template', () => {
    const s = source();
    for (const divisor of [7, 8, 9, 10, 11, 12]) {
      assert.ok(new RegExp(`\\n\\s*${divisor}:\\s*\``).test(s), `EXPANDED_INTRO must define a key for divisor ${divisor}`);
    }
  }),
  test('divisor 6 is no longer excluded from the mature FAQ shape by the old gate', () => {
    const s = source();
    // Divisor 6 falls in the 6-12 range that the removed `divisor <= 5` gate
    // previously excluded; confirming the gate string is gone (checked above)
    // combined with fact-bank completeness for n=6 (checked above) together
    // prove divisor 6 now reaches matureFaqItems just like every other divisor.
    assert.equal(s.includes('divisor <= 5'), true, 'the divisor <= 5 check still legitimately exists elsewhere (gradeContext and the strategy extra-hint bullet) and must not be removed by this change');
    const sixEntry = DIVIDE_BY_FACTS.find((e) => e.n === 6);
    assert.ok(sixEntry?.faqDifferentiator?.question && sixEntry?.faqDifferentiator?.answer, 'divisor 6 fact-bank entry must supply mature FAQ content');
  }),
];
