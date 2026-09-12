/**
 * Pure logic for the FractionBar visual, kept out of the .tsx component file
 * so it can be unit tested directly (this project's test harness runs plain
 * .ts modules through Node, not a component-rendering framework).
 */

const CARDINALS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

const DENOMINATOR_NAMES: Record<number, { singular: string; plural: string }> = {
  2: { singular: 'half', plural: 'halves' },
  3: { singular: 'third', plural: 'thirds' },
  4: { singular: 'fourth', plural: 'fourths' },
  5: { singular: 'fifth', plural: 'fifths' },
  6: { singular: 'sixth', plural: 'sixths' },
  7: { singular: 'seventh', plural: 'sevenths' },
  8: { singular: 'eighth', plural: 'eighths' },
  9: { singular: 'ninth', plural: 'ninths' },
  10: { singular: 'tenth', plural: 'tenths' },
  11: { singular: 'eleventh', plural: 'elevenths' },
  12: { singular: 'twelfth', plural: 'twelfths' },
};

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** e.g. describeFraction(3, 4) -> "Three out of four equal parts shaded. Fraction: three fourths." */
export function describeFraction(numerator: number, denominator: number): string {
  const numeratorWord = CARDINALS[numerator] ?? String(numerator);
  const denominatorCardinal = CARDINALS[denominator] ?? String(denominator);
  const names = DENOMINATOR_NAMES[denominator];
  const fractionName = names
    ? `${numeratorWord} ${numerator === 1 ? names.singular : names.plural}`
    : `${numerator}/${denominator}`;
  return `${capitalize(numeratorWord)} out of ${denominatorCardinal} equal parts shaded. Fraction: ${fractionName}.`;
}

/** One boolean per partition, true where shaded. Supports denominators 2–12. */
export function fractionBarSegments(numerator: number, denominator: number): boolean[] {
  if (!Number.isInteger(denominator) || denominator < 2 || denominator > 12) {
    throw new Error('FractionBar supports denominators 2 through 12 only');
  }
  if (!Number.isInteger(numerator) || numerator < 0 || numerator > denominator) {
    throw new Error('FractionBar numerator must be an integer between 0 and the denominator');
  }
  return Array.from({ length: denominator }, (_, i) => i < numerator);
}
