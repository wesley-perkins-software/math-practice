import { assert, test } from './harness';
import { MULTIPLICATION_FACTS } from '../src/engine/presets';
import {
  MULTIPLICATION_FACTS_CAPABILITY,
  toPracticeOverrides,
  validatePublicPracticePreset,
  type PublicOperation,
  type RoutePracticeCapability,
} from '../src/engine/publicPreset';

const validate = (input: unknown, capability = MULTIPLICATION_FACTS_CAPABILITY) =>
  validatePublicPracticePreset(input, capability);

const valueOf = (input: unknown, capability = MULTIPLICATION_FACTS_CAPABILITY) => {
  const result = validate(input, capability);
  assert.equal(result.success, true, result.success ? undefined : result.error.reason);
  return result.value;
};

const assertInvalid = (input: unknown, capability = MULTIPLICATION_FACTS_CAPABILITY) => {
  const result = validate(input, capability);
  assert.equal(result.success, false);
  assert.ok(result.error.field);
};

export const tests = [
  test('accepts and normalizes valid V1 multiplication-facts presets', () => {
    assert.deepEqual(valueOf({ version: 1 }), { version: 1 });
    assert.deepEqual(
      valueOf({ version: 1, facts: [8, 6, 7], mode: 'untimed', questionCount: 20 }),
      { version: 1, facts: [6, 7, 8], mode: 'untimed', questionCount: 20 },
    );
    assert.deepEqual(
      valueOf({ version: 1, facts: [6], operations: ['multiplication'], mode: 'timed', durationSeconds: 120 }),
      { version: 1, facts: [6], operations: ['multiplication'], mode: 'timed', durationSeconds: 120 },
    );
  }),

  test('rejects missing or unsupported versions and non-object inputs without throwing', () => {
    for (const input of [{}, { version: 2 }, null, undefined, 'preset', 1, true, [], [1]]) {
      assert.doesNotThrow(() => assertInvalid(input));
    }
  }),

  test('never throws when hostile object inspection throws', () => {
    const getter = Object.defineProperty({}, 'version', { get: () => { throw new Error('hostile getter'); } });
    const proxy = new Proxy({}, { getOwnPropertyDescriptor: () => { throw new Error('hostile proxy'); } });
    assert.doesNotThrow(() => assertInvalid(getter));
    assert.doesNotThrow(() => assertInvalid(proxy));
  }),

  test('validates fact bounds, length, element types, and duplicates', () => {
    assert.deepEqual(valueOf({ version: 1, facts: [1] }).facts, [1]);
    assert.deepEqual(valueOf({ version: 1, facts: [12, 1, 7] }).facts, [1, 7, 12]);
    for (const facts of [[], [1, 1], [0], [13], [1.5], [NaN], [Infinity], ['6'], null]) {
      assertInvalid({ version: 1, facts });
    }
    assertInvalid({ version: 1, facts: [...Array.from({ length: 12 }, (_, index) => index + 1), 12] });
  }),

  test('enforces explicit timed and untimed duration semantics', () => {
    assert.deepEqual(valueOf({ version: 1, mode: 'untimed' }).mode, 'untimed');
    for (const durationSeconds of [30, 60, 120, 300]) {
      assert.equal(valueOf({ version: 1, mode: 'timed', durationSeconds }).durationSeconds, durationSeconds);
    }
    assertInvalid({ version: 1, mode: 'timed' });
    assertInvalid({ version: 1, mode: 'untimed', durationSeconds: 60 });
    assertInvalid({ version: 1, durationSeconds: 60 });
    for (const durationSeconds of [0, 25, 60.5, NaN, Infinity, '60']) {
      assertInvalid({ version: 1, mode: 'timed', durationSeconds });
    }
  }),

  test('recognizes only the four supported future question counts', () => {
    for (const questionCount of [10, 20, 30, 50]) {
      assert.equal(valueOf({ version: 1, questionCount }).questionCount, questionCount);
    }
    for (const questionCount of [0, 25, 50.5, NaN, Infinity, '20']) {
      assertInvalid({ version: 1, questionCount });
    }
  }),

  test('validates known operations and applies the route operation lock', () => {
    assert.deepEqual(valueOf({ version: 1, operations: ['multiplication'] }).operations, ['multiplication']);
    for (const operations of [[], ['division'], ['mixed'], ['multiplication', 'multiplication'], null]) {
      assertInvalid({ version: 1, operations });
    }
  }),

  test('normalizes operations in a stable public order for a future mixed capability', () => {
    const operations = ['addition', 'subtraction', 'multiplication', 'division'] as const;
    const capability: RoutePracticeCapability = { operations: { allowed: operations } };
    const requested: PublicOperation[] = ['division', 'addition', 'multiplication'];
    assert.deepEqual(valueOf({ version: 1, operations: requested }, capability).operations, [
      'addition',
      'multiplication',
      'division',
    ]);
  }),

  test('rejects recognized fields that a route capability does not permit', () => {
    const locked: RoutePracticeCapability = {};
    assertInvalid({ version: 1, facts: [6] }, locked);
    assertInvalid({ version: 1, operations: ['multiplication'] }, locked);
    assertInvalid({ version: 1, mode: 'untimed' }, locked);
    assertInvalid({ version: 1, mode: 'timed', durationSeconds: 60 }, locked);
    assertInvalid({ version: 1, questionCount: 20 }, locked);
  }),

  test('fails the whole preset when any recognized field is malformed', () => {
    const result = validate({ version: 1, facts: [6, 7, 99], questionCount: 20 });
    assert.equal(result.success, false);
    assert.equal('value' in result, false);
  }),

  test('drops internal and deferred fields from normalized and resolved output', () => {
    const attack = {
      version: 1,
      facts: [7],
      questionCount: 20,
      storageKey: 'evil',
      path: '/other/',
      label: 'Wrong identity',
      rendererVariant: 'evil',
      feedbackDelay: 0,
      correctFeedbackDelayMs: 0,
      analyticsIdentity: 'evil',
      canonical: '/other/',
      fixedTimerDuration: false,
      seed: 123,
      operandA: { min: -100, max: 1000 },
      withRemainder: true,
    };
    const normalized = valueOf(attack);
    const resolved = toPracticeOverrides(normalized);
    assert.deepEqual(normalized, { version: 1, facts: [7], questionCount: 20 });
    assert.deepEqual(resolved, { selectedFacts: [7], questionCount: 20 });
    for (const forbidden of [
      'storageKey', 'path', 'label', 'rendererVariant', 'feedbackDelay', 'correctFeedbackDelayMs',
      'analyticsIdentity', 'canonical', 'fixedTimerDuration', 'seed', 'operandA', 'withRemainder',
    ]) {
      assert.equal(forbidden in normalized, false);
      assert.equal(forbidden in resolved, false);
    }
  }),

  test('validation and translation do not mutate input, capability, or route preset', () => {
    const input = { version: 1 as const, facts: [8, 6, 7], mode: 'timed', durationSeconds: 60 };
    const inputBefore = structuredClone(input);
    const capabilityBefore = structuredClone(MULTIPLICATION_FACTS_CAPABILITY);
    const routePresetBefore = structuredClone(MULTIPLICATION_FACTS);
    const normalized = valueOf(input);
    toPracticeOverrides(normalized);
    assert.deepEqual(input, inputBefore);
    assert.deepEqual(MULTIPLICATION_FACTS_CAPABILITY, capabilityBefore);
    assert.deepEqual(MULTIPLICATION_FACTS, routePresetBefore);
  }),
];
