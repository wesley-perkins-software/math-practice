import { assert, test } from './harness';
import { DEFAULT_CREATE_PRACTICE_STATE, absolutePracticeUrl, deriveCreatePractice, selectCreatePracticeType, type CreatePracticeState } from '../src/engine/createPractice';
import { PRACTICE_CATEGORY_IDS, PRACTICE_TYPE_REGISTRY } from '../src/engine/practiceTypes';
import { formatSharedPracticeHeading } from '../src/engine/sharedPractice';

const select = (id: Parameters<typeof selectCreatePracticeType>[1]) => selectCreatePracticeType(DEFAULT_CREATE_PRACTICE_STATE, id);
const derive = (state: CreatePracticeState) => {
  const result = deriveCreatePractice(state);
  assert.equal(result.success, true);
  return result;
};

export const tests = [
  test('starts empty with product session defaults and registry categories every current type', () => {
    assert.deepEqual(DEFAULT_CREATE_PRACTICE_STATE, { skillOptions: {}, mode: 'untimed', durationSeconds: 60, questionCount: 20 });
    assert.equal(deriveCreatePractice(DEFAULT_CREATE_PRACTICE_STATE).success, false);
    assert.deepEqual(PRACTICE_CATEGORY_IDS.map(category => [category, PRACTICE_TYPE_REGISTRY.filter(entry => entry.category === category).map(entry => entry.id)]), [
      ['addition', ['addition-1-digit', 'addition-2digit-no-regrouping', 'addition-2digit-regrouping']],
      ['subtraction', ['subtraction-1-digit', 'subtraction-2digit-no-regrouping', 'subtraction-2digit-regrouping']],
      ['multiplication', ['multiplication-facts']], ['division', ['division-facts', 'division-remainders']],
    ]);
    for (const entry of PRACTICE_TYPE_REGISTRY) assert.deepEqual(select(entry.id).skillOptions, entry.defaultSkillOptions);
  }),
  test('type changes preserve sessions and replace incompatible options with registry defaults', () => {
    const multiplication = { ...select('multiplication-facts'), mode: 'timed' as const, durationSeconds: 120 as const, questionCount: 30 as const, skillOptions: { facts: [6, 7, 8] } };
    const addition = selectCreatePracticeType(multiplication, 'addition-2digit-regrouping');
    assert.deepEqual(addition, { practiceType: 'addition-2digit-regrouping', skillOptions: {}, mode: 'timed', durationSeconds: 120, questionCount: 30 });
    assert.deepEqual(selectCreatePracticeType(addition, 'division-facts').skillOptions, { divisors: [1,2,3,4,5,6,7,8,9,10,11,12] });
  }),
  test('selected multiplication facts validate, normalize, and serialize live', () => {
    const base = select('multiplication-facts');
    assert.equal(deriveCreatePractice({ ...base, skillOptions: { facts: [] } }).success, false);
    assert.equal(deriveCreatePractice({ ...base, skillOptions: { facts: [0] } }).success, false);
    assert.equal(deriveCreatePractice({ ...base, skillOptions: { facts: [13] } }).success, false);
    assert.equal(derive({ ...base, skillOptions: { facts: [6] } }).query, 'v=2&skill=multiplication-facts&facts=6&mode=untimed&questions=20');
    const multiple = derive({ ...base, skillOptions: { facts: [8, 6, 7] } });
    assert.equal(multiple.query, 'v=2&skill=multiplication-facts&facts=6,7,8&mode=untimed&questions=20');
    assert.deepEqual(multiple.definition.skillOptions, { facts: [6, 7, 8] });
    assert.equal((derive(base).definition.skillOptions as { facts: readonly number[] }).facts.length, 12);
  }),
  test('selected division values validate, normalize, and serialize live', () => {
    const base = select('division-facts');
    assert.equal(deriveCreatePractice({ ...base, skillOptions: { divisors: [] } }).success, false);
    assert.equal(deriveCreatePractice({ ...base, skillOptions: { divisors: [0] } }).success, false);
    assert.equal(deriveCreatePractice({ ...base, skillOptions: { divisors: [13] } }).success, false);
    assert.equal(derive({ ...base, skillOptions: { divisors: [8, 6, 7] } }).query, 'v=2&skill=division-facts&divisors=6,7,8&mode=untimed&questions=20');
    assert.equal((derive(base).definition.skillOptions as { divisors: readonly number[] }).divisors.length, 12);
  }),
  test('session controls produce only supported untimed, endless, timed, and finite definitions', () => {
    const base = select('addition-1-digit');
    assert.equal(derive(base).query, 'v=2&skill=addition-1-digit&mode=untimed&questions=20');
    assert.equal(derive({ ...base, questionCount: undefined }).query, 'v=2&skill=addition-1-digit&mode=untimed');
    assert.equal(derive({ ...base, mode: 'timed', durationSeconds: 30, questionCount: undefined }).query, 'v=2&skill=addition-1-digit&mode=timed&duration=30');
    assert.equal(derive({ ...base, mode: 'timed', durationSeconds: 120 }).query, 'v=2&skill=addition-1-digit&mode=timed&duration=120&questions=20');
    assert.equal(deriveCreatePractice({ ...base, durationSeconds: 45 as 30 }).success, true, 'unused untimed duration is omitted');
    assert.equal(deriveCreatePractice({ ...base, mode: 'timed', durationSeconds: 45 as 30 }).success, false);
    assert.equal(deriveCreatePractice({ ...base, questionCount: 25 as 20 }).success, false);
  }),
  test('there is no applied snapshot: every edit updates the one copy/start target', () => {
    const base = select('multiplication-facts');
    const first = derive({ ...base, skillOptions: { facts: [6, 7] } });
    const second = derive({ ...base, skillOptions: { facts: [8, 9] }, questionCount: 30 });
    assert.equal(first.relativeUrl, '/practice/?v=2&skill=multiplication-facts&facts=6,7&mode=untimed&questions=20');
    assert.equal(second.relativeUrl, '/practice/?v=2&skill=multiplication-facts&facts=8,9&mode=untimed&questions=30');
    assert.equal(absolutePracticeUrl(second.relativeUrl, 'https://deploy-preview-42.example.net/create/'), `https://deploy-preview-42.example.net${second.relativeUrl}`);
  }),
  test('builder preview uses the runner formatter for skill and session wording', () => {
    const multiplication = derive({ ...select('multiplication-facts'), skillOptions: { facts: [6,7,8] } });
    assert.deepEqual(formatSharedPracticeHeading(multiplication.definition), { title: 'Multiplication Facts', details: ['6, 7, 8 facts', '20 questions', 'Untimed'] });
    const division = derive({ ...select('division-facts'), skillOptions: { divisors: [6,7,8] }, mode: 'timed', durationSeconds: 120 });
    assert.deepEqual(formatSharedPracticeHeading(division.definition), { title: 'Division Facts', details: ['Divide by 6, 7, 8', '2 minutes', 'Up to 20 questions'] });
    assert.deepEqual(formatSharedPracticeHeading(derive({ ...select('addition-2digit-regrouping'), questionCount: 30 }).definition), { title: '2-Digit Addition With Regrouping', details: ['30 questions', 'Untimed'] });
  }),
];
