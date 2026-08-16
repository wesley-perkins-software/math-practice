import type { GeneratedPracticeEntry } from './types';

/**
 * Divide-by fact bank (Phase 1B, pilot scope only).
 *
 * Per docs/seo/CANONICAL_GENERATED_PAGE_STANDARD.md's Phase 1B ("Author
 * divideBy.ts (12 entries), following the same interface and review process
 * as Phase 1A"), the full family is 12 entries. This pilot authors only the
 * divisor-6 entry, to match the scope of the MathPracticeOnline content pilot
 * on /division/divide-by/6/ (see that task's instructions: "do not propagate
 * the pilot to divisors 1–12 yet"). The remaining 11 entries are intentionally
 * deferred to a future Phase 1B completion pass, not stubbed out here.
 *
 * Same content-integrity rules as timesTables.ts apply: every numeric example
 * below was recalculated, and no unsupported difficulty/curriculum claim is
 * made.
 */

export const DIVIDE_BY_GRADE_DEFAULT =
  'Division facts are typically introduced in Grade 3 alongside their matching multiplication fact family, with fluent recall expected by the end of the year.';

export const DIVIDE_BY_FACTS: GeneratedPracticeEntry[] = [
  {
    n: 6,
    quickAnswerFact:
      'Every divide-by-6 fact reverses a 6 times table fact (48÷6=8 because 6×8=48), and because 6=2×3, any divide-by-6 problem can also be solved in two easier steps: divide by 2, then by 3.',
    introClause:
      'because 6 is the product of 2 and 3, a divide-by-6 fact that is not yet automatic can always be split into an easier divide-by-2 step and a divide-by-3 step, in addition to the direct multiplication-fact recall this practice builds',
    strategyTitle: 'Ask "6 Times What?" — or Split Into ÷2 Then ÷3',
    strategyExplanation:
      'The fastest method is to think in reverse: 48÷6 asks "6 times what equals 48?" Recalling 6×8=48 gives the answer directly. When a fact is not yet automatic, use 6=2×3 instead: divide by 2 first, then by 3 (or the reverse order). For 48÷6: 48÷2=24, then 24÷3=8 — the same answer, reached in two smaller steps.',
    parentTeacherNote:
      'If a student knows 6×7=42 from times-table practice but hesitates on 42÷6, the gap is usually retrieval direction, not the fact itself — this page targets exactly that gap. For a student who freezes on a ÷6 fact but can handle ÷2 and ÷3 separately, teach the split method (halve, then divide by 3) as a fallback while direct recall catches up; it is mathematically exact, not an estimate.',
    faqDifferentiator: {
      question: 'Can a divide by 6 answer be checked using division by smaller numbers?',
      answer:
        'Yes — because 6=2×3, any divide-by-6 problem can be split into a divide-by-2 step and a divide-by-3 step, in either order. For 42÷6: dividing by 2 first gives 21, then dividing 21 by 3 gives 7. This works because 42÷6 = 42÷(2×3) = (42÷2)÷3, matching the direct answer 42÷6=7.',
    },
  },
];

/**
 * Look up a single divisor's fact entry. Returns undefined for divisors not
 * yet authored (currently only n=6 is present — see the module note above).
 */
export function getDivideByFact(n: number): GeneratedPracticeEntry | undefined {
  return DIVIDE_BY_FACTS.find((entry) => entry.n === n);
}

/**
 * Lightweight, dependency-free validation for whatever entries are present in
 * this pilot-scope fact bank. Unlike timesTables.ts's validator, this does
 * NOT require exactly 12 entries — only the entries that exist are checked
 * for well-formedness, since the family is intentionally partial until a
 * future Phase 1B completion pass authors the remaining divisors.
 */
export function validateDivideByFacts(
  entries: GeneratedPracticeEntry[] = DIVIDE_BY_FACTS,
): string[] {
  const errors: string[] = [];

  const seenN = new Set<number>();
  const seenQuickAnswer = new Set<string>();
  const seenFaqQuestion = new Set<string>();

  for (const entry of entries) {
    if (!Number.isInteger(entry.n) || entry.n < 1 || entry.n > 12) {
      errors.push(`Entry has an invalid n: ${entry.n}`);
    }
    if (seenN.has(entry.n)) {
      errors.push(`Duplicate n found: ${entry.n}`);
    }
    seenN.add(entry.n);

    const requiredFields: [string, string | undefined][] = [
      ['quickAnswerFact', entry.quickAnswerFact],
      ['introClause', entry.introClause],
      ['strategyTitle', entry.strategyTitle],
      ['strategyExplanation', entry.strategyExplanation],
      ['parentTeacherNote', entry.parentTeacherNote],
      ['faqDifferentiator.question', entry.faqDifferentiator?.question],
      ['faqDifferentiator.answer', entry.faqDifferentiator?.answer],
    ];
    for (const [field, value] of requiredFields) {
      if (!value || value.trim().length === 0) {
        errors.push(`n=${entry.n}: missing or empty field "${field}"`);
      }
    }

    if (entry.quickAnswerFact) {
      if (seenQuickAnswer.has(entry.quickAnswerFact)) {
        errors.push(`n=${entry.n}: duplicate quickAnswerFact value`);
      }
      seenQuickAnswer.add(entry.quickAnswerFact);
    }

    if (entry.faqDifferentiator?.question) {
      if (seenFaqQuestion.has(entry.faqDifferentiator.question)) {
        errors.push(`n=${entry.n}: duplicate FAQ question`);
      }
      seenFaqQuestion.add(entry.faqDifferentiator.question);
    }
  }

  return errors;
}

// Allows running this file directly as a standalone validation script without
// integrating it into any page or build step:
//   node --experimental-strip-types src/data/generated-practice/divideBy.ts
if (import.meta.url === `file://${process.argv[1]}`) {
  const errors = validateDivideByFacts();
  if (errors.length > 0) {
    console.error(`Divide-by fact bank validation FAILED (${errors.length} issue(s)):`);
    for (const error of errors) {
      console.error(` - ${error}`);
    }
    process.exit(1);
  }
  console.log(`Divide-by fact bank validation passed: ${DIVIDE_BY_FACTS.length}/12 entries valid (pilot scope).`);
}
