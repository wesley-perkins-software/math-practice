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
import { buildSessionResult } from '../src/engine/scorer';
import type { Problem } from '../src/engine/types';

function fact(operandA: number, operandB: number): Problem {
  return { id: `${operandA}-${operandB}`, operandA, operandB, operation: 'multiplication', correctAnswer: operandA * operandB };
}

export const tests = [
  // ── Config normalization ──────────────────────────────────────────────
  test('normalizeMultiplicationTestConfig falls back to all-1-12/20 for missing input', () => {
    const config = normalizeMultiplicationTestConfig({});
    assert.deepEqual([...config.facts], Array.from({ length: 12 }, (_, i) => i + 1));
    assert.equal(config.questionCount, 20);
  }),
  test('normalizeMultiplicationTestConfig has no timed field at all — V1 is a fixed-length assessment only', () => {
    const config = normalizeMultiplicationTestConfig({});
    assert.equal('timed' in config, false);
  }),
  test('normalizeMultiplicationTestConfig rejects an invalid facts selection back to the full default', () => {
    const config = normalizeMultiplicationTestConfig({ facts: [0, 13], questionCount: 10 });
    assert.deepEqual([...config.facts], Array.from({ length: 12 }, (_, i) => i + 1));
    assert.equal(config.questionCount, 10);
  }),
  test('normalizeMultiplicationTestConfig rejects a QuestionCount not in the Test-local union', () => {
    const config = normalizeMultiplicationTestConfig({ questionCount: 50 });
    assert.equal(config.questionCount, 20);
  }),
  test('normalizeMultiplicationTestConfig honors a valid single-table selection', () => {
    const config = normalizeMultiplicationTestConfig({ facts: [7] });
    assert.deepEqual([...config.facts], [7]);
  }),
  test('normalizeMultiplicationTestConfig accepts each of the three supported question counts', () => {
    for (const count of [10, 20, 30] as const) {
      assert.equal(normalizeMultiplicationTestConfig({ questionCount: count }).questionCount, count);
    }
  }),

  // ── Query codec ────────────────────────────────────────────────────────
  test('parseMultiplicationTestQuery returns undefined for an empty query', () => {
    assert.equal(parseMultiplicationTestQuery(''), undefined);
  }),
  test('parseMultiplicationTestQuery parses a valid full query', () => {
    const config = parseMultiplicationTestQuery('facts=6,7,8&count=10');
    assert.ok(config);
    assert.deepEqual([...config!.facts], [6, 7, 8]);
    assert.equal(config!.questionCount, 10);
  }),
  test('parseMultiplicationTestQuery rejects the removed timed parameter', () => {
    assert.equal(parseMultiplicationTestQuery('facts=1,2&timed=1'), undefined);
    assert.equal(parseMultiplicationTestQuery('timed=0'), undefined);
  }),
  test('parseMultiplicationTestQuery rejects an unknown parameter', () => {
    assert.equal(parseMultiplicationTestQuery('facts=1,2&seed=42'), undefined);
  }),
  test('parseMultiplicationTestQuery rejects a duplicate parameter', () => {
    assert.equal(parseMultiplicationTestQuery('count=10&count=20'), undefined);
  }),
  test('parseMultiplicationTestQuery rejects an unsupported question count', () => {
    assert.equal(parseMultiplicationTestQuery('count=50'), undefined);
    assert.equal(parseMultiplicationTestQuery('count=100'), undefined);
  }),
  test('parseMultiplicationTestQuery accepts each of 10/20/30', () => {
    for (const count of ['10', '20', '30']) {
      const config = parseMultiplicationTestQuery(`count=${count}`);
      assert.ok(config);
      assert.equal(config!.questionCount, Number(count));
    }
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
    const config = normalizeMultiplicationTestConfig({ facts: [3, 4], questionCount: 30 });
    const query = serializeMultiplicationTestQuery(config);
    const parsed = parseMultiplicationTestQuery(query);
    assert.ok(parsed);
    assert.deepEqual([...parsed!.facts], [...config.facts]);
    assert.equal(parsed!.questionCount, config.questionCount);
  }),
  test('serializeMultiplicationTestQuery never emits a timed, seed, score, or result field', () => {
    const config = normalizeMultiplicationTestConfig({ facts: [1], questionCount: 30 });
    const query = serializeMultiplicationTestQuery(config);
    for (const forbidden of ['timed', 'seed', 'score', 'result', 'answer']) {
      assert.equal(new URLSearchParams(query).has(forbidden), false);
    }
  }),

  // ── Runtime config ─────────────────────────────────────────────────────
  test('buildMultiplicationTestRuntimeConfig always wires untimed mode with the selected tables — V1 has no timed option', () => {
    const runtime = buildMultiplicationTestRuntimeConfig(normalizeMultiplicationTestConfig({ facts: [5, 6] }));
    assert.equal(runtime.mode, 'untimed');
    assert.equal(runtime.fixedTimerDuration, undefined);
    assert.equal(runtime.factsMode, true);
    assert.equal(runtime.maxFactor, 12);
    assert.deepEqual([...(runtime.selectedFacts ?? [])], [5, 6]);
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
  test('a 30-question attempt generates exactly 30 problems', () => {
    const config = normalizeMultiplicationTestConfig({ questionCount: 30 });
    const problems = buildMultiplicationTestProblems(config, 42);
    assert.equal(problems.length, 30);
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
  test('buildMultiplicationTestResult has no correctPerMinute field at all — timed mode no longer exists', () => {
    const config = normalizeMultiplicationTestConfig({ questionCount: 10 });
    const session = buildSessionResult(8, 10, 42, { completionReason: 'question-limit', questionTarget: 10 });
    const result = buildMultiplicationTestResult(session, [fact(6, 7), fact(6, 7)], config);
    assert.equal('correctPerMinute' in result, false);
    assert.equal(result.missed.length, 1);
    assert.equal(result.session.correct, 8);
  }),
  test('buildMultiplicationTestResult still measures and preserves elapsed time from the session it is given', () => {
    const config = normalizeMultiplicationTestConfig({ questionCount: 10 });
    const session = buildSessionResult(10, 10, 37, { completionReason: 'question-limit', questionTarget: 10 });
    const result = buildMultiplicationTestResult(session, [], config);
    assert.equal(result.session.durationSeconds, 37);
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

  test('MULTIPLICATION_TEST_QUESTION_COUNTS is exactly 10/20/30, not 10/20/50 and not the shared 10/20/30/50 QuestionCount', () => {
    assert.deepEqual([...MULTIPLICATION_TEST_QUESTION_COUNTS], [10, 20, 30]);
  }),
];
