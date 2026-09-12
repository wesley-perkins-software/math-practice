import { defaultRandom, type RandomSource } from '../random';
import { gcd, reduce } from './math';
import type { Fraction, FractionProblem, FractionSkillId } from './types';

/**
 * Version of the generator rules covered by the deterministic contract,
 * mirroring `GENERATOR_VERSION` in `src/engine/generator.ts` — bumping this
 * changes future output without retroactively touching problems already
 * generated under an older version.
 */
export const FRACTION_GENERATOR_VERSION = 'fractions-gen-v1' as const;

let _idCounter = 0;
function nextId(): string {
  return `frac-${++_idCounter}`;
}

function randInt(min: number, max: number, random: RandomSource): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

/**
 * Fractions-specific recent-history keys, separate from arithmetic's
 * `RecentProblem`/`GenerationHistory` (`src/engine/generator.ts`), which is
 * hard-typed to scalar `operandA/operandB/correctAnswer` fields. Keyed by
 * skill, not by an arithmetic `storageKey` shape.
 */
export interface FractionGenerationHistory {
  readonly recentBySkill: Map<FractionSkillId, string[]>;
}

const RECENT_HISTORY_LIMIT = 5;
const MAX_RETRY_ATTEMPTS = 20;
const defaultRecentBySkill = new Map<FractionSkillId, string[]>();
const defaultHistory: FractionGenerationHistory = { recentBySkill: defaultRecentBySkill };

/** Creates isolated repeat-suppression state for a deterministic generation run (e.g. tests, a future seeded daily set). */
export function createFractionGenerationHistory(): FractionGenerationHistory {
  return { recentBySkill: new Map() };
}

function canonicalKey(fraction: Fraction): string {
  const r = reduce(fraction);
  return `${r.numerator}/${r.denominator}`;
}

function isRecentDuplicate(history: FractionGenerationHistory, skill: FractionSkillId, key: string): boolean {
  return (history.recentBySkill.get(skill) ?? []).includes(key);
}

function rememberRecent(history: FractionGenerationHistory, skill: FractionSkillId, key: string): void {
  const list = history.recentBySkill.get(skill) ?? [];
  list.push(key);
  if (list.length > RECENT_HISTORY_LIMIT) list.shift();
  history.recentBySkill.set(skill, list);
}

/**
 * Picks a numerator in 1..denominator-1 that is coprime with `denominator` —
 * i.e. a proper fraction already in lowest terms. Built as direct sampling
 * over the (always non-empty, since 1 is coprime with everything) set of
 * valid numerators rather than reject-and-retry, so callers never need a
 * "what if no valid candidate exists" fallback.
 */
function randomProperCoprimeNumerator(denominator: number, random: RandomSource): number {
  const candidates: number[] = [];
  for (let n = 1; n < denominator; n++) {
    if (gcd(n, denominator) === 1) candidates.push(n);
  }
  return candidates[randInt(0, candidates.length - 1, random)]!;
}

export interface FractionGenerationOptions {
  random?: RandomSource;
  history?: FractionGenerationHistory;
}

/**
 * Equivalent Fractions: a simple reduced base fraction, a multiplier > 1
 * applied to both terms, and a fixed target denominator. The multiplier is
 * capped so the target denominator never exceeds 12 — both the prompt and
 * the target representation need to render in FractionBar's 2-12 supported
 * partition range for the optional "Show model" two-bar comparison.
 */
function generateEquivalentFractionsProblem(random: RandomSource, history: FractionGenerationHistory): FractionProblem {
  let prompt: Fraction = { numerator: 0, denominator: 0 };
  let correctAnswer: Fraction = { numerator: 0, denominator: 0 };
  let targetDenominator = 0;
  let key = '';
  for (let attempts = 0; attempts < MAX_RETRY_ATTEMPTS; attempts++) {
    const baseDenominator = randInt(2, 6, random);
    const baseNumerator = randomProperCoprimeNumerator(baseDenominator, random);
    const maxMultiplier = Math.max(2, Math.floor(12 / baseDenominator));
    const multiplier = randInt(2, maxMultiplier, random);
    targetDenominator = baseDenominator * multiplier;
    prompt = { numerator: baseNumerator, denominator: baseDenominator };
    correctAnswer = { numerator: baseNumerator * multiplier, denominator: targetDenominator };
    key = canonicalKey(correctAnswer);
    if (!isRecentDuplicate(history, 'equivalent-fractions', key)) break;
  }

  rememberRecent(history, 'equivalent-fractions', key);
  return {
    id: nextId(),
    skill: 'equivalent-fractions',
    prompt,
    correctAnswer,
    policy: { kind: 'FIXED_DENOMINATOR_REQUIRED', targetDenominator },
  };
}

/**
 * Simplifying Fractions: an intentionally unreduced prompt (base coprime
 * fraction scaled by a multiplier > 1, guaranteeing gcd(prompt) > 1) with a
 * unique simplest-form answer.
 */
function generateSimplifyingFractionsProblem(random: RandomSource, history: FractionGenerationHistory): FractionProblem {
  let prompt: Fraction = { numerator: 0, denominator: 0 };
  let correctAnswer: Fraction = { numerator: 0, denominator: 0 };
  let key = '';
  for (let attempts = 0; attempts < MAX_RETRY_ATTEMPTS; attempts++) {
    const denominator = randInt(2, 6, random);
    const numerator = randomProperCoprimeNumerator(denominator, random);
    // Cap the multiplier so the unreduced prompt's denominator never exceeds
    // 12 — FractionBar (the only V1 visual model) supports 2–12 partitions,
    // and this prompt (not the reduced answer) is what the bar must show.
    const maxMultiplier = Math.max(2, Math.floor(12 / denominator));
    const multiplier = randInt(2, maxMultiplier, random);
    prompt = { numerator: numerator * multiplier, denominator: denominator * multiplier };
    correctAnswer = { numerator, denominator };
    key = canonicalKey(correctAnswer);
    if (!isRecentDuplicate(history, 'simplifying-fractions', key)) break;
  }

  rememberRecent(history, 'simplifying-fractions', key);
  return {
    id: nextId(),
    skill: 'simplifying-fractions',
    prompt,
    correctAnswer,
    policy: { kind: 'SIMPLEST_FORM_REQUIRED' },
  };
}

export function generateFractionProblem(
  skill: FractionSkillId,
  options: FractionGenerationOptions = {},
): FractionProblem {
  const random = options.random ?? defaultRandom;
  const history = options.history ?? defaultHistory;
  switch (skill) {
    case 'equivalent-fractions':
      return generateEquivalentFractionsProblem(random, history);
    case 'simplifying-fractions':
      return generateSimplifyingFractionsProblem(random, history);
  }
}

export function generateFractionProblemSet(
  skill: FractionSkillId,
  count: number,
  options: FractionGenerationOptions = {},
): FractionProblem[] {
  const random = options.random ?? defaultRandom;
  const history = options.history ?? defaultHistory;
  return Array.from({ length: count }, () => generateFractionProblem(skill, { random, history }));
}
