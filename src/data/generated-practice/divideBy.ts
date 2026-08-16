import type { GeneratedPracticeEntry } from './types';

/**
 * Reviewed divide-by fact bank (controlled rollout scope).
 *
 * Per docs/seo/CANONICAL_GENERATED_PAGE_STANDARD.md's Phase 1B ("Author
 * divideBy.ts (12 entries), following the same interface and review process
 * as Phase 1A"), the full family is 12 entries. Entries 1–6 have completed
 * editorial review. The remaining entries are intentionally absent, rather
 * than being filled with generic copy, until their rollout is reviewed.
 *
 * Same content-integrity rules as timesTables.ts apply: every numeric example
 * below was recalculated, and no unsupported difficulty/curriculum claim is
 * made.
 */

export const DIVIDE_BY_GRADE_DEFAULT =
  'Division facts are typically introduced in Grade 3 alongside their matching multiplication fact family, with fluent recall expected by the end of the year.';

export const DIVIDE_BY_FACTS: GeneratedPracticeEntry[] = [
  {
    n: 1,
    quickAnswerFact:
      'Dividing by 1 leaves the number unchanged, so 12÷1=12.',
    introClause:
      'The questions are mixed up, but the same simple idea works every time: one group contains the whole number.',
    strategyTitle: 'Dividing by 1 Keeps the Number the Same',
    strategyExplanation:
      'When a number is split into one group, that group contains everything. For 48÷1, the one group contains all 48, so 48÷1=48. The same is true for 7÷1=7 and 12÷1=12.',
    parentTeacherNote:
      'Watch for a child who answers 1 because the divisor is 1. Ask, "If all 12 items go into one group, how many are in that group?" This brings attention back to the whole number: 12÷1=12.',
    faqDifferentiator: {
      question: 'Why is the answer not always 1 when dividing by 1?',
      answer:
        'The 1 tells how many equal groups there are, not how many items are in the group. If 9 items are placed in one group, that group has all 9 items, so 9÷1=9.',
    },
  },
  {
    n: 2,
    quickAnswerFact:
      'Dividing by 2 means splitting into two equal groups, or finding half; for example, 18÷2=9.',
    introClause:
      'Each problem asks for one of two equal shares, so thinking about half can help when an answer does not come to mind right away.',
    strategyTitle: 'Find Half',
    strategyExplanation:
      'To divide by 2, find half of the number. Half of 14 is 7, so 14÷2=7. You can check with a doubles fact: 7+7=14, which also means 2×7=14. In the same way, half of 24 is 12, so 24÷2=12.',
    parentTeacherNote:
      'If recall is uncertain, ask, "What is half of this number?" A doubles fact can also help: knowing 9+9=18 shows that 18÷2=9. Encourage the child to check that both groups would be equal.',
    faqDifferentiator: {
      question: 'Is dividing by 2 the same as finding half?',
      answer:
        'Yes. Dividing 16 into two equal groups gives 8 in each group, so half of 16 is 8 and 16÷2=8.',
    },
  },
  {
    n: 3,
    quickAnswerFact:
      'Dividing by 3 means splitting a number into three equal groups; for example, 21÷3=7.',
    introClause:
      'A matching 3 times table fact can answer each question, so you can think backward from multiplication whenever you need help.',
    strategyTitle: 'Ask "3 Times What?"',
    strategyExplanation:
      'Turn the division question into a multiplication question. For 21÷3, ask, "3 times what equals 21?" Because 3×7=21, the answer is 7. For 36÷3, the fact 3×12=36 gives the answer 12.',
    parentTeacherNote:
      'When a child pauses, say the question in the multiplication direction: "3 times what equals 24?" If 3×8=24 is known, then 24÷3=8. This prompt helps without giving away the answer.',
    faqDifferentiator: {
      question: 'Which multiplication fact helps with 27 divided by 3?',
      answer:
        'Use 3×9=27. Thinking backward from that multiplication fact shows that 27÷3=9.',
    },
  },
  {
    n: 4,
    quickAnswerFact:
      'Dividing by 4 means splitting a number into four equal groups; for example, 28÷4=7.',
    introClause:
      'A 4 times table fact can give the answer, and halving the number twice offers a useful way to work it out.',
    strategyTitle: 'Halve, Then Halve Again',
    strategyExplanation:
      'Four equal groups can be found by splitting into halves twice. For 28÷4, half of 28 is 14, and half of 14 is 7, so 28÷4=7. For 40÷4, half of 40 is 20 and half of 20 is 10.',
    parentTeacherNote:
      'If a divide-by-4 fact is not remembered, prompt the child to halve the number and then halve the result. For 32÷4, half of 32 is 16 and half of 16 is 8. Check with 4×8=32.',
    faqDifferentiator: {
      question: 'Why does halving twice give the same answer as dividing by 4?',
      answer:
        'The first half splits the number into 2 equal groups, and halving again splits each part in 2, making 4 equal groups. Half of 24 is 12 and half of 12 is 6, so 24÷4=6.',
    },
  },
  {
    n: 5,
    quickAnswerFact:
      'Dividing by 5 means splitting a number into five equal groups; for example, 35÷5=7.',
    introClause:
      'The practiced numbers come from the 5 times table, so their final digit is always 0 or 5 and a matching multiplication fact can help.',
    strategyTitle: 'Use a 5 Times Table Fact',
    strategyExplanation:
      'Ask, "5 times what equals this number?" For 35÷5, 5×7=35, so the answer is 7. If you need help with 45÷5, count by 5s to 45 or remember 5×9=45; either way, the answer is 9.',
    parentTeacherNote:
      'Prompt with the matching multiplication question, such as "5 times what equals 40?" Counting by 5s can help a child reach 8, and 5×8=40 confirms that 40÷5=8.',
    faqDifferentiator: {
      question: 'Why do the numbers in divide-by-5 facts end in 0 or 5?',
      answer:
        'Every number used here is a multiple of 5, and multiples of 5 end in 0 or 5. For example, 30÷5=6 and 45÷5=9.',
    },
  },
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
 * yet authored (currently 1–6 are present — see the module note above).
 */
export function getDivideByFact(n: number): GeneratedPracticeEntry | undefined {
  return DIVIDE_BY_FACTS.find((entry) => entry.n === n);
}

/**
 * Lightweight, dependency-free validation for whatever entries are present in
 * this rollout-scope fact bank. Unlike timesTables.ts's validator, this does
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
  console.log(`Divide-by fact bank validation passed: ${DIVIDE_BY_FACTS.length}/12 reviewed entries valid.`);
}
