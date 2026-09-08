import { assert, test } from './harness';
import {
  MULTIPLICATION_FACTS_CAPABILITY,
  validatePublicPracticePreset,
  type PublicOperation,
  type RoutePracticeCapability,
} from '../src/engine/publicPreset';
import { parsePublicPracticePresetQuery, serializePublicPracticePreset } from '../src/engine/publicPresetUrl';

const capability = MULTIPLICATION_FACTS_CAPABILITY;
const parse = (query: string | URLSearchParams, routeCapability = capability) =>
  parsePublicPracticePresetQuery(query, routeCapability);
const valueOf = (query: string | URLSearchParams, routeCapability = capability) => {
  const result = parse(query, routeCapability);
  assert.equal(result.success, true, result.success ? undefined : result.error.reason);
  return result.value;
};
const invalid = (query: string | URLSearchParams, routeCapability = capability) => {
  const result = parse(query, routeCapability);
  assert.equal(result.success, false);
  assert.equal('value' in result, false);
};

const mixedCapability: RoutePracticeCapability = {
  operations: { allowed: ['addition', 'subtraction', 'multiplication', 'division'] },
};

export const tests = [
  test('requires exactly one supported version parameter', () => {
    assert.deepEqual(valueOf('?v=1'), { version: 1 });
    for (const query of ['', '?facts=6', '?v=2', '?v=abc', '?v=', '?v=1&v=1']) invalid(query);
  }),

  test('parses strict comma-separated facts and delegates fact policy', () => {
    assert.deepEqual(valueOf('?v=1&facts=6').facts, [6]);
    assert.deepEqual(valueOf('?v=1&facts=6,7,8').facts, [6, 7, 8]);
    assert.deepEqual(valueOf('?v=1&facts=6%2C7%2C8').facts, [6, 7, 8]);
    for (const facts of ['', '6,,8', '6,6', '6.5', '-1', 'abc', '0', '06', '6,13', '6, 7']) {
      invalid(`?v=1&facts=${facts}`);
    }
  }),

  test('parses operations and enforces public vocabulary and route capability', () => {
    assert.deepEqual(valueOf('?v=1&operations=multiplication').operations, ['multiplication']);
    assert.deepEqual(
      valueOf('?v=1&operations=division,addition,multiplication', mixedCapability).operations,
      ['addition', 'multiplication', 'division'],
    );
    invalid('?v=1&operations=division');
    invalid('?v=1&operations=unknown', mixedCapability);
    invalid('?v=1&operations=addition,addition', mixedCapability);
    invalid('?v=1&operations=');
  }),

  test('parses strict modes and preserves duration cross-field semantics', () => {
    assert.equal(valueOf('?v=1&mode=untimed').mode, 'untimed');
    for (const duration of [30, 60, 120, 300]) {
      assert.equal(valueOf(`?v=1&mode=timed&duration=${duration}`).durationSeconds, duration);
    }
    for (const query of [
      '?v=1&mode=timer', '?v=1&mode=TIMED&duration=60', '?v=1&mode=',
      '?v=1&mode=timed', '?v=1&mode=untimed&duration=60', '?v=1&duration=60',
      '?v=1&mode=timed&duration=25', '?v=1&mode=timed&duration=60.0',
      '?v=1&mode=timed&duration=-60', '?v=1&mode=timed&duration=',
    ]) invalid(query);
  }),

  test('parses only supported strict question counts', () => {
    for (const count of [10, 20, 30, 50]) assert.equal(valueOf(`?v=1&questions=${count}`).questionCount, count);
    for (const count of ['25', '20.0', '-20', 'abc', '', '020']) invalid(`?v=1&questions=${count}`);
    invalid('?v=1&questions=10&questions=20');
  }),

  test('rejects duplicate, unknown, and internal parameters as a unit', () => {
    for (const query of [
      '?v=1&facts=6&facts=7', '?v=1&mode=untimed&mode=timed', '?v=1&foo=bar',
      '?v=1&qusetions=20', '?v=1&storageKey=evil', '?v=1&path=/other/',
      '?v=1&seed=3', '?v=1&canonical=/other/', '?v=1&analytics=evil',
    ]) invalid(query);
    const result = parse('?v=1&facts=6,99&questions=20');
    assert.equal(result.success, false);
    assert.equal('value' in result, false);
  }),

  test('does not throw for odd strings or hostile URLSearchParams inspection', () => {
    for (const query of ['?%', '?v=%', '?v=1&&', '?v=1&facts=%EF%BF%BD', '?=']) {
      assert.doesNotThrow(() => parse(query));
    }
    const hostile = new Proxy(new URLSearchParams('v=1'), {
      get(target, property, receiver) {
        if (property === Symbol.iterator) throw new Error('hostile iterator');
        return Reflect.get(target, property, receiver);
      },
    });
    assert.doesNotThrow(() => invalid(hostile));
  }),

  test('serializes normalized presets in canonical order without invented defaults', () => {
    const normalized = validatePublicPracticePreset({
      version: 1, facts: [8, 6, 7], operations: ['multiplication'], mode: 'timed',
      durationSeconds: 120, questionCount: 20,
    }, capability);
    assert.equal(normalized.success, true);
    const serialized = serializePublicPracticePreset(normalized.value);
    assert.equal(serialized, 'v=1&facts=6,7,8&operations=multiplication&mode=timed&duration=120&questions=20');
    assert.equal(serializePublicPracticePreset(normalized.value), serialized);
    assert.equal(serializePublicPracticePreset({ version: 1 }), 'v=1');
    assert.equal(serializePublicPracticePreset({ version: 1, mode: 'untimed', questionCount: 20 }), 'v=1&mode=untimed&questions=20');
    assert.equal(serialized.includes('+'), false);
  }),

  test('round trips representative normalized public presets', () => {
    const allFacts = Array.from({ length: 12 }, (_, index) => index + 1);
    const candidates: unknown[] = [
      { version: 1, facts: [8, 6, 7] },
      { version: 1, facts: [1] },
      { version: 1, facts: allFacts },
      { version: 1, mode: 'untimed', questionCount: 20 },
      { version: 1, mode: 'timed', durationSeconds: 60 },
      { version: 1, facts: [6], mode: 'timed', durationSeconds: 120, questionCount: 50 },
      { version: 1, operations: ['multiplication'] },
    ];
    for (const candidate of candidates) {
      const validated = validatePublicPracticePreset(candidate, capability);
      assert.equal(validated.success, true);
      assert.deepEqual(valueOf(serializePublicPracticePreset(validated.value)), validated.value);
    }

    const mixed = validatePublicPracticePreset(
      { version: 1, operations: ['division', 'addition', 'multiplication'] as PublicOperation[] },
      mixedCapability,
    );
    assert.equal(mixed.success, true);
    assert.deepEqual(valueOf(serializePublicPracticePreset(mixed.value), mixedCapability), mixed.value);
  }),
];
