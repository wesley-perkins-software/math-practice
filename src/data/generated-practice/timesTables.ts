import type { GeneratedPracticeEntry } from './types';

/**
 * Multiplication times-table fact bank (tables 1–12).
 *
 * This is the operation-specific source of truth used by the mature generated
 * /multiplication/times-tables/[table] pages, per
 * docs/seo/CANONICAL_GENERATED_PAGE_STANDARD.md. The shared template still
 * keeps legacy fallbacks for tables that have not completed content rollout.
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
 * - The 7-times-table entry states plainly that no single reliable shortcut
 *   exists, rather than inventing one — see GeneratedPracticeEntry.strategyExplanation.
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
      'The 7 times table has no single reliable shortcut the way the 2s, 5s, or 9s do, but every 7× fact can be checked by flipping it into an already-known fact from another table (7×6=6×7).',
    introClause:
      'being honest that some tables require direct memorization helps set realistic expectations rather than searching for a trick that does not exist',
    strategyTitle: 'Build From a Known Fact — No Single Shortcut',
    strategyExplanation:
      'Rather than one universal trick, break 7×n into a fact you already know plus a small adjustment — for example, 7×8 = (5×8) + (2×8) = 40+16 = 56 — or use commutativity (7×8=8×7) to borrow a strategy from another table. For the handful of facts this doesn\'t simplify well, direct memorization is the most reliable path, and that is a normal, expected part of learning this table.',
    parentTeacherNote:
      "Because there's no single trick for the 7s, repeated exposure and targeted practice matter more here than for tables with a clear rule — prioritize the specific facts a student gets wrong (often 7×6, 7×7, and 7×8) rather than redrilling the whole table evenly.",
    faqDifferentiator: {
      question: 'Why doesn\'t the 7 times table have an easy trick like the 9s or 5s?',
      answer:
        "Unlike 5 (ends in 0 or 5) or 9 (a well-known finger trick), 7 doesn't produce a simple visual or digit pattern across its products — that's a real property of the number, not a gap in available strategies. The most reliable approaches are decomposing into known facts (7×8 = 5×8+2×8 = 56) or direct memorization for the remaining facts.",
    },
  },
  {
    n: 8,
    quickAnswerFact:
      "8×n is the same number doubled three times, connecting the 8 times table directly to both the 2s and 4s tables a student likely already knows.",
    introClause:
      'because 8 is 2 multiplied by itself three times, this entire table can be built from repeated doubling rather than learned as 12 new facts',
    strategyTitle: 'Double Three Times',
    strategyExplanation:
      '8×n = double(double(double(n))). For 8×6: 6→12→24→48. A student who already knows the 4s table (double twice) only needs one more doubling step to reach the 8s.',
    parentTeacherNote:
      "If a student's 8× answer matches the 4× answer for the same number, they likely stopped doubling one step early — this is a specific, identifiable error, not a general recall problem, and naming it directly usually fixes it quickly.",
    faqDifferentiator: {
      question: 'How many times do you double a number to get its 8 times table answer?',
      answer:
        'Three times. For 8×5: double 5 to get 10, double 10 to get 20, and double 20 to get 40. Each doubling step multiplies by 2, and 2×2×2=8, so three doublings always produce the correct 8× answer.',
    },
  },
  {
    n: 9,
    quickAnswerFact:
      'Every 9× fact equals 10×n minus n, and the digits of any 9 times table product always sum to a multiple of 9 — a reliable way to check an answer.',
    introClause:
      'the widely known "finger trick" for the 9s works because of this same 10-minus-n relationship, not as an unrelated shortcut',
    strategyTitle: 'Ten Times, Minus One Group (Plus the Finger Check)',
    strategyExplanation:
      '9×n = 10×n − n. For 9×7: 10×7=70, minus 7 is 63. The familiar finger trick (fold down finger number n on two hands, count fingers left and right for the tens and ones digits) is a physical shortcut for this same relationship for n from 1 to 9, and can be used as a secondary check.',
    parentTeacherNote:
      'The finger trick is a fast physical method, but confirm the student also understands why it works (10×n minus n) — relying on the trick alone can break down when fingers aren\'t available, such as during a timed digital drill.',
    faqDifferentiator: {
      question: 'Does the 9 times table finger trick always work?',
      answer:
        'It works reliably for multipliers 1 through 9 on ten fingers. For example, to find 9×6: fold the 6th finger down, leaving 5 fingers to the left (tens digit) and 4 to the right (ones digit), giving 54. It is a physical shortcut for the same 10×n−n relationship, so it matches direct calculation across that range.',
    },
  },
  {
    n: 10,
    quickAnswerFact:
      'Multiplying any whole number by 10 appends a single zero to it, because multiplying by 10 shifts every digit one place value to the left.',
    introClause:
      'understanding why appending a zero works — place value, not a coincidence — prepares students directly for multiplying by 100 and 1,000 later on',
    strategyTitle: 'Append a Zero (Place-Value Shift)',
    strategyExplanation:
      '10×n adds a 0 to the end of n: 10×8=80, 10×12=120. This works because multiplying by 10 moves every digit one place value higher, not because of a memorized pattern — the same idea extends to ×100 (add two zeros) and beyond.',
    parentTeacherNote:
      "If a student can append a zero for 10×8 but hesitates on 10×12 (a two-digit number), check that they understand the rule applies to the whole number, not only single digits — usually a quick reminder fixes it rather than new instruction.",
    faqDifferentiator: {
      question: 'Why does multiplying by 10 just add a zero?',
      answer:
        'Because our number system is base-10: each place value is 10 times the one to its right. Multiplying by 10 shifts every digit one place to the left, and appending a 0 in the ones place is the visible result of that shift. For example, 10×12=120 because the 1 (tens) becomes hundreds and the 2 (ones) becomes tens.',
    },
    gradeOverride:
      'Often introduced in Grade 2 as an early multiplication concept, with fluency reinforced in Grade 3 alongside the rest of the times tables.',
  },
  {
    n: 11,
    quickAnswerFact:
      'For multipliers 1 through 9, an 11× fact repeats the multiplier\'s digit (11×6=66), but this pattern breaks at 11×10, 11×11, and 11×12, which need to be learned separately.',
    introClause:
      'most of this table follows one of the simplest visual patterns among all the times tables, which makes the three exceptions easy to isolate and target directly',
    strategyTitle: 'Repeat the Digit, Memorize Three Exceptions',
    strategyExplanation:
      '11×n for n=1–9 repeats the digit of n (11×4=44, 11×8=88). The pattern stops working at 11×10=110, 11×11=121, and 11×12=132, which do not follow the repeat-digit shortcut because the multiplier itself has two digits — these three need to be memorized on their own.',
    parentTeacherNote:
      'If a student extends the repeat-digit pattern incorrectly to 11×10, 11×11, or 11×12 (for example, answering 11×11 as "1111"), that is an expected, predictable error at this stage — explicitly flag these three as the exceptions rather than assuming general confusion about the whole table.',
    faqDifferentiator: {
      question: 'Does the repeat-the-digit trick work for the entire 11 times table?',
      answer:
        'No — it works for 11×1 through 11×9 (for example, 11×7=77), but not for 11×10 (110), 11×11 (121), or 11×12 (132). Those three facts don\'t follow the single-digit-repeat pattern because the multiplier has two digits, and are best learned as standalone facts.',
    },
    // Grade override rationale: a narrow, hedged extension consistent with
    // docs/seo/CANONICAL_GENERATED_PAGE_STANDARD.md's own example (11s/12s
    // conventionally introduced slightly later) — not present in the
    // pre-existing GRADE_BADGE map, added here as a defensible, hedged claim.
    gradeOverride:
      'Often reinforced after the 1–10 tables are secure, since the larger 11s facts require students to move beyond the familiar repeated-digit pattern and apply place-value understanding.',
  },
  {
    n: 12,
    quickAnswerFact:
      '12×n splits cleanly into a 10×n fact plus a 2×n fact added together, so it never requires memorizing a fact independent of two tables already known.',
    introClause:
      'as the last table in the standard 1–12 range, the 12s table is a natural checkpoint for combining two earlier strategies — appending a zero and doubling — into one calculation',
    strategyTitle: 'Split Into 10× Plus 2×',
    strategyExplanation:
      '12×n = 10×n + 2×n. For 12×9: 10×9=90, 2×9=18, and 90+18=108. This reuses two already-mastered strategies (append a zero, then double) instead of introducing a new one.',
    parentTeacherNote:
      "If a student can do 10×n and 2×n separately but gets 12×n wrong, the error is almost always in the final addition step, not the multiplication — check the addition specifically before reteaching the multiplication strategy. Getting 12×n right consistently is also a good sign the student can combine two previously separate strategies (the ×10 table and the ×2 table) into one calculation, which is worth naming explicitly as a milestone.",
    faqDifferentiator: {
      question: 'What is the fastest way to calculate a 12 times table fact by hand?',
      answer:
        'Split it into a ×10 fact and a ×2 fact, then add them. For 12×11: 10×11=110, 2×11=22, and 110+22=132. This is exact, not an estimate, because 12=10+2, so 12×n is the sum of those two parts for any n.',
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
