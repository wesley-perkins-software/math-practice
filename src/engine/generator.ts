import type { PracticeConfig, Problem, Operation } from './types';
import { defaultRandom, type RandomSource } from './random';

/**
 * Version of the generator rules covered by the deterministic contract.
 * The same normalized config, seed, fresh/equivalent history, count, and
 * generator/RNG versions produce the same ordered arithmetic content. IDs are
 * deliberately outside that guarantee.
 */
export const GENERATOR_VERSION = 'gen-v1' as const;

let _idCounter = 0;
function nextId(): string {
  return String(++_idCounter);
}

function randInt(min: number, max: number, random: RandomSource): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

interface RecentProblem {
  operandA: number;
  operandB: number;
  operation: Exclude<Operation, 'mixed'>;
  correctAnswer: number;
}

const RECENT_HISTORY_LIMIT = 5;
const MAX_RETRY_ATTEMPTS = 20;
const recentByStorageKey = new Map<string, RecentProblem[]>();

export interface GenerationHistory {
  /** Internal per-practice history used by the existing repeat-suppression rules. */
  readonly recentByStorageKey: Map<string, RecentProblem[]>;
}

export interface GenerationOptions {
  random?: RandomSource;
  history?: GenerationHistory;
}

const defaultHistory: GenerationHistory = { recentByStorageKey };

/** Creates isolated repeat-suppression state for a deterministic generation run. */
export function createGenerationHistory(): GenerationHistory {
  return { recentByStorageKey: new Map() };
}

/** Returns true if adding two non-negative integers requires a carry in any column */
function hasCarry(a: number, b: number): boolean {
  while (a > 0 || b > 0) {
    if ((a % 10) + (b % 10) >= 10) return true;
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }
  return false;
}

/**
 * Returns true if the ones digits alone require regrouping 10 ones as 1 ten
 * (onesDigitA + onesDigitB >= 10). Unlike `hasCarry`, this ignores carries
 * that only occur further left (e.g. tens-to-hundreds), so it targets the
 * introductory ones-to-tens regrouping skill specifically.
 */
function hasOnesRegroup(a: number, b: number): boolean {
  return (a % 10) + (b % 10) >= 10;
}

/** Returns true if subtracting b from a (a >= b) requires a borrow in any column */
function hasBorrow(a: number, b: number): boolean {
  let borrow = 0;
  while (a > 0 || b > 0) {
    const topDigit = (a % 10) - borrow;
    const bottomDigit = b % 10;

    if (topDigit < bottomDigit) {
      return true;
    }

    borrow = 0;
    a = Math.floor(a / 10);
    b = Math.floor(b / 10);
  }
  return false;
}

function generateAddition(config: PracticeConfig, random: RandomSource): Problem {
  const { operandA, operandB, carrying, requireOnesRegroup } = config;
  const noCarry = carrying === false;
  const requireCarry = carrying === true;
  let a: number, b: number;
  let attempts = 0;
  do {
    a = randInt(operandA.min, operandA.max, random);
    b = randInt(operandB.min, operandB.max, random);
    attempts++;
    // Safety valve: after 100 attempts relax the constraint to avoid infinite loops
    if (attempts > 100) break;
  } while (
    (noCarry && hasCarry(a, b)) ||
    (requireCarry && !hasCarry(a, b)) ||
    (requireOnesRegroup && !hasOnesRegroup(a, b))
  );

  return { id: nextId(), operandA: a, operandB: b, operation: 'addition', correctAnswer: a + b };
}

function generateSubtraction(config: PracticeConfig, random: RandomSource): Problem {
  const { operandA, operandB, borrowing } = config;
  const noBorrow = borrowing === false;
  const requireBorrow = borrowing === true;

  let a: number | undefined;
  let b: number | undefined;
  let attempts = 0;
  while (attempts < 100) {
    const candidateA = randInt(operandA.min, operandA.max, random);
    const candidateB = randInt(operandB.min, operandB.max, random);
    attempts++;

    if (candidateB > candidateA) continue;

    const candidateHasBorrow = hasBorrow(candidateA, candidateB);
    if (noBorrow && candidateHasBorrow) continue;
    if (requireBorrow && !candidateHasBorrow) continue;

    a = candidateA;
    b = candidateB;
    break;
  }

  if (a === undefined || b === undefined) {
    for (let candidateA = operandA.min; candidateA <= operandA.max; candidateA++) {
      for (let candidateB = operandB.min; candidateB <= operandB.max; candidateB++) {
        if (candidateB > candidateA) continue;

        const candidateHasBorrow = hasBorrow(candidateA, candidateB);
        if (noBorrow && candidateHasBorrow) continue;
        if (requireBorrow && !candidateHasBorrow) continue;

        a = candidateA;
        b = candidateB;
        break;
      }
      if (a !== undefined && b !== undefined) break;
    }
  }

  if (a === undefined || b === undefined) {
    throw new Error(`Unable to generate subtraction problem for config "${config.storageKey}"`);
  }

  return { id: nextId(), operandA: a, operandB: b, operation: 'subtraction', correctAnswer: a - b };
}

function generateMultiplication(config: PracticeConfig, random: RandomSource): Problem {
  const maxF = config.maxFactor ?? 12;
  let a: number, b: number;
  if (config.factsMode) {
    a = randInt(1, maxF, random);
    b = randInt(1, maxF, random);
  } else {
    a = randInt(config.operandA.min, config.operandA.max, random);
    b = randInt(config.operandB.min, config.operandB.max, random);
  }
  return { id: nextId(), operandA: a, operandB: b, operation: 'multiplication', correctAnswer: a * b };
}

function generateDivisionWithRemainder(random: RandomSource): Problem {
  const divisor = randInt(2, 12, random);
  const quotient = randInt(1, 12, random);
  const remainder = randInt(1, divisor - 1, random);
  const dividend = divisor * quotient + remainder;
  return { id: nextId(), operandA: dividend, operandB: divisor, operation: 'division', correctAnswer: quotient, remainder };
}

function generateDivision(config: PracticeConfig, random: RandomSource): Problem {
  if (config.withRemainder) return generateDivisionWithRemainder(random);

  const maxF = config.maxFactor ?? 12;
  let divisor: number, quotient: number;
  if (config.factsMode) {
    divisor = randInt(config.operandB.min, config.operandB.max, random);
    quotient = randInt(1, maxF, random);
  } else {
    divisor = randInt(Math.max(config.operandB.min, 1), config.operandB.max, random);
    quotient = randInt(config.operandA.min, config.operandA.max, random);
  }
  const dividend = divisor * quotient;
  return { id: nextId(), operandA: dividend, operandB: divisor, operation: 'division', correctAnswer: quotient };
}

function generateSingle(config: PracticeConfig, op: Exclude<Operation, 'mixed'>, random: RandomSource): Problem {
  switch (op) {
    case 'addition':      return generateAddition(config, random);
    case 'subtraction':   return generateSubtraction(config, random);
    case 'multiplication': return generateMultiplication(config, random);
    case 'division':      return generateDivision(config, random);
  }
}

function isOneDigitAdditionConfig(config: PracticeConfig): boolean {
  return (
    config.operation === 'addition' &&
    config.operandA.min >= 0 &&
    config.operandA.max <= 9 &&
    config.operandB.min >= 0 &&
    config.operandB.max <= 9
  );
}

function isExactRepeat(history: RecentProblem[], candidate: Problem): boolean {
  const previous = history[history.length - 1];
  return Boolean(
    previous &&
    previous.operation === candidate.operation &&
    previous.operandA === candidate.operandA &&
    previous.operandB === candidate.operandB
  );
}

function repeatsRecentAdditionAnswer(history: RecentProblem[], candidate: Problem): boolean {
  if (history.length < 2) return false;
  const lastTwo = history.slice(-2);
  return lastTwo.every((item) => item.correctAnswer === candidate.correctAnswer);
}

function saveToHistory(history: GenerationHistory, config: PracticeConfig, problem: Problem): void {
  const current = history.recentByStorageKey.get(config.storageKey) ?? [];
  const next: RecentProblem[] = [
    ...current,
    {
      operandA: problem.operandA,
      operandB: problem.operandB,
      operation: problem.operation,
      correctAnswer: problem.correctAnswer,
    },
  ].slice(-RECENT_HISTORY_LIMIT);
  history.recentByStorageKey.set(config.storageKey, next);
}

export function generateProblem(config: PracticeConfig, options: GenerationOptions = {}): Problem {
  const random = options.random ?? defaultRandom;
  const generationHistory = options.history ?? defaultHistory;
  const generateCandidate = (): Problem => {
    if (config.operation === 'mixed') {
      const ops = config.operations ?? ['addition', 'subtraction', 'multiplication', 'division'];
      const op = ops[Math.floor(random() * ops.length)];
      return generateSingle(config, op, random);
    }
    return generateSingle(config, config.operation, random);
  };

  const history = generationHistory.recentByStorageKey.get(config.storageKey) ?? [];
  const suppressRepeatedAnswers = isOneDigitAdditionConfig(config);
  let candidate = generateCandidate();
  let attempts = 0;
  // Keep generation total for singleton/impossible spaces: after the existing
  // bounded retry budget, accept the only candidate rather than loop forever.
  while (
    attempts < MAX_RETRY_ATTEMPTS &&
    (isExactRepeat(history, candidate) ||
      (suppressRepeatedAnswers && repeatsRecentAdditionAnswer(history, candidate)))
  ) {
    candidate = generateCandidate();
    attempts++;
  }

  saveToHistory(generationHistory, config, candidate);
  return candidate;
}

export function generateProblemSet(config: PracticeConfig, count: number, options: GenerationOptions = {}): Problem[] {
  return Array.from({ length: count }, () => generateProblem(config, options));
}
