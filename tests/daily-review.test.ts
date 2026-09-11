import { assert, test } from './harness';
import {
  DAILY_REVIEW_GRADE_IDS,
  DAILY_REVIEW_MIX_VERSION,
  buildDailyReviewSeed,
  dailyReviewStorageKey,
  generateDailyReviewProblems,
  isDailyReviewCompletedToday,
  isDailyReviewGradeId,
  loadDailyReviewPrefs,
  markDailyReviewCompleted,
  millisecondsUntilNextLocalMidnight,
  todayDateKey,
  type DailyReviewGradeId,
} from '../src/engine/dailyReview';

class MemoryStorage {
  data = new Map<string, string>();
  get length() { return this.data.size; }
  key(i: number) { return [...this.data.keys()][i] ?? null; }
  getItem(k: string) { return this.data.get(k) ?? null; }
  setItem(k: string, v: string) { this.data.set(k, String(v)); }
  removeItem(k: string) { this.data.delete(k); }
  clear() { this.data.clear(); }
}

function setupStorage() {
  const storage = new MemoryStorage();
  Object.defineProperty(globalThis, 'localStorage', { value: storage, writable: true, configurable: true });
  return storage;
}

const EXPECTED_QUOTA: Record<DailyReviewGradeId, { addition: number; subtraction: number; multiplication: number; division: number }> = {
  k: { addition: 6, subtraction: 4, multiplication: 0, division: 0 },
  g1: { addition: 5, subtraction: 5, multiplication: 0, division: 0 },
  g2: { addition: 5, subtraction: 5, multiplication: 0, division: 0 },
  g3: { addition: 3, subtraction: 3, multiplication: 2, division: 2 },
  g4: { addition: 2, subtraction: 2, multiplication: 3, division: 3 },
  g5: { addition: 2, subtraction: 2, multiplication: 3, division: 3 },
};

function countByOperation(problems: ReturnType<typeof generateDailyReviewProblems>) {
  return {
    addition: problems.filter((p) => p.operation === 'addition').length,
    subtraction: problems.filter((p) => p.operation === 'subtraction').length,
    multiplication: problems.filter((p) => p.operation === 'multiplication').length,
    division: problems.filter((p) => p.operation === 'division').length,
  };
}

const DATE = '2026-09-11';

// Problem.id is a module-level incrementing counter, deliberately outside the
// determinism contract (see GENERATOR_VERSION's own doc comment in
// generator.ts) — compare the arithmetic-relevant fields only, exactly like
// tests/generator-determinism.test.ts's own `tuple` helper does.
const tuple = (p: { operation: string; operandA: number; operandB: number; correctAnswer: number; remainder?: number }) => [
  p.operation,
  p.operandA,
  p.operandB,
  p.correctAnswer,
  p.remainder,
];

export const tests = [
  test('every grade produces exactly 10 problems matching its exact operation quota', () => {
    for (const gradeId of DAILY_REVIEW_GRADE_IDS) {
      const problems = generateDailyReviewProblems(DATE, gradeId);
      assert.equal(problems.length, 10, gradeId);
      assert.deepEqual(countByOperation(problems), EXPECTED_QUOTA[gradeId], gradeId);
    }
  }),

  test('subtraction never produces a negative result at any grade', () => {
    for (const gradeId of DAILY_REVIEW_GRADE_IDS) {
      for (const problem of generateDailyReviewProblems(DATE, gradeId)) {
        if (problem.operation === 'subtraction') assert.ok(problem.correctAnswer >= 0, `${gradeId}: ${problem.operandA}-${problem.operandB}`);
      }
    }
  }),

  test('kindergarten stays within Numbers-up-to-10 scope and never generates multiplication/division', () => {
    const problems = generateDailyReviewProblems(DATE, 'k');
    for (const problem of problems) {
      assert.ok(problem.operation === 'addition' || problem.operation === 'subtraction', problem.operation);
      assert.ok(problem.operandA >= 0 && problem.operandA <= 10, String(problem.operandA));
      assert.ok(problem.operandB >= 0 && problem.operandB <= 10, String(problem.operandB));
      assert.ok(problem.correctAnswer >= 0 && problem.correctAnswer <= 20, String(problem.correctAnswer));
    }
  }),

  test('kindergarten allows zero but never exceeds 2 zero-operand problems in a 10-question set, across many dates', () => {
    let sawZeroOperandProblem = false;
    let sawFullQuota = false;
    for (let day = 1; day <= 31; day++) {
      const dateKey = `2026-04-${String(day).padStart(2, '0')}`;
      if (Number.isNaN(new Date(dateKey).getTime())) continue;
      const problems = generateDailyReviewProblems(dateKey, 'k');
      assert.equal(problems.length, 10, dateKey);
      assert.deepEqual(countByOperation(problems), EXPECTED_QUOTA.k, dateKey);
      const zeroOperandCount = problems.filter((p) => p.operandA === 0 || p.operandB === 0).length;
      assert.ok(zeroOperandCount <= 2, `${dateKey}: expected at most 2 zero-operand problems, got ${zeroOperandCount}`);
      if (zeroOperandCount > 0) sawZeroOperandProblem = true;
      if (zeroOperandCount === 2) sawFullQuota = true;
    }
    assert.ok(sawZeroOperandProblem, 'zero must remain a valid Kindergarten operand, not suppressed entirely');
    assert.ok(sawFullQuota, 'the 2-problem cap should actually be reached on at least one sampled date');
  }),

  test('grade 3/4 division facts are always exact (no remainder) with divisor/quotient within 1–12', () => {
    for (const gradeId of ['g3', 'g4'] as const) {
      for (const problem of generateDailyReviewProblems(DATE, gradeId)) {
        if (problem.operation !== 'division') continue;
        assert.equal(problem.remainder, undefined, gradeId);
        assert.ok(problem.operandB >= 1 && problem.operandB <= 12, `divisor ${problem.operandB}`);
        assert.ok(problem.correctAnswer >= 1 && problem.correctAnswer <= 12, `quotient ${problem.correctAnswer}`);
        assert.equal(problem.operandB * problem.correctAnswer, problem.operandA);
      }
    }
  }),

  test('grade 4 multiplication stays within the established 1–12 facts pool (no widened 1-digit × 2-digit shape)', () => {
    for (let day = 1; day <= 28; day++) {
      const problems = generateDailyReviewProblems(`2026-01-${String(day).padStart(2, '0')}`, 'g4').filter((p) => p.operation === 'multiplication');
      assert.equal(problems.length, 3);
      for (const p of problems) {
        assert.equal(p.operandA * p.operandB, p.correctAnswer);
        assert.ok(p.operandA >= 1 && p.operandA <= 12 && p.operandB >= 1 && p.operandB <= 12, `facts-mode slot must stay within the established 1–12 pool: ${p.operandA} × ${p.operandB}`);
      }
    }
  }),

  test('grade 5 multiplication uses a genuinely-harder facts pool (4–12) via the established selectedFacts mechanism, never a widened 2-digit shape', () => {
    let sawHarderFact = false;
    for (let day = 1; day <= 28; day++) {
      const problems = generateDailyReviewProblems(`2026-02-${String(day).padStart(2, '0')}`, 'g5').filter((p) => p.operation === 'multiplication');
      assert.equal(problems.length, 3);
      for (const p of problems) {
        assert.equal(p.operandA * p.operandB, p.correctAnswer);
        assert.ok(p.operandA >= 4 && p.operandA <= 12, `harder-facts operandA ${p.operandA} must come from the selectedFacts pool, never widened beyond 12`);
        assert.ok(p.operandB >= 1 && p.operandB <= 12, `operandB ${p.operandB} must stay within the established 1–12 pool`);
        if (p.operandA >= 4) sawHarderFact = true;
      }
    }
    assert.ok(sawHarderFact, 'the harder-facts pool should be exercised across a month of dates');
  }),

  test('no grade ever emits a problem shape outside formats already established elsewhere on the site', () => {
    for (const gradeId of DAILY_REVIEW_GRADE_IDS) {
      for (const dateKey of ['2026-03-01', '2026-03-15', '2026-03-28']) {
        for (const problem of generateDailyReviewProblems(dateKey, gradeId)) {
          if (problem.operation === 'addition' || problem.operation === 'subtraction') {
            assert.ok(problem.operandA <= 99 && problem.operandB <= 99, `${gradeId}: ${problem.operandA} ${problem.operation} ${problem.operandB} exceeds the established 2-digit range`);
          }
          if (problem.operation === 'multiplication') {
            assert.ok(problem.operandA <= 12 && problem.operandB <= 12, `${gradeId}: ${problem.operandA} × ${problem.operandB} exceeds the established 1–12 facts pool`);
          }
        }
      }
    }
  }),

  test('grade 5 division mixes two remainder problems and one exact problem, each internally consistent', () => {
    const problems = generateDailyReviewProblems(DATE, 'g5').filter((p) => p.operation === 'division');
    assert.equal(problems.length, 3);
    const remainderProblems = problems.filter((p) => p.remainder !== undefined);
    const exactProblems = problems.filter((p) => p.remainder === undefined);
    assert.equal(remainderProblems.length, 2);
    assert.equal(exactProblems.length, 1);
    for (const p of remainderProblems) {
      assert.ok(p.remainder! > 0, `remainder must be > 0: ${p.remainder}`);
      assert.ok(p.remainder! < p.operandB, `remainder must be < divisor: ${p.remainder} vs ${p.operandB}`);
      assert.equal(p.operandB * p.correctAnswer + p.remainder!, p.operandA);
    }
    for (const p of exactProblems) assert.equal(p.operandB * p.correctAnswer, p.operandA);
  }),

  test('same date + grade + mix version reproduces an identical ordered array; different inputs diverge', () => {
    const first = generateDailyReviewProblems(DATE, 'g3');
    const second = generateDailyReviewProblems(DATE, 'g3');
    assert.deepEqual(first.map(tuple), second.map(tuple));

    const differentDate = generateDailyReviewProblems('2026-09-12', 'g3');
    assert.notDeepEqual(first.map(tuple), differentDate.map(tuple));

    const differentGrade = generateDailyReviewProblems(DATE, 'g4');
    assert.notDeepEqual(first.map(tuple), differentGrade.map(tuple));

    const differentMixVersion = generateDailyReviewProblems(DATE, 'g3', DAILY_REVIEW_MIX_VERSION + 1);
    assert.notDeepEqual(first.map(tuple), differentMixVersion.map(tuple));
  }),

  test('kindergarten\'s zero-operand retry loop stays deterministic: same date reproduces the same set, different dates diverge', () => {
    const firstK = generateDailyReviewProblems(DATE, 'k');
    const secondK = generateDailyReviewProblems(DATE, 'k');
    assert.deepEqual(firstK.map(tuple), secondK.map(tuple));

    const differentDateK = generateDailyReviewProblems('2026-09-12', 'k');
    assert.notDeepEqual(firstK.map(tuple), differentDateK.map(tuple));
  }),

  test('the deterministic shuffle never changes the underlying operation-count quota', () => {
    for (const gradeId of DAILY_REVIEW_GRADE_IDS) {
      for (const dateKey of ['2026-01-01', '2026-06-15', '2026-12-31']) {
        const problems = generateDailyReviewProblems(dateKey, gradeId);
        assert.deepEqual(countByOperation(problems), EXPECTED_QUOTA[gradeId], `${gradeId} on ${dateKey}`);
      }
    }
  }),

  test('buildDailyReviewSeed is a pure function of its three inputs', () => {
    assert.equal(buildDailyReviewSeed(DATE, 'g3', 1), buildDailyReviewSeed(DATE, 'g3', 1));
    assert.notEqual(buildDailyReviewSeed(DATE, 'g3', 1), buildDailyReviewSeed(DATE, 'g4', 1));
    assert.notEqual(buildDailyReviewSeed(DATE, 'g3', 1), buildDailyReviewSeed('2026-09-12', 'g3', 1));
    assert.notEqual(buildDailyReviewSeed(DATE, 'g3', 1), buildDailyReviewSeed(DATE, 'g3', 2));
  }),

  test('todayDateKey formats a local date as YYYY-MM-DD', () => {
    assert.equal(todayDateKey(new Date(2026, 8, 11)), '2026-09-11');
    assert.equal(todayDateKey(new Date(2026, 0, 5)), '2026-01-05');
  }),

  test('todayDateKey is built from local calendar components, not a UTC-based ISO slice', () => {
    // A local-components implementation and a UTC/ISO implementation only
    // ever disagree near a local-midnight boundary that itself differs from
    // UTC midnight — which depends on the process's own timezone, so pin it
    // explicitly rather than relying on the test runner's default (which may
    // already be UTC, masking the bug this test exists to catch). 11pm
    // Eastern on Sept 11 is already Sept 12 in UTC, so a UTC/ISO
    // implementation would wrongly report the 12th.
    const originalTz = process.env.TZ;
    try {
      process.env.TZ = 'America/New_York';
      const localElevenPm = new Date(2026, 8, 11, 23, 0, 0, 0);
      assert.equal(todayDateKey(localElevenPm), '2026-09-11');
      assert.notEqual(todayDateKey(localElevenPm), localElevenPm.toISOString().slice(0, 10));
    } finally {
      if (originalTz === undefined) delete process.env.TZ; else process.env.TZ = originalTz;
    }
  }),

  test('todayDateKey resolves the same UTC instant to different local dates in different timezones', () => {
    // Sept 12 04:30 UTC is already Sept 12 local in New York (UTC-4) but
    // still Sept 11 local in Los Angeles (UTC-7) — a genuine timezone-
    // boundary case, not just two zones that happen to agree.
    const instant = new Date(Date.UTC(2026, 8, 12, 4, 30));
    const originalTz = process.env.TZ;
    try {
      process.env.TZ = 'America/New_York';
      assert.equal(todayDateKey(new Date(instant.getTime())), '2026-09-12', 'New York local date');
      process.env.TZ = 'America/Los_Angeles';
      assert.equal(todayDateKey(new Date(instant.getTime())), '2026-09-11', 'Los Angeles local date');
    } finally {
      if (originalTz === undefined) delete process.env.TZ; else process.env.TZ = originalTz;
    }
  }),

  test('millisecondsUntilNextLocalMidnight measures to the next local calendar day, via calendar construction not a fixed 24h offset', () => {
    assert.equal(millisecondsUntilNextLocalMidnight(new Date(2026, 8, 11, 23, 59, 0, 0)), 60_000);
    assert.equal(millisecondsUntilNextLocalMidnight(new Date(2026, 8, 11, 0, 0, 0, 0)), 24 * 60 * 60 * 1000);
    assert.equal(millisecondsUntilNextLocalMidnight(new Date(2026, 8, 11, 12, 0, 0, 0)), 12 * 60 * 60 * 1000);
    // Crossing a month/year boundary must roll over correctly via Date's own calendar normalization.
    assert.equal(millisecondsUntilNextLocalMidnight(new Date(2025, 11, 31, 23, 0, 0, 0)), 60 * 60 * 1000);
  }),

  test('isDailyReviewGradeId validates against the six supported IDs only', () => {
    for (const id of DAILY_REVIEW_GRADE_IDS) assert.ok(isDailyReviewGradeId(id));
    for (const bad of ['g6', 'k1', '', 'G3', null, undefined, 3]) assert.equal(isDailyReviewGradeId(bad), false, String(bad));
  }),

  test('each grade has its own dedicated storage identity, not shared with any existing preset', () => {
    const keys = DAILY_REVIEW_GRADE_IDS.map(dailyReviewStorageKey);
    assert.deepEqual(keys, ['daily-review-k', 'daily-review-g1', 'daily-review-g2', 'daily-review-g3', 'daily-review-g4', 'daily-review-g5']);
    assert.equal(new Set(keys).size, keys.length);
  }),

  test('completing one grade marks only that grade complete and leaves others untouched', () => {
    setupStorage();
    markDailyReviewCompleted('g3', '2026-09-11');
    assert.ok(isDailyReviewCompletedToday('g3', '2026-09-11'));
    for (const other of DAILY_REVIEW_GRADE_IDS.filter((id) => id !== 'g3')) {
      assert.equal(isDailyReviewCompletedToday(other, '2026-09-11'), false, other);
    }
  }),

  test('completing one grade after another preserves each grade\'s own completion state', () => {
    setupStorage();
    markDailyReviewCompleted('g3', '2026-09-11');
    markDailyReviewCompleted('g4', '2026-09-11');
    assert.ok(isDailyReviewCompletedToday('g3', '2026-09-11'), 'completing another grade must not clear an earlier completion');
    assert.ok(isDailyReviewCompletedToday('g4', '2026-09-11'));
  }),

  test('a new day naturally presents every grade as incomplete again', () => {
    setupStorage();
    markDailyReviewCompleted('g3', '2026-09-11');
    assert.equal(isDailyReviewCompletedToday('g3', '2026-09-12'), false);
  }),

  test('loadDailyReviewPrefs defaults sensibly when nothing has been stored yet', () => {
    setupStorage();
    const prefs = loadDailyReviewPrefs();
    assert.deepEqual(prefs.completedDateBySelection, {});
  }),

  test('a legacy stored record with a stray lastSelection field still loads its completion data', () => {
    const storage = setupStorage();
    storage.setItem('mp_daily_review_prefs', JSON.stringify({
      version: 1,
      data: { lastSelection: 'g4', completedDateBySelection: { g3: '2026-09-11' } },
    }));
    assert.ok(isDailyReviewCompletedToday('g3', '2026-09-11'), 'legacy lastSelection field must not break reading completedDateBySelection');
  }),
];
