import { assert, test } from './harness';
import { deriveSafePracticeDimensions, safeEventPayload } from '../src/lib/createPracticeAnalytics';
import { validatePracticeDefinitionV2, type PracticeSessionOptions } from '../src/engine/practiceDefinition';
import { PRACTICE_TYPE_REGISTRY } from '../src/engine/practiceTypes';
import { trackEvent } from '../src/lib/analytics';

function definition(practiceType: string, sessionOptions: PracticeSessionOptions, selection?: readonly number[]) {
  const entry = PRACTICE_TYPE_REGISTRY.find((item) => item.id === practiceType);
  assert.ok(entry);
  const skillOptions = practiceType === 'multiplication-facts'
    ? { facts: selection ?? [1] }
    : practiceType === 'division-facts' ? { divisors: selection ?? [1] } : {};
  const validated = validatePracticeDefinitionV2({ version: 2, practiceType, skillOptions, sessionOptions });
  if (!validated.success) throw new Error(`Invalid test definition: ${validated.error.reason}`);
  return validated.value;
}

export const tests = [
  test('derives registry-backed dimensions for every current practice type', () => {
    for (const entry of PRACTICE_TYPE_REGISTRY) {
      const dimensions = deriveSafePracticeDimensions(definition(entry.id, { mode: 'untimed' }));
      assert.deepEqual(
        { practice_type: dimensions.practice_type, category: dimensions.category },
        { practice_type: entry.id, category: entry.category },
      );
      assert.equal(dimensions.session_mode, 'untimed_endless');
    }
  }),
  test('maps the four session shapes to finite mode buckets and bounded options', () => {
    const cases: readonly [PracticeSessionOptions, string, object][] = [
      [{ mode: 'untimed' }, 'untimed_endless', {}],
      [{ mode: 'untimed', questionCount: 20 }, 'untimed_finite', { question_count: 20 }],
      [{ mode: 'timed', durationSeconds: 60 }, 'timed_only', { duration_seconds: 60 }],
      [{ mode: 'timed', durationSeconds: 120, questionCount: 30 }, 'timed_finite', { duration_seconds: 120, question_count: 30 }],
    ];
    for (const [session, bucket, optional] of cases) {
      const dimensions = deriveSafePracticeDimensions(definition('addition-1-digit', session));
      assert.equal(dimensions.session_mode, bucket);
      for (const [key, value] of Object.entries(optional)) assert.equal((dimensions as unknown as Record<string, unknown>)[key], value);
    }
  }),
  test('buckets selection breadth without exposing facts or divisors', () => {
    for (const practiceType of ['multiplication-facts', 'division-facts'] as const) {
      for (const [values, scope] of [[[6], 'single'], [[6, 7], 'multiple'], [Array.from({ length: 12 }, (_, i) => i + 1), 'all']] as const) {
        const dimensions = deriveSafePracticeDimensions(definition(practiceType, { mode: 'untimed' }, values));
        assert.equal(dimensions.selection_scope, scope);
        assert.equal('facts' in dimensions, false);
        assert.equal('divisors' in dimensions, false);
        assert.equal(JSON.stringify(dimensions).includes('6,7'), false);
      }
    }
  }),
  test('runtime allowlist removes high-cardinality and learner/problem fields', () => {
    const unsafe = {
      practice_type: 'multiplication-facts', session_mode: 'timed_finite', question_count: 20,
      url: '/practice/?secret', href: 'x', query: 'x', query_string: 'x', practice_url: 'x',
      facts: '6,7,8', divisors: '3,6,9', storage_key: 'x', assignment_id: 'x', session_id: 'x',
      problem: '6 x 7', answer: '42', arbitrary: ['anything'],
    };
    assert.deepEqual(safeEventPayload(unsafe), {
      practice_type: 'multiplication-facts', session_mode: 'timed_finite', question_count: 20,
    });
  }),
  test('analytics dispatch fails open when the vendor function throws', () => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, 'window');
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { gtag: () => { throw new Error('blocked'); } } });
    assert.doesNotThrow(() => trackEvent('shared_practice_open', { practice_type: 'addition-1-digit' }));
    if (previous) Object.defineProperty(globalThis, 'window', previous);
    else delete (globalThis as { window?: unknown }).window;
  }),
];
