import { assert, test } from './harness';
import { createGenerationHistory, generateProblem } from '../src/engine/generator';
import { MULTIPLICATION_FACTS, multiplyTableConfig } from '../src/engine/presets';
import {
  ALL_FACTS, buildPracticeUrl, resolveInitialPilotState, settingsToPreset,
} from '../src/engine/multiplicationFactsPilot';
import { parsePublicPracticePresetQuery } from '../src/engine/publicPresetUrl';
import { MULTIPLICATION_FACTS_CAPABILITY } from '../src/engine/publicPreset';

function sequence(values: number[]) {
  let index = 0;
  return () => values[index++ % values.length];
}

export const tests = [
  test('clean route preserves untimed, endless, all-facts defaults', () => {
    const state = resolveInitialPilotState('');
    assert.equal(state.kind, 'default');
    assert.equal(state.settings.mode, 'untimed');
    assert.equal(state.settings.questionCount, undefined);
    assert.deepEqual(state.settings.facts, ALL_FACTS);
    assert.equal(MULTIPLICATION_FACTS.storageKey, 'mult-facts');
  }),
  test('valid untimed and timed shared assignments resolve completely', () => {
    const untimed = resolveInitialPilotState('?v=1&facts=6,7,8&mode=untimed&questions=20');
    assert.equal(untimed.kind, 'preset');
    assert.deepEqual(untimed.settings.facts, [6, 7, 8]);
    assert.equal(untimed.settings.mode, 'untimed');
    assert.equal(untimed.settings.questionCount, 20);
    const timed = resolveInitialPilotState('?v=1&facts=6&mode=timed&duration=120&questions=20');
    assert.equal(timed.kind, 'preset');
    assert.deepEqual(timed.settings.facts, [6]);
    assert.equal(timed.settings.durationSeconds, 120);
    assert.equal(timed.settings.questionCount, 20);
  }),
  test('invalid queries fail as a unit to untouched defaults', () => {
    for (const query of [
      '?v=1&facts=6,99&questions=20', '?v=1&questions=11', '?v=1&qusetions=20',
      '?v=1&operations=division', '?v=1&mode=untimed&duration=30',
    ]) {
      const state = resolveInitialPilotState(query);
      assert.equal(state.kind, 'invalid', query);
      assert.deepEqual(state.settings.facts, ALL_FACTS);
      assert.equal(state.settings.questionCount, undefined);
    }
  }),
  test('form mapping validates choices and strips untimed duration', () => {
    assert.equal(settingsToPreset({ facts: [], mode: 'untimed', durationSeconds: 60 }), undefined);
    const untimed = settingsToPreset({ facts: [8, 6, 7], mode: 'untimed', durationSeconds: 300, questionCount: 10 });
    assert.deepEqual(untimed, { version: 1, facts: [6, 7, 8], mode: 'untimed', questionCount: 10 });
    for (const duration of [30, 60, 120, 300] as const) {
      assert.equal(settingsToPreset({ facts: [6], mode: 'timed', durationSeconds: duration })?.durationSeconds, duration);
    }
    for (const questionCount of [10, 20, 30, 50] as const) {
      assert.equal(settingsToPreset({ facts: [6], mode: 'untimed', durationSeconds: 60, questionCount })?.questionCount, questionCount);
    }
  }),
  test('share URL is absolute, canonical ordered, minimal, and round trips', () => {
    const url = buildPracticeUrl(new URL('https://deploy-preview.example/multiplication/facts/?old=1#x'), {
      facts: [6, 7, 8], mode: 'timed', durationSeconds: 120, questionCount: 20,
    });
    assert.equal(url?.href, 'https://deploy-preview.example/multiplication/facts/?v=1&facts=6,7,8&mode=timed&duration=120&questions=20');
    const parsed = parsePublicPracticePresetQuery(url!.search, MULTIPLICATION_FACTS_CAPABILITY);
    assert.equal(parsed.success, true);
    if (parsed.success) assert.deepEqual(parsed.value, settingsToPreset({ facts: [6, 7, 8], mode: 'timed', durationSeconds: 120, questionCount: 20 }));
  }),
  test('endless all-facts URL remains explicit and omits irrelevant fields', () => {
    const url = buildPracticeUrl(new URL('https://example.test/multiplication/facts/'), {
      facts: ALL_FACTS, mode: 'untimed', durationSeconds: 300,
    });
    assert.equal(url?.search, '?v=1&facts=1,2,3,4,5,6,7,8,9,10,11,12&mode=untimed');
    assert.equal(url?.search.includes('storage'), false);
    assert.equal(url?.search.includes('questions'), false);
    assert.equal(url?.search.includes('duration'), false);
  }),
  test('single selected family fixes the first factor and keeps normal multiplier range', () => {
    const problem = generateProblem(MULTIPLICATION_FACTS, { random: sequence([0.8, 0.5]), history: createGenerationHistory(), selectedFacts: [6] });
    assert.equal(problem.operandA, 6);
    assert.equal(problem.operandB, 7);
  }),
  test('controlled randomness selects different allowed families without disallowed families', () => {
    const random = sequence([0, 0.2, 0.4, 0.2, 0.99, 0.2]);
    const history = createGenerationHistory();
    const problems = Array.from({ length: 3 }, () => generateProblem(MULTIPLICATION_FACTS, { random, history, selectedFacts: [6, 7, 8] }));
    assert.deepEqual(problems.map(problem => problem.operandA), [6, 7, 8]);
    assert.ok(problems.every(problem => [6, 7, 8].includes(problem.operandA)));
  }),
  test('all selected families retain standard facts bounds while times-table routes ignore the seam', () => {
    const normal = generateProblem(MULTIPLICATION_FACTS, { random: sequence([0.99, 0]), history: createGenerationHistory(), selectedFacts: ALL_FACTS });
    assert.deepEqual([normal.operandA, normal.operandB], [12, 1]);
    const table = generateProblem(multiplyTableConfig(6), { random: sequence([0.99, 0.99]), history: createGenerationHistory() });
    assert.equal(table.operandA, 6);
    assert.equal(table.operandB, 12);
  }),
];
