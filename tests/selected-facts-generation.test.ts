import { assert, sequence, test } from './harness';
import { createGenerationHistory, generateProblemSet } from '../src/engine/generator';
import { MULTIPLICATION_FACTS, DIVISION_FACTS, multiplyTableConfig, divideByConfig } from '../src/engine/presets';

const content = (items: ReturnType<typeof generateProblemSet>) => items.map(({ operandA, operandB, correctAnswer, remainder }) => ({ operandA, operandB, correctAnswer, remainder }));

export const tests = [
  test('selected multiplication families use injected randomness and remain deterministic', () => {
    const config = { ...MULTIPLICATION_FACTS, selectedFacts: [6, 7, 8] };
    const run = () => generateProblemSet(config, 4, { random: sequence([0, .1, .4, .5, .9, .99, .2, .7]), history: createGenerationHistory() });
    assert.deepEqual(content(run()), content(run()));
    assert.ok(run().every((problem) => [6, 7, 8].includes(problem.operandA) && problem.operandB >= 1 && problem.operandB <= 12));
    assert.ok(generateProblemSet({ ...MULTIPLICATION_FACTS, selectedFacts: [6] }, 8, { random: sequence([0, .1, .2, .3, .4, .5, .6, .7]), history: createGenerationHistory() }).every((problem) => problem.operandA === 6));
  }),
  test('selected exact-division divisors are constrained, deterministic, and suppress consecutive duplicates', () => {
    const config = { ...DIVISION_FACTS, selectedDivisors: [6, 7, 8] };
    const values = [0, .1, .4, .5, .9, .99, .2, .7, .6, .3];
    const run = () => generateProblemSet(config, 5, { random: sequence(values), history: createGenerationHistory() });
    assert.deepEqual(content(run()), content(run()));
    const problems = run();
    assert.ok(problems.every((problem) => [6, 7, 8].includes(problem.operandB) && problem.operandA % problem.operandB === 0 && problem.remainder === undefined));
    for (let i = 1; i < problems.length; i++) assert.notDeepEqual([problems[i].operandA, problems[i].operandB], [problems[i - 1].operandA, problems[i - 1].operandB]);
    assert.ok(generateProblemSet({ ...DIVISION_FACTS, selectedDivisors: [6] }, 6, { random: sequence([0, .1, 0, .2, 0, .3]), history: createGenerationHistory() }).every((problem) => problem.operandB === 6));
  }),
  test('existing Times Table and Divide By presets retain fixed behavior and identity', () => {
    assert.ok(generateProblemSet(multiplyTableConfig(6), 8, { history: createGenerationHistory() }).every((problem) => problem.operandA === 6));
    assert.ok(generateProblemSet(divideByConfig(7), 8, { history: createGenerationHistory() }).every((problem) => problem.operandB === 7));
    assert.equal(multiplyTableConfig(6).storageKey, 'mult-table-6'); assert.equal(divideByConfig(7).storageKey, 'div-by-7');
  }),
];
