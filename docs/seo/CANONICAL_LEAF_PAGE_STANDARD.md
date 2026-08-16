# Canonical Leaf-Page Standard

**Status:** Rolled out to all 9 non-generated leaf practice pages (3 Addition + 3 Subtraction + Multiplication Facts + Division Facts + Division with Remainders). The 24 generated Times Tables / Divide By pages are **not yet rolled out** — they require the structured per-number fact bank noted in [Pilot Evaluation](#pilot-evaluation) and [Implementation notes](#implementation-notes), tracked as a separate follow-up decision. See [Rollout: all non-generated leaf pages](#rollout-all-non-generated-leaf-pages) for what shipped and what remains deferred as future layout work.

- **Created:** 2026-08-02
- **Purpose:** Define the target content shape for every leaf practice page on MathPracticeOnline (addition/subtraction leaves, multiplication facts, division facts/remainders, all 12 times-tables, all 12 divide-by pages), so content-quality work converges on one standard instead of being re-decided page by page.
- **Origin:** Grew out of the content-quality audit in `docs/seo/SEO_AEO_GEO_AUDIT.md`, which identified thin leaf-page intros and the absence of parent/teacher guidance on leaf pages as the site's largest remaining content-quality gap.
- **Scope boundary:** This is a content-shape standard, not a redesign. It does not introduce new architecture, new schema types, or new sections beyond what's described below, and it does not change `PracticeLayout.astro` itself — see [Implementation notes](#implementation-notes).

---

## Canonical section order

```
Breadcrumb                                    [unchanged]
H1                                             [unchanged]
Quick Answer block (1–2 sentences)             [NEW — mandatory]
Intro paragraph (40–70 words)                  [expanded — mandatory]
─────────────────────────────
Practice Widget                                [unchanged, positioned right after intro]
─────────────────────────────
"What You'll Practice" (bullets)               [unchanged — mandatory]
Strategy / how-it-works explanation            [unchanged — mandatory where applicable]
Parent & Teacher Guidance (3–5 sentences)      [NEW — mandatory, short form]
FAQ (4–6 Q&As)                                 [unchanged — refined]
Next-step CTA sentence                         [NEW — mandatory, one line]
Related Practice (InternalLinks grid)          [unchanged]
```

## Section-by-section standard

| Section | Mandatory? | Source | Notes |
|---|---|---|---|
| Quick Answer | Mandatory | Semi-generated — template shape, per-page fact required | 1–2 standalone sentences directly under the H1. Must be extractable on its own (no pronouns referencing surrounding text), factually precise, no marketing language. Pattern: `"{Skill} is {plain-language definition}. {One concrete, verifiable fact}."` |
| Intro (40–70 words) | Mandatory | Handwritten (hand-authored pages) / templated + 1 unique clause (generated pages) | Identifies the skill and audience, establishes search intent naturally. Must not repeat the Quick Answer's content. |
| Practice widget | Mandatory | Unchanged | Stays immediately after the intro, before all deeper explanatory content — preserves fast access to the primary action. |
| What You'll Practice | Mandatory | Generated from preset config | Unchanged. |
| Strategy / how-it-works | Optional | Handwritten | Applies where a real strategy/procedure exists. |
| Parent/Teacher guidance (short) | Mandatory | Handwritten | 3–5 sentences. Must contain specific, actionable diagnostic guidance (a mistake to watch for, why it happens, how to respond) — not generic study advice. |
| FAQ (4–6) | Mandatory | Mixed | First question should reinforce (not duplicate) the Quick Answer with more depth. Remaining questions should be genuinely distinct between pages, not lightly reworded templates. |
| Next-step CTA sentence | Mandatory | Generated from existing `relatedLinks` data | One sentence naming the logical next skill. |
| Related Practice grid | Mandatory | Unchanged | Existing `InternalLinks` component and data, untouched. |

## AI-citation structuring

- Quick Answer must be self-contained: a search/AI engine should be able to lift it verbatim as a correct, complete answer.
- The FAQ's first Q&A should echo the Quick Answer's content in expanded form — redundant on purpose, since different engines/extractors weight prose vs. `FAQPage` schema differently.
- Every claim in the Quick Answer and first FAQ answer must be specific and verifiable (a number, a range, a named rule), not generic marketing language.

## Implementation notes

- No changes to `PracticeLayout.astro`'s slot mechanism were required for the pilot. The Quick Answer is nested inside the existing `intro` slot (as a `<Fragment slot="intro">` containing the answer block followed by the intro paragraph). The Parent/Teacher section, next-step CTA, and the `InternalLinks` component are all nested inside the existing `how-it-works` slot, in the order described above — `InternalLinks` was moved from its own top-level `slot="links"` usage to the end of the `how-it-works` slot content on the 3 piloted pages only. This keeps the change scoped to the pilot pages with zero risk to any other page using `PracticeLayout.astro`.
- For the 24 generated times-table/divide-by pages, real per-page differentiation (not just numeral substitution) is required for the Quick Answer, one FAQ answer, and ideally the Parent/Teacher note. This needs a small per-number authored fact bank (12 entries × 2 operations) — **explicitly out of scope for this pilot**, tracked as a follow-up decision before generated-page rollout.

---

## Pilot Evaluation

**Pilot scope:** `src/pages/addition/1-digit.astro`, `src/pages/addition/2-digit-no-carrying.astro`, `src/pages/addition/2-digit-with-carrying.astro`. No other pages were modified. `PracticeLayout.astro` was not modified.

1. **Does the page feel better?** Yes — each page now reads as a real resource with a defensible claim to being "the best answer" for its topic, rather than a widget with a caption. The added sections (Quick Answer, Parent/Teacher, next-step CTA) fill exactly the gap the audit identified.
2. **Does the Quick Answer improve readability?** Yes, directionally — but in practice the Quick Answer box and the intro paragraph immediately below it are similar in length and tone, and on a first read they can blur together as "two paragraphs saying almost the same thing" rather than two clearly distinct units (a citable definition vs. an audience/intent statement). The content is non-duplicative by design, but the *visual* distinction between them is weaker than it looked on paper.
3. **Does the Parent/Teacher section feel genuinely valuable?** Yes — this is the strongest addition. Writing it as specific diagnostic guidance ("watch for a child who does X, here's why, here's what to do") rather than generic tips produced real instructional content, not filler. This validates that section as mandatory.
4. **Does the page still feel fast?** Yes — the widget is still the second thing on the page (after Quick Answer + intro), unchanged from before. All the new depth was added below the widget, so the "get to practicing quickly" property is preserved.
5. **Is the widget positioned correctly?** Confirmed correct as designed — no change recommended.
6. **Is anything weaker in practice than it looked on paper?**
   - The Quick Answer / intro visual distinction (noted in #2) needs a style fix — e.g., dropping the bordered box in favor of a bolded lead sentence, or making the intro visually lighter/smaller — so the two units read as distinct rather than repetitive.
   - The Parent/Teacher guidance, written as one dense 4-sentence paragraph, is harder to scan than the site's existing bullet/card sections (What You'll Practice, Strategies). It reads well but doesn't match the site's scannability pattern elsewhere on the page.
   - The next-step CTA sentence sometimes states almost the same link the Related Practice grid's first card already shows, reading as a mild repetition rather than a distinct signal.
   - Coordinating the Quick Answer's example numbers to avoid duplicating an FAQ answer's example required manual attention on all 3 pages — confirms the design doc's conclusion that the 24 generated pages will need a structured fact bank rather than ad hoc coordination.
7. **Should anything be revised before sitewide rollout?** Yes, three targeted revisions, not a redesign:
   - Give the Quick Answer a visually distinct treatment from the intro paragraph (lighter intro styling, or drop the box), so they don't read as duplicate paragraphs at a glance.
   - Allow Parent/Teacher guidance to be either one paragraph or a short lead sentence + 2–3 supporting sentences, whichever scans better for the specific content — not force one dense paragraph every time.
   - Decide whether the next-step CTA sentence should be dropped when it would repeat the Related Practice grid's first entry, or whether the grid's first entry should instead be visually marked as "next step" and the sentence made purely narrative (not link-duplicating).

**Recommendation:** Approve the standard for sitewide rollout **with the three revisions above applied** to the pattern (not just noted) before extending past this pilot. The core structure — Quick Answer, expanded intro, widget-first placement, mandatory Parent/Teacher guidance, FAQ reinforcement, next-step CTA — held up well and should not be redesigned. The generated-page fact-bank requirement (item 6) should be scoped as its own follow-up decision before applying this standard to the 24 times-table/divide-by pages, since those pages need a mechanism this pilot didn't test.

*(This Pilot Evaluation section is retained in full as historical documentation. The rollout below deliberately shipped the pilot's exact pattern, unrevised — the three recommendations above are explicitly deferred to a future UI refresh, not applied here.)*

---

## Rollout: all non-generated leaf pages

**Status:** Complete. The standard, exactly as piloted (no revisions from the Pilot Evaluation applied), has been rolled out to the 6 remaining non-generated leaf pages:

- `src/pages/subtraction/1-digit.astro`
- `src/pages/subtraction/2-digit-no-borrowing.astro`
- `src/pages/subtraction/2-digit-with-borrowing.astro`
- `src/pages/multiplication/facts.astro`
- `src/pages/division/facts.astro`
- `src/pages/division/remainders.astro`

Combined with the 3 pilot pages, this covers all 9 leaf pages in the target list that are not part of the generated Times Tables / Divide By set (`Addition leaf pages`, `Subtraction leaf pages`, `Multiplication Facts`, `Division Facts`, `Division with Remainders` — the full non-generated scope named when this standard was first commissioned).

**What was applied to each page, matching the pilot exactly:**
- A 1–2 sentence Quick Answer block directly under the H1, using the same visual treatment as the pilot (`bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl` box) — **not** the differentiated treatment recommended in the Pilot Evaluation, per instruction to ship the approved pattern unrevised.
- An expanded ~40–70 word intro paragraph identifying skill and audience, positioned immediately after the Quick Answer.
- A mandatory Parent & Teacher Guidance section with specific, diagnostic advice (not generic tips), written as one paragraph — **not** the short-lead-plus-bullets alternative recommended in the Pilot Evaluation, same reasoning.
- FAQ reinforcement: the first question now reinforces (not duplicates) the Quick Answer, with distinct worked examples between the two. Question counts were **not increased** — pages that already had 4 questions kept 4; `division/facts.astro` and `division/remainders.astro` already had 5 questions each pre-rollout and were left at 5 (no questions added or removed on those two).
- A one-sentence next-step CTA linking to the logical next skill, reusing each page's existing `relatedLinks`/`links` data — **not** de-duplicated against the Related Practice grid's first entry, per the same "ship as piloted" instruction; this is the same minor redundancy already flagged in the Pilot Evaluation.
- The `InternalLinks` "Related Practice" grid repositioned to the end of the page content, after the FAQ and next-step CTA — done only inside these 6 files, `PracticeLayout.astro` was not touched.

**Pages left with their pre-existing structure untouched:** `division/facts.astro` and `division/remainders.astro` already had a full "Tips for Parents and Teachers" section (a "Grade-by-Grade Progression" table plus 3 linked paragraphs) predating this standard. That section already exceeds the standard's mandatory Parent/Teacher requirement, so it was **left exactly as-is** — not replaced, shortened, or duplicated with a second guidance section. Only the Quick Answer, intro expansion, next-step CTA, and `InternalLinks` repositioning were added around it.

**Explicitly not done in this rollout, per instruction:**
- The 24 generated Times Tables (`/multiplication/times-tables/[table]`) and Divide By (`/division/divide-by/[divisor]`) pages were **not modified** — confirmed via `git status`/`git diff --stat` showing only the 6 intended files changed.
- No revisions from the Pilot Evaluation (Quick Answer/intro visual differentiation, Parent/Teacher scannable layout, CTA de-duplication) were applied — those remain deferred to a dedicated future UI refresh.
- The practice widget was not moved on any page — it remains the second element after the Quick Answer + intro, exactly as in the pilot. Any future repositioning is explicitly out of scope here.
- No layout, color, styling, metadata, URL, navigation, or schema-type changes were made anywhere in the rollout.

**Verification performed:**
- `npm run build` — succeeded, 68 pages, no errors, matching the page count before this rollout (no pages added or removed).
- Inspected generated `dist/` HTML for all 9 non-generated leaf pages (3 pilot + 6 rollout): all JSON-LD blocks parse as valid JSON; FAQ schema entry counts match the visible FAQ count on every page (4/4 on 7 pages, 5/5 on the two division pages); heading hierarchy is clean on all 9 (`h1` → `h2` → `h3`, no skipped levels); titles and canonical URLs are byte-identical to their pre-rollout values; the `InternalLinks`/"Related Practice" section renders exactly once per page.
- `git status`/`git diff --stat` confirm exactly the 6 intended files changed in this rollout (plus the 3 pilot files from the prior PR) — no generated pages, layouts, or other site files were touched.
- No accessibility regression: no new unlabeled interactive elements, heading order preserved on all 9 pages, no changes to existing widget/form components.

**Risk:** Low — same risk profile as the pilot, now applied to 6 additional files with an identical, already-validated pattern. No shared-layout or shared-component changes.
