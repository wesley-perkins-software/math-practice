import { assert, test } from './harness';
import { parsePracticeDefinitionV2Query, serializePracticeDefinitionV2 } from '../src/engine/practiceDefinitionUrl';
import { formatDuration, formatSharedPracticeHeading, prepareSharedPractice } from '../src/engine/sharedPractice';

function valid(query: string) {
  const result = parsePracticeDefinitionV2Query(query);
  assert.equal(result.success, true, result.success ? undefined : result.error.reason);
  return result.value;
}

function invalid(query: string | URLSearchParams) {
  const result = parsePracticeDefinitionV2Query(query);
  assert.equal(result.success, false, query.toString());
  assert.equal('value' in result, false, query.toString());
}

export const tests = [
  test('parses every public option family and supported session shape', () => {
    assert.deepEqual(valid('v=2&skill=multiplication-facts&facts=8,6,7&mode=untimed&problems=20').skillOptions, { facts: [6, 7, 8] });
    assert.deepEqual(valid('v=2&skill=multiplication-facts&facts=6&mode=untimed').skillOptions, { facts: [6] });
    assert.deepEqual(valid('v=2&skill=division-facts&divisors=6&mode=timed&duration=30').skillOptions, { divisors: [6] });
    assert.deepEqual(valid('v=2&skill=division-facts&divisors=8,6,7&mode=timed&duration=120&problems=20').sessionOptions, { mode: 'timed', durationSeconds: 120, questionCount: 20 });
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
      'v=2&skill=addition-1-digit&mode=untimed&duration=60', 'v=2&skill=addition-1-digit&mode=untimed&problems=20x',
      'v=2&skill=addition-1-digit&mode=untimed&problems=25', 'v=2&skill=addition-1-digit&mode=untimed&storageKey=evil'];
    for (const query of invalid) {
      const result = parsePracticeDefinitionV2Query(query);
      assert.equal(result.success, false, query);
      assert.equal('value' in result, false, query);
    }
  }),
  test('rejects the pre-launch questions key rather than treating it as an alias', () => {
    invalid('v=2&skill=addition-1-digit&mode=untimed&questions=20');
    invalid('v=2&skill=addition-1-digit&mode=untimed&problems=20&questions=20');
    invalid('v=2&skill=multiplication-facts&facts=6&mode=untimed&questions=20');
  }),
  test('rejects whitespace, plus semantics, case variants, and non-ASCII lookalikes', () => {
    const malformed = [
      'v= 2&skill=addition-1-digit&mode=untimed', 'v=2 &skill=addition-1-digit&mode=untimed',
      'v=2&skill= addition-1-digit&mode=untimed', 'v=2&skill=addition-1-digit &mode=untimed',
      'v=2&skill=addition-1-digit&mode=untimed ', 'v=2&skill=addition-1-digit&mode=untimed&problems= 20',
      'v=2&skill=addition-1-digit&mode=untimed&problems=20 ',
      'v=2&skill=multiplication-facts&facts=6, 7,8&mode=untimed',
      'v=2&skill=multiplication-facts&facts=6,%207,8&mode=untimed',
      'v=2&skill=multiplication-facts&facts=6%20%2C7&mode=untimed',
      'v=2&skill=multiplication-facts&facts=6+7&mode=untimed',
      'v=2&skill=addition-1-digit&mode=untimed&problems=+20', 'v=2&skill=multiplication+facts&mode=untimed',
      'V=2&skill=addition-1-digit&mode=untimed', 'v=2&Skill=addition-1-digit&mode=untimed',
      'v=2&skill=Addition-1-Digit&mode=untimed', 'v=2&skill=addition-1-digit&mode=UNTIMED',
      'v=2&skill=addition-1-digit&mode=untimed&Problems=20',
      'v=2&skill=addition-1-digit&mode=untimed&problems=２０',
      'v=2&skill=addition-1-digit&mode=untimed&problems=−20',
      'v=2&skill=multiplication-facts&facts=6，7&mode=untimed',
      'v=2&skill=multiplication-facts&facts=6,\u00a07&mode=untimed',
    ];
    for (const query of malformed) invalid(query);
  }),
  test('accepts encoded commas once but rejects encoded spaces, plus signs, and double encoding', () => {
    assert.deepEqual(valid('v=2&skill=multiplication-facts&facts=6%2C7%2C8&mode=untimed').skillOptions, { facts: [6, 7, 8] });
    for (const query of [
      'v=2&skill=multiplication-facts&facts=6%20%2C7&mode=untimed',
      'v=2&skill=addition-1-digit&mode=untimed&problems=%2B20',
      'v=2&skill=multiplication-facts&facts=6%252C7&mode=untimed',
      'v=2&skill=addition-1-digit&mode=untimed&problems=%',
    ]) invalid(query);
  }),
  test('rejects every explicit empty value and duplicate recognized key', () => {
    const requiredBase = 'v=2&skill=addition-1-digit&mode=untimed';
    for (const query of [
      'v=&skill=addition-1-digit&mode=untimed', 'v=2&skill=&mode=untimed', 'v=2&skill=addition-1-digit&mode=',
      `${requiredBase}&duration=`, `${requiredBase}&problems=`,
      'v=2&skill=multiplication-facts&facts=&mode=untimed', 'v=2&skill=division-facts&divisors=&mode=untimed',
    ]) invalid(query);
    invalid('v&skill=addition-1-digit&mode=untimed');
    for (const duplicate of ['v=2', 'skill=addition-1-digit', 'mode=untimed', 'problems=20']) {
      invalid(`${requiredBase}&problems=20&${duplicate}`);
    }
    invalid('v=2&skill=multiplication-facts&facts=6,7&facts=8&mode=untimed');
  }),
  test('rejects strict numeric variants and malformed fact/divisor lists', () => {
    for (const value of ['02', '020', '+20', '-20', '20.0', '20e0', '2e1', '0x14', '15', '100', '', ' 20', '20 ', '２０']) {
      invalid(`v=2&skill=addition-1-digit&mode=untimed&problems=${value}`);
    }
    for (const value of ['060', '+60', '-60', '60.0', '6e1', '0x3c', '']) {
      invalid(`v=2&skill=addition-1-digit&mode=timed&duration=${value}`);
    }
    for (const [skill, key] of [['multiplication-facts', 'facts'], ['division-facts', 'divisors']] as const) {
      for (const list of [',6,7', '6,7,', '6,,7', '6, 7', '6,a', '6,-7', '6,+7', '6,7.0', '6,6', '0,6', '6,13', '06']) {
        invalid(`v=2&skill=${skill}&${key}=${list}&mode=untimed`);
      }
    }
  }),
  test('rejects unknown internal-looking fields and every wrong skill-specific field', () => {
    for (const key of ['storageKey', 'operation', 'minOperand', 'maxOperand', 'renderer', 'seed', 'title', 'assignmentId', 'foo']) {
      invalid(`v=2&skill=addition-1-digit&mode=untimed&${key}=value`);
    }
    for (const query of [
      'v=2&skill=addition-1-digit&facts=6&mode=untimed', 'v=2&skill=addition-1-digit&divisors=6&mode=untimed',
      'v=2&skill=multiplication-facts&facts=6&divisors=6&mode=untimed',
      'v=2&skill=division-facts&divisors=6&facts=6&mode=untimed',
      'v=2&skill=division-remainders&divisors=6&mode=untimed',
    ]) invalid(query);
  }),
  test('bounds oversized public input and fails safely', () => {
    invalid(`v=2&skill=${'a'.repeat(5000)}&mode=untimed`);
    invalid(`v=2&skill=multiplication-facts&facts=${Array.from({ length: 1000 }, () => '6').join(',')}&mode=untimed`);
    invalid(`v=2&skill=addition-1-digit&mode=untimed&problems=${'9'.repeat(300)}`);
    invalid(`v=2&skill=addition-1-digit&mode=untimed&foo=${'x'.repeat(5000)}`);
    const params = new URLSearchParams({ v: '2', skill: 'addition-1-digit', mode: 'untimed', title: 'x'.repeat(1000) });
    invalid(params);
  }),
  test('serializes normalized definitions in stable order and round trips without internals', () => {
    const definition = valid('problems=20&mode=untimed&facts=8,6,7&skill=multiplication-facts&v=2');
    const query = serializePracticeDefinitionV2(definition);
    assert.equal(query, 'v=2&skill=multiplication-facts&facts=6,7,8&mode=untimed&problems=20');
    assert.ok(!query.includes('questions='));
    assert.deepEqual(valid(query), definition);
    const noLimit = serializePracticeDefinitionV2(valid('v=2&skill=division-facts&divisors=7&mode=timed&duration=120'));
    assert.equal(noLimit, 'v=2&skill=division-facts&divisors=7&mode=timed&duration=120');
    assert.ok(!noLimit.includes('problems=') && !noLimit.includes('questions='));
    assert.ok(!query.includes('storageKey') && !query.includes('operand'));
  }),
  test('round trips representative normalized definitions across every registered practice type and session shape', () => {
    const queries = [
      'v=2&skill=addition-1-digit&mode=untimed',
      'v=2&skill=addition-2digit-no-regrouping&mode=untimed&problems=10',
      'v=2&skill=addition-2digit-regrouping&mode=timed&duration=30',
      'v=2&skill=subtraction-1-digit&mode=timed&duration=60&problems=20',
      'v=2&skill=subtraction-2digit-no-regrouping&mode=untimed&problems=30',
      'v=2&skill=subtraction-2digit-regrouping&mode=timed&duration=300',
      'v=2&skill=multiplication-facts&facts=6&mode=untimed',
      'v=2&skill=multiplication-facts&facts=6,7,8&mode=timed&duration=120&problems=50',
      'v=2&skill=multiplication-facts&facts=1,2,3,4,5,6,7,8,9,10,11,12&mode=untimed',
      'v=2&skill=division-facts&divisors=6&mode=untimed',
      'v=2&skill=division-facts&divisors=6,7,8&mode=timed&duration=120',
      'v=2&skill=division-facts&divisors=1,2,3,4,5,6,7,8,9,10,11,12&mode=untimed&problems=20',
      'v=2&skill=division-remainders&mode=timed&duration=120&problems=20',
    ];
    for (const query of queries) {
      const definition = valid(query);
      const serialized = serializePracticeDefinitionV2(definition);
      assert.ok(!serialized.includes('questions='), query);
      assert.deepEqual(valid(serialized), definition, query);
    }
  }),
  test('URL fragments are excluded by URLSearchParams and never serialized', () => {
    const url = new URL('https://example.test/practice/?v=2&skill=addition-1-digit&mode=untimed&problems=20#foo');
    const definition = parsePracticeDefinitionV2Query(url.searchParams);
    assert.equal(definition.success, true);
    if (definition.success) assert.equal(serializePracticeDefinitionV2(definition.value), 'v=2&skill=addition-1-digit&mode=untimed&problems=20');
  }),
  test('runner preparation preserves trusted identity, selected options, and session props', () => {
    const first = prepareSharedPractice(valid('v=2&skill=multiplication-facts&facts=6,7,8&mode=untimed&problems=20'));
    const second = prepareSharedPractice(valid('v=2&skill=multiplication-facts&facts=3&mode=timed&duration=60'));
    assert.equal(first.config.storageKey, 'mult-facts'); assert.equal(second.config.storageKey, 'mult-facts');
    assert.deepEqual(first.config.selectedFacts, [6, 7, 8]); assert.equal(first.questionCount, 20);
    assert.deepEqual(first.heading, { title: 'Multiplication Facts', details: ['6, 7, and 8 facts', '20 problems', 'Untimed'] });
    assert.equal(second.config.mode, 'timed'); assert.equal(second.config.timerDuration, 60); assert.equal(second.config.fixedTimerDuration, true);
    const division = prepareSharedPractice(valid('v=2&skill=division-facts&divisors=6,8&mode=timed&duration=120&problems=20'));
    assert.equal(division.config.storageKey, 'div-facts'); assert.deepEqual(division.config.selectedDivisors, [6, 8]);
    assert.deepEqual(division.heading, { title: 'Division Facts', details: ['Divide by 6 and 8', '2 minutes', 'Up to 20 problems'] });
    const allFacts = prepareSharedPractice(valid('v=2&skill=multiplication-facts&facts=1,2,3,4,5,6,7,8,9,10,11,12&mode=timed&duration=30&problems=50'));
    assert.deepEqual(allFacts.heading, { title: 'Multiplication Facts', details: ['30 seconds', 'Up to 50 problems'] }, 'the runner omits the redundant all-facts detail since the H1 already names the skill');
    const allDivisors = prepareSharedPractice(valid('v=2&skill=division-facts&divisors=1,2,3,4,5,6,7,8,9,10,11,12&mode=untimed'));
    assert.deepEqual(allDivisors.heading, { title: 'Division Facts', details: ['Untimed'] }, 'the runner omits the redundant all-divisors detail since the H1 already names the skill');
  }),
  test('shared heading details cover plain skills and every session shape naturally', () => {
    const heading = (query: string) => formatSharedPracticeHeading(valid(query));
    assert.deepEqual(heading('v=2&skill=addition-2digit-regrouping&mode=untimed&problems=30'), {
      title: '2-Digit Addition With Regrouping', details: ['30 problems', 'Untimed'],
    });
    assert.deepEqual(heading('v=2&skill=subtraction-2digit-no-regrouping&mode=untimed'), {
      title: '2-Digit Subtraction Without Regrouping', details: ['Untimed'],
    });
    assert.deepEqual(heading('v=2&skill=addition-1-digit&mode=timed&duration=30'), {
      title: '1-Digit Addition', details: ['30 seconds'],
    });
    assert.deepEqual(heading('v=2&skill=addition-1-digit&mode=timed&duration=120&problems=20'), {
      title: '1-Digit Addition', details: ['2 minutes', 'Up to 20 problems'],
    });
    assert.equal(formatDuration(60), '1 minute');
    assert.equal(formatDuration(300), '5 minutes');
  }),
];
