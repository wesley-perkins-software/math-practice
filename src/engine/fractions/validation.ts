import type { Fraction, FractionAnswerPolicy } from './types';
import { equals, isInLowestTerms } from './math';

/**
 * Single source of truth for grading a submitted fraction — no page-specific
 * conditionals. Every comparison is exact integer/cross-product math (see
 * `math.ts`); nothing here uses floating-point division.
 */
export function validateFractionAnswer(
  policy: FractionAnswerPolicy,
  submitted: Fraction,
  correctAnswer: Fraction,
): boolean {
  switch (policy.kind) {
    case 'FIXED_DENOMINATOR_REQUIRED':
      return submitted.denominator === policy.targetDenominator && equals(submitted, correctAnswer);
    case 'SIMPLEST_FORM_REQUIRED':
      return equals(submitted, correctAnswer) && isInLowestTerms(submitted);
    case 'EQUIVALENT_VALUE_ACCEPTED':
      return equals(submitted, correctAnswer);
    case 'EXACT_MATCH':
      return submitted.numerator === correctAnswer.numerator && submitted.denominator === correctAnswer.denominator;
  }
}
