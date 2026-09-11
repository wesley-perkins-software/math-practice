import type { PracticeConfig, Problem } from './types';
import { createGenerationHistory, generateProblem } from './generator';
import { createSeededRandom, type RandomSource } from './random';
import { createVersionedRecordAdapter } from './storage';

/**
 * Bumping this changes every future daily seed without touching past ones
 * retroactively — the same protection GENERATOR_VERSION/RNG_VERSION give the
 * underlying engine, applied one layer up at the quota/config layer a future
 * change to tier definitions would otherwise silently mutate.
 */
export const DAILY_REVIEW_MIX_VERSION = 1 as const;

export type DailyReviewGradeId = 'k' | 'g1' | 'g2' | 'g3' | 'g4' | 'g5';

export const DAILY_REVIEW_GRADE_IDS: readonly DailyReviewGradeId[] = ['k', 'g1', 'g2', 'g3', 'g4', 'g5'];

export function isDailyReviewGradeId(value: unknown): value is DailyReviewGradeId {
  return typeof value === 'string' && (DAILY_REVIEW_GRADE_IDS as readonly string[]).includes(value);
}

export const DAILY_REVIEW_GRADE_LABELS: Record<DailyReviewGradeId, string> = {
  k: 'Kindergarten',
  g1: 'Grade 1',
  g2: 'Grade 2',
  g3: 'Grade 3',
  g4: 'Grade 4',
  g5: 'Grade 5',
};

/** Short explanatory copy shown beside the grade choice — kept narrow and honest, never implying broader curriculum coverage than the generator produces. */
export const DAILY_REVIEW_GRADE_SUBTITLES: Record<DailyReviewGradeId, string> = {
  k: 'Numbers to 10',
  g1: 'Addition & subtraction within 20',
  g2: 'Two-digit addition & subtraction',
  g3: 'Adds multiplication & division facts',
  g4: 'Facts fluency & multi-digit multiplication',
  g5: 'Multi-digit arithmetic & division with remainders',
};

interface QuotaSlot {
  count: number;
  config: PracticeConfig;
}

interface DailyReviewGrade {
  storageKey: string;
  quota: QuotaSlot[];
}

function slotConfig(storageKey: string, config: Omit<PracticeConfig, 'storageKey' | 'mode' | 'timerDuration'>): PracticeConfig {
  return { storageKey, mode: 'untimed', timerDuration: 60, ...config };
}

const DAILY_REVIEW_GRADES: Record<DailyReviewGradeId, DailyReviewGrade> = {
  k: {
    storageKey: 'daily-review-k',
    quota: [
      { count: 6, config: slotConfig('daily-review-k', { operation: 'addition', operandA: { min: 0, max: 5 }, operandB: { min: 0, max: 5 } }) },
      { count: 4, config: slotConfig('daily-review-k', { operation: 'subtraction', operandA: { min: 0, max: 10 }, operandB: { min: 0, max: 10 } }) },
    ],
  },
  g1: {
    storageKey: 'daily-review-g1',
    quota: [
      { count: 5, config: slotConfig('daily-review-g1', { operation: 'addition', operandA: { min: 1, max: 10 }, operandB: { min: 1, max: 10 } }) },
      { count: 5, config: slotConfig('daily-review-g1', { operation: 'subtraction', operandA: { min: 1, max: 20 }, operandB: { min: 1, max: 10 } }) },
    ],
  },
  g2: {
    storageKey: 'daily-review-g2',
    quota: [
      { count: 5, config: slotConfig('daily-review-g2', { operation: 'addition', operandA: { min: 10, max: 99 }, operandB: { min: 10, max: 99 } }) },
      { count: 5, config: slotConfig('daily-review-g2', { operation: 'subtraction', operandA: { min: 10, max: 99 }, operandB: { min: 10, max: 99 } }) },
    ],
  },
  g3: {
    storageKey: 'daily-review-g3',
    quota: [
      { count: 3, config: slotConfig('daily-review-g3', { operation: 'addition', operandA: { min: 10, max: 99 }, operandB: { min: 10, max: 99 } }) },
      { count: 3, config: slotConfig('daily-review-g3', { operation: 'subtraction', operandA: { min: 10, max: 99 }, operandB: { min: 10, max: 99 } }) },
      { count: 2, config: slotConfig('daily-review-g3', { operation: 'multiplication', operandA: { min: 1, max: 12 }, operandB: { min: 1, max: 12 }, factsMode: true, maxFactor: 12 }) },
      { count: 2, config: slotConfig('daily-review-g3', { operation: 'division', operandA: { min: 1, max: 12 }, operandB: { min: 1, max: 12 }, factsMode: true, maxFactor: 12 }) },
    ],
  },
  g4: {
    storageKey: 'daily-review-g4',
    quota: [
      { count: 2, config: slotConfig('daily-review-g4', { operation: 'addition', operandA: { min: 10, max: 99 }, operandB: { min: 10, max: 99 } }) },
      { count: 2, config: slotConfig('daily-review-g4', { operation: 'subtraction', operandA: { min: 10, max: 99 }, operandB: { min: 10, max: 99 } }) },
      { count: 2, config: slotConfig('daily-review-g4', { operation: 'multiplication', operandA: { min: 1, max: 12 }, operandB: { min: 1, max: 12 }, factsMode: true, maxFactor: 12 }) },
      { count: 1, config: slotConfig('daily-review-g4', { operation: 'multiplication', operandA: { min: 1, max: 9 }, operandB: { min: 10, max: 99 }, factsMode: false }) },
      { count: 3, config: slotConfig('daily-review-g4', { operation: 'division', operandA: { min: 1, max: 12 }, operandB: { min: 1, max: 12 }, factsMode: true, maxFactor: 12 }) },
    ],
  },
  g5: {
    storageKey: 'daily-review-g5',
    quota: [
      { count: 2, config: slotConfig('daily-review-g5', { operation: 'addition', operandA: { min: 100, max: 999 }, operandB: { min: 100, max: 999 } }) },
      { count: 2, config: slotConfig('daily-review-g5', { operation: 'subtraction', operandA: { min: 100, max: 999 }, operandB: { min: 100, max: 999 } }) },
      { count: 2, config: slotConfig('daily-review-g5', { operation: 'multiplication', factsMode: true, maxFactor: 12, selectedFacts: [4, 5, 6, 7, 8, 9, 10, 11, 12], operandA: { min: 1, max: 12 }, operandB: { min: 1, max: 12 } }) },
      { count: 1, config: slotConfig('daily-review-g5', { operation: 'multiplication', operandA: { min: 10, max: 99 }, operandB: { min: 10, max: 99 }, factsMode: false }) },
      { count: 2, config: slotConfig('daily-review-g5', { operation: 'division', withRemainder: true, operandA: { min: 1, max: 12 }, operandB: { min: 2, max: 12 } }) },
      { count: 1, config: slotConfig('daily-review-g5', { operation: 'division', operandA: { min: 1, max: 12 }, operandB: { min: 1, max: 12 }, factsMode: true, maxFactor: 12 }) },
    ],
  },
};

export function dailyReviewStorageKey(gradeId: DailyReviewGradeId): string {
  return DAILY_REVIEW_GRADES[gradeId].storageKey;
}

/** The visitor's local calendar date as YYYY-MM-DD — deliberately local, not UTC, matching storage.ts's own convention (a classroom in one room should see one set all day). */
export function todayDateKey(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function hashString(input: string): number {
  // FNV-1a — small, dependency-free, stable across runs for the same string.
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function buildDailyReviewSeed(dateKey: string, gradeId: DailyReviewGradeId, mixVersion: number = DAILY_REVIEW_MIX_VERSION): number {
  return hashString(`${dateKey}|${gradeId}|${mixVersion}`);
}

function deterministicShuffle<T>(items: T[], random: RandomSource): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

/**
 * The single source of truth for a Daily Review session: exactly 10
 * problems, an explicit per-grade operation quota (never generic
 * `operation:'mixed'` per-question selection), one seeded RNG, one isolated
 * GenerationHistory, and a deterministic shuffle drawing from that same
 * stream. Same (dateKey, gradeId, mixVersion) always reproduces the same
 * ordered array; this is the only place Daily Review touches randomness.
 */
export function generateDailyReviewProblems(
  dateKey: string,
  gradeId: DailyReviewGradeId,
  mixVersion: number = DAILY_REVIEW_MIX_VERSION,
): Problem[] {
  const grade = DAILY_REVIEW_GRADES[gradeId];
  const seed = buildDailyReviewSeed(dateKey, gradeId, mixVersion);
  const random = createSeededRandom(seed);
  const history = createGenerationHistory();

  const problems: Problem[] = [];
  for (const slot of grade.quota) {
    for (let i = 0; i < slot.count; i++) {
      problems.push(generateProblem(slot.config, { random, history }));
    }
  }
  return deterministicShuffle(problems, random);
}

// ─── Completion / preference storage ─────────────────────────────────────────
// Independent per grade: completing one grade's review today must never mark
// another grade complete, and switching grades must preserve each grade's own
// completion state. This is deliberately separate from the ordinary
// PageStats each grade's storageKey already accumulates via storage.ts.

export interface DailyReviewPrefs {
  lastSelection: DailyReviewGradeId;
  completedDateBySelection: Partial<Record<DailyReviewGradeId, string>>;
}

const DAILY_REVIEW_PREFS_KEY = 'mp_daily_review_prefs';

function isDailyReviewPrefs(value: unknown): value is DailyReviewPrefs {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  if (!isDailyReviewGradeId(record.lastSelection)) return false;
  const completed = record.completedDateBySelection;
  if (typeof completed !== 'object' || completed === null) return false;
  return Object.entries(completed as Record<string, unknown>).every(
    ([key, date]) => isDailyReviewGradeId(key) && (date === undefined || typeof date === 'string'),
  );
}

const dailyReviewPrefsAdapter = createVersionedRecordAdapter<DailyReviewPrefs>(isDailyReviewPrefs);

const DEFAULT_DAILY_REVIEW_PREFS: DailyReviewPrefs = { lastSelection: 'g3', completedDateBySelection: {} };

export function loadDailyReviewPrefs(): DailyReviewPrefs {
  return dailyReviewPrefsAdapter.read(DAILY_REVIEW_PREFS_KEY) ?? { ...DEFAULT_DAILY_REVIEW_PREFS, completedDateBySelection: {} };
}

export function saveDailyReviewLastSelection(gradeId: DailyReviewGradeId): void {
  const current = loadDailyReviewPrefs();
  dailyReviewPrefsAdapter.write(DAILY_REVIEW_PREFS_KEY, { ...current, lastSelection: gradeId });
}

export function markDailyReviewCompleted(gradeId: DailyReviewGradeId, dateKey: string): void {
  const current = loadDailyReviewPrefs();
  dailyReviewPrefsAdapter.write(DAILY_REVIEW_PREFS_KEY, {
    ...current,
    completedDateBySelection: { ...current.completedDateBySelection, [gradeId]: dateKey },
  });
}

export function isDailyReviewCompletedToday(gradeId: DailyReviewGradeId, dateKey: string): boolean {
  return loadDailyReviewPrefs().completedDateBySelection[gradeId] === dateKey;
}
