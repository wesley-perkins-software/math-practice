import { assert, test } from './harness';
import { parsePracticeDefinitionV2Query, serializePracticeDefinitionV2 } from '../src/engine/practiceDefinitionUrl';
import { formatDuration, formatSharedPracticeHeading, prepareSharedPractice } from '../src/engine/sharedPractice';

function valid(query: string) {
  const result = parsePracticeDefinitionV2Query(query);
  assert.equal(result.success, true, result.success ? undefined : result.error.reason);
  return result.value;
}

export const tests = [
  test('parses every public option family and supported session shape', () => {
    assert.deepEqual(valid('v=2&skill=multiplication-facts&facts=8,6,7&mode=untimed&questions=20').skillOptions, { facts: [6, 7, 8] });
    assert.deepEqual(valid('v=2&skill=multiplication-facts&facts=6&mode=untimed').skillOptions, { facts: [6] });
    assert.deepEqual(valid('v=2&skill=division-facts&divisors=6&mode=timed&duration=30').skillOptions, { divisors: [6] });
    assert.deepEqual(valid('v=2&skill=division-facts&divisors=8,6,7&mode=timed&duration=120&questions=20').sessionOptions, { mode: 'timed', durationSeconds: 120, questionCount: 20 });
    for (const skill of ['addition-1-digit', 'addition-2digit-regrouping', 'subtraction-1-digit', 'subtraction-2digit-no-regrouping', 'division-remainders']) {
      assert.deepEqual(valid(`v=2&skill=${skill}&mode=untimed`).skillOptions, {});
    }
  }),
  test('rejects malformed, extra, duplicate, partial, and cross-skill URL state as a unit', () => {
    const invalid = ['', 'skill=addition-1-digit&mode=untimed', 'v=1&skill=addition-1-digit&mode=untimed', 'v=02&skill=addition-1-digit&mode=untimed',
      'v=2&mode=untimed', 'v=2&skill=unknown&mode=untimed', 'v=2&skill=addition-1-digit&mode=untimed&foo=bar',
      'v=2&skill=addition-1-digit&skill=subtraction-1-digit&mode=untimed', 'v=2&skill=addition-1-digit&mode=untimed&mode=timed',
      'v=2&skill=multiplication-facts&facts=6,,8&mode=untimed', 'v=2&skill=multiplication-facts&facts=6,abc&mode=untimed',
      'v=2&skill=multiplication-facts&facts=0&mode=untimed', 'v=2&skill=multiplication-facts&facts=6,6&mode=untimed',
      'v=2&skill=division-facts&divisors=13&mode=untimed', 'v=2&skill=division-facts&divisors=7,7&mode=untimed',
      'v=2&skill=addition-1-digit&facts=6&mode=untimed', 'v=2&skill=multiplication-facts&divisors=6&mode=untimed',
      'v=2&skill=addition-1-digit&mode=bad', 'v=2&skill=addition-1-digit&mode=timed',
      'v=2&skill=addition-1-digit&mode=timed&duration=60.0', 'v=2&skill=addition-1-digit&mode=timed&duration=45',
      'v=2&skill=addition-1-digit&mode=untimed&duration=60', 'v=2&skill=addition-1-digit&mode=untimed&questions=20x',
      'v=2&skill=addition-1-digit&mode=untimed&questions=25', 'v=2&skill=addition-1-digit&mode=untimed&storageKey=evil'];
    for (const query of invalid) {
      const result = parsePracticeDefinitionV2Query(query);
      assert.equal(result.success, false, query);
      assert.equal('value' in result, false, query);
    }
  }),
  test('serializes normalized definitions in stable order and round trips without internals', () => {
    const definition = valid('questions=20&mode=untimed&facts=8,6,7&skill=multiplication-facts&v=2');
    const query = serializePracticeDefinitionV2(definition);
    assert.equal(query, 'v=2&skill=multiplication-facts&facts=6,7,8&mode=untimed&questions=20');
    assert.deepEqual(valid(query), definition);
    assert.equal(serializePracticeDefinitionV2(valid('v=2&skill=division-facts&divisors=7&mode=timed&duration=120')), 'v=2&skill=division-facts&divisors=7&mode=timed&duration=120');
    assert.ok(!query.includes('storageKey') && !query.includes('operand'));
  }),
  test('runner preparation preserves trusted identity, selected options, and session props', () => {
    const first = prepareSharedPractice(valid('v=2&skill=multiplication-facts&facts=6,7,8&mode=untimed&questions=20'));
    const second = prepareSharedPractice(valid('v=2&skill=multiplication-facts&facts=3&mode=timed&duration=60'));
    assert.equal(first.config.storageKey, 'mult-facts'); assert.equal(second.config.storageKey, 'mult-facts');
    assert.deepEqual(first.config.selectedFacts, [6, 7, 8]); assert.equal(first.questionCount, 20);
    assert.deepEqual(first.heading, { title: 'Multiplication Facts', details: ['6, 7, and 8 facts', '20 questions', 'Untimed'] });
    assert.equal(second.config.mode, 'timed'); assert.equal(second.config.timerDuration, 60); assert.equal(second.config.fixedTimerDuration, true);
    const division = prepareSharedPractice(valid('v=2&skill=division-facts&divisors=6,8&mode=timed&duration=120&questions=20'));
    assert.equal(division.config.storageKey, 'div-facts'); assert.deepEqual(division.config.selectedDivisors, [6, 8]);
    assert.deepEqual(division.heading, { title: 'Division Facts', details: ['Divide by 6 and 8', '2 minutes', 'Up to 20 questions'] });
    const allFacts = prepareSharedPractice(valid('v=2&skill=multiplication-facts&facts=1,2,3,4,5,6,7,8,9,10,11,12&mode=timed&duration=30&questions=50'));
    assert.deepEqual(allFacts.heading, { title: 'Multiplication Facts', details: ['30 seconds', 'Up to 50 questions'] }, 'the runner omits the redundant all-facts detail since the H1 already names the skill');
    const allDivisors = prepareSharedPractice(valid('v=2&skill=division-facts&divisors=1,2,3,4,5,6,7,8,9,10,11,12&mode=untimed'));
    assert.deepEqual(allDivisors.heading, { title: 'Division Facts', details: ['Untimed'] }, 'the runner omits the redundant all-divisors detail since the H1 already names the skill');
  }),
  test('shared heading details cover plain skills and every session shape naturally', () => {
    const heading = (query: string) => formatSharedPracticeHeading(valid(query));
    assert.deepEqual(heading('v=2&skill=addition-2digit-regrouping&mode=untimed&questions=30'), {
      title: '2-Digit Addition With Regrouping', details: ['30 questions', 'Untimed'],
    });
    assert.deepEqual(heading('v=2&skill=subtraction-2digit-no-regrouping&mode=untimed'), {
      title: '2-Digit Subtraction Without Regrouping', details: ['Untimed'],
    });
    assert.deepEqual(heading('v=2&skill=addition-1-digit&mode=timed&duration=30'), {
      title: '1-Digit Addition', details: ['30 seconds'],
    });
    assert.deepEqual(heading('v=2&skill=addition-1-digit&mode=timed&duration=120&questions=20'), {
      title: '1-Digit Addition', details: ['2 minutes', 'Up to 20 questions'],
    });
    assert.equal(formatDuration(60), '1 minute');
    assert.equal(formatDuration(300), '5 minutes');
  }),
];
