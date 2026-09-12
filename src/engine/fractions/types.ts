/**
 * Fractions is a deliberately separate domain from the arithmetic `Problem`/
 * `Operation` types in `src/engine/types.ts`. Arithmetic answers are scalar
 * numbers checked with `===`; a fraction answer is a rational value that can
 * have many valid representations, so it needs its own type and its own
 * answer-policy abstraction rather than widening `Operation`/`Problem`.
 */

/** An exact rational value. `denominator` must always be a positive integer. */
export interface Fraction {
  readonly numerator: number;
  readonly denominator: number;
}

export type FractionSkillId = 'equivalent-fractions' | 'simplifying-fractions';

/**
 * How a submitted `Fraction` is judged against `FractionProblem.correctAnswer`.
 * Only FIXED_DENOMINATOR_REQUIRED and SIMPLEST_FORM_REQUIRED are exercised by
 * the prototype's two skills; EQUIVALENT_VALUE_ACCEPTED and EXACT_MATCH are
 * typed now so later skills (Add/Subtract, Compare) don't need a type change.
 */
export type FractionAnswerPolicy =
  | { readonly kind: 'FIXED_DENOMINATOR_REQUIRED'; readonly targetDenominator: number }
  | { readonly kind: 'SIMPLEST_FORM_REQUIRED' }
  | { readonly kind: 'EQUIVALENT_VALUE_ACCEPTED' }
  | { readonly kind: 'EXACT_MATCH' };

export interface FractionProblem {
  readonly id: string;
  readonly skill: FractionSkillId;
  /** The fraction shown to the learner. May be unreduced (e.g. Simplify's prompt). */
  readonly prompt: Fraction;
  /** The canonical correct value, independent of the prompt's own representation. */
  readonly correctAnswer: Fraction;
  readonly policy: FractionAnswerPolicy;
}
