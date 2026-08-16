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
      'Each answer matches a 6 times table fact — for example, 48÷6=8 because 6×8=48.',
    introClause:
      'divide-by-6 practice uses the same 12 facts as the 6 times table, just asked the other way around, so a fact that does not come to mind right away can always be worked out from the 6 times table or by dividing in two smaller steps',
    strategyTitle: 'Ask "6 Times What?" — or Split Into ÷2 Then ÷3',
    strategyExplanation:
      'Think in reverse: 48÷6 is asking "6 times what equals 48?" If you remember 6×8=48, you have your answer right away. If a fact doesn\'t come to mind, try splitting it instead, since 6=2×3: divide by 2 first, then by 3 (or the other way around). For 48÷6: 48÷2=24, then 24÷3=8 — same answer, in two easier steps.',
    parentTeacherNote:
      'Ask "6 times what equals ___" before showing the division problem — most kids find the multiplication direction easier, and connecting the two is what makes both stick. If a fact still doesn\'t come, splitting it into ÷2 then ÷3 (see the strategy above) is a solid fallback. Once ÷6 feels comfortable, try another divisor or switch to mixed division facts — whichever feels useful next.',
    faqDifferentiator: {
      question: 'Why does splitting into ÷2 and ÷3 work for divide by 6, but not for divide by 7?',
      answer:
        "Because 6 is a composite number — it's 2×3 — while 7 is prime and can't be split into smaller whole-number factors. That's why the divide-by-2-then-÷3 shortcut works for divide by 6 (and other composite divisors, like 8, 9, or 12), but there's no similar shortcut for divide by 7.",
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
