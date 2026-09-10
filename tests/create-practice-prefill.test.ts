import { readFileSync } from 'node:fs';
import { assert, test } from './harness';
import { deriveCreatePractice } from '../src/engine/createPractice';
import { buildCreatePracticePrefillHref, parseCreatePracticePrefill } from '../src/engine/createPracticePrefill';

const source = (path: string) => readFileSync(path, 'utf8');
const invalid = (query: string) => assert.equal(parseCreatePracticePrefill(query), undefined, query);

export const tests = [
  test('skill-only prefill selects the type with its normal registry default', () => {
    const mult = parseCreatePracticePrefill('skill=multiplication-facts');
    assert.deepEqual(mult, { practiceType: 'multiplication-facts', skillOptions: { facts: Array.from({ length: 12 }, (_, i) => i + 1) }, mode: 'untimed', durationSeconds: 60, questionCount: 20 });
    const div = parseCreatePracticePrefill('skill=division-facts');
    assert.deepEqual(div?.skillOptions, { divisors: Array.from({ length: 12 }, (_, i) => i + 1) });
    const empty = parseCreatePracticePrefill('skill=addition-1-digit');
    assert.deepEqual(empty, { practiceType: 'addition-1-digit', skillOptions: {}, mode: 'untimed', durationSeconds: 60, questionCount: 20 });
  }),
  test('single and subset fact/divisor prefill normalize to ascending arrays', () => {
    assert.deepEqual(parseCreatePracticePrefill('skill=multiplication-facts&facts=6')?.skillOptions, { facts: [6] });
    assert.deepEqual(parseCreatePracticePrefill('skill=multiplication-facts&facts=8,6,7')?.skillOptions, { facts: [6, 7, 8] });
    assert.deepEqual(parseCreatePracticePrefill('skill=division-facts&divisors=7')?.skillOptions, { divisors: [7] });
    assert.deepEqual(parseCreatePracticePrefill('skill=division-facts&divisors=9,3,6')?.skillOptions, { divisors: [3, 6, 9] });
    assert.deepEqual(parseCreatePracticePrefill('skill=multiplication-facts&facts=1,2,3,4,5,6,7,8,9,10,11,12')?.skillOptions, { facts: Array.from({ length: 12 }, (_, i) => i + 1) });
  }),
  test('session settings stay at normal creator defaults regardless of prefill', () => {
    const prefilled = parseCreatePracticePrefill('skill=multiplication-facts&facts=6')!;
    assert.equal(prefilled.mode, 'untimed');
    assert.equal(prefilled.durationSeconds, 60);
    assert.equal(prefilled.questionCount, 20);
  }),
  test('unknown or unsupported skill falls back to no prefill', () => {
    invalid('skill=not-real');
    invalid('skill=not-real&facts=6');
    invalid('');
  }),
  test('wrong skill-specific parameter fails the prefill as a unit', () => {
    invalid('skill=multiplication-facts&divisors=6');
    invalid('skill=division-facts&facts=7');
    invalid('skill=addition-1-digit&facts=6');
  }),
  test('out-of-range, duplicate, and malformed selections fail as a unit', () => {
    invalid('skill=multiplication-facts&facts=0');
    invalid('skill=multiplication-facts&facts=13');
    invalid('skill=multiplication-facts&facts=6,6');
    invalid('skill=multiplication-facts&facts=');
    invalid('skill=multiplication-facts&facts=6,,7');
    invalid('skill=multiplication-facts&facts=6,+7');
    invalid('skill=multiplication-facts&facts=6,7.0');
    invalid('skill=multiplication-facts&facts=-6');
  }),
  test('unknown parameters reject the whole prefill rather than partially applying', () => {
    invalid('skill=multiplication-facts&facts=6&foo=bar');
    invalid('skill=multiplication-facts&facts=6&mode=timed');
    invalid('skill=multiplication-facts&facts=6&v=2');
  }),
  test('no version parameter is required or accepted', () => {
    assert.deepEqual(parseCreatePracticePrefill('skill=multiplication-facts&facts=6')?.skillOptions, { facts: [6] });
    invalid('v=1&skill=multiplication-facts&facts=6');
  }),
  test('a valid prefill always derives a valid /practice/ URL with facts/divisors carried through', () => {
    const mult = deriveCreatePractice(parseCreatePracticePrefill('skill=multiplication-facts&facts=6')!);
    assert.equal(mult.success, true);
    assert.ok(mult.success && mult.relativeUrl.includes('skill=multiplication-facts') && mult.relativeUrl.includes('facts=6'));
    const div = deriveCreatePractice(parseCreatePracticePrefill('skill=division-facts&divisors=3,6,9')!);
    assert.equal(div.success, true);
    assert.ok(div.success && div.relativeUrl.includes('divisors=3,6,9'));
  }),
  test('invalid prefill leaves the builder in its normal blank state, not a partial one', () => {
    assert.equal(parseCreatePracticePrefill('skill=multiplication-facts&facts=13'), undefined);
    assert.equal(deriveCreatePractice({ skillOptions: {}, mode: 'untimed', durationSeconds: 60, questionCount: 20 }).success, false);
  }),
  test('buildCreatePracticePrefillHref produces the exact contextual hrefs used on leaf pages', () => {
    assert.equal(buildCreatePracticePrefillHref('multiplication-facts', [6]), '/create/?skill=multiplication-facts&facts=6');
    assert.equal(buildCreatePracticePrefillHref('division-facts', [7]), '/create/?skill=division-facts&divisors=7');
    const href6 = buildCreatePracticePrefillHref('multiplication-facts', [6]);
    assert.deepEqual(parseCreatePracticePrefill(href6.split('?')[1])?.skillOptions, { facts: [6] });
  }),
  test('Times Table and Divide By leaf pages link to the prefilled creator via the shared helper, not a hand-written query', () => {
    const table = source('src/pages/multiplication/times-tables/[table].astro');
    assert.ok(table.includes("buildCreatePracticePrefillHref('multiplication-facts', [tableNumber])"));
    assert.ok(table.includes('Create Custom Practice'));
    const divideBy = source('src/pages/division/divide-by/[divisor].astro');
    assert.ok(divideBy.includes("buildCreatePracticePrefillHref('division-facts', [divisor])"));
    assert.ok(divideBy.includes('Create Custom Practice'));
  }),
  test('prefill initialization builds state directly and never calls chooseType or fires analytics', () => {
    const builder = source('src/components/CreatePracticeBuilder.tsx');
    const initializerStart = builder.indexOf('function initialCreatePracticeState');
    const initializerEnd = builder.indexOf('\n}', initializerStart);
    const initializer = builder.slice(initializerStart, initializerEnd);
    assert.ok(initializer.includes('parseCreatePracticePrefill'));
    assert.equal(initializer.includes('trackCreatePracticeEvent'), false);
    assert.equal(initializer.includes('chooseType'), false);
    assert.ok(builder.includes('useState<CreatePracticeState>(initialCreatePracticeState)'));
  }),
  test('/create/ page never reads the query string server-side, keeping one canonical static page', () => {
    const createPage = source('src/pages/create.astro');
    assert.equal(createPage.includes('Astro.url.searchParams'), false);
    assert.ok(createPage.includes("canonical={`${SITE_URL}/create/`}"));
  }),
];
