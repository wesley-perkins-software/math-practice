import { readFileSync } from 'node:fs';
import { assert, test } from './harness';

const source = readFileSync('src/components/WorksheetGenerator.tsx', 'utf8');
const globalCss = readFileSync('src/styles/global.css', 'utf8');

export const tests = [
  test('worksheet digits use the site brand sans stack with tabular numerals, not the legacy monospace font', () => {
    assert.equal(source.includes('font-mono'), false, 'WorksheetGenerator should no longer reference font-mono');
    // Every digit-bearing element (operand rows, answer, long division divisor/dividend/answer) should be font-sans + tabular-nums.
    const digitMatches = source.match(/className="[^"]*worksheet-digits[^"]*"/g) ?? [];
    assert.ok(digitMatches.length >= 3, 'expected operandA, operator/operandB, and answer rows to carry the worksheet-digits hook');
    for (const cls of digitMatches) {
      assert.ok(cls.includes('font-sans'), `${cls} should use font-sans`);
      assert.ok(cls.includes('tabular-nums'), `${cls} should use tabular-nums for aligned digit widths`);
    }
    assert.ok(source.includes('long-division-figure inline-flex items-end font-sans'), 'long division figure should also use the sans stack');
  }),

  test('print CSS targets the worksheet-digits hook instead of the removed font-mono class', () => {
    assert.ok(globalCss.includes('.worksheet-problem .worksheet-digits {'), 'print rule should hook off worksheet-digits');
    assert.equal(globalCss.includes('.worksheet-problem .font-mono {'), false);
  }),

  test('long-division bracket sizing still keys off --dividend-digits, unaffected by the font change', () => {
    assert.ok(globalCss.includes('min-width: calc(var(--dividend-digits, 2) * 1ch + 6mm) !important;'));
  }),

  test('the division-bracket figure (divisor, bracketed dividend, quotient+remainder) is unchanged in structure', () => {
    assert.ok(source.includes('long-division-divisor'));
    assert.ok(source.includes('long-division-dividend'));
    assert.ok(source.includes('R{problem.remainder}'));
  }),

  test('answer keys reuse the same WorksheetProblem/DivisionProblem renderers as blank worksheets (no duplicated markup)', () => {
    assert.equal((source.match(/function DivisionProblem/g) ?? []).length, 1);
    assert.equal((source.match(/function WorksheetProblem/g) ?? []).length, 1);
    assert.ok(source.includes('showAnswer'));
  }),

  test('every division worksheet problem — basic facts included, not just with-remainder — routes through the division-bracket renderer', () => {
    assert.ok(source.includes("if (problem.operation === 'division')"), 'dispatch must key off the operation, not just remainder presence, so exact facts get the bracket too');
    assert.ok(source.includes('return <DivisionProblem problem={problem} showAnswer={showAnswer} />;'));
    assert.equal(source.includes("if (problem.remainder !== undefined) {\n    return <DivisionProblem"), false, 'must not still gate the bracket renderer on remainder presence alone');
  }),

  test('the remainder badge only renders for actual with-remainder problems, and its own class carries the smaller print size (not a fragile :last-child selector)', () => {
    assert.ok(source.includes('{hasRemainder && <span className="long-division-remainder'), 'basic facts (no remainder) must not render an "R" badge');
    assert.ok(globalCss.includes('.long-division-answer .long-division-remainder {'));
    assert.equal(globalCss.includes('.long-division-answer span:last-child {'), false, ':last-child would wrongly shrink a remainder-less quotient, which is now the only child');
  }),

  test('basic division facts no longer render through the generic stacked WorksheetProblem path with a visible ÷ operator', () => {
    // The generic stacked layout (OP_SYMBOL, "×"/"−"/"+"/"÷" operator span) is reached only
    // for addition/subtraction/multiplication now that division always early-returns above it.
    const dispatchIdx = source.indexOf("if (problem.operation === 'division')");
    const symbolIdx = source.indexOf('const symbol = OP_SYMBOL[problem.operation]');
    assert.ok(dispatchIdx > -1 && symbolIdx > -1 && dispatchIdx < symbolIdx, 'division must be routed away before the shared stacked-operator markup is reached');
  }),

  test('the division-bracket print sizing applies to any division config (facts or remainders), not only withRemainder', () => {
    assert.ok(source.includes("selectedConfig?.operation === 'division'"));
    assert.equal(source.includes('Boolean(selectedConfig?.withRemainder)'), false, 'basic division facts must also get the bracket print-sizing class, not just remainder configs');
  }),
];
