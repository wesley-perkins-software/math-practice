# Canonical Generated-Page Standard

**Status:**
- Generated-page architecture standard: **complete**
- Phase 1A times-table fact-bank data layer: **complete** — see [Phase 1A: Times-table fact bank](#phase-1a-times-table-fact-bank-complete) below
- Live generated-page integration (`[table].astro`, `[divisor].astro`, `PracticeLayout.astro`, `presets.ts`): **not started**
- Divide-by fact bank (Phase 1B): **not started**
- Generated-page rollout (Phase 2+): **not started**

This document and the Phase 1A fact bank together are architecture-plus-authored-data. The fact bank is real, authored, validated data — not a placeholder or a design sketch — but it is not yet read by any live page.

- **Created:** 2026-08-02
- **Purpose:** Define the canonical architecture — sections, generation sources, and uniqueness mechanism — for all generated practice pages, so a future rollout converges on one design instead of improvising per family. This is the generated-page counterpart to `docs/seo/CANONICAL_LEAF_PAGE_STANDARD.md`, which explicitly scoped the 24 generated pages out and named the missing piece as "a structured per-number fact bank."
- **Origin:** Grew out of `docs/seo/CANONICAL_LEAF_PAGE_STANDARD.md`'s deferral of the 24 generated pages, and `docs/seo/SEO_AEO_GEO_AUDIT.md`'s Section 4c to-do: *"Extend the standard to the 24 generated Times Tables / Divide By pages — not started, blocked on designing the per-number fact bank."*
- **Scope boundary:** This document plus Phase 1A is architecture and authored data only, not page-template implementation. Phase 1A added `src/data/generated-practice/types.ts` and `src/data/generated-practice/timesTables.ts`. It did not modify `src/pages/multiplication/times-tables/[table].astro`, `.../index.astro`, `src/pages/division/divide-by/[divisor].astro`, `PracticeLayout.astro`, or `presets.ts` — those all still use their pre-existing local `TABLE_STRATEGIES`/`STRATEGY`/`GRADE_BADGE`/inline FAQ content. See [Phased rollout plan](#phased-rollout-plan) for how the remaining phases get built.

---

## Why generated pages need a different standard than leaf pages

The Canonical Leaf-Page Standard assumes hand-authored content: a human writes a unique Quick Answer, intro, and FAQ for each of the 9 leaf pages. That doesn't scale to generated pages, and it shouldn't be attempted — the 24 generated pages (and any future generated family) exist precisely *because* they follow one template across a range of parameters. Trying to hand-write 24 independent pages would either take a large amount of manual effort or regress into copy-pasted, templated pages with numerals swapped — which is exactly the thin/duplicate-content failure mode search engines and AI answer engines penalize.

The correct model is: **one shared template + one small, explicitly-authored per-number data module**, so uniqueness is deliberately engineered into a small, reviewable dataset instead of being either hand-written 24 times or faked with string interpolation.

---

## Canonical section order

```
Breadcrumb                                    [unchanged]
H1                                             [unchanged]
Quick Answer block (1–2 sentences)             [templated skeleton + 1 fact-bank fact — mandatory]
Intro paragraph (40–70 words)                  [templated skeleton + 1 unique clause — mandatory]
─────────────────────────────
Practice Widget                                [unchanged, positioned right after intro]
─────────────────────────────
"What You'll Practice" (bullets)               [generated from preset config — mandatory]
Strategy / how-it-works explanation            [fact-bank sourced — mandatory]
Parent & Teacher Guidance (3–5 sentences)      [templated skeleton + fact-bank note — mandatory]
FAQ (4–6 Q&As)                                 [templated skeleton + ≥1 fact-bank-sourced Q&A — mandatory]
Next-step CTA sentence                         [generated from sequence function — mandatory]
Related Practice (InternalLinks grid)          [generated from sequence function — mandatory]
```

This mirrors the leaf standard's order exactly, on purpose — a user or crawler moving between a leaf page and a generated page should encounter the same content rhythm. What differs is the **Source** column below.

## Section-by-section standard

| Section | Mandatory? | Source | Notes |
|---|---|---|---|
| Quick Answer | Mandatory | Template skeleton + 1 fact-bank fact | Pattern: `"{Operation with N} means {plain definition}. {One concrete, fact-bank-sourced, verifiable fact about N}."` The second sentence must come from the per-number data module, not be numerically substituted boilerplate — see [Anti-thin-content rules](#anti-thin-content-rules-substantive-educational-differentiation). |
| Intro (40–70 words) | Mandatory | Template skeleton + 1 unique clause | Skeleton identifies skill + audience (same as leaf pages); the required unique clause is pulled from the fact bank's relationship/strategy/derived-fact field, not invented per page at write time. |
| Practice widget | Mandatory | Unchanged | Same position as the leaf standard — immediately after the intro. |
| What You'll Practice | Mandatory | Generated from preset config (`multiplyTableConfig(n)` / `divideByConfig(n)`) | Fully mechanical — no authoring needed. |
| Strategy / how-it-works | Mandatory | Fact-bank sourced | Replaces the leaf standard's "optional" status — for generated pages this section IS the primary uniqueness carrier. See item 4. |
| Parent & Teacher Guidance | Mandatory | Template skeleton + fact-bank note | Grade context comes from the family-level default (see [Grade guidance](#grade-guidance-family-level-with-narrow-overrides)), not a per-number mandatory field. The diagnostic note itself is fact-bank sourced. |
| FAQ (4–6) | Mandatory | Template skeleton for 3–5 questions + 1 wholly fact-bank-sourced Q&A | The templated questions ("What times tables should I practice first?", programmatic fact lists, etc.) are fine as skeletons; at least one Q&A per page must be genuinely number-specific, not a generic template. |
| Next-step CTA sentence | Mandatory | Generated from sequence function | `n → n+1` (or last → first wraparound), computed, not hand-linked. |
| Related Practice grid | Mandatory | Generated from sequence function | Prev/next in sequence, paired operation (times-table N ↔ divide-by N), and link to the family index/hub — all computed as a pure function of `n`. |

---

## The data-driven architecture

### Operation-specific data modules (not one combined file)

Do not consolidate all generated-page fact data into a single file like `numberFacts.ts`. The two existing near-duplicate arrays already in the codebase — `TABLE_STRATEGIES` (in `[table].astro`) and `STRATEGY` (in `times-tables/index.astro`) — are evidence of what happens when the same content gets re-authored ad hoc in multiple places; the fix is a **single source of truth per operation family**, not a single file across families that don't share content.

Proposed layout:

```
src/data/generated-practice/
  types.ts          — shared NumberFactEntry interface (where fields genuinely align)
  timesTables.ts     — NumberFactEntry entries keyed 1–12, times-tables specific
  divideBy.ts        — NumberFactEntry entries keyed 1–12, divide-by specific
```

A shared interface is appropriate because both families need the same *shape* of content (a relationship/strategy field, a common-mistake field, an FAQ differentiator, a Quick-Answer fact), but the modules themselves stay separate so one family's data can be edited, reviewed, or extended without touching the other, and so a future family (e.g. squares) doesn't have to shoehorn its content into a file named after an unrelated topic.

Proposed shared shape (illustrative, not final implementation):

```ts
// src/data/generated-practice/types.ts
export interface NumberFactEntry {
  n: number;
  quickAnswerFact: string;      // one verifiable, number-specific sentence
  strategyOrNote: string;       // see "Anti-thin-content rules" below — may be a strategy,
                                 // a relationship, a common mistake, a worked example,
                                 // or an honest "no shortcut" statement
  faqDifferentiator: { q: string; a: string }; // one genuinely unique FAQ pair
  gradeOverride?: string;       // optional — only when a specific, defensible override applies
}
```

### How uniqueness is achieved without hand-writing 24 pages

Only ~12 entries per operation module need authoring (24 entries total across both families today) — the same order of magnitude as the existing `TABLE_STRATEGIES` array, just consolidated into one reviewed source instead of re-derived per file. The template (`.astro` page + `getStaticPaths`) stays fully mechanical; only the data module requires human authorship, and it's authored once, not once per page.

### Anti-thin-content rules: substantive educational differentiation

The uniqueness requirement is **substantive educational differentiation** — genuinely number-specific information — not phrasing variance. Paraphrasing a sentence or swapping the numeral in an otherwise identical template does **not** satisfy this standard and should be treated as a content defect if found in review, not an acceptable shortcut.

The `strategyOrNote` field (and the Quick-Answer fact, and the FAQ differentiator) must contain one of the following, whichever is genuinely true for that number:

- A **useful relationship** (e.g., "9× facts equal 10× the number minus the number itself").
- A **common student mistake** for that specific number and why it happens (e.g., confusing ×11 and ×12 patterns past single digits).
- A **derived-fact strategy** (e.g., "7× facts can be built from a known 5× fact plus 2× the number").
- A **real worked numeric example** specific to that number, not a generic template example.
- An **honest statement that the number has no simple shortcut**, when that's true — e.g., 7 and 8 are the two times-tables facts most commonly cited as lacking an easy trick, and forcing an invented "trick" onto them would itself be a thin-content problem (a fabricated claim), not a fix for one.

The standard explicitly does **not** require a "memorable trick" for every number. Authoring under pressure to invent a trick where none exists produces exactly the kind of low-value, non-credible content this standard is trying to prevent. An honest "this one just takes practice, here's why" is preferable to a manufactured mnemonic.

### Grade guidance: family level, with narrow overrides

Grade-level context (e.g., "commonly introduced around Grade 3") is a property of the **operation family** — times tables in general, divide-by in general — not something that needs a distinct, mandatory value manufactured for every single number. Requiring a per-number grade claim for all 12 entries risks inventing precision that doesn't exist (curricula vary by school, district, and country) and duplicates the existing `GRADE_BADGE` pattern's ad hoc, unsourced feel.

Design:
- A single family-level default grade-range statement lives in the template/page copy (e.g., "Times tables are typically introduced in Grade 3 and practiced through Grade 5"), stated as a general, non-authoritative-sounding range, not a rigid nationwide claim.
- `gradeOverride` on `NumberFactEntry` is optional and used only where a specific, well-supported case exists — e.g., 11s and 12s are conventionally introduced later than 2s–10s in many curricula, which is a defensible, narrow override, not a per-number requirement.
- Avoid rigid, unverifiable "Grade X" claims for every number; prefer ranges and hedged language ("typically," "often") over absolute claims, consistent with how the existing About-page Organization cleanup (`docs/seo/SEO_AEO_GEO_AUDIT.md` Section 4b) removed an unverifiable `foundingDate` rather than guessing one.

---

## AI Overviews & LLM consumption

- The Quick Answer must remain self-contained and liftable verbatim, exactly as in the leaf standard.
- For generated pages specifically, the defense against AI engines (or Google) treating the 24 pages as duplicate/boilerplate content is **substantive educational differentiation**, not phrasing variance — see above. A generative engine comparing `times-tables/7` and `times-tables/8` should find a genuinely different, factual claim about each number, not a reworded sentence with a different numeral.
- The FAQ's fact-bank-sourced Q&A should be the single most citation-worthy sentence on the page, because it's the one piece of content that cannot be produced by template substitution alone — flag it as the highest-value target for that reason during authoring/review.
- Programmatic content (the full 1×n…12×n list, the full n÷n…12n÷n list) is legitimate and useful for AEO (a complete, structured answer to "what is the N times table"), but does not by itself satisfy the differentiation requirement — it's the same shape of content for every n, just with different numbers substituted, so it must be paired with, not substituted for, a fact-bank-sourced sentence.

---

## Structured data

- Continue the existing pattern: `LearningResource` + `FAQPage` JSON-LD per generated page, with `LearningResource.provider` referencing the shared `Organization` node via `{"@id": ORGANIZATION_ID}` from `src/config/site.ts` (the pattern already used across all 30 non-generated-page instances per `docs/seo/SEO_AEO_GEO_AUDIT.md` Section 4).
- No new schema types are being proposed for generated pages in this document. `Course`/`Dataset`/`Quiz` types were considered but are out of scope here — worth evaluating separately once real per-family content exists, not decided speculatively now.
- **Recommendation, not scoped for immediate implementation:** there is currently no shared JSON-LD builder function anywhere in the codebase — every page (generated and leaf alike) hand-assembles its own `LearningResource`/`FAQPage` object literal. For generated pages in particular, where 24 pages construct near-identical JSON-LD shapes from the same preset/data-module inputs, a small typed helper (e.g. `buildLearningResourceSchema(config, faqItems)`) would remove hand-duplication risk. This is listed as a future implementation recommendation, not built here.

---

## Internal linking

Internal links for generated pages should be a pure function of `n` and the family, not hand-authored per page:

- **Prev/next in sequence** — table N links to N−1 and N+1 (wrapping or truncating at the family's bounds, 1 and 12).
- **Paired-operation cross-link** — times-table N should link to divide-by N and vice versa; they're the natural inverse-operation pair for the same number and currently have no cross-link at all.
- **Hub/index link** — every generated leaf page links back to its family's index page (`times-tables/index.astro` exists today; `divide-by/index.astro` does not yet exist — see [Open questions](#open-questions-to-resolve-before-implementation), also tracked as a Quick Win in `docs/seo/SEO_AEO_GEO_AUDIT.md`'s internal-linking section).

All three link types are computed from `n`, reusing the existing `InternalLinks` component — no new component is required, only a small pure link-generation function that both the times-tables and divide-by pages call with their respective `n`.

## Related Practice

The Related Practice grid uses the same generated links described above, rendered through the existing `InternalLinks` component exactly as it already is on leaf pages — no change to that component is proposed. The only change is *how* the `links` array passed into it is produced (a function of `n`, rather than a hand-typed array duplicated with small variations across 12 files).

## Parent & Teacher Guidance

Templated skeleton (family-level framing: "Parents and teachers helping a student with the {N} times table…") plus one mandatory sentence sourced from the data module's `strategyOrNote` field, reframed as guidance rather than a strategy tip where useful (e.g., "if the strategy above doesn't stick, watch for a child confusing 7× facts with 8× facts specifically" rather than a generic "practice more" statement). This is intentionally not required to be a large, hand-authored paragraph the way the leaf standard's Parent/Teacher section is — the mandatory content is the one fact-bank sentence, wrapped in a short reusable skeleton.

## FAQ generation

- 3–5 questions may be templated skeletons shared across the family (e.g., "What is the {N} times table?", "How do I memorize the {N} times table?", the programmatic full-list question).
- At least 1 question per page must be the `faqDifferentiator` pair straight from the data module — a question and answer that would not make sense, or would not be true, for any other number in the family.
- The `FAQPage` JSON-LD `mainEntity` array is generated from the same combined list (templated + fact-bank), matching the existing sitewide pattern of visible content and schema sharing one source array.

---

## Reuse for future generated page families

Any future generated family (e.g., squares, percentages-of-a-number, a third operation range) should follow this fixed four-part recipe rather than re-deriving architecture:

1. **Preset generator function** in `src/engine/presets.ts` — following the existing `multiplyTableConfig(n)` / `divideByConfig(n)` pattern, returning a `PracticeConfig` for a given `n`.
2. **Operation-specific fact-bank data module** under `src/data/generated-practice/<family>.ts`, implementing (or extending) the shared `NumberFactEntry` interface, authored once per family (typically ~12 entries for a 1–12 range family, but sized to whatever range the family actually covers).
3. **Shared `.astro` template with `getStaticPaths`**, following this document's canonical section order, reading from the family's preset generator and data module.
4. **Index/hub page** for the family, linking to every generated leaf page in it and providing the paired-operation/related-family cross-links described above.

A family is not ready to ship until its data module passes the [anti-thin-content rules](#anti-thin-content-rules-substantive-educational-differentiation) for every entry — including the "honest no-shortcut" option where genuinely applicable.

---

## Phase 1A: Times-table fact bank — complete

**Status:** Complete. This phase authored the multiplication times-table fact bank described above as real data. It did **not** touch any `.astro` page, layout, or preset — the page-template migration is a separate, later phase (see [Phased rollout plan](#phased-rollout-plan)).

**Files added:**
- `src/data/generated-practice/types.ts` — the `GeneratedPracticeEntry` interface.
- `src/data/generated-practice/timesTables.ts` — 12 authored entries (tables 1–12), plus `TIMES_TABLE_GRADE_DEFAULT`, a `getTimesTableFact(n)` lookup helper, and a dependency-free `validateTimesTableFacts()` function.

**Final field interface** (implemented exactly as designed, no changes from the original proposal in this document):

```ts
interface GeneratedPracticeEntry {
  n: number;
  quickAnswerFact: string;
  introClause: string;
  strategyTitle: string;
  strategyExplanation: string;
  parentTeacherNote: string;
  faqDifferentiator: { question: string; answer: string };
  gradeOverride?: string;
}
```

Each field maps to exactly one canonical-page section (Quick Answer, Intro, Strategy heading + body, Parent/Teacher, FAQ, grade guidance), kept as separate fields rather than one overloaded string — this held up during authoring with no pressure to merge fields, confirming the original design in this document.

**Mapping from existing duplicated content to the new fields:**

| Existing source | Where it lived | Mapped to | Disposition |
|---|---|---|---|
| `TABLE_STRATEGIES[n].tip` | `[table].astro` | `strategyExplanation` (rewritten) | Preserved the core method for each table where mathematically sound (e.g. 1's identity property, 2's doubling, 9's finger trick tied to the 10×n−n relationship); expanded vague entries with a worked numeric example where the original lacked one. |
| `TABLE_STRATEGIES[n].name` | `[table].astro` | `strategyTitle` (rewritten) | Retitled for clarity/consistency (e.g. "The Finger Trick" → "Ten Times, Minus One Group (Plus the Finger Check)" to name the underlying relationship, not just the mnemonic). |
| `STRATEGY[n]` | `times-tables/index.astro` | Superseded by `quickAnswerFact` / `strategyExplanation` | This was a condensed, independently-authored duplicate of `TABLE_STRATEGIES` (see [Contradictions discovered](#contradictions-discovered) below) — not migrated as a separate field; the fact bank is the intended single source going forward. |
| `GRADE_BADGE[n]` | `[table].astro` | `gradeOverride` (tables 1, 2, 5, 10) / `TIMES_TABLE_GRADE_DEFAULT` (all other tables) | Preserved exactly which tables get an early-introduction override, since that distinction already existed in the codebase; language was hedged ("often," not the original unhedged "Grade 2 – Grade 3" badge text). |
| Inline `faqItems` (grade question + trick question) | `[table].astro` | Not migrated 1:1 — superseded by `faqDifferentiator` | The old per-table FAQ's "trick" question just restated `TABLE_STRATEGIES[n].tip`; the new `faqDifferentiator` is a distinct question genuinely specific to each table (see [Content requirements](#content-requirements) in the original design), not a restated strategy. |
| `times-tables/index.astro`'s "hardest table" / learning-order FAQ claims | `times-tables/index.astro` | Not migrated — flagged, not carried forward | See [Contradictions discovered](#contradictions-discovered). |

**Contradictions discovered:**

- `times-tables/index.astro`'s FAQ states *"The 7s and 8s are typically the hardest... the 6s, 7s, 8s, and 12s are the last four tables most students master"* — this is an unsupported comparative claim with no authoritative source anywhere in this repository (no citation, no data). Per this standard's content-integrity rules, no such comparative ranking claim was carried into the new fact bank. The 7-times-table entry instead states plainly that no single shortcut exists for that number specifically, without ranking it against other tables. **This existing claim in `times-tables/index.astro` is flagged as a pre-existing content-integrity issue, not fixed in this task** (per instructions, the old files are not modified in Phase 1A) — it should be revised or removed when the page template is migrated.
- `TABLE_STRATEGIES` and `STRATEGY` were confirmed to be independently-authored duplicates of the same underlying content, occasionally drifting in wording (e.g. table 9's tip differs slightly in phrasing between the two) without changing the substance. No factual contradiction was found between them beyond wording drift; the new fact bank resolves the duplication by becoming the one source both will eventually read from.
- No contradiction was found between `[table].astro`'s `GRADE_BADGE` logic and `times-tables/index.astro`'s grade-related FAQ text — both agree that tables 1, 2, 5, and 10 are introduced earlier (Grade 2) with the rest as a Grade 3 focus.

**Fact-checking approach used:** every numeric example in every field (quick-answer facts, strategy explanations, parent notes, FAQ answers) was independently recalculated during authoring — e.g. `6×4=24`, `6×6=36`, `6×8=48` for the even-multiplier last-digit pattern; `9×6=54` for the finger-trick check; `12×11=132` for the split-strategy FAQ. Claims about digit patterns (5s ending in 0/5, 9s' digit sum being a multiple of 9, 6s' even-multiplier last-digit match) were verified algebraically, not just by spot-checking a few examples, before being stated as reliable rules rather than coincidences. No claim about relative difficulty, national curriculum requirements, or "most common mistake" was made anywhere in the new fact bank, consistent with the content-integrity rules above.

**Audit table** (one row per table):

| Table | Unique fact type | Strategy type | Parent-guidance focus | FAQ focus | Grade override used? |
|---|---|---|---|---|---|
| 1 | Property (identity) | Explicit reasoning, no shortcut needed | Conceptual understanding of "groups of," not recall | Why practice a "trivial" table at all | Yes |
| 2 | Relationship (to addition/doubling) | Doubling | Distinguishing doubling from counting | Doubling ⇔ 2× equivalence | Yes |
| 3 | Derived-fact method | Build from the 2s table | Isolating the "extra group" addition step | How to hand-check a 3× answer | No |
| 4 | Derived-fact method | Double twice (build from 2s) | Identifying which doubling step was skipped/repeated | Relationship between 2s, 4s, 8s | No |
| 5 | Notable digit property | Skip-counting | Using the ends-in-0-or-5 pattern as a self-check | Why the digit pattern exists | Yes |
| 6 | Derived-fact + digit pattern | Build from the 5s table | Using the even-multiplier last-digit check | Scope/limits of the last-digit pattern | No |
| 7 | Honest "no simple shortcut" | Decomposition + commutativity | Prioritizing specific hard facts (7×6, 7×7, 7×8) | Why no easy trick exists for this number | No |
| 8 | Derived-fact method | Triple doubling (build from 2s/4s) | Identifying a stopped-early doubling error | Counting the doubling steps | No |
| 9 | Relationship (10×n−n) + digit property | Ten-minus-one-group / finger trick | Ensuring conceptual understanding behind the trick | Validity range of the finger trick | No |
| 10 | Property (place value) | Append a zero | Extending the rule to two-digit numbers | Why appending a zero works (place value) | Yes |
| 11 | Property + explicit exceptions | Repeat-digit + memorize 3 exceptions | Naming the 3 exceptions as expected errors | Scope/limits of the repeat-digit pattern | Yes |
| 12 | Derived-fact method | Split into 10× and 2× | Isolating the addition step as the likely error source | Worked example of the split strategy | Yes |

**Review checklist result:** all 12 entries were checked against the standard's review checklist (factually correct arithmetic, no invented shortcut, no unsupported curriculum claim, quick-answer facts differ substantively per entry, strategies are usable by a student, parent notes are table-specific, FAQ pairs would not read correctly unchanged on another table, worked examples calculate correctly, tone is parent/teacher-friendly, language is concise) — no failures found. Programmatic validation (`validateTimesTableFacts()` / `npm run validate:times-tables`) additionally confirms: exactly 12 entries, `n` values cover 1–12 exactly once, no missing/empty required fields, no duplicate FAQ questions, no duplicate `quickAnswerFact` values.

**Lessons learned during authoring:**
- The "honest no-shortcut" option (used for table 7) reads noticeably differently from the other 11 entries — flatter, more direct — and that's the correct outcome, not a defect; forcing a manufactured trick onto 7 to make it "feel" consistent with the other entries would have violated the anti-thin-content rule for the sake of surface uniformity.
- Several digit-pattern claims (6's even-multiplier last-digit match, 9's digit-sum-is-a-multiple-of-9 rule) needed to be scoped precisely (e.g. "for even multipliers only," "digit sum is a multiple of 9," not "always sums to exactly 9") to stay factually accurate — an early draft of the 6s entry over-generalized the pattern to all multipliers before this was caught and narrowed.
- Splitting `strategyTitle`/`strategyExplanation` from `faqDifferentiator` turned out to matter in practice: the natural temptation while authoring was to make the FAQ answer just restate the strategy in question form, which does not satisfy "would not make equal sense on every other page" as cleanly as a genuinely distinct angle (e.g. table 9's strategy explains *how* to compute the fact; its FAQ instead addresses *when the finger trick is valid*, a different question).
- The grade-override rationale for 11 and 12 (introduced in this fact bank, not present in the old `GRADE_BADGE` map) is a new, hedged claim, not one lifted from existing project documentation — see [Open questions](#open-questions-to-resolve-before-implementation) below for whether this should be validated or softened further before rollout.

**Validation performed:**
- `npm run validate:times-tables` — passes, 12/12 entries valid (exact-count, coverage, non-empty-field, and no-duplicate checks all pass).
- `npm run build` — succeeded, 68 pages, no errors, same page count as before this task (the new data module is not imported by any page yet, so it has no effect on build output).
- No automated test suite exists in this repository beyond `npm run build` (consistent with prior audit entries); none was skipped.

---

## Strengths of the proposed architecture

- **Scales without linear authoring cost per page.** Adding a new generated family costs one data module (~12 entries) and one template, not N hand-written pages.
- **Fixes an existing duplication, not just a future one.** Consolidating `TABLE_STRATEGIES`/`STRATEGY` into one per-family data module removes a real, already-present maintenance smell, not just a hypothetical one.
- **Anti-thin-content mechanism is explicit and auditable.** "Substantive educational differentiation" with four/five defined content shapes (relationship, mistake, derived strategy, worked example, honest no-shortcut) gives reviewers a concrete checklist instead of a vague "make it feel unique" standard.
- **Consistent with the leaf standard's shape**, so users and crawlers see one coherent content rhythm sitewide rather than two unrelated page designs.
- **Grade-guidance approach avoids manufacturing false precision** — a known failure mode already caught once in this codebase (the About page's unverifiable `foundingDate`, removed rather than guessed, per `SEO_AEO_GEO_AUDIT.md` Section 4b).

## Tradeoffs

- **Requires real authoring effort up front.** Even at ~12 entries per family, writing genuinely differentiated, factually correct content for two operation families is real work, not a mechanical migration — likely more design/review time than any single leaf-page pilot took.
- **Two data modules with a shared interface is more files than one combined module**, at the cost of a small amount of import/wiring overhead, in exchange for cleaner per-family ownership.
- **The "honest no-shortcut" option is right for content integrity but weakens AEO differentiation for those specific numbers** — a page whose unique fact is "there's no shortcut here" is less quotable than one with a real relationship. This is an accepted tradeoff (correctness over manufactured richness), not a gap to solve by inventing content.
- **Grade overrides being rare-by-design** means most pages share one family-level grade statement — less per-page grade-specific detail than the current, ungoverned `GRADE_BADGE` behavior, in exchange for not making unverifiable per-number claims.

## Implementation recommendations

1. Build the two data modules (`timesTables.ts`, `divideBy.ts`) and the shared `NumberFactEntry` interface first, in isolation, and have them reviewed against the anti-thin-content checklist before touching any `.astro` file.
2. Refactor `[table].astro` and `[divisor].astro` to read from the new data modules, replacing `TABLE_STRATEGIES`/`STRATEGY`/`GRADE_BADGE`/inline `faqItems` in place — this is a consolidation of existing content into the new source, not new content authoring, and should be low-risk if the data modules are already correct.
3. Add the missing `src/pages/division/divide-by/index.astro` hub page (already tracked as a Quick Win in `docs/seo/SEO_AEO_GEO_AUDIT.md`) as part of the same rollout, since the internal-linking design here depends on both families having an index page.
4. Add the paired-operation cross-link (times-table N ↔ divide-by N) as a small pure function, reused by both page templates.
5. Defer the shared JSON-LD builder helper to a separate follow-up — useful, but not blocking, and better scoped once the data-module refactor's shape is settled.

## Phased rollout plan

- **Phase 0 (this document):** Architecture and design only. No code changes. Complete.
- **Phase 1A:** Author `timesTables.ts` (12 entries) and the shared `GeneratedPracticeEntry` interface. Review each entry against the anti-thin-content checklist. No `.astro` changes. **Complete** — see [Phase 1A: Times-table fact bank](#phase-1a-times-table-fact-bank-complete).
- **Phase 1B:** Author `divideBy.ts` (12 entries), following the same interface and review process as Phase 1A. No `.astro` changes. **Not started.**
- **Phase 2:** Pilot the refactor on a small number of `[table].astro`/`[divisor].astro` instances (e.g., one or two specific `n` values, following the leaf standard's own pilot-before-sitewide-rollout precedent) — wire the new data modules and section order into the existing dynamic-route template, verify build output and JSON-LD validity, and resolve the flagged `times-tables/index.astro` "hardest table" content-integrity issue at that point. **Not started.**
- **Phase 3:** Roll out to all 24 generated pages once the pilot is evaluated, following the same "ship as piloted, log deviations" discipline used in the leaf-page rollout. **Not started.**
- **Phase 4:** Add `division/divide-by/index.astro` and the paired-operation cross-links; update `docs/seo/SEO_AEO_GEO_AUDIT.md`'s roadmap checklist to reflect the generated-page rollout as done. **Not started.**
- **Phase 5 (optional, separately scoped):** Shared JSON-LD builder helper; extending this same architecture to a new generated family. **Not started.**

## Open questions to resolve before implementation

1. ~~**Exact `NumberFactEntry` field list**~~ — **Resolved by Phase 1A.** The field list (`quickAnswerFact`, `introClause`, `strategyTitle`, `strategyExplanation`, `parentTeacherNote`, `faqDifferentiator`, `gradeOverride`) held up during authoring with Parent/Teacher guidance as its own dedicated field, as this question anticipated — no changes needed.
2. ~~**Who authors the data-module entries, and how are they fact-checked?**~~ — **Answered for Phase 1A** (this task): every numeric example was recalculated, digit-pattern claims were verified algebraically, and entries were checked against the standard's review checklist plus programmatic validation. Whether this same discipline needs a second, independent reviewer (not just the original author) before the Phase 2 pilot is still open.
3. **Divide-by index page ownership** — should `division/divide-by/index.astro` be built as part of the eventual template rollout (Phase 2/3/4) or tracked as a fully separate PR, given it's already an independent roadmap item in `SEO_AEO_GEO_AUDIT.md`?
4. **Should the paired-operation cross-link be mutual on both pages from day one**, or introduced on just one side first to limit blast radius, consistent with how the leaf-page rollout piloted on 3 pages before the remaining 6?
5. **Does `factsMode`/`maxFactor` in `PracticeConfig` need any extension** to support a future family that isn't naturally bounded to 1–12 (e.g., percentages), or is the 1–12 range assumption safe to keep baked into the recipe for now?
6. **New, from Phase 1A authoring — should the 11/12 grade overrides be validated further?** These two overrides (introduced during Phase 1A, not present in the pre-existing `GRADE_BADGE` map) are a new, hedged claim rather than one lifted from prior project documentation. Confirm this is an acceptable level of assertion before it reaches a live page, or soften/remove it.
7. **New, from Phase 1A — how should the flagged `times-tables/index.astro` "hardest table" FAQ content be handled?** It was left untouched per this task's scope (old arrays are not modified until template migration), but it is a real content-integrity issue (unsupported comparative claim) that should be resolved no later than the Phase 2 pilot, and arguably sooner given it's live on production content today.
8. **New, from Phase 1A — should Phase 1B (`divideBy.ts`) reuse any Phase 1A entries by reference** (e.g., a divide-by-9 entry restating the 10×n−n relationship from times-table 9) rather than re-deriving each relationship independently, given several of the mathematical relationships used (doubling, place value, decomposition) are operation-symmetric?
