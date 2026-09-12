import { assert, test } from './harness';
import { compare, equals, gcd, isInLowestTerms, makeFraction, reduce } from '../src/engine/fractions/math';

export const tests = [
  test('makeFraction rejects a zero denominator', () => {
    assert.throws(() => makeFraction(1, 0));
  }),

  test('makeFraction rejects non-integer numerator/denominator', () => {
    assert.throws(() => makeFraction(1.5, 2));
    assert.throws(() => makeFraction(1, 2.5));
  }),

  test('makeFraction normalizes a negative denominator onto the numerator', () => {
    assert.deepEqual(makeFraction(1, -2), { numerator: -1, denominator: 2 });
  }),

  test('gcd is correct for coprime, shared-factor, and zero inputs', () => {
    assert.equal(gcd(6, 8), 2);
    assert.equal(gcd(9, 12), 3);
    assert.equal(gcd(7, 5), 1);
    assert.equal(gcd(0, 5), 5);
  }),

  test('reduce: 2/4 -> 1/2', () => {
    assert.deepEqual(reduce({ numerator: 2, denominator: 4 }), { numerator: 1, denominator: 2 });
  }),

  test('reduce: 6/8 -> 3/4', () => {
    assert.deepEqual(reduce({ numerator: 6, denominator: 8 }), { numerator: 3, denominator: 4 });
  }),

  test('reduce: 0/5 -> 0/1 (zero numerator)', () => {
    assert.deepEqual(reduce({ numerator: 0, denominator: 5 }), { numerator: 0, denominator: 1 });
  }),

  test('reduce: 4/2 -> 2/1 (whole-number equivalent)', () => {
    assert.deepEqual(reduce({ numerator: 4, denominator: 2 }), { numerator: 2, denominator: 1 });
  }),

  test('reduce: an already-reduced fraction is unchanged', () => {
    assert.deepEqual(reduce({ numerator: 3, denominator: 4 }), { numerator: 3, denominator: 4 });
  }),

  test('isInLowestTerms distinguishes reduced from unreduced fractions', () => {
    assert.equal(isInLowestTerms({ numerator: 3, denominator: 4 }), true);
    assert.equal(isInLowestTerms({ numerator: 6, denominator: 8 }), false);
    assert.equal(isInLowestTerms({ numerator: 0, denominator: 1 }), true);
  }),

  test('equals: 1/2 == 2/4 and 3/6 == 1/2', () => {
    assert.equal(equals({ numerator: 1, denominator: 2 }, { numerator: 2, denominator: 4 }), true);
    assert.equal(equals({ numerator: 3, denominator: 6 }, { numerator: 1, denominator: 2 }), true);
  }),

  test('equals rejects unequal fractions', () => {
    assert.equal(equals({ numerator: 1, denominator: 2 }, { numerator: 1, denominator: 3 }), false);
  }),

  test('equals treats whole-number equivalents correctly (4/2 == 2/1)', () => {
    assert.equal(equals({ numerator: 4, denominator: 2 }, { numerator: 2, denominator: 1 }), true);
  }),

  test('compare: 1/2 < 3/4', () => {
    assert.equal(compare({ numerator: 1, denominator: 2 }, { numerator: 3, denominator: 4 }), -1);
  }),

  test('compare: 5/6 > 2/3', () => {
    assert.equal(compare({ numerator: 5, denominator: 6 }, { numerator: 2, denominator: 3 }), 1);
  }),

  test('compare: equal rational values compare equal even with different representations', () => {
    assert.equal(compare({ numerator: 2, denominator: 4 }, { numerator: 1, denominator: 2 }), 0);
  }),
];
