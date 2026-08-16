import type { GeneratedPracticeEntry } from './types';

/**
 * Multiplication times-table fact bank (tables 1–12).
 *
 * This is the operation-specific source of truth used by the mature generated
 * /multiplication/times-tables/[table] pages, per
 * docs/seo/CANONICAL_GENERATED_PAGE_STANDARD.md.
 *
 * Content integrity notes (see docs/seo/CANONICAL_GENERATED_PAGE_STANDARD.md
 * "Anti-thin-content rules" for the full standard this was authored against):
 * - No entry claims a table is "the hardest" or "most commonly missed" —
 *   the pre-existing times-tables/index.astro FAQ makes exactly this kind of
 *   unsupported comparative claim ("The 7s and 8s are typically the hardest
 *   ... the last four tables most students master"). That claim has no
 *   authoritative source in this repository and is flagged, not repeated,
 *   here. See CANONICAL_GENERATED_PAGE_STANDARD.md's Phase 1A notes for the
 *   full list of reconciled/flagged content.
 * - The 7-times-table entry uses five groups plus two more groups rather than
 *   presenting a novelty shortcut — see GeneratedPracticeEntry.strategyExplanation.
 * - Grade guidance follows the family-level default below, with narrow,
 *   hedged overrides only where the existing codebase (or a clearly stated,
 *   defensible rationale) already supports a distinction — see
 *   TIMES_TABLE_GRADE_DEFAULT and the "Grade override rationale" comments
 *   inline below.
 */

/**
 * Family-level default grade guidance, used by any table entry that does not
 * set `gradeOverride`. Deliberately hedged ("typically") rather than a rigid
 * nationwide claim — see docs/seo/CANONICAL_GENERATED_PAGE_STANDARD.md's
 * "Grade guidance" section.
 */
export const TIMES_TABLE_GRADE_DEFAULT =
  'Times tables are typically a core Grade 3 fluency goal, with Grade 4 reinforcing recall alongside multi-digit multiplication.';

export const TIMES_TABLE_FACTS: GeneratedPracticeEntry[] = [
  {
    n: 1,
    quickAnswerFact:
      'Multiplying by 1 leaves the other number unchanged: 1×4=4, 1×9=9, and 1×12=12.',
    introClause:
      'one group of a number is simply that number, so the 1s table is about understanding equal groups rather than learning a new list of answers',
    strategyTitle: 'One Group Is the Same Number',
    strategyExplanation:
      'Think of the first number as the number of equal groups. One group of 7 contains 7, so 1×7=7. The same idea works for every fact in this table: one group of 12 is 12, so 1×12=12.',
    parentTeacherNote:
      'Watch for a child who adds 1 to the other number, such as answering 1×8 with 9. Ask, “If you have one group of 8 objects, how many objects do you have?” This brings the question back to the meaning of multiplication.',
    faqDifferentiator: {
      question: 'Why does the 1 times table need practice if the answer is always the other number?',
      answer:
        'It helps students connect multiplication to equal groups. For example, 1×8 means one group of 8, so the answer is 8. Once that idea is clear, the facts do not need a separate trick.',
    },
    // Grade override rationale: matches the existing GRADE_BADGE distinction already
    // present in [table].astro (tables 1, 2, 5, 10 marked Grade 2–3 vs. the Grade 3–4
    // default for the rest) — preserved here, with hedged language.
    gradeOverride:
      'Often introduced in Grade 2 as an early multiplication concept, with fluency reinforced in Grade 3 alongside the rest of the times tables.',
  },
  {
    n: 2,
    quickAnswerFact:
      'Multiplying by 2 means making two equal groups, or doubling the other number. For example, 2×7 is 7+7=14.',
    introClause:
      'the 2s table connects each multiplication fact to a familiar addition fact and produces the even-number sequence from 2 through 24',
    strategyTitle: 'Think Doubles',
    strategyExplanation:
      'Add the other number to itself. For 2×9, think 9+9=18. You can also count by 2s—2, 4, 6, 8, and so on—to check that every answer is even.',
    parentTeacherNote:
      'If a child counts every object instead of doubling, ask, “What is the number plus itself?” For 2×9, the prompt “What is 9+9?” keeps the two equal groups visible without giving away 18.',
    faqDifferentiator: {
      question: 'Is the 2 times table the same thing as doubling?',
      answer:
        'Yes. Two groups of a number are the same as that number added to itself. For example, 2×11=22 because 11+11=22.',
    },
    gradeOverride:
      'Often introduced in Grade 2 as an early multiplication concept, with fluency reinforced in Grade 3 alongside the rest of the times tables.',
  },
  {
    n: 3,
    quickAnswerFact:
      'Multiplying by 3 means making three equal groups. For example, 3×4 is 4+4+4=12.',
    introClause:
      'each 3s fact can be built with repeated addition or by doubling the other number and adding one more equal group',
    strategyTitle: 'Add One More Group to a Double',
    strategyExplanation:
      'Start with the double, then add the number once more. For 3×8, double 8 to get 16, then add one more 8 to get 24. That makes three equal groups of 8.',
    parentTeacherNote:
      'Watch for a child who doubles twice and gives the 4s answer. Ask them to point to the two groups in the double, then add only one more group. For 3×6, that means 12+6, not 12+12.',
    faqDifferentiator: {
      question: 'What is a quick way to check a 3 times table answer by hand?',
      answer:
        'Double the other number, then add it one more time. For 3×9, double 9 to get 18, then add 9 to get 27. The three groups are 9+9+9.',
    },
  },
  {
    n: 4,
    quickAnswerFact:
      'Multiplying by 4 means making four equal groups. For example, 4×6=24, and you can find it by doubling 6 and then doubling the result.',
    introClause:
      'two clear doubling steps give students a practical way to work out a 4s fact from addition facts they already know',
    strategyTitle: 'Double, Then Double Again',
    strategyExplanation:
      'Double the other number, then double that answer. For 4×7, double 7 to get 14, then double 14 to get 28. Be sure to complete both doubling steps.',
    parentTeacherNote:
      'If an answer matches the 2s fact, the child may have stopped after one double; if it matches the 8s fact, they may have doubled three times. Ask them to say each step aloud: for 4×6, “6 doubled is 12; 12 doubled is 24.”',
    faqDifferentiator: {
      question: 'How is the 4 times table related to the 2 and 8 times tables?',
      answer:
        'The 4s answer is the 2s answer doubled once more. For 4×6, double 6 to get 12, then double 12 to get 24. Doubling 24 once more gives 8×6=48.',
    },
  },
  {
    n: 5,
    quickAnswerFact:
      'Multiplying by 5 means making equal groups of 5. For example, 5×7=35, and this page practices the answers from 5×1=5 through 5×12=60.',
    introClause:
      'the answers follow the count-by-5s sequence and alternate between a last digit of 5 and a last digit of 0',
    strategyTitle: 'Skip-Count by Fives',
    strategyExplanation:
      'Count 5, 10, 15, 20, and continue until you reach the needed group. For 5×9, nine counts land on 45. Use the last digit to check: an odd number of groups ends in 5, while an even number of groups ends in 0.',
    parentTeacherNote:
      'Watch for skipped numbers while counting by 5s. Ask the child to touch or mark one count for each group. If an answer does not end in 0 or 5, prompt them to use the last-digit pattern to check it.',
    faqDifferentiator: {
      question: 'Why do all 5 times table answers end in only two possible digits?',
      answer:
        'As you count by 5s, the last digits alternate: 5, 0, 5, 0. An odd number of groups therefore ends in 5, as in 5×7=35, and an even number of groups ends in 0, as in 5×8=40.',
    },
    gradeOverride:
      'Often introduced in Grade 2 as an early multiplication concept, with fluency reinforced in Grade 3 alongside the rest of the times tables.',
  },
  {
    n: 6,
    quickAnswerFact:
      'A quick way to find any 6 times fact is to start with the matching 5 times fact and add one more group — for example, 6×8 is 5×8=40 plus one more 8, which makes 48.',
    introClause:
      'the 6 times table is often the first one without an easy shortcut like doubling or counting by fives, so showing how every 6 times fact grows out of a 5 times fact already known gives a student something solid to build on',
    strategyTitle: 'Use a 5s Fact, Then Add One More Group',
    strategyExplanation:
      'Every 6 times fact is one 5 times fact plus one more group. For 6×8, start with 5×8=40. Add one more group of 8: 40+8=48. As a check: 6×8 = 5×8 + 8.',
    parentTeacherNote:
      "If a child does 5 times facts quickly but slows down on 6 times facts, they likely haven't linked the two yet — remind them to start with the 5s fact, then add one more group. Once that click happens, the 6s stop feeling like a whole new table to memorize.",
    faqDifferentiator: {
      question: 'Is there a quick way to check a 6 times answer?',
      answer:
        "Yes, for even numbers: when you multiply 6 by an even number, the last digit of the answer matches that number. For example, 6×4=24, 6×6=36, and 6×8=48 — the 4, 6, and 8 show up again at the end. This doesn't work for odd numbers (6×5=30), so use it only as a check for even ones.",
    },
  },
  {
    n: 7,
    quickAnswerFact:
      'Multiplying by 7 means making seven equal groups. This page practices 7×1 through 7×12; for example, 7×8=56.',
    introClause:
      'a 7s fact can be built from a nearby fact a student already knows instead of relying on a special trick',
    strategyTitle: 'Start With Five Groups, Then Add Two',
    strategyExplanation:
      'Use the matching 5s fact, then add two more equal groups. For 7×8, start with 5×8=40. Add 8 twice: 40+8+8=56. Use this as a way to work out an answer when it is not yet known.',
    parentTeacherNote:
      'If a child stops at the 5s answer, ask, “How many more groups do you need to make seven groups?” For 7×6, begin with 5×6=30, then add 6+6 to reach 42.',
    faqDifferentiator: {
      question: 'How can facts from the 5 times table help with the 7 times table?',
      answer:
        'Seven groups are five groups plus two more groups. For 7×9, start with 5×9=45 and add two groups of 9: 45+9+9=63.',
    },
  },
  {
    n: 8,
    quickAnswerFact:
      'Multiplying by 8 means making eight equal groups. This page practices 8×1 through 8×12; for example, 8×6=48.',
    introClause:
      'repeated doubling gives students a concrete way to find an 8s product when they do not recall it yet',
    strategyTitle: 'Double Three Times',
    strategyExplanation:
      'Double the other number, double that answer, then double once more. For 8×6, double 6 to get 12, double 12 to get 24, and double 24 to get 48. This is a useful backup while direct recall is still growing.',
    parentTeacherNote:
      'If a child gives the matching 4s answer, they may have stopped after two doubles. Ask them to say all three steps aloud. For 8×7: 7 doubled is 14, 14 doubled is 28, and 28 doubled is 56.',
    faqDifferentiator: {
      question: 'How many times do you double a number to get its 8 times table answer?',
      answer:
        'Three times. For 8×5, double 5 to get 10, double 10 to get 20, and double 20 to get 40. The three doubling steps make eight equal groups.',
    },
  },
  {
    n: 9,
    quickAnswerFact:
      'Multiplying by 9 means making nine equal groups. This page practices 9×1 through 9×12; for example, 9×7=63.',
    introClause:
      'each 9s fact is one group less than the matching 10s fact, giving students one dependable strategy across the full range',
    strategyTitle: 'Use Ten Groups, Then Subtract One',
    strategyExplanation:
      'Start with ten groups, then subtract one group. For 9×7, find 10×7=70 and subtract one group of 7: 70−7=63. This method works for every fact from 9×1 through 9×12.',
    parentTeacherNote:
      'If a child subtracts 1 instead of one whole group, ask, “What size group must come off?” For 9×8, start with 80 and subtract 8, not 1, to get 72.',
    faqDifferentiator: {
      question: 'What pattern appears in the 9 times table from 9×1 through 9×10?',
      answer:
        'From 9×1=9 through 9×10=90, the tens digit rises while the ones digit falls, and the two digits add to 9. This specific two-digit pattern does not describe 9×11=99 or 9×12=108, so use ten groups minus one group for the full table.',
    },
  },
  {
    n: 10,
    quickAnswerFact:
      'Multiplying by 10 means making ten equal groups. This page practices 10×1 through 10×12; for example, 10×8=80.',
    introClause:
      'the whole-number products in the 10s table follow a clear place-value pattern and have 0 in the ones place',
    strategyTitle: 'Use the Whole-Number Tens Pattern',
    strategyExplanation:
      'Count in groups of ten: 10, 20, 30, and so on. For the whole numbers practiced here, the product has the other number in the tens-and-higher places and 0 in the ones place: 10×3=30, 10×8=80, and 10×12=120.',
    parentTeacherNote:
      'If a child writes 10×12 as 102, ask them to count twelve groups of ten or read 120 as “twelve tens.” This keeps the zero-ending pattern connected to place value.',
    faqDifferentiator: {
      question: 'Why does multiplying by 10 just add a zero?',
      answer:
        'For the whole-number facts on this page, multiplying by 10 makes the number ten times as large and puts 0 in the ones place. For example, 12 groups of 10 make 120. This is the reason 10×12 can be written as 12 followed by a zero.',
    },
    gradeOverride:
      'Often introduced in Grade 2 as an early multiplication concept, with fluency reinforced in Grade 3 alongside the rest of the times tables.',
  },
  {
    n: 11,
    quickAnswerFact:
      'Multiplying by 11 means making eleven equal groups. This page practices 11×1 through 11×12; for example, 11×7=77.',
    introClause:
      'ten groups plus one more group works for every 11s fact, including the facts beyond the repeated-digit pattern',
    strategyTitle: 'Use Ten Groups, Then Add One',
    strategyExplanation:
      'Start with ten groups, then add one more group. For 11×7, find 10×7=70 and add 7 to get 77. The same method works beyond the single-digit facts: 11×12 is 120+12=132.',
    parentTeacherNote:
      'If a child repeats digits for 11×10, 11×11, or 11×12, remind them that the shortcut only covers multipliers 1 through 9. Prompt “ten groups plus one more” to find 110, 121, or 132 correctly.',
    faqDifferentiator: {
      question: 'Does the repeat-the-digit trick work for the entire 11 times table?',
      answer:
        'No. It works for 11×1 through 11×9, such as 11×7=77. It does not work for 11×10=110, 11×11=121, or 11×12=132. The ten-groups-plus-one strategy works for all twelve facts.',
    },
    // Use the family-level guidance rather than implying a required sequence.
    gradeOverride: TIMES_TABLE_GRADE_DEFAULT,
  },
  {
    n: 12,
    quickAnswerFact:
      'Multiplying by 12 means making twelve equal groups. This page practices 12×1 through 12×12; for example, 12×8=96.',
    introClause:
      'ten groups plus two more groups gives students a concrete way to build every product in the practiced range',
    strategyTitle: 'Use Ten Groups, Then Add Two',
    strategyExplanation:
      'Find ten groups, find two more groups, then add. For 12×8, 10×8=80 and 2×8=16, so 80+16=96. This gives you a way to work out any 12s fact when you need it.',
    parentTeacherNote:
      'If the two partial facts are correct but the final answer is not, check the addition before repeating the multiplication. For 12×9, have the child say 90+18=108 after finding 10×9 and 2×9.',
    faqDifferentiator: {
      question: 'How can the 10 and 2 times tables help with the 12 times table?',
      answer:
        'Twelve groups are ten groups plus two groups. For 12×11, find 10×11=110 and 2×11=22, then add 110+22=132. This method works for every whole-number fact on the page.',
    },
    // No gradeOverride: insufficient justification for table-12-specific curriculum
    // timing guidance beyond the family-level default (see TIMES_TABLE_GRADE_DEFAULT).
  },
];

/**
 * Look up a single table's fact entry. Returns undefined for n outside 1–12.
 */
export function getTimesTableFact(n: number): GeneratedPracticeEntry | undefined {
  return TIMES_TABLE_FACTS.find((entry) => entry.n === n);
}

/**
 * Lightweight, dependency-free validation for the fact bank. Returns an array
 * of human-readable problems (empty if none). Run directly with:
 *
 *   node --experimental-strip-types src/data/generated-practice/timesTables.ts
 *
 * or `npm run validate:times-tables` (see package.json).
 */
export function validateTimesTableFacts(
  entries: GeneratedPracticeEntry[] = TIMES_TABLE_FACTS,
): string[] {
  const errors: string[] = [];

  if (entries.length !== 12) {
    errors.push(`Expected exactly 12 entries, found ${entries.length}.`);
  }

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

  for (let n = 1; n <= 12; n++) {
    if (!seenN.has(n)) {
      errors.push(`Missing entry for n=${n}`);
    }
  }

  return errors;
}

// Allows running this file directly as a standalone validation script without
// integrating it into any page or build step:
//   node --experimental-strip-types src/data/generated-practice/timesTables.ts
if (import.meta.url === `file://${process.argv[1]}`) {
  const errors = validateTimesTableFacts();
  if (errors.length > 0) {
    console.error(`Times-table fact bank validation FAILED (${errors.length} issue(s)):`);
    for (const error of errors) {
      console.error(` - ${error}`);
    }
    process.exit(1);
  }
  console.log('Times-table fact bank validation passed: 12/12 entries valid.');
}
