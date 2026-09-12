import type { PracticeConfig, Problem, SessionResult } from './types';
import { generateProblemSet, createGenerationHistory } from './generator';
import { createSeededRandom } from './random';

/**
 * Deliberately NOT the shared `QuestionCount` (10|20|30|50) — the Test
 * supports its own smaller, fixed set of counts. Keeping this local avoids
 * touching a type every other practice surface's finite-session path
 * depends on.
 */
export const MULTIPLICATION_TEST_QUESTION_COUNTS = [10, 20, 30] as const;
export type MultiplicationTestQuestionCount = (typeof MULTIPLICATION_TEST_QUESTION_COUNTS)[number];

const ALL_TABLES: readonly number[] = Object.freeze(Array.from({ length: 12 }, (_, i) => i + 1));

/**
 * V1 is a fixed-length assessment only — no user-configurable timer. Total
 * elapsed time is still measured (see buildMultiplicationTestRuntimeConfig)
 * and shown in results, but there is no countdown or time pressure. Timed
 * fluency is the Arithmetic Speed Drill's job, not the Test's.
 */
export interface MultiplicationTestConfig {
  readonly facts: readonly number[];
  readonly questionCount: MultiplicationTestQuestionCount;
}

export const DEFAULT_MULTIPLICATION_TEST_CONFIG: MultiplicationTestConfig = Object.freeze({
  facts: ALL_TABLES,
  questionCount: 20,
});

export function isMultiplicationTestQuestionCount(value: unknown): value is MultiplicationTestQuestionCount {
  return typeof value === 'number' && (MULTIPLICATION_TEST_QUESTION_COUNTS as readonly number[]).includes(value);
}

function isValidFactsSelection(facts: readonly number[]): boolean {
  if (facts.length === 0 || facts.length > ALL_TABLES.length) return false;
  const seen = new Set<number>();
  for (const fact of facts) {
    if (!Number.isInteger(fact) || fact < 1 || fact > 12) return false;
    if (seen.has(fact)) return false;
    seen.add(fact);
  }
  return true;
}

/** Trusted, in-memory config (already validated) — never reads/writes storage or the URL. */
export function normalizeMultiplicationTestConfig(input: {
  facts?: readonly number[];
  questionCount?: number;
}): MultiplicationTestConfig {
  const facts = input.facts && isValidFactsSelection(input.facts) ? [...input.facts] : [...ALL_TABLES];
  const questionCount = isMultiplicationTestQuestionCount(input.questionCount) ? input.questionCount : DEFAULT_MULTIPLICATION_TEST_CONFIG.questionCount;
  return Object.freeze({ facts, questionCount });
}

// ─── URL query codec — configuration only, never results/answers/seed ────────

const ALLOWED_QUERY_KEYS = new Set(['facts', 'count']);
const MAX_QUERY_LENGTH = 512;
const MAX_PARAMETER_LENGTH = 64;

function parsePositiveInteger(value: string): number | undefined {
  return /^[1-9]\d*$/.test(value) ? Number(value) : undefined;
}

/**
 * Strictly parses `?facts=1,2,3&count=20` into a config. Any malformation
 * (unknown/duplicate keys, oversized input, invalid values) fails the whole
 * parse rather than partially repairing it — the caller falls back to
 * `DEFAULT_MULTIPLICATION_TEST_CONFIG` on failure, and the page never
 * redirects for a malformed query.
 */
export function parseMultiplicationTestQuery(query: string | URLSearchParams): MultiplicationTestConfig | undefined {
  try {
    if (typeof query === 'string' && query.length > MAX_QUERY_LENGTH) return undefined;
    const params = typeof query === 'string' ? new URLSearchParams(query) : query;
    const values = new Map<string, string>();
    for (const [key, value] of params) {
      if (values.has(key)) return undefined;
      if (key.length > MAX_PARAMETER_LENGTH || value.length > MAX_PARAMETER_LENGTH) return undefined;
      if (!ALLOWED_QUERY_KEYS.has(key)) return undefined;
      if (value === '') return undefined;
      values.set(key, value);
    }
    if (values.size === 0) return undefined;

    let facts: number[] | undefined;
    const rawFacts = values.get('facts');
    if (rawFacts !== undefined) {
      const parts = rawFacts.split(',', ALL_TABLES.length + 1);
      if (parts.length > ALL_TABLES.length) return undefined;
      const parsed = parts.map(parsePositiveInteger);
      if (parsed.some((n) => n === undefined)) return undefined;
      facts = parsed as number[];
      if (!isValidFactsSelection(facts)) return undefined;
    }

    let questionCount: number | undefined;
    const rawCount = values.get('count');
    if (rawCount !== undefined) {
      const parsed = parsePositiveInteger(rawCount);
      if (parsed === undefined || !isMultiplicationTestQuestionCount(parsed)) return undefined;
      questionCount = parsed;
    }

    return normalizeMultiplicationTestConfig({ facts, questionCount });
  } catch {
    return undefined;
  }
}

/** Serializes configuration only — never a seed, result, or score — for a shareable, canonical-preserving query string. */
export function serializeMultiplicationTestQuery(config: MultiplicationTestConfig): string {
  const params = new URLSearchParams();
  if (config.facts.length !== ALL_TABLES.length) {
    params.set('facts', [...config.facts].sort((a, b) => a - b).join(','));
  }
  if (config.questionCount !== DEFAULT_MULTIPLICATION_TEST_CONFIG.questionCount) {
    params.set('count', String(config.questionCount));
  }
  return params.toString();
}

// ─── Problem generation — reuses the existing generator/seeded-RNG pipeline ──

/**
 * Base runtime config for problem generation. Not part of the
 * ALL_PRESETS/progress registry — this identity is never used to read or
 * write stats. Always untimed: `PracticeWidget` still measures elapsed time
 * for an untimed finite session (captured at session start, i.e. Start
 * Test) and reports it in the completed `SessionResult` — the Test just
 * never puts the learner under a countdown.
 */
export function buildMultiplicationTestRuntimeConfig(config: MultiplicationTestConfig): PracticeConfig {
  return Object.freeze({
    storageKey: 'mult-test',
    operation: 'multiplication',
    mode: 'untimed',
    timerDuration: 60,
    operandA: { min: 1, max: 12 },
    operandB: { min: 1, max: 12 },
    factsMode: true,
    maxFactor: 12,
    selectedFacts: config.facts,
    // No perceptible correctness pause — feedback is hidden entirely, but a
    // uniform, brief transition still separates one problem from the next.
    correctFeedbackDelayMs: 200,
    incorrectFeedbackDelayMs: 200,
  });
}

/** A fresh, non-deterministic seed for one test attempt. Never persisted, never placed in the URL. */
export function createMultiplicationTestSeed(): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    return crypto.getRandomValues(new Uint32Array(1))[0]!;
  }
  return Math.floor(Math.random() * 2 ** 32);
}

/** Builds one attempt's deterministic-given-its-seed problem set, reusing the generator's repeat-suppression rules. */
export function buildMultiplicationTestProblems(config: MultiplicationTestConfig, seed: number): Problem[] {
  const runtimeConfig = buildMultiplicationTestRuntimeConfig(config);
  const random = createSeededRandom(seed);
  const history = createGenerationHistory();
  return generateProblemSet(runtimeConfig, config.questionCount, { random, history });
}

// ─── Missed-fact review ───────────────────────────────────────────────────────

/** Dedupes by exact (operandA, operandB) pair. Commutative pairs (7×8 vs 8×7) are kept distinct. */
export function dedupeMissedProblems(missed: readonly Problem[]): Problem[] {
  const seen = new Set<string>();
  const result: Problem[] = [];
  for (const problem of missed) {
    const key = `${problem.operandA}x${problem.operandB}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(problem);
  }
  return result;
}

// ─── Result model ─────────────────────────────────────────────────────────────

export interface MultiplicationTestResult {
  readonly session: SessionResult;
  /** Exact missed equations, deduped — never the submitted answer or response time. */
  readonly missed: readonly Problem[];
  readonly config: MultiplicationTestConfig;
}

export function buildMultiplicationTestResult(
  session: SessionResult,
  missed: readonly Problem[],
  config: MultiplicationTestConfig,
): MultiplicationTestResult {
  const deduped = dedupeMissedProblems(missed);
  return Object.freeze({
    session,
    missed: Object.freeze(deduped),
    config,
  });
}

// ─── Analytics dimensions ─────────────────────────────────────────────────────

export type MultiplicationTestSelectionScope = 'all' | 'single' | 'multiple';

export function deriveMultiplicationTestSelectionScope(facts: readonly number[]): MultiplicationTestSelectionScope {
  if (facts.length >= ALL_TABLES.length) return 'all';
  if (facts.length === 1) return 'single';
  return 'multiple';
}
