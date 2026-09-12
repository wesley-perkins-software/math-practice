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

  test('long division notation and structure are unchanged (divisor, bracketed dividend, quotient+remainder)', () => {
    assert.ok(source.includes('long-division-divisor'));
    assert.ok(source.includes('long-division-dividend'));
    assert.ok(source.includes('R{problem.remainder}'));
  }),

  test('answer keys reuse the same WorksheetProblem/LongDivisionProblem renderers as blank worksheets (no duplicated markup)', () => {
    assert.equal((source.match(/function LongDivisionProblem/g) ?? []).length, 1);
    assert.equal((source.match(/function WorksheetProblem/g) ?? []).length, 1);
    assert.ok(source.includes('showAnswer'));
  }),
];
