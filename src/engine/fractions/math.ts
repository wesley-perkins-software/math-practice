import type { Fraction } from './types';

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

/** Normalizes sign onto the numerator and rejects a zero/non-integer denominator. */
export function makeFraction(numerator: number, denominator: number): Fraction {
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator)) {
    throw new Error('Fraction numerator and denominator must be integers');
  }
  if (denominator === 0) {
    throw new Error('Fraction denominator must not be zero');
  }
  return denominator < 0
    ? { numerator: -numerator, denominator: -denominator }
    : { numerator, denominator };
}

/** `0/n` reduces to `0/1`; whole-number equivalents like `4/2` reduce to `2/1`. */
export function reduce(fraction: Fraction): Fraction {
  if (fraction.numerator === 0) return { numerator: 0, denominator: 1 };
  const divisor = gcd(fraction.numerator, fraction.denominator);
  return { numerator: fraction.numerator / divisor, denominator: fraction.denominator / divisor };
}

export function isInLowestTerms(fraction: Fraction): boolean {
  const reduced = reduce(fraction);
  return reduced.numerator === fraction.numerator && reduced.denominator === fraction.denominator;
}

/**
 * Exact rational equality via cross-multiplication — no floating-point
 * division. Assumes both denominators are positive (guaranteed by
 * `makeFraction`/every generator in this domain).
 */
export function equals(a: Fraction, b: Fraction): boolean {
  return a.numerator * b.denominator === b.numerator * a.denominator;
}

/** Exact rational ordering via cross-multiplication. Same positive-denominator assumption as `equals`. */
export function compare(a: Fraction, b: Fraction): -1 | 0 | 1 {
  const left = a.numerator * b.denominator;
  const right = b.numerator * a.denominator;
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}
