import { assert, sequence, test } from './harness';
import {
  GENERATOR_VERSION,
  createGenerationHistory,
  generateProblem,
  generateProblemSet,
} from '../src/engine/generator';
import { createSeededRandom, RNG_VERSION } from '../src/engine/random';
import {
  ADDITION_1_DIGIT,
  ADDITION_2_DIGIT_CARRYING,
  DIVISION_FACTS,
  DIVISION_REMAINDERS,
  MIXED_PRACTICE,
  MULTIPLICATION_FACTS,
  SUBTRACTION_2_DIGIT_BORROWING,
} from '../src/engine/presets';

const tuple = (problem: ReturnType<typeof generateProblem>) => [
  problem.operation,
  problem.operandA,
  problem.operandB,
  problem.correctAnswer,
  problem.remainder,
];

const seededSet = (seed: number, count = 20) =>
  generateProblemSet(ADDITION_1_DIGIT, count, {
    random: createSeededRandom(seed),
    history: createGenerationHistory(),
  }).map(tuple);

export const tests = [
  test('seeded helper is stable, bounded, stateful, and explicitly versioned', () => {
    const first = createSeededRandom(1234);
    const second = createSeededRandom(1234, RNG_VERSION);
    const values = Array.from({ length: 6 }, () => first());
    assert.deepEqual(values, Array.from({ length: 6 }, () => second()));
    assert.ok(values.every((value) => value >= 0 && value < 1));
    assert.equal(RNG_VERSION, 'rng-v1');
    assert.equal(GENERATOR_VERSION, 'gen-v1');
  }),

  test('injected values drive addition, multiplication, and exact division operands', () => {
    const history = createGenerationHistory();
    const addition = generateProblem(
      { ...ADDITION_1_DIGIT, storageKey: 'injected-addition' },
      { random: sequence([0.2, 0.7]), history },
    );
    assert.deepEqual(tuple(addition).slice(1, 4), [2, 7, 9]);

    const multiplication = generateProblem(MULTIPLICATION_FACTS, { random: sequence([0, 0.999]) });
    assert.deepEqual(tuple(multiplication).slice(1, 4), [1, 12, 12]);

    const division = generateProblem(DIVISION_FACTS, { random: sequence([0.999, 0]) });
    assert.deepEqual(tuple(division).slice(1, 4), [12, 12, 1]);
  }),

  test('mixed selection and every remainder draw use the injected source', () => {
    const operations = ['addition', 'subtraction', 'multiplication', 'division'] as const;
    operations.forEach((operation, index) => {
      const problem = generateProblem(
        { ...MIXED_PRACTICE, storageKey: `injected-mixed-${operation}` },
        { random: sequence([index / operations.length, 0.5, 0.5]) },
      );
      assert.equal(problem.operation, operation);
    });

    const remainder = generateProblem(DIVISION_REMAINDERS, {
      random: sequence([0, 0.999, 0.5]),
    });
    assert.deepEqual(tuple(remainder).slice(1), [25, 2, 12, 1]);
  }),

  test('addition retries continue consuming the injected source', () => {
    const problem = generateProblem(ADDITION_2_DIGIT_CARRYING, {
      random: sequence([0.06, 0.06, 0.1, 0.999]),
    });
    assert.deepEqual([problem.operandA, problem.operandB], [23, 99]);
  }),

  test('subtraction retries deterministically reach the unchanged exhaustive fallback', () => {
    let draws = 0;
    const problem = generateProblem(
      {
        ...SUBTRACTION_2_DIGIT_BORROWING,
        storageKey: 'injected-subtraction-fallback',
        operandA: { min: 20, max: 21 },
        operandB: { min: 11, max: 19 },
      },
      { random: () => { draws++; return draws % 2 === 1 ? 0.999 : 0; } },
    );
    assert.equal(draws, 200);
    assert.deepEqual([problem.operandA, problem.operandB], [20, 11]);
  }),

  test('same deterministic inputs reproduce ordered content while different seeds diverge', () => {
    assert.deepEqual(seededSet(8675309), seededSet(8675309));
    assert.notDeepEqual(seededSet(8675309), seededSet(42));
  }),

  test('problem sets consume one continuing RNG stream rather than restarting per item', () => {
    const problems = generateProblemSet(MULTIPLICATION_FACTS, 3, {
      random: sequence([0, 0.1, 0.2, 0.3, 0.4, 0.5]),
      history: createGenerationHistory(),
    });
    assert.deepEqual(problems.map((problem) => [problem.operandA, problem.operandB]), [
      [1, 2],
      [3, 4],
      [5, 7],
    ]);
  }),

  test('explicit history makes repeat suppression reproducible and isolates ordinary activity', () => {
    const config = { ...ADDITION_1_DIGIT, storageKey: 'isolated-seeded-history' };
    generateProblem(config); // Ordinary generation mutates only the legacy default history.

    const run = () => generateProblemSet(config, 3, {
      random: sequence([0, 0, 0, 0, 0.2, 0, 0.1, 0.1, 0.3, 0]),
      history: createGenerationHistory(),
    }).map(tuple);

    const first = run();
    generateProblem(config);
    const second = run();
    assert.deepEqual(first, second);
    assert.notDeepEqual(first[0]?.slice(1, 3), first[1]?.slice(1, 3));
  }),
];
