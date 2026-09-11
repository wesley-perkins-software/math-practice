import type { DailyReviewGradeId } from '@/engine/dailyReview';

export interface DailyReviewGradePage {
  slug: string;
  gradeId: DailyReviewGradeId;
  label: string;
  educationalLevel: string;
  intro: string;
  practices: string;
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
    intro: 'A new 10-question arithmetic warm-up every day.',
    practices: 'Practice 10 early addition and subtraction problems using numbers to 10.',
  },
  {
    slug: '1st-grade',
    gradeId: 'g1',
    label: '1st Grade',
    educationalLevel: 'Grade 1',
    intro: 'A new 10-question arithmetic warm-up every day.',
    practices: 'Today\'s set practices addition and subtraction facts within 20.',
    practicePageHref: '/1st-grade-math-practice/',
  },
  {
    slug: '2nd-grade',
    gradeId: 'g2',
    label: '2nd Grade',
    educationalLevel: 'Grade 2',
    intro: 'A new 10-question arithmetic warm-up every day.',
    practices: 'Today\'s set practices two-digit addition and subtraction.',
    practicePageHref: '/2nd-grade-math-practice/',
  },
  {
    slug: '3rd-grade',
    gradeId: 'g3',
    label: '3rd Grade',
    educationalLevel: 'Grade 3',
    intro: 'A new 10-question arithmetic warm-up every day.',
    practices: 'Today\'s set mixes two-digit addition and subtraction with multiplication and division facts.',
    practicePageHref: '/3rd-grade-math-practice/',
  },
  {
    slug: '4th-grade',
    gradeId: 'g4',
    label: '4th Grade',
    educationalLevel: 'Grade 4',
    intro: 'A new 10-question arithmetic warm-up every day.',
    practices: 'Today\'s set weights heavily toward multiplication and division facts fluency, alongside two-digit addition and subtraction.',
    practicePageHref: '/4th-grade-math-practice/',
  },
  {
    slug: '5th-grade',
    gradeId: 'g5',
    label: '5th Grade',
    educationalLevel: 'Grade 5',
    intro: 'A new 10-question arithmetic warm-up every day.',
    practices: 'Today\'s set mixes arithmetic, harder multiplication facts, and division with remainders.',
    practicePageHref: '/5th-grade-math-practice/',
  },
];
