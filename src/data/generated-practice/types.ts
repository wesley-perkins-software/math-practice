/**
 * Shared shape for a generated-practice page family's per-number fact bank.
 *
 * See docs/seo/CANONICAL_GENERATED_PAGE_STANDARD.md for the architecture this
 * supports. Each family (times tables, divide-by, and any future family) gets
 * its own data module using this interface — see that document's "Operation-
 * specific data modules" section for why the modules stay separate per family
 * even though they share one interface.
 *
 * Fields are kept separate on purpose. Strategy, Parent/Teacher guidance, and
 * FAQ content serve different sections of a generated page and different
 * structured-data uses (visible prose vs. FAQPage JSON-LD vs. a diagnostic
 * note aimed at adults, not students) — collapsing them into one overloaded
 * string would make future page-template integration lossy and would make it
 * impossible to review each section against its own content requirements.
 */
export interface GeneratedPracticeEntry {
  /** The number this entry describes (1–12 for the current families). */
  n: number;

  /**
   * One concise, self-contained, factually verifiable sentence for the page's
   * Quick Answer block. Must be understandable without surrounding context —
   * no pronouns referencing other sections. May describe a reliable product
   * pattern, a relationship to another table, a derived-fact method, a
   * notable property, or an honest note that there is no single shortcut.
   */
  quickAnswerFact: string;

  /**
   * A short clause meant to be woven into a 40–70 word intro paragraph.
   * Must add information beyond quickAnswerFact, not restate it — the intro
   * and Quick Answer are read back-to-back, so duplicating content between
   * them reads as repetitive (the same issue flagged in the leaf-page
   * standard's pilot evaluation).
   */
  introClause: string;

  /** Short, specific name for the strategy section's heading (e.g. "Double, Then Add One More Group"). */
  strategyTitle: string;

  /**
   * The strategy explanation: a mathematically valid, usable method a
   * student can actually apply, including at least one worked numeric
   * example. Where no strong shortcut genuinely exists for this number, this
   * field should say so honestly rather than manufacturing a gimmick — see
   * "Content integrity" in the authoring notes below.
   */
  strategyExplanation: string;

  /**
   * A specific, diagnostic note for parents/teachers: a likely mistake to
   * watch for and why it happens, a way to prompt without supplying the
   * answer, a connection to a previously learned fact, or a signal that a
   * student is ready to move on. Generic advice ("practice often") is not
   * sufficient on its own.
   */
  parentTeacherNote: string;

  /**
   * One FAQ question/answer pair that is genuinely specific to this number —
   * it should not read as equally true, unchanged, on every other entry in
   * the family. Include a concrete numeric example where appropriate.
   */
  faqDifferentiator: {
    question: string;
    answer: string;
  };

  /**
   * Optional override of the family-level default grade guidance, for the
   * rare case where a number's curriculum placement is genuinely and
   * specifically different (see each family module's exported grade-default
   * constant). Do not set this just to give every entry unique-looking
   * metadata, and avoid presenting curriculum timing as a universal or
   * nationwide requirement — use hedged language ("often," "typically").
   */
  gradeOverride?: string;
}
