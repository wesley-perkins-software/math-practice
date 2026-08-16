/**
 * Standalone validation for the 2-digit subtraction-with-regrouping generator
 * (`SUBTRACTION_2_DIGIT_BORROWING`, page-labeled "2-Digit Subtraction With
 * Regrouping"). Mirrors generator.regrouping.test.ts's approach for
 * addition. Run directly, no test framework required:
 *   node --experimental-strip-types src/engine/generator.regrouping-subtraction.test.ts
 *
 * Covers:
 * - Every problem generated for the borrowing/regrouping preset requires a
 *   ones-to-tens regroup (borrow), since both operand ranges are strictly
 *   2-digit (no hundreds column exists to produce a borrow elsewhere).
 * - The no-borrowing preset never requires regrouping in any column, and
 *   always keeps operandA >= operandB.
 */

import { generateProblem } from './generator.ts';
import { SUBTRACTION_2_DIGIT, SUBTRACTION_2_DIGIT_BORROWING } from './presets.ts';

const SAMPLE_SIZE = 2000;
const errors: string[] = [];

function onesDigit(n: number): number {
  return n % 10;
}

// ─── Borrowing/regrouping preset: every problem must require a regroup ────

for (let i = 0; i < SAMPLE_SIZE; i++) {
  const problem = generateProblem(SUBTRACTION_2_DIGIT_BORROWING);
  if (problem.operandA < problem.operandB) {
    errors.push(
      `SUBTRACTION_2_DIGIT_BORROWING produced ${problem.operandA} - ${problem.operandB}, which is negative.`
    );
  }
  const requiresRegroup = onesDigit(problem.operandA) < onesDigit(problem.operandB);
  if (!requiresRegroup) {
    errors.push(
      `SUBTRACTION_2_DIGIT_BORROWING produced ${problem.operandA} - ${problem.operandB}, ` +
        `whose ones digits (${onesDigit(problem.operandA)} vs ${onesDigit(problem.operandB)}) ` +
        `do not require regrouping.`
    );
  }
}

// ─── No-borrowing preset: must never require regrouping, and A >= B ───────

for (let i = 0; i < SAMPLE_SIZE; i++) {
  const problem = generateProblem(SUBTRACTION_2_DIGIT);
  if (problem.operandA < problem.operandB) {
    errors.push(
      `SUBTRACTION_2_DIGIT produced ${problem.operandA} - ${problem.operandB}, which is negative.`
    );
  }
  const requiresRegroup = onesDigit(problem.operandA) < onesDigit(problem.operandB);
  if (requiresRegroup) {
    errors.push(
      `SUBTRACTION_2_DIGIT produced ${problem.operandA} - ${problem.operandB}, whose ones digits ` +
        `(${onesDigit(problem.operandA)} vs ${onesDigit(problem.operandB)}) require regrouping.`
    );
  }
}

if (errors.length > 0) {
  console.error(`Subtraction regrouping generator validation FAILED (${errors.length} issue(s)):`);
  for (const error of errors.slice(0, 20)) {
    console.error(` - ${error}`);
  }
  process.exit(1);
}

console.log(
  `Subtraction regrouping generator validation passed: ${SAMPLE_SIZE} samples each for ` +
    `SUBTRACTION_2_DIGIT_BORROWING (ones-to-tens regrouping required) and SUBTRACTION_2_DIGIT ` +
    `(no regrouping, A >= B).`
);
