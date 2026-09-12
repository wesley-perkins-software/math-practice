import { assert, test } from './harness';
import { describeFraction, fractionBarSegments } from '../src/engine/fractions/visual';

export const tests = [
  test('denominator determines partition count', () => {
    assert.equal(fractionBarSegments(1, 2).length, 2);
    assert.equal(fractionBarSegments(5, 12).length, 12);
  }),

  test('numerator determines the shaded prefix, denominator 2', () => {
    assert.deepEqual(fractionBarSegments(1, 2), [true, false]);
  }),

  test('numerator determines the shaded prefix, denominator 12', () => {
    assert.deepEqual(
      fractionBarSegments(5, 12),
      [true, true, true, true, true, false, false, false, false, false, false, false],
    );
  }),

  test('zero numerator shades nothing; numerator equal to denominator shades everything', () => {
    assert.deepEqual(fractionBarSegments(0, 4), [false, false, false, false]);
    assert.deepEqual(fractionBarSegments(4, 4), [true, true, true, true]);
  }),

  test('rejects denominators outside the supported 2-12 visual range', () => {
    assert.throws(() => fractionBarSegments(0, 1));
    assert.throws(() => fractionBarSegments(0, 13));
  }),

  test('rejects a numerator outside 0..denominator', () => {
    assert.throws(() => fractionBarSegments(-1, 4));
    assert.throws(() => fractionBarSegments(5, 4));
  }),

  test('accessible label names shaded count, total, and the fraction in words', () => {
    assert.equal(describeFraction(3, 4), 'Three out of four equal parts shaded. Fraction: three fourths.');
    assert.equal(describeFraction(1, 2), 'One out of two equal parts shaded. Fraction: one half.');
    assert.equal(describeFraction(5, 12), 'Five out of twelve equal parts shaded. Fraction: five twelfths.');
  }),
];
