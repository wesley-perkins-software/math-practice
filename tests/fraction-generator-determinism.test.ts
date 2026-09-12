import { assert, test } from './harness';
import {
  createFractionGenerationHistory,
  generateFractionProblemSet,
} from '../src/engine/fractions/generator';
import { createSeededRandom } from '../src/engine/random';
import { gcd, reduce } from '../src/engine/fractions/math';

const tuple = (problem: ReturnType<typeof generateFractionProblemSet>[number]) => [
  problem.skill,
  problem.prompt.numerator,
  problem.prompt.denominator,
  problem.correctAnswer.numerator,
  problem.correctAnswer.denominator,
];

const seededSet = (skill: 'equivalent-fractions' | 'simplifying-fractions', seed: number, count = 20) =>
  generateFractionProblemSet(skill, count, {
    random: createSeededRandom(seed),
    history: createFractionGenerationHistory(),
  }).map(tuple);

export const tests = [
  test('same seed produces the same ordered Equivalent Fractions sequence', () => {
    assert.deepEqual(seededSet('equivalent-fractions', 8675309), seededSet('equivalent-fractions', 8675309));
  }),

  test('same seed produces the same ordered Simplifying Fractions sequence', () => {
    assert.deepEqual(seededSet('simplifying-fractions', 8675309), seededSet('simplifying-fractions', 8675309));
  }),

  test('different seeds can produce different sequences', () => {
    assert.notDeepEqual(seededSet('equivalent-fractions', 1), seededSet('equivalent-fractions', 2));
  }),

  test('Equivalent Fractions: target denominator is always a valid multiple relationship', () => {
    const set = generateFractionProblemSet('equivalent-fractions', 30, {
      random: createSeededRandom(42),
      history: createFractionGenerationHistory(),
    });
    for (const problem of set) {
      assert.equal(problem.policy.kind, 'FIXED_DENOMINATOR_REQUIRED');
      if (problem.policy.kind !== 'FIXED_DENOMINATOR_REQUIRED') continue;
      const { targetDenominator } = problem.policy;
      assert.equal(problem.correctAnswer.denominator, targetDenominator);
      assert.ok(targetDenominator > problem.prompt.denominator, 'target denominator must exceed the prompt denominator');
      assert.ok(targetDenominator % problem.prompt.denominator === 0, 'target denominator must be an integer multiple of the prompt denominator');
      const multiplier = targetDenominator / problem.prompt.denominator;
      assert.equal(problem.correctAnswer.numerator, problem.prompt.numerator * multiplier);
      assert.notEqual(targetDenominator, 0);
      assert.ok(targetDenominator <= 12, 'target denominator must stay within FractionBar\'s 2-12 supported partition range for the optional two-bar model');
    }
  }),

  test('Simplifying Fractions: prompts are always reducible with a unique simplest-form answer', () => {
    const set = generateFractionProblemSet('simplifying-fractions', 30, {
      random: createSeededRandom(42),
      history: createFractionGenerationHistory(),
    });
    for (const problem of set) {
      assert.equal(problem.policy.kind, 'SIMPLEST_FORM_REQUIRED');
      assert.ok(gcd(problem.prompt.numerator, problem.prompt.denominator) > 1, 'prompt must not already be in simplest form');
      assert.deepEqual(reduce(problem.prompt), problem.correctAnswer);
      assert.equal(gcd(problem.correctAnswer.numerator, problem.correctAnswer.denominator), 1);
      assert.notEqual(problem.prompt.denominator, 0);
      assert.ok(problem.prompt.denominator <= 12, 'prompt denominator must stay within FractionBar\'s 2-12 supported partition range');
    }
  }),

  test('duplicate suppression avoids immediate exact repeats within the recent window', () => {
    const history = createFractionGenerationHistory();
    const random = createSeededRandom(7);
    const set = generateFractionProblemSet('simplifying-fractions', 10, { random, history });
    for (let i = 1; i < set.length; i++) {
      assert.notDeepEqual(reduce(set[i]!.correctAnswer), reduce(set[i - 1]!.correctAnswer));
    }
  }),
];
