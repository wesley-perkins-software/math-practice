import { assert, test } from './harness';
import { ALL_PRESETS } from '../src/engine/presets';
import {
  PRACTICE_CATEGORY_IDS,
  PRACTICE_TYPE_IDS,
  PRACTICE_TYPE_REGISTRY,
} from '../src/engine/practiceTypes';
import {
  PRACTICE_DEFINITION_VERSION,
  resolvePracticeDefinition,
  validatePracticeDefinitionV2,
} from '../src/engine/practiceDefinition';

const definition = (practiceType: string, skillOptions: unknown, sessionOptions: unknown = { mode: 'untimed' }) => ({
  version: 2,
  practiceType,
  skillOptions,
  sessionOptions,
});

const valueOf = (input: unknown) => {
  const result = validatePracticeDefinitionV2(input);
  assert.equal(result.success, true, result.success ? undefined : result.error.reason);
  return result.value;
};

const invalid = (input: unknown) => {
  const result = validatePracticeDefinitionV2(input);
  assert.equal(result.success, false);
  assert.equal('value' in result, false);
};

export const tests = [
  test('registry has stable unique IDs, valid categories, metadata, paths, and trusted presets', () => {
    assert.equal(new Set(PRACTICE_TYPE_IDS).size, PRACTICE_TYPE_IDS.length);
    assert.equal(new Set(PRACTICE_TYPE_REGISTRY.map((entry) => entry.id)).size, PRACTICE_TYPE_REGISTRY.length);
    assert.deepEqual(PRACTICE_TYPE_REGISTRY.map((entry) => entry.id), [...PRACTICE_TYPE_IDS]);
    for (const entry of PRACTICE_TYPE_REGISTRY) {
      assert.ok(PRACTICE_CATEGORY_IDS.includes(entry.category));
      assert.ok(entry.displayName.trim().length > 0);
      assert.ok(/^\/[a-z0-9-/]+\/$/.test(entry.canonicalPath));
      assert.ok(ALL_PRESETS.includes(entry.baseConfig));
      assert.equal('storageKey' in entry, false);
      assert.equal('progressIdentity' in entry, false);
    }
  }),

  test('accepts valid V2 definitions and empty options for preset-defined skills', () => {
    assert.equal(PRACTICE_DEFINITION_VERSION, 2);
    assert.deepEqual(valueOf(definition('addition-2digit-regrouping', {}, { mode: 'untimed', questionCount: 20 })), {
      version: 2,
      practiceType: 'addition-2digit-regrouping',
      skillOptions: {},
      sessionOptions: { mode: 'untimed', questionCount: 20 },
    });
  }),

  test('rejects unsupported versions, types, malformed objects, and unknown fields without throwing', () => {
    const inputs = [null, undefined, [], 'x', 2, true, {}, { version: 1 }, { version: 3 },
      definition('unknown', {}),
      { ...definition('addition-1-digit', {}), path: '/evil/' },
      definition('addition-1-digit', { typo: true }),
      definition('addition-1-digit', {}, null),
    ];
    for (const input of inputs) assert.doesNotThrow(() => invalid(input));
  }),

  test('never throws for hostile object inspection', () => {
    const getter = Object.defineProperty({}, 'version', { get: () => { throw new Error('hostile'); } });
    const proxy = new Proxy({}, { ownKeys: () => { throw new Error('hostile'); } });
    assert.doesNotThrow(() => invalid(getter));
    assert.doesNotThrow(() => invalid(proxy));
  }),

  test('validates and normalizes multiplication fact selections', () => {
    assert.deepEqual(valueOf(definition('multiplication-facts', { facts: [6] })).skillOptions, { facts: [6] });
    assert.deepEqual(valueOf(definition('multiplication-facts', { facts: [8, 6, 7] })).skillOptions, { facts: [6, 7, 8] });
    const all = Array.from({ length: 12 }, (_, index) => 12 - index);
    assert.deepEqual(valueOf(definition('multiplication-facts', { facts: all })).skillOptions, { facts: [...all].reverse() });
    for (const facts of [[], [6, 6], [0], [13], [-1], [1.5], ['6'], null]) invalid(definition('multiplication-facts', { facts }));
  }),

  test('validates and normalizes division divisor selections', () => {
    assert.deepEqual(valueOf(definition('division-facts', { divisors: [6] })).skillOptions, { divisors: [6] });
    assert.deepEqual(valueOf(definition('division-facts', { divisors: [8, 6, 7] })).skillOptions, { divisors: [6, 7, 8] });
    for (const divisors of [[], [6, 6], [0], [13], [-1], [1.5], ['6'], null]) invalid(definition('division-facts', { divisors }));
  }),

  test('enforces common untimed, timed, duration, and question-count semantics', () => {
    assert.deepEqual(valueOf(definition('addition-1-digit', {})).sessionOptions, { mode: 'untimed' });
    assert.deepEqual(valueOf(definition('addition-1-digit', {}, { mode: 'timed', durationSeconds: 120, questionCount: 20 })).sessionOptions, { mode: 'timed', durationSeconds: 120, questionCount: 20 });
    for (const durationSeconds of [30, 60, 120, 300]) valueOf(definition('addition-1-digit', {}, { mode: 'timed', durationSeconds }));
    for (const questionCount of [10, 20, 30, 50]) valueOf(definition('addition-1-digit', {}, { mode: 'untimed', questionCount }));
    for (const session of [
      { mode: 'timed' }, { mode: 'untimed', durationSeconds: 60 }, { mode: 'timed', durationSeconds: 25 },
      {}, { mode: 'other' }, { mode: 'untimed', questionCount: 25 },
    ]) invalid(definition('addition-1-digit', {}, session));
  }),

  test('strictly rejects internal identity fields and fails as a unit', () => {
    invalid({ ...definition('multiplication-facts', { facts: [6, 7, 8] }, { mode: 'untimed', questionCount: 20 }), storageKey: 'evil', canonical: '/evil/', path: '/evil/' });
    invalid(definition('multiplication-facts', { facts: [6, 7, 8], storageKey: 'evil' }));
    invalid(definition('multiplication-facts', { facts: [6, 7, 99] }, { mode: 'untimed', questionCount: 20 }));
  }),

  test('resolution uses trusted identity and validation mutates no input, registry, or preset', () => {
    const input = definition('multiplication-facts', { facts: [8, 6, 7] }, { mode: 'timed', durationSeconds: 60 });
    const before = structuredClone(input);
    const registryBefore = PRACTICE_TYPE_REGISTRY.map(({ id, category, canonicalPath, displayName, baseConfig, defaultSkillOptions }) => ({ id, category, canonicalPath, displayName, baseConfig: structuredClone(baseConfig), defaultSkillOptions: structuredClone(defaultSkillOptions) }));
    const validated = valueOf(input);
    const resolved = resolvePracticeDefinition(validated);
    assert.equal(resolved.baseConfig, PRACTICE_TYPE_REGISTRY.find((entry) => entry.id === 'multiplication-facts')!.baseConfig);
    assert.equal(resolved.baseConfig.storageKey, 'mult-facts');
    assert.equal('storageKey' in validated, false);
    assert.deepEqual(input, before);
    assert.deepEqual(PRACTICE_TYPE_REGISTRY.map(({ id, category, canonicalPath, displayName, baseConfig, defaultSkillOptions }) => ({ id, category, canonicalPath, displayName, baseConfig, defaultSkillOptions })), registryBefore);
  }),
];
