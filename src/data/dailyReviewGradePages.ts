import type { DailyReviewGradeId } from '@/engine/dailyReview';

export interface DailyReviewGradePage {
  slug: string;
  gradeId: DailyReviewGradeId;
  label: string;
  educationalLevel: string;
  /** One-line, grade-specific, answer-first sentence rendered immediately above PracticeWidget. */
  intro: string;
  /** Compact paragraph rendered immediately below PracticeWidget — adds the daily-consistency behavior and, where relevant, a scope note; never repeats the intro verbatim. */
  explanation: string;
  practicePageHref?: string;
}

/**
 * Route-level metadata for the six Daily Review grade pages
 * (/daily-review/{slug}/). Kept as a plain module-level export, not defined
 * inline in [grade].astro's frontmatter, because Astro's getStaticPaths runs
 * in an isolated scope that cannot see other frontmatter-local consts.
 */
export const DAILY_REVIEW_GRADE_PAGES: DailyReviewGradePage[] = [
  {
    slug: 'kindergarten',
    gradeId: 'k',
    label: 'Kindergarten',
    educationalLevel: 'Kindergarten',
    intro: 'Practice 10 early addition and subtraction problems using numbers up to 10.',
    explanation: 'Today\'s Kindergarten set stays the same all day and changes tomorrow. Daily Review focuses on early arithmetic practice, not full Kindergarten curriculum coverage.',
  },
  {
    slug: '1st-grade',
    gradeId: 'g1',
    label: '1st Grade',
    educationalLevel: 'Grade 1',
    intro: 'Practice 10 addition and subtraction problems within 20.',
    explanation: 'Today\'s 1st Grade set stays the same all day and changes tomorrow. Daily Review is an arithmetic warm-up, not full 1st Grade curriculum coverage.',
    practicePageHref: '/1st-grade-math-practice/',
  },
  {
    slug: '2nd-grade',
    gradeId: 'g2',
    label: '2nd Grade',
    educationalLevel: 'Grade 2',
    intro: 'Practice 10 two-digit addition and subtraction problems.',
    explanation: 'Today\'s 2nd Grade set stays the same all day and changes tomorrow — a quick warm-up in two-digit addition and subtraction.',
    practicePageHref: '/2nd-grade-math-practice/',
  },
  {
    slug: '3rd-grade',
    gradeId: 'g3',
    label: '3rd Grade',
    educationalLevel: 'Grade 3',
    intro: 'Practice 10 addition, subtraction, multiplication, and division problems.',
    explanation: 'Today\'s 3rd Grade set stays the same all day and changes tomorrow, mixing two-digit addition and subtraction with multiplication and division facts.',
    practicePageHref: '/3rd-grade-math-practice/',
  },
  {
    slug: '4th-grade',
    gradeId: 'g4',
    label: '4th Grade',
    educationalLevel: 'Grade 4',
    intro: 'Practice 10 arithmetic problems weighted toward multiplication and division facts.',
    explanation: 'Today\'s 4th Grade set stays the same all day and changes tomorrow, leaning heavily on multiplication and division facts fluency alongside two-digit addition and subtraction.',
    practicePageHref: '/4th-grade-math-practice/',
  },
  {
    slug: '5th-grade',
    gradeId: 'g5',
    label: '5th Grade',
    educationalLevel: 'Grade 5',
    intro: 'Practice 10 mixed arithmetic problems, including division with remainders.',
    explanation: 'Today\'s 5th Grade set stays the same all day and changes tomorrow, mixing arithmetic, harder multiplication facts, and division with remainders.',
    practicePageHref: '/5th-grade-math-practice/',
  },
];
