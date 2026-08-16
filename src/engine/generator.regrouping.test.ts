/**
 * Standalone validation for the 2-digit addition-with-regrouping generator
 * (`ADDITION_2_DIGIT_CARRYING`, page-labeled "2-Digit Addition with
 * Carrying"). Run directly, no test framework required:
 *   node --experimental-strip-types src/engine/generator.regrouping.test.ts
 *
 * Covers:
 * - Every problem generated for the carrying/regrouping preset requires
 *   ones-to-tens regrouping (onesDigitA + onesDigitB >= 10), not merely a
 *   carry somewhere in the sum (e.g. 93 + 94, which only regroups
 *   tens-to-hundreds).
 * - The no-carrying preset still never requires regrouping in any column.
 */

import { generateProblem } from './generator.ts';
import { ADDITION_2_DIGIT, ADDITION_2_DIGIT_CARRYING } from './presets.ts';

const SAMPLE_SIZE = 2000;
const errors: string[] = [];

function onesDigit(n: number): number {
  return n % 10;
}

function tensDigit(n: number): number {
  return Math.floor(n / 10) % 10;
}

// ─── Carrying/regrouping preset: every problem must regroup ones into tens ─

for (let i = 0; i < SAMPLE_SIZE; i++) {
  const problem = generateProblem(ADDITION_2_DIGIT_CARRYING);
  const onesSum = onesDigit(problem.operandA) + onesDigit(problem.operandB);
  if (onesSum < 10) {
    errors.push(
      `ADDITION_2_DIGIT_CARRYING produced ${problem.operandA} + ${problem.operandB}, ` +
        `whose ones digits (${onesDigit(problem.operandA)} + ${onesDigit(problem.operandB)} = ${onesSum}) ` +
        `do not require regrouping.`
    );
  }
}

// The classic non-example from the bug report must never be reachable.
{
  let sawNonExample = false;
  for (let i = 0; i < SAMPLE_SIZE; i++) {
    const problem = generateProblem(ADDITION_2_DIGIT_CARRYING);
    if (
      (problem.operandA === 93 && problem.operandB === 94) ||
      (problem.operandA === 94 && problem.operandB === 93)
    ) {
      sawNonExample = true;
    }
  }
  if (sawNonExample) {
    errors.push('ADDITION_2_DIGIT_CARRYING generated 93 + 94, which requires no ones-to-tens regrouping.');
  }
}

// ─── No-carrying preset: must never require regrouping in any column ──────

for (let i = 0; i < SAMPLE_SIZE; i++) {
  const problem = generateProblem(ADDITION_2_DIGIT);
  const onesSum = onesDigit(problem.operandA) + onesDigit(problem.operandB);
  const tensSum = tensDigit(problem.operandA) + tensDigit(problem.operandB);
  if (onesSum >= 10) {
    errors.push(
      `ADDITION_2_DIGIT produced ${problem.operandA} + ${problem.operandB}, whose ones digits sum to ${onesSum} (>= 10).`
    );
  }
  if (tensSum >= 10) {
    errors.push(
      `ADDITION_2_DIGIT produced ${problem.operandA} + ${problem.operandB}, whose tens digits sum to ${tensSum} (>= 10).`
    );
  }
}

if (errors.length > 0) {
  console.error(`Regrouping generator validation FAILED (${errors.length} issue(s)):`);
  for (const error of errors.slice(0, 20)) {
    console.error(` - ${error}`);
  }
  process.exit(1);
}

console.log(
  `Regrouping generator validation passed: ${SAMPLE_SIZE} samples each for ADDITION_2_DIGIT_CARRYING (ones-to-tens regrouping required) and ADDITION_2_DIGIT (no regrouping in any column).`
);
