import { assert, test } from './harness';
import { validateFractionAnswer } from '../src/engine/fractions/validation';
import type { Fraction } from '../src/engine/fractions/types';

const half: Fraction = { numerator: 1, denominator: 2 };
const threeQuarters: Fraction = { numerator: 3, denominator: 4 };

export const tests = [
  // Fixed denominator: prompt target equivalent to 1/2, required denominator 8.
  test('FIXED_DENOMINATOR_REQUIRED accepts the exact target-denominator representation', () => {
    const policy = { kind: 'FIXED_DENOMINATOR_REQUIRED' as const, targetDenominator: 8 };
    assert.equal(validateFractionAnswer(policy, { numerator: 4, denominator: 8 }, half), true);
  }),

  test('FIXED_DENOMINATOR_REQUIRED rejects the correct value in the wrong denominator', () => {
    const policy = { kind: 'FIXED_DENOMINATOR_REQUIRED' as const, targetDenominator: 8 };
    assert.equal(validateFractionAnswer(policy, half, half), false);
    assert.equal(validateFractionAnswer(policy, { numerator: 2, denominator: 4 }, half), false);
  }),

  test('FIXED_DENOMINATOR_REQUIRED rejects a wrong numerator over the correct denominator', () => {
    const policy = { kind: 'FIXED_DENOMINATOR_REQUIRED' as const, targetDenominator: 8 };
    assert.equal(validateFractionAnswer(policy, { numerator: 3, denominator: 8 }, half), false);
  }),

  // Simplest form: target 3/4.
  test('SIMPLEST_FORM_REQUIRED accepts only the lowest-terms representation', () => {
    const policy = { kind: 'SIMPLEST_FORM_REQUIRED' as const };
    assert.equal(validateFractionAnswer(policy, threeQuarters, threeQuarters), true);
  }),

  test('SIMPLEST_FORM_REQUIRED rejects a mathematically-equivalent but unreduced answer', () => {
    const policy = { kind: 'SIMPLEST_FORM_REQUIRED' as const };
    assert.equal(validateFractionAnswer(policy, { numerator: 6, denominator: 8 }, threeQuarters), false);
    assert.equal(validateFractionAnswer(policy, { numerator: 9, denominator: 12 }, threeQuarters), false);
  }),

  test('SIMPLEST_FORM_REQUIRED rejects a wrong reduced fraction', () => {
    const policy = { kind: 'SIMPLEST_FORM_REQUIRED' as const };
    assert.equal(validateFractionAnswer(policy, { numerator: 2, denominator: 3 }, threeQuarters), false);
  }),

  test('EQUIVALENT_VALUE_ACCEPTED accepts any representation with the correct value', () => {
    const policy = { kind: 'EQUIVALENT_VALUE_ACCEPTED' as const };
    assert.equal(validateFractionAnswer(policy, { numerator: 2, denominator: 4 }, half), true);
    assert.equal(validateFractionAnswer(policy, { numerator: 1, denominator: 3 }, half), false);
  }),

  test('EXACT_MATCH requires the identical numerator/denominator pair', () => {
    const policy = { kind: 'EXACT_MATCH' as const };
    assert.equal(validateFractionAnswer(policy, half, half), true);
    assert.equal(validateFractionAnswer(policy, { numerator: 2, denominator: 4 }, half), false);
  }),
];
