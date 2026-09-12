# Fractions Architecture (Prototype)

## Why a separate domain

Fractions is deliberately **not** an extension of the arithmetic `Operation`/
`Problem` types in `src/engine/types.ts`. Those types are flat and
scalar-numeric (`operandA/operandB: number`, `correctAnswer: number`), and
`Operation` is consumed by an exhaustive switch in `generator.ts` and by
several hardcoded arrays in `ProgressDashboard.tsx`. Widening either would
risk every one of those call sites for a domain (rational values, multiple
valid representations) that doesn't fit a scalar-equality model anyway.

Instead, Fractions has its own parallel type/module tree under
`src/engine/fractions/`, and its own runtime component
(`FractionPracticeWidget`) rather than an extension of `PracticeWidget`
(whose `handleAnswer(answer: number, remainder?: number)` -> `scoreAnswer`
pipeline is hard-typed to scalar numeric answers with no render seam for a
fraction bar or two-field input).

## What's reused, unchanged, from the existing runtime

- `session.ts` — the accept/feedback/completion state machine
  (`startPracticeSession`, `recordCompletedQuestion`, `finishAnswerFeedback`)
  is answer-shape-agnostic and used as-is.
- `storage.ts` — `PageStats`/`SessionLogEntry` are keyed by an opaque
  `storageKey` string and contain only counters; new fraction storage keys
  are purely additive, no migration.
- `ScoreCard` — renders only `correct`/`total`/`score`, reused unchanged.
- `NumberPad` — reused unchanged for digit entry.
- `random.ts` (`RandomSource`, `createSeededRandom`) — domain-agnostic,
  reused unchanged for fraction generation.

## What's new

- `src/engine/fractions/types.ts` — `Fraction`, `FractionProblem`,
  `FractionAnswerPolicy` (`FIXED_DENOMINATOR_REQUIRED`,
  `SIMPLEST_FORM_REQUIRED`, `EQUIVALENT_VALUE_ACCEPTED`, `EXACT_MATCH`; only
  the first two are exercised by the prototype's two skills).
- `src/engine/fractions/math.ts` — exact integer rational math (`reduce`,
  `equals`, `compare`, `gcd`). No floating-point division anywhere.
- `src/engine/fractions/validation.ts` — single source of truth for grading
  a submitted fraction against a policy.
- `src/engine/fractions/generator.ts` — seeded, deterministic generation for
  Equivalent Fractions and Simplifying Fractions, with its own
  `FractionGenerationHistory` (a canonical reduced-value key, not the
  arithmetic `RecentProblem` shape).
- `src/engine/fractions/visual.ts` — pure logic (partition/shading,
  accessible label wording) behind `FractionBar`, kept out of the `.tsx`
  file so it's unit-testable without a component-rendering framework (this
  repo's test harness runs plain `.ts` modules through Node, not a DOM).
- `src/components/FractionBar.tsx` — the only V1 visual model: an inline
  SVG horizontal bar, 2–12 partitions, fill vs. no-fill (not hue) for
  grayscale-safe shading.
- `src/components/FractionInput.tsx` — stacked numerator/denominator input,
  modeled on `RemainderProblemInput`'s two-slot pattern (the closest
  existing precedent — no shared `AnswerInput` interface exists to
  implement instead). A denominator of `0` is blocked at the digit-entry
  level (a leading zero can never be typed), not filtered at submit time;
  numerator `0` is a valid, submittable value.
- `src/components/FractionPracticeWidget.tsx` — the fractions-specific
  runner described above.

## Prototype scope

Two skills only: Equivalent Fractions (fixed target denominator, editable
numerator only) and Simplifying Fractions (both fields editable, simplest
form required). Routes live at `/fractions/prototype-equivalent/` and
`/fractions/prototype-simplify/` — `noindex`'d, excluded from the sitemap,
and not linked from any public surface (nav, homepage, grade pages,
InternalLinks). See the repo's Fractions audit/prototype task notes for the
full V1 scope and phased plan; this doc covers only what's implemented.
