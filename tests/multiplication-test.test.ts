import { assert, test } from './harness';
import {
  DEFAULT_MULTIPLICATION_TEST_CONFIG,
  MULTIPLICATION_TEST_QUESTION_COUNTS,
  buildMultiplicationTestProblems,
  buildMultiplicationTestResult,
  buildMultiplicationTestRuntimeConfig,
  dedupeMissedProblems,
  deriveMultiplicationTestSelectionScope,
  normalizeMultiplicationTestConfig,
  parseMultiplicationTestQuery,
  serializeMultiplicationTestQuery,
} from '../src/engine/multiplicationTest';
import { buildSessionResult, buildTimedSessionResult } from '../src/engine/scorer';
import type { Problem } from '../src/engine/types';

function fact(operandA: number, operandB: number): Problem {
  return { id: `${operandA}-${operandB}`, operandA, operandB, operation: 'multiplication', correctAnswer: operandA * operandB };
}

export const tests = [
  // ── Config normalization ──────────────────────────────────────────────
  test('normalizeMultiplicationTestConfig falls back to all-1-12/20/untimed for missing input', () => {
    const config = normalizeMultiplicationTestConfig({});
    assert.deepEqual([...config.facts], Array.from({ length: 12 }, (_, i) => i + 1));
    assert.equal(config.questionCount, 20);
    assert.equal(config.timed, false);
  }),
  test('normalizeMultiplicationTestConfig rejects an invalid facts selection back to the full default', () => {
    const config = normalizeMultiplicationTestConfig({ facts: [0, 13], questionCount: 10, timed: true });
    assert.deepEqual([...config.facts], Array.from({ length: 12 }, (_, i) => i + 1));
    assert.equal(config.questionCount, 10);
    assert.equal(config.timed, true);
  }),
  test('normalizeMultiplicationTestConfig rejects a QuestionCount not in the Test-local union', () => {
    const config = normalizeMultiplicationTestConfig({ questionCount: 100 as unknown as number });
    assert.equal(config.questionCount, 20);
  }),
  test('normalizeMultiplicationTestConfig honors a valid single-table selection', () => {
    const config = normalizeMultiplicationTestConfig({ facts: [7] });
    assert.deepEqual([...config.facts], [7]);
  }),

  // ── Query codec ────────────────────────────────────────────────────────
  test('parseMultiplicationTestQuery returns undefined for an empty query', () => {
    assert.equal(parseMultiplicationTestQuery(''), undefined);
  }),
  test('parseMultiplicationTestQuery parses a valid full query', () => {
    const config = parseMultiplicationTestQuery('facts=6,7,8&count=10&timed=1');
    assert.ok(config);
    assert.deepEqual([...config!.facts], [6, 7, 8]);
    assert.equal(config!.questionCount, 10);
    assert.equal(config!.timed, true);
  }),
  test('parseMultiplicationTestQuery rejects an unknown parameter', () => {
    assert.equal(parseMultiplicationTestQuery('facts=1,2&seed=42'), undefined);
  }),
  test('parseMultiplicationTestQuery rejects a duplicate parameter', () => {
    assert.equal(parseMultiplicationTestQuery('count=10&count=20'), undefined);
  }),
  test('parseMultiplicationTestQuery rejects an unsupported question count', () => {
    assert.equal(parseMultiplicationTestQuery('count=100'), undefined);
  }),
  test('parseMultiplicationTestQuery rejects a malformed facts list', () => {
    assert.equal(parseMultiplicationTestQuery('facts=1,abc,3'), undefined);
  }),
  test('parseMultiplicationTestQuery rejects an out-of-range table', () => {
    assert.equal(parseMultiplicationTestQuery('facts=1,13'), undefined);
  }),
  test('parseMultiplicationTestQuery never accepts a seed, score, or result field', () => {
    assert.equal(parseMultiplicationTestQuery('seed=1'), undefined);
    assert.equal(parseMultiplicationTestQuery('score=100'), undefined);
    assert.equal(parseMultiplicationTestQuery('result=win'), undefined);
  }),
  test('serializeMultiplicationTestQuery omits every field at its default (canonical, empty query)', () => {
    assert.equal(serializeMultiplicationTestQuery(DEFAULT_MULTIPLICATION_TEST_CONFIG), '');
  }),
  test('serializeMultiplicationTestQuery + parseMultiplicationTestQuery round-trip a non-default config', () => {
    const config = normalizeMultiplicationTestConfig({ facts: [3, 4], questionCount: 50, timed: true });
    const query = serializeMultiplicationTestQuery(config);
    const parsed = parseMultiplicationTestQuery(query);
    assert.ok(parsed);
    assert.deepEqual([...parsed!.facts], [...config.facts]);
    assert.equal(parsed!.questionCount, config.questionCount);
    assert.equal(parsed!.timed, config.timed);
  }),
  test('serializeMultiplicationTestQuery never emits a seed, score, or result field', () => {
    const config = normalizeMultiplicationTestConfig({ facts: [1], questionCount: 50, timed: true });
    const query = serializeMultiplicationTestQuery(config);
    for (const forbidden of ['seed', 'score', 'result', 'answer']) {
      assert.equal(new URLSearchParams(query).has(forbidden), false);
    }
  }),

  // ── Runtime config ─────────────────────────────────────────────────────
  test('buildMultiplicationTestRuntimeConfig wires untimed mode with the selected tables', () => {
    const runtime = buildMultiplicationTestRuntimeConfig(normalizeMultiplicationTestConfig({ facts: [5, 6] }));
    assert.equal(runtime.mode, 'untimed');
    assert.equal(runtime.factsMode, true);
    assert.equal(runtime.maxFactor, 12);
    assert.deepEqual([...(runtime.selectedFacts ?? [])], [5, 6]);
  }),
  test('buildMultiplicationTestRuntimeConfig wires a fixed 60-second timer when timed', () => {
    const runtime = buildMultiplicationTestRuntimeConfig(normalizeMultiplicationTestConfig({ timed: true }));
    assert.equal(runtime.mode, 'timed');
    assert.equal(runtime.timerDuration, 60);
    assert.equal(runtime.fixedTimerDuration, true);
  }),

  // ── Problem generation / determinism ────────────────────────────────────
  test('the same config and seed produce the same problem sequence', () => {
    const config = normalizeMultiplicationTestConfig({ facts: [7, 8], questionCount: 10 });
    const a = buildMultiplicationTestProblems(config, 12345);
    const b = buildMultiplicationTestProblems(config, 12345);
    assert.deepEqual(
      a.map((p) => [p.operandA, p.operandB, p.correctAnswer]),
      b.map((p) => [p.operandA, p.operandB, p.correctAnswer]),
    );
  }),
  test('a different seed produces a different problem sequence', () => {
    const config = normalizeMultiplicationTestConfig({ facts: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], questionCount: 20 });
    const a = buildMultiplicationTestProblems(config, 1);
    const b = buildMultiplicationTestProblems(config, 2);
    assert.notDeepEqual(
      a.map((p) => [p.operandA, p.operandB]),
      b.map((p) => [p.operandA, p.operandB]),
    );
  }),
  test('generated problems only use the selected tables for the first factor', () => {
    const config = normalizeMultiplicationTestConfig({ facts: [4, 9], questionCount: 20 });
    const problems = buildMultiplicationTestProblems(config, 999);
    assert.equal(problems.length, 20);
    for (const p of problems) assert.ok(p.operandA === 4 || p.operandA === 9);
  }),

  // ── Missed-fact dedup ────────────────────────────────────────────────────
  test('dedupeMissedProblems removes exact duplicate (operandA, operandB) pairs', () => {
    const deduped = dedupeMissedProblems([fact(7, 8), fact(7, 8), fact(6, 9)]);
    assert.equal(deduped.length, 2);
  }),
  test('dedupeMissedProblems keeps commutative pairs distinct', () => {
    const deduped = dedupeMissedProblems([fact(7, 8), fact(8, 7)]);
    assert.equal(deduped.length, 2);
  }),
  test('dedupeMissedProblems preserves first-occurrence order', () => {
    const deduped = dedupeMissedProblems([fact(3, 4), fact(5, 6), fact(3, 4)]);
    assert.deepEqual(deduped.map((p) => [p.operandA, p.operandB]), [[3, 4], [5, 6]]);
  }),

  // ── Result model ─────────────────────────────────────────────────────────
  test('buildMultiplicationTestResult omits correctPerMinute for an untimed attempt', () => {
    const config = normalizeMultiplicationTestConfig({ questionCount: 10, timed: false });
    const session = buildSessionResult(8, 10, 42, { completionReason: 'question-limit', questionTarget: 10 });
    const result = buildMultiplicationTestResult(session, [fact(6, 7), fact(6, 7)], config);
    assert.equal(result.correctPerMinute, undefined);
    assert.equal(result.missed.length, 1);
    assert.equal(result.session.correct, 8);
    assert.equal(result.config.timed, false);
  }),
  test('buildMultiplicationTestResult computes correctPerMinute for a timed attempt', () => {
    const config = normalizeMultiplicationTestConfig({ timed: true, questionCount: 20 });
    const session = buildTimedSessionResult(30, 30, 0, 60_000, 60, 'time-limit');
    const result = buildMultiplicationTestResult(session, [], config);
    assert.equal(result.correctPerMinute, 30);
  }),
  test('buildMultiplicationTestResult never retains a submitted answer, only the missed Problem', () => {
    const config = normalizeMultiplicationTestConfig({});
    const session = buildSessionResult(0, 1, 5);
    const result = buildMultiplicationTestResult(session, [fact(9, 9)], config);
    assert.deepEqual(Object.keys(result.missed[0]!).sort(), ['correctAnswer', 'id', 'operandA', 'operandB', 'operation'].sort());
  }),

  // ── Analytics dimension helper ───────────────────────────────────────────
  test('deriveMultiplicationTestSelectionScope reports all/single/multiple correctly', () => {
    assert.equal(deriveMultiplicationTestSelectionScope(Array.from({ length: 12 }, (_, i) => i + 1)), 'all');
    assert.equal(deriveMultiplicationTestSelectionScope([7]), 'single');
    assert.equal(deriveMultiplicationTestSelectionScope([7, 8]), 'multiple');
  }),

  test('MULTIPLICATION_TEST_QUESTION_COUNTS is exactly 10/20/50, not the shared 10/20/30/50 QuestionCount', () => {
    assert.deepEqual([...MULTIPLICATION_TEST_QUESTION_COUNTS], [10, 20, 50]);
  }),
];
