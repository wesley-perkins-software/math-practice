# Master Growth Requirements Backlog

**Status:** Living document — the project's ordered growth plan. Execute one `GROWTH-###` at a time, top to bottom within its tier, unless a dependency or a stop/continue condition says otherwise.

**Created:** 2026-09-10. **Primary objective driving prioritization:** increase qualified new traffic to MathPracticeOnline.com while making it an increasingly exceptional, authoritative product. Acquisition > Authority > Distribution > Product Quality > Retention, in that order, when two ideas are otherwise comparable — but acquisition work must never damage UX, performance, trust, accessibility, or existing rankings.

---

## Evidence Rules

- **Source A — the repository (`development` branch, HEAD `30015a5c061eff760310de1b1df1b7da594b39a0` at time of writing)** is authoritative for anything about current implementation: routes, content, metadata, structured data, internal linking, robots/sitemap, engines, storage, analytics, tests. Where the repository and the external research disagree, the repository wins.
- **Source B — the attached Deep Research "Traffic-Growth Strategy Audit (September 2026)"** is the external evidence base for SERP/competitor/search-intent observations. It is not authoritative for implementation state — its own research environment could not fetch several routes' interior content and said so explicitly.
- **A note on process, for anyone extending this document:** the repository inspection that produced this backlog was initially run against a stale local checkout, 24 commits behind `origin/development`, which genuinely lacked the Create Classroom Practice integration described below. That was caught by cross-checking `git fetch`/`git log` against the external evidence before writing anything, then fast-forwarding and re-verifying the load-bearing claims directly against source files (not only via prior summaries). Anyone revisiting this document after further commits should re-run the equivalent spot checks (`git status`, `git log HEAD..origin/development`) before trusting inherited conclusions.

---

## Verified / Rejected Research Assumptions

| Area | Verdict | Evidence |
|---|---|---|
| Create Classroom Practice nav/footer/homepage/for-teachers/facts-page discoverability | **CONFIRMED true** | `src/components/SiteHeader.astro` `staticLinks` includes `{ href:'/create/', label:'Create Classroom Practice' }` positioned immediately before My Progress; footer link "Create Practice" present in `HubLayout.astro`, `PracticeLayout.astro`, `index.astro`; homepage For Teachers card has primary "Create Classroom Practice →" + secondary "Classroom guide →"; `for-teachers.astro` has a dedicated CTA block; `multiplication/facts.astro` and `division/facts.astro` link to `/create/`. Backed by passing tests (`tests/site-header.test.ts`, `tests/create-practice-discoverability.test.ts`). **Do not re-recommend any of this.** |
| `/practice/` URL contract uses `problems=` | **CONFIRMED true** | `src/engine/practiceDefinitionUrl.ts`: `COMMON_PARAMETERS` includes `problems`; the legacy `questions=` key is explicitly rejected, not aliased (`tests/practice-definition-url.test.ts`). Example: `/practice/?v=2&skill=multiplication-facts&facts=6,7,8&mode=timed&duration=120&problems=50`. |
| Create prefill contract (`?skill=`, `?facts=`, `?divisors=`) exists; Times Table/Divide By leaves link to it prefilled | **CONFIRMED true** | New `src/engine/createPracticePrefill.ts`; both leaf templates call `buildCreatePracticePrefillHref('multiplication-facts'|'division-facts', [n])`, covered by `tests/create-practice-prefill.test.ts`. |
| Create/Practice funnel analytics exist, privacy-conscious | **CONFIRMED true — no further instrumentation requirement needed** | `src/lib/createPracticeAnalytics.ts` fires `create_practice_type_select`, `create_practice_copy_link`, `create_practice_preview`, plus existing `shared_practice_*` events; a runtime allowlist strips facts/divisors/URLs/session IDs (`tests/create-practice-analytics.test.ts`). |
| Speed Drill is a polished, modern page with Personal Best, How It Works, FAQ, Related Practice | **CONFIRMED true** | `arithmetic-speed-drill.astro` has all listed sections; the Start button reads "Start 60-Second Drill"; Related Practice sits after the FAQ. |
| Times Table leaves (`/multiplication/times-tables/[n]`) are thin/templated | **REJECTED — false, for all 12** | Direct read of `[table].astro`: a code comment states *"Every 1–12 page now uses the mature operation-specific fact bank"* — `getTimesTableFact(tableNumber)` is unconditional, and `EXPANDED_INTRO` has hand-written entries for all 12 tables, each with a unique Quick Answer, Strategy, Parent & Teacher Guidance, and a 5th FAQ differentiator, sourced from a validated fact bank (`npm run validate:times-tables`). This is materially better than `docs/seo/SEO_AEO_GEO_AUDIT.md` currently describes (that doc still documents a 3-table pilot — the **doc is stale relative to code**, a documentation-hygiene note, not a product gap; not actioned in this backlog). Remaining, confirmed-real weaknesses: (a) the "What You'll Practice" bullet list and (b) the "Use Commutativity" card are still literal templated boilerplate (digit swapped only); (c) no visible per-table reference grid exists on the page (only buried in one FAQ answer's prose). |
| Divide By leaves need the same treatment as Times Tables | **PARTLY true — one confirmed, narrow inconsistency** | Direct read of `[divisor].astro`: the fact bank (`divideBy.ts`) covers all 12 divisors, and Strategy/Parent-Teacher content is fact-bank-driven for all 12, but `matureFaqItems` (the newer, tighter FAQ) is gated `fact && divisor <= 5` — divisors 6–12 fall back to the older `legacyFaqItems`. `EXPANDED_INTRO` is likewise hand-tailored only for divisors 1–6; 7–12 use a generic wrapper template. Real, narrow, confirmed gap — not "leaves are thin." |
| Grade pages are thin link-hubs | **REJECTED — false** | Real unique per-grade content (skills checklist, grade-specific pedagogy cards, 4–5 unique FAQ items, `LearningResource`+`FAQPage` JSON-LD). Confirmed *different* gap: no embedded practice widget on any grade page. |
| My Progress is underdeveloped | **REJECTED — false** | `ProgressDashboard.tsx` (680 lines): empty-state CTA, 14 achievement badges, operations-strength chart, 35-day calendar, recent sessions, guarded reset flow. `storage.ts` recently got a real correctness fix (timed-session completion semantics) unrelated to content depth. Only a minor, already-tracked note: `progress.astro`'s static crawlable prose is borderline-thin (~170–190 words) since most content is client-rendered from localStorage. |
| `/create/` needs supporting content and forced indexing | **REJECTED — already done** | `create.astro` has an intro, "Create Math Practice Without an Account" section, "What Can I Create?" grid, a 5-item FAQ + JSON-LD, footer links. Sitemap inclusion and non-noindex are asserted by `scripts/test-build-contract.mjs`. |
| Sitemap/robots/canonical/structured data are unhealthy or missing `/create/`, leaves, etc. | **REJECTED — infra is mature** | `@astrojs/sitemap`'s filter is exclusion-based (not allowlist), so it includes `/create/`, all 24 generated leaves, grade pages, worksheets, and `/progress/` by default; `scripts/test-build-contract.mjs` asserts this plus `/practice/` exclusion and noindex. `BaseLayout.astro` emits a consolidated Organization/WebSite JSON-LD graph site-wide plus per-page `LearningResource`/`FAQPage`/`BreadcrumbList`. `/addition-practice` and `/subtraction-practice` — flagged in the older roadmap doc as orphan/duplicate-content pages needing resolution — **no longer exist as pages at all**; confirmed via `Glob`, they are now pure `astro.config.mjs` redirects, excluded from the sitemap. **This item is stale/already resolved and is not carried into this backlog.** |
| Technical SEO — real, still-open gaps | **CONFIRMED, narrow** | (1) Internal nav/footer links in `HubLayout`/`PracticeLayout`/`index.astro` omit trailing slashes while canonicals always force one — a live mismatch (`trailingSlash` unset in `astro.config.mjs`). (2) `PracticeLayout.astro` emits `BreadcrumbList` JSON-LD unconditionally even when `breadcrumbVisual={false}` hides the visible trail (true on all 24 generated leaves) — flagged for validation, not assumed to be a defect (see GROWTH-005B). (3) No `/division/divide-by/index.astro` divisor grid exists (confirmed via `Glob`) — `/division/divide-by/8` sits 4 clicks from home, the deepest page on the site, while multiplication already has a times-table index. |
| Multiplication chart, Daily/Mixed Review do not exist | **CONFIRMED — true, real gaps** | No route, component, or preset for either concept anywhere in `src/`. |
| Worksheets are a shallow, shared-generator tool, not top-3 priority | **CONFIRMED** | One `WorksheetGenerator.tsx`, `PROBLEM_COUNT = 12` fixed, 4 operation pages reusing it. Matches research; no Tier A/B requirement needed. |
| Trust surface lacks contact/accessibility/ownership info | **CONFIRMED** | Grepped `about.astro`, `privacy.astro`, `terms.astro`, `for-parents.astro`, `for-teachers.astro` for contact/email/mailto — zero actual contact mechanisms; no accessibility statement; no named owner/entity beyond the brand. |
| Speed-drill operation-specific variants would be easy to build | **CONFIRMED, not yet built** | `PracticeConfig.operations` is already the exact seam `SpeedDrillSetup.tsx` uses client-side; no URL-addressable per-operation route exists yet. Validate via GSC before building (research's own "MAYBE" verdict). |

---

## Tier A — Execute (exact order)

Ordering rationale (acquisition-first): traffic-producing assets first, cleanup second, expansion after evidence. The flow is (1) a one-time measurement baseline, (2) the one truly tiny structural fix that's obviously worth doing regardless of what else ships, (3) the Multiplication Chart — the single strongest confirmed acquisition/link-magnet asset in this backlog, targeted as one of the very next major builds rather than a later 90-day project, (4) targeted arithmetic-cluster strengthening that reuses existing content investments, (5) Daily/Mixed Review — a separate, independently-justified acquisition + distribution + retention bet, queued after the Chart for sequencing reasons only, not because its priority depends on the Chart's results, and only then (6) narrower hygiene/trust/measurement work that is useful but not itself a traffic driver.

### GROWTH-001 — Establish Search Console baseline for the multiplication/times-table cluster
- **Tier:** A · **Status:** Ready · **Mechanism:** none (validation gate)
- **Confirmed repository gap:** no GSC baseline currently referenced anywhere in the repo/docs for this cluster.
- **External evidence:** research flags times-table SERPs as "penetrable" but all volume/position figures are directional, not measured.
- **Strategic rationale:** protects existing rankings — do not rewrite metadata/content on pages that may already rank well, and gives a pre-Chart-launch baseline to compare against post-launch.
- **Confidence:** Very High · **Traffic upside:** Indirect · **Execution score:** Excellent · **Engineering effort:** Very Low · **Design effort:** None · **Time to impact:** Immediate
- **Dependencies:** none
- **Exact scope:** GSC property for mathpracticeonline.com; no code.
- **Implementation requirements:**
  - [ ] Pull 28-day and 3-month impressions/clicks/CTR/avg. position for: `/multiplication/`, `/multiplication/facts/`, all 12 `/multiplication/times-tables/[n]/`, `/create/`, `/arithmetic-speed-drill/`.
  - [ ] Record query overlap/cannibalization between `/multiplication/facts/` and individual `/times-tables/[n]/` pages.
  - [ ] Record whether `/create/` shows any impressions for "generator/custom/no login" query patterns.
- **Non-goals / DO NOT TOUCH:** no metadata/content changes triggered directly by this item.
- **Testing requirements:** none.
- **Success metrics:** GSC position buckets recorded per page.
- **Measurement interval:** one-time baseline, then re-check after GROWTH-006 ships.
- **Continue condition:** always continue — this is a data pull, not a bet.
- **Stop / rethink condition:** n/a.

### GROWTH-004 — Add `/division/divide-by/index.astro` divisor grid
- **Tier:** A · **Status:** Ready · **Mechanism:** Acquisition, Distribution
- **Confirmed repository gap:** `multiplication/times-tables/index.astro` exists and links to all 12 tables; no equivalent exists for division (confirmed absent via `Glob`).
- **External evidence:** research's internal-link audit implicitly assumes symmetry between the two families; repo inspection found the asymmetry directly.
- **Strategic rationale:** brings `/division/divide-by/[n]` from crawl depth 4 (the single deepest page family on the site) to depth 3, matching multiplication, and gives a natural link target for the future Chart's division-side cross-links.
- **Confidence:** Very High · **Traffic upside:** Medium · **Execution score:** Excellent · **Engineering effort:** Very Low · **Design effort:** Low · **Time to impact:** Weeks
- **Dependencies:** none
- **Exact scope:** new `src/pages/division/divide-by/index.astro` (mirror `multiplication/times-tables/index.astro`); one new link from `src/pages/division/index.astro`.
- **Implementation requirements:**
  - [ ] Create the index page with a 1–12 grid linking to each `/division/divide-by/[n]/`.
  - [ ] Add breadcrumb + `BreadcrumbList`/`LearningResource` JSON-LD matching the times-tables index pattern.
  - [ ] Link it from `division/index.astro`.
- **Internal-link requirements:** reduces crawl depth of all 12 divide-by leaves by one hop.
- **Non-goals / DO NOT TOUCH:** do not change the multiplication times-tables index; do not touch leaf page content here (see GROWTH-002).
- **Testing requirements:** extend `tests/routes-components.test.ts`-style route-existence assertions; add to `scripts/test-build-contract.mjs` sitemap inclusion checks.
- **Visual QA:** grid at mobile/desktop widths.
- **Success metrics:** GSC impressions for "divide by N"/"division facts N" queries; crawl-depth improvement (qualitative).
- **Measurement interval:** 4–8 weeks post-ship.
- **Continue condition:** ship as-is; low risk, additive only.
- **Stop / rethink condition:** none expected.

### GROWTH-006 — Ship the interactive + printable Multiplication Chart (`/multiplication-chart/`)
- **Tier:** A · **Status:** Ready · **Mechanism:** Acquisition + Authority
- **Confirmed repository gap:** no route, component, or content for a multiplication chart exists anywhere in `src/`.
- **External evidence:** research identifies this as the strongest link-earning opportunity — SERPs saturated with static PDF libraries (e.g. DadsWorksheets' 133 variants) but weak on modern interactive + printable canonical pages; strong, evergreen, high-volume demand.
- **Strategic rationale:** the single highest-confidence new-page bet in this backlog. Targeted as one of the next major builds after only the GSC baseline and the divide-by index — near-term (within the next few weeks of active work), not a project that waits until late in a 90-day window, and not held behind smaller cleanup tasks.
- **Confidence:** High · **Traffic upside:** High · **Execution score:** Exceptional · **Engineering effort:** Medium · **Design effort:** Medium · **Time to impact:** Months
- **Dependencies:** none. (Re-evaluated: a per-table/per-divisor fact *list* — GROWTH-003 — and a full interactive 12×12 *matrix* with row/column highlighting, keyboard navigation, touch interaction, print layout, and a blank variant are different UI complexity classes, not the same rendering concern. The only thing they share is trivial fact computation (`i*j` for `i,j` in 1–12), which does not warrant a shared UI abstraction. GROWTH-003 is not a prerequisite and this item may proceed without it — see GROWTH-003's own card for its now-independent justification.)
- **Exact scope:** new route `src/pages/multiplication-chart.astro` (or `/multiplication-chart/index.astro`); new interactive grid component; print stylesheet additions.
- **Implementation requirements:**
  - [ ] 1–12 interactive grid with row/column highlighting on hover/focus/touch.
  - [ ] Full keyboard accessibility (arrow-key or tab navigation across cells, visible focus states).
  - [ ] Static, readable fallback markup (works with JS disabled / for crawlers).
  - [ ] Print-friendly CSS layout; black-and-white print variant; blank/fill-in variant.
  - [ ] Canonical, title, meta description, breadcrumb.
- **Content requirements:** concise answer-first intro ("What is a multiplication chart / how to read it"), 4–6 item FAQ.
- **Engine requirements:** build a purpose-built interactive grid component. It may share a trivial fact-computation helper with GROWTH-003 if convenient, but must not be blocked on or forced to reuse GROWTH-003's UI — keep the two components separate.
- **Design requirements:** premium, calm visual treatment consistent with the site's existing polish (Speed Drill / Times Table leaves as the bar); mobile-first since teachers will project and print from varied devices.
- **SEO / infrastructure requirements:** include in sitemap (automatic per the exclusion-filter default — confirm via `scripts/test-build-contract.mjs`); `LearningResource` + `FAQPage` + `BreadcrumbList` JSON-LD.
- **Internal-link requirements:** link from `multiplication/index.astro`, `multiplication/facts.astro`, every Times Table leaf, and (new) the divide-by index (GROWTH-004) — reciprocal linking both directions.
- **Accessibility/performance requirements:** keyboard operability is a hard requirement, not a nice-to-have, given the "interactive" positioning; verify no CLS from print-CSS media queries.
- **Non-goals / DO NOT TOUCH:** do not build a downloadable PDF pipeline in this first pass — defer until print-CSS is proven insufficient for teacher expectations (validate via GSC/user feedback post-launch); do not build a matrix of size variants (1–10, 1–15, 1–20, etc.) — one canonical 1–12 asset only.
- **Testing requirements:** build-contract assertions (sitemap inclusion, canonical, no query-string leakage); keyboard-navigation test if feasible within the existing lightweight test harness.
- **Visual QA:** desktop/tablet/mobile, print preview in at least one browser, screen-reader pass over the static fallback.
- **Success metrics:** GSC impressions/clicks/position for "multiplication chart"/"times table chart"/"printable multiplication chart" queries; referring-domains growth (if available); GA4 landing-page new users.
- **Measurement interval:** check indexing status within 2 weeks; impressions/clicks at 4 and 12 weeks.
- **Continue condition:** indexed and accumulating impressions within expected timeframe → continue investing in internal links/promotion.
- **Stop / rethink condition (Chart-specific only):** if no meaningful impressions or referring links after ~90 days post-indexing, do not build additional chart variants (bigger grids, more print styles). This condition is scoped to the Chart alone — it is not evidence against Daily/Mixed Review (GROWTH-009) or any other unrelated asset, which has its own independent success/stop criteria.

### GROWTH-002 — Close the Divide-By 6–12 FAQ/intro maturity gap
- **Tier:** A · **Status:** Ready · **Mechanism:** Acquisition, Product Quality
- **Confirmed repository gap:** `src/pages/division/divide-by/[divisor].astro` gates `matureFaqItems` on `fact && divisor <= 5`; divisors 6–12 render the older `legacyFaqItems` and a generic fallback intro instead of a hand-tailored one, despite the underlying fact bank (`divideBy.ts`) having all 12 divisors fully reviewed.
- **External evidence:** research's inference that Divide-By leaves need the same treatment as Times Tables is only partly right — this is the precise, narrow place where that's true.
- **Strategic rationale:** targeted arithmetic-cluster strengthening — closes a real content-consistency gap using data that already exists; no new data authoring needed beyond intro prose for 7 divisors.
- **Confidence:** High · **Traffic upside:** Low–Medium · **Execution score:** Strong · **Engineering effort:** Low · **Design effort:** None · **Time to impact:** Weeks
- **Dependencies:** none
- **Exact scope:** `src/pages/division/divide-by/[divisor].astro` only.
- **Implementation requirements:**
  - [ ] Extend `EXPANDED_INTRO` with hand-written entries for divisors 7–12, parallel in style/length to the existing 1–6 entries (not the generic wrapper template).
  - [ ] Remove the `divisor <= 5` gate on `matureFaqItems` so all 12 divisors render the mature FAQ shape; verify none of its fields are actually divisor-range-specific in content (they are not, per source read — the gate was incidental to rollout order, not a content limitation).
- **Content requirements:** 6 new intro paragraphs (divisors 7–12), matching the 40–70 word target already used elsewhere on the site.
- **Non-goals / DO NOT TOUCH:** do not touch Times Table leaves (already uniform across all 12); do not add a new fact-bank field.
- **Testing requirements:** add a test asserting all 12 divisors render the mature FAQ item shape and a non-generic intro.
- **Visual QA:** spot-check divisors 6, 9, 12.
- **Success metrics:** GSC query mix improvement for divide-by-N queries currently served by weaker content (secondary to GROWTH-001's baseline).
- **Measurement interval:** 4–8 weeks.
- **Continue condition:** ship as-is; low risk.
- **Stop / rethink condition:** none expected.

### GROWTH-003 — Add a per-table/per-divisor fact-reference list
- **Tier:** A · **Status:** Ready · **Mechanism:** Acquisition, Product Quality
- **Confirmed repository gap:** no page renders a visible list of all 12 facts for a given table/divisor — the full list only exists buried inside one FAQ answer's prose (`tableList`/`sampleFacts` strings in `[table].astro`/`[divisor].astro`).
- **External evidence:** research names a clean, extractable reference table as valuable for both users and AI answer engines.
- **Strategic rationale (revised):** independently worthwhile as a content upgrade to all 24 already-mature leaves — not, as previously drafted, a shared architecture the Multiplication Chart depends on. A 12-row fact list (`N×1=… … N×12=…`) and a full interactive 12×12 matrix with highlighting/keyboard nav/touch/print/blank-variant are genuinely different UI complexity classes; forcing them into one abstraction would be premature. This item stands on its own acquisition/product-quality merit and can ship independently of, and in any order relative to, GROWTH-006.
- **Confidence:** High · **Traffic upside:** Medium · **Execution score:** Strong · **Engineering effort:** Low–Medium · **Design effort:** Low · **Time to impact:** Weeks
- **Dependencies:** none
- **Exact scope:** new small component (e.g. `src/components/FactReferenceList.tsx` or `.astro`); consumed by `[table].astro` and `[divisor].astro`.
- **Implementation requirements:**
  - [ ] Build a component taking a base number (table or divisor) and rendering a compact 12-row fact list (`N×1=… … N×12=…` or `N÷N=1 … 12N÷N=12`).
  - [ ] Wire it into both leaf templates, replacing the prose-buried fact list currently used only in one FAQ answer.
  - [ ] Keep styling consistent with existing leaf-page card patterns (`PracticeLayout` content slots).
- **Design requirements:** compact, scannable, mobile-safe (12 rows or a 3×4/4×3 grid).
- **Non-goals / DO NOT TOUCH:** not a substitute for the full Chart's highlight/print/blank-variant features; do not add print/PDF here; do not build this as a shared primitive with GROWTH-006 — keep the components separate.
- **Testing requirements:** unit test for the component's fact generation given a base number 1–12.
- **Visual QA:** all 12 tables and 12 divisors, mobile and desktop.
- **Success metrics:** none traffic-direct beyond the leaf pages' existing GROWTH-001 baseline; framed as a content-depth/product-quality improvement.
- **Measurement interval:** n/a (small content/infra item).
- **Continue condition:** ship as-is.
- **Stop / rethink condition:** none expected.

### GROWTH-009 — Daily/Mixed Review warm-up tool (queued after the Multiplication Chart)
- **Tier:** A · **Status:** Ready (queued — see sequencing note) · **Mechanism:** Acquisition + Distribution + Retention
- **Confirmed repository state:** no route/component/preset exists for this concept anywhere in `src/`. Full engine reuse is available: `PracticeConfig`, the shared generator, `PracticeWidget`, `storage.ts` — the same primitives every other practice page already uses.
- **External evidence:** research independently identifies a credible SERP gap (paid Teachers Pay Teachers products and blog posts dominate "daily math practice"/"math warm up"/"bell ringer math"/"spiral review"; no dominant free interactive tool).
- **Strategic rationale:** this is promoted to Tier A because its evidence stands on its own — it is a different growth bet from the Multiplication Chart (Acquisition + Distribution + Retention / classroom-habit formation, vs. the Chart's Acquisition + Authority / natural-link angle), independently justified by the research's SERP-gap finding, not by the Chart's performance. It is sequenced *after* the Chart in execution order for engineering-bandwidth reasons only (it is the single largest build in the near-term roadmap, ~1–2 weeks) — **not** because Chart underperformance would invalidate it, and **not** gated on the Chart's GSC/link-earning results. If the Chart is delayed for its own reasons, this item does not need to wait indefinitely; it only needs the Chart's implementation effort to clear first.
- **Confidence:** Medium-High · **Traffic upside:** High (if the SERP-gap thesis holds) · **Execution score:** Excellent · **Engineering effort:** Medium · **Design effort:** Medium · **Time to impact:** Months
- **Dependencies:** none (sequenced after GROWTH-006 for engineering bandwidth, not as a technical or evidentiary dependency)
- **Exact scope:** new route (e.g. `/daily-math-practice/` or `/math-warm-up/`); new deterministic mixed-set config; reused `PracticeWidget`/generator/storage.
- **Implementation requirements (own product/architecture validation still applies before implementation — this is about scope, not about waiting on the Chart):**
  - [ ] Confirm the deterministic mixed-set/config approach (grade-level selection, mixed operations) against the existing `PracticeConfig` shape.
  - [ ] Decide projector-mode and printable-companion scope up front (per the owner's preference for a polished launch, not a deliberately weak MVP), even though the internal build order below stages the work.
- **Staged build sequence internally (an internal build order, not a phased public launch):**
  1. Deterministic mixed-set config (reuse `PracticeConfig`/generator).
  2. Page + widget integration (reuse `PracticeWidget`).
  3. Projector/warm-up mode (large-type, whole-class display).
  4. Printable companion.
  5. Internal linking from hubs, grade pages, and For Teachers.
- **Non-goals / DO NOT TOUCH:** do not ship a deliberately weak MVP; do not gate this item's priority on GROWTH-006's GSC results.
- **Testing requirements:** unit tests for the deterministic mixed-set generation; route-existence/build-contract assertions once shipped.
- **Visual QA:** desktop/tablet/mobile, projector-mode legibility at distance, print preview.
- **Success metrics (its own, independent of the Chart):** GSC impressions/clicks for "daily math practice"/"math warm up"/"bell ringer math"/"spiral review" queries; GA4 classroom-session/repeat-visit patterns; projector-mode and print-companion usage.
- **Measurement interval:** 4 and 12 weeks post-ship.
- **Continue condition:** ship as-is once its own product/architecture validation is complete; do not hold for Chart performance data.
- **Stop / rethink condition:** if actual usage post-launch contradicts the hypothesis (low classroom adoption, low repeat sessions), adjust before any further expansion of this feature. This is evaluated entirely on its own metrics — a disappointing Chart outcome is not evidence against this item, and vice versa.

### GROWTH-005A — Normalize internal trailing-slash links
- **Tier:** A · **Status:** Ready · **Mechanism:** Authority, Product Quality (crawl hygiene)
- **Confirmed repository gap:** `HubLayout.astro`/`PracticeLayout.astro`/`index.astro` footer and nav links (e.g. `/addition`, `/multiplication`, `/arithmetic-speed-drill`, `/1st-grade-math-practice`) omit trailing slashes while every canonical tag (`BaseLayout.astro`) forces one — a live, concrete mismatch. `astro.config.mjs` has no `trailingSlash` setting to normalize this at the framework level.
- **External evidence:** research explicitly calls out checking "trailing-slash consistency" as a technical-SEO item.
- **Strategic rationale:** small, safe, confirmed inconsistency; low cost to fix, avoids an unnecessary redirect hop on every internal nav click.
- **Confidence:** High · **Traffic upside:** Low · **Execution score:** Moderate · **Engineering effort:** Low · **Design effort:** None · **Time to impact:** Immediate
- **Dependencies:** none
- **Exact scope:** `src/layouts/HubLayout.astro`, `src/layouts/PracticeLayout.astro`, `src/pages/index.astro`, `src/pages/404.astro` (the four files that hand-duplicate header/footer chrome).
- **Implementation requirements:**
  - [ ] Add trailing slashes to all internal `href`s in these four files' nav/footer blocks.
  - [ ] Confirm `SiteHeader.astro`'s data-driven links (`practiceNav.ts`) are already consistent (spot-checked, not fully audited in this backlog — verify during implementation).
- **Non-goals / DO NOT TOUCH:** do not set a global `trailingSlash` config option in `astro.config.mjs` without separately verifying it doesn't change build output shape for existing routes; this item is scoped to link text only.
- **Testing requirements:** `scripts/test-build-contract.mjs` or a lightweight grep-based test confirming no bare (non-slashed) internal hrefs remain in the four files.
- **Success metrics:** none directly measurable; hygiene item.
- **Measurement interval:** n/a.
- **Continue condition:** ship as-is.
- **Stop / rethink condition:** none.

### GROWTH-007 — Add contact mechanism + accessibility statement
- **Tier:** A · **Status:** Ready · **Mechanism:** Authority, Product Quality, Trust
- **Confirmed repository gap:** grepped `about.astro`, `privacy.astro`, `terms.astro`, `for-parents.astro`, `for-teachers.astro` for contact/email/mailto — zero actual contact mechanisms found (only reassurance that *users* don't need to give an email); no accessibility statement anywhere; no named owner/entity beyond the "Math Practice Online" brand.
- **External evidence:** research names contact + accessibility statement as modest, high-trust, AI-citation-friendly additions — explicitly not expected to drive large direct traffic.
- **Strategic rationale:** cheap, low-risk trust surface improvement; realistic expectations set (Authority/Trust, not Acquisition).
- **Confidence:** High · **Traffic upside:** Indirect · **Execution score:** Moderate · **Engineering effort:** Low · **Design effort:** Low · **Time to impact:** Immediate
- **Dependencies:** none
- **Exact scope:** `src/pages/about.astro` (or a new `/contact` mailto link in footer), new accessibility-statement content (own page or a section on `about.astro`).
- **Implementation requirements:**
  - [ ] Add a `mailto:` contact link (footer and/or About page) — no form/backend needed, preserving the no-backend architecture.
  - [ ] Add a short accessibility statement (WCAG-aligned intent language, no formal audit claimed unless one has actually been performed).
- **Non-goals / DO NOT TOUCH:** do not add a contact form requiring backend infrastructure; do not overstate accessibility conformance.
- **Testing requirements:** none beyond build success.
- **Success metrics:** none traffic-direct; qualitative trust signal.
- **Measurement interval:** n/a.
- **Continue condition:** ship as-is.
- **Stop / rethink condition:** none.

### GROWTH-008 — Wire Create Classroom Practice funnel + GSC dashboards into ongoing measurement
- **Tier:** A · **Status:** Ready · **Mechanism:** Distribution (measurement, not code)
- **Confirmed repository gap:** none in the code — analytics already exist (`createPracticeAnalytics.ts`) and are correctly privacy-scoped. The gap is operational: nothing in this backlog process currently confirms these events are visible/segmentable in GA4, or that GSC is being checked on a cadence.
- **External evidence:** research's own measurement-plan section calls for tracking Create → copy-link events and drill completions.
- **Strategic rationale:** cheap, no-code task that gives every later Tier B validation decision (speed-test promotion, Chart link-earning, Daily Review adoption) real signal instead of guesswork.
- **Confidence:** Very High · **Traffic upside:** Indirect · **Execution score:** Strong · **Engineering effort:** Very Low · **Design effort:** None · **Time to impact:** Immediate
- **Dependencies:** none
- **Implementation requirements:**
  - [ ] Confirm `create_practice_type_select`, `create_practice_copy_link`, `create_practice_preview`, and `shared_practice_*` events are flowing into GA4 and buildable into a simple funnel view.
  - [ ] Set a recurring (e.g. monthly) checkpoint against the GROWTH-001 GSC baseline.
- **Non-goals / DO NOT TOUCH:** no new event instrumentation — it already exists and is correctly scoped.
- **Success metrics:** funnel visibility itself is the deliverable.
- **Measurement interval:** monthly checkpoint.
- **Continue condition:** ongoing.
- **Stop / rethink condition:** n/a.

---

## Tier B — Validate Then Execute

### GROWTH-005B — BreadcrumbList JSON-LD on pages with a hidden visual breadcrumb
- **Tier:** B · **Status:** Needs validation · **Mechanism:** Authority (structured-data hygiene)
- **Confirmed repository gap:** `PracticeLayout.astro` emits `BreadcrumbList` JSON-LD unconditionally whenever a `breadcrumb` prop is supplied, independent of `breadcrumbVisual` (which only gates the visible `<nav>` trail) — true on all 24 generated Times Table/Divide By leaves, which pass `breadcrumbVisual={false}`.
- **External evidence:** none specific — this was surfaced by repository inspection, not the external research.
- **Strategic rationale:** **do not assume this is a defect.** Schema.org's `BreadcrumbList` does not require a matching visible UI element, and there is no confirmed Google guidance mandating visual/schema parity for breadcrumbs specifically (unlike FAQPage, where a real deprecation is documented). Implementing a "fix" here without evidence would be exactly the SEO busywork this backlog is supposed to avoid.
- **What promotes this to Tier A:** (a) Google's Rich Results Test or Search Console surfaces an actual manual-action/warning on these URLs because of the mismatch, or (b) a concrete product reason emerges to show the visible trail on those pages (e.g. a UX finding that users get lost without it).
- **Confidence:** Medium · **Traffic upside:** Low · **Execution score:** Weak (as currently understood — no confirmed problem) · **Engineering effort:** Low if promoted · **Time to impact:** n/a until validated
- **Recommended action now:** none beyond documentation. Optionally add a one-line code comment in `PracticeLayout.astro` explicitly noting the decoupling is intentional (some prior documentation of this already exists per the codebase's own comments). Do not change page output.
- **Stop / rethink condition:** if validation surfaces no real issue after checking Rich Results Test once, close this item permanently rather than re-raising it in future backlog revisions.

### GROWTH-B1 — Operation-specific Speed Drill URL (e.g. `/arithmetic-speed-drill/multiplication`)
- **Tier:** B · **Status:** Needs validation · **Mechanism:** Acquisition
- **Confirmed repository state:** `PracticeConfig.operations` is already the exact seam `SpeedDrillSetup.tsx` uses client-side to filter by operation; no URL-addressable per-operation route exists yet. The single shared `storageKey: 'speed-drill'` means a new dedicated page would need its own storage key to track a separate Personal Best — a real, non-trivial wrinkle, not just routing.
- **External evidence:** research downgraded its own recommendation here to "MAYBE / validate first," citing cannibalization risk against the canonical mixed Speed Drill.
- **What promotes this to Tier A:** GSC shows meaningful impressions for operation-specific queries ("multiplication speed test," "timed multiplication test," "mad minute math") not already captured by `/arithmetic-speed-drill/`'s existing query mix, **or** that page's GSC data shows it isn't ranking for such intent despite impressions existing elsewhere.
- **If promoted:** build only the single highest-evidence operation (do not build a matrix of near-duplicate pages); give it a distinct `storageKey`; keep `/arithmetic-speed-drill/` as the canonical mixed page per the research's own cannibalization-avoidance framing.
- **Confidence:** Medium · **Traffic upside:** Medium (if promoted) · **Engineering effort:** Low (if promoted)
- **Dependencies:** GROWTH-001-style query-mix check specifically on `/arithmetic-speed-drill/`.
- **Stop / rethink condition:** if GSC shows `/arithmetic-speed-drill/` already earns operation-specific-test impressions, skip this permanently.

### GROWTH-B3 — Grade pages: embed a quick mixed-practice widget
- **Tier:** B · **Status:** Needs validation · **Mechanism:** Product Quality, secondary Acquisition
- **Confirmed repository gap:** no grade page (`1st`–`5th-grade-math-practice.astro`) embeds a practice widget (`slot="widget"` is never used on any of them) — confirmed real, but this is a different gap than "thin content" (grade pages already have substantial unique copy).
- **What promotes this to Tier A:** GSC confirms grade pages receive meaningful impressions/clicks worth improving engagement on, rather than functioning purely as internal-link support for other pages.
- **If promoted:** reuse `PracticeWidget` with a grade-appropriate mixed preset; do not rewrite the surrounding page content, which is already good.
- **Confidence:** Medium · **Traffic upside:** Low-Medium

### GROWTH-B4 — UK Multiplication Tables Check (MTC) simulator
- **Tier:** B · **Status:** Needs validation (timing-gated) · **Mechanism:** Acquisition (seasonal)
- **Confirmed repository state:** no MTC-specific content/config exists.
- **External evidence:** statutory UK Year-4 check; 25 questions, tables 2–12 weighted toward 6/7/8/9/12, 6-second-per-question timing. The 2026 window (1–12 June, catch-up 15–19 June) has already passed as of this document's writing (current date: September 2026); the next relevant window is **June 2027**.
- **What promotes this to active work:** proximity to the June 2027 window (build in **spring 2027**, not off-season) and/or confirmed non-trivial UK traffic share in GA4 geography reports.
- **If promoted:** engine reuse is straightforward — a 25-question, divisor-weighted timed preset, close to existing `PracticeConfig` shapes.
- **Confidence:** Medium · **Traffic upside:** Medium, seasonal · **Stop / rethink condition:** do not build off-season without a clear spring 2027 ship date.

---

## Tier C — Later / Exploratory

- **Fractions engine** — explicitly deferred per research and confirmed absent from the repo; no premature scaffolding. Revisit only after the arithmetic pillar is fully optimized and the domain has more authority.
- **Broad K–5 topic sprawl / new grade-page SEO expansion** targeting head "Nth grade math" terms — coverage would be too incomplete to compete with IXL/Khan; grade pages stay internal-linking support (see GROWTH-B3 for the one validated exception).
- **Large worksheet-library expansion** to Math-Drills/Math-Aids scale — not a near-term acquisition bet per both research and repo state (already a functional, shallow-by-design tool).
- **Teacher accounts/dashboards/backend/rosters** — would break the no-login architecture; explicitly protected in `docs/expansion-foundation-plan.md`.
- **QR code on Create share links, saved/recent local presets, projector mode specifically for Create, printable companion for Create** — real Distribution/Retention polish, but should not preempt Tier A acquisition work per the primary-objective ordering.
- **Full `SITE`-constant config centralization** across ~38 files — mechanical hygiene, no traffic effect, already tracked as deferred in `docs/seo/SEO_AEO_GEO_AUDIT.md`.
- **`llms.txt`, self-hosted fonts, `twitter:site` tags** — already explicitly gated behind owner approval in `docs/seo/SEO_AEO_GEO_AUDIT.md`; not re-litigated here.
- **Operation-specific speed-test page matrix** (more than the single validated variant in GROWTH-B1) — explicitly rejected; cannibalization risk against the canonical Speed Drill.

---

## Rejected / Deferred Recommendations (explicit)

1. **"Add Create to nav/footer/homepage/for-teachers discoverability"** — already fully shipped on current `development`. Confirmed by direct source read + passing tests.
2. **"`/create/` needs supporting content"** — already shipped (FAQ, how-it-works, JSON-LD).
3. **"Times Table leaves are thin/templated"** — false for all 12 as of current HEAD. `docs/seo/SEO_AEO_GEO_AUDIT.md`'s description of a 3-table pilot is itself stale documentation, flagged here for hygiene but not actioned as a growth item.
4. **"Sitemap/robots missing `/create/` or leaves"** — false; the mature exclusion-filter sitemap and `scripts/test-build-contract.mjs` already assert this.
5. **"`/addition-practice`/`/subtraction-practice` orphan duplicate-content pages need resolving"** — already resolved; these are now pure redirects, not pages, and excluded from the sitemap.
6. **Aggressive metadata/title rewrites on already-indexable pages** — blocked pending GROWTH-001's GSC baseline; do not rewrite what may already be ranking well.
7. **Operation-specific Speed Drill pages as an immediate, unconditional build** — kept in Tier B pending GSC validation, consistent with the research's own "MAYBE" and the real cannibalization risk against the canonical mixed Speed Drill.
8. **FAQPage schema as a rich-result play** — content is retained for users/AEO only; not justified by rich results (Google deprecated FAQ rich results May–Aug 2026, matching research). No new FAQ schema work is scoped for that reason anywhere in this backlog.
9. **"Fix" BreadcrumbList emitted alongside a hidden visual breadcrumb, as an unconditional Tier A task** — moved to Tier B (GROWTH-005B) pending actual evidence of a problem; implementing this without evidence would itself be SEO busywork.
10. **Treating GROWTH-003 as a hard prerequisite for the Multiplication Chart** — re-evaluated on this revision. A 12-row per-table/per-divisor fact list and a full interactive 12×12 matrix with highlighting/keyboard nav/touch/print/blank-variant are different UI complexity classes; the only shared element (trivial `i*j` fact computation) doesn't justify a shared architecture. GROWTH-003 now stands as its own independently-justified item; GROWTH-006 has no dependency on it.
11. **Gating Daily/Mixed Review's priority on Multiplication Chart performance** — re-evaluated on this revision. These are different growth bets (Chart: Acquisition + Authority / link-earning; Daily Review: Acquisition + Distribution + Retention / classroom-habit formation), and the research's SERP-gap finding for Daily Review is independent evidence, not contingent on the Chart's results. Daily/Mixed Review (GROWTH-009) is promoted to Tier A; it is sequenced after the Chart only for engineering-bandwidth reasons.

---

## The Next 10 Requirements (execution order)

1. **GROWTH-001** *(Tier A — execute)* — Search Console baseline: multiplication/times-table cluster (validation, no code)
2. **GROWTH-004** *(Tier A — execute)* — Add `/division/divide-by/index.astro` divisor grid
3. **GROWTH-006** *(Tier A — execute)* — Multiplication Chart (`/multiplication-chart/`)
4. **GROWTH-002** *(Tier A — execute)* — Close Divide-By 6–12 FAQ/intro maturity gap
5. **GROWTH-003** *(Tier A — execute)* — Add a per-table/per-divisor fact-reference list
6. **GROWTH-009** *(Tier A — execute)* — Daily/Mixed Review warm-up tool (queued after the Chart for bandwidth, not evidence)
7. **GROWTH-005A** *(Tier A — execute)* — Normalize internal trailing-slash links
8. **GROWTH-007** *(Tier A — execute)* — Contact mechanism + accessibility statement
9. **GROWTH-008** *(Tier A — execute)* — Wire Create funnel + GSC dashboards into ongoing measurement
10. **GROWTH-B1** *(Tier B — validate first)* — Operation-specific Speed Drill, only if GSC justifies it

*(GROWTH-005B, GROWTH-B3, and GROWTH-B4 are intentionally not in this list — all three are validation/timing-gated Tier B items with no default action yet.)*

## Master Execution Order

1. GROWTH-001 *(Tier A)*
2. GROWTH-004 *(Tier A)*
3. GROWTH-006 *(Tier A)*
4. GROWTH-002 *(Tier A)*
5. GROWTH-003 *(Tier A)*
6. GROWTH-009 *(Tier A — queued after GROWTH-006 for bandwidth, not evidence)*
7. GROWTH-005A *(Tier A)*
8. GROWTH-007 *(Tier A)*
9. GROWTH-008 *(Tier A)*
10. GROWTH-005B *(Tier B — validation check only, Rich Results Test pass)*
11. GROWTH-B1 *(Tier B — validation, then build only if justified)*
12. GROWTH-B3 *(Tier B — validation-gated)*
13. GROWTH-B4 *(Tier B — timing-gated, spring 2027)*
14. Tier C items — not scheduled; revisit only after the above compounds and a fresh GSC/GA4 review.

## 30 / 90 / 365-Day View

- **Next 30 days:** GROWTH-001 (baseline) and GROWTH-004 (tiny structural fix) complete quickly; substantial, and ideally complete, progress on **GROWTH-006 (Multiplication Chart)** — this is a near-term build, not a later-quarter one. GROWTH-002 (Divide-By 6–12 maturity fix) can run in parallel given its small, independent scope.
- **Next 90 days:** GROWTH-006 shipped and past its first impressions checkpoint; GROWTH-003 (fact-reference list) shipped; **GROWTH-009 (Daily/Mixed Review)** underway or shipped depending on scope — its own product/architecture validation, not Chart performance, gates its start; GROWTH-B1 (operation-specific Speed Drill) validated via GSC and built only if justified; GROWTH-005A/007/008 (hygiene, trust, measurement) fit in alongside this window since none of them block or are blocked by the above.
- **Next 12 months:** arithmetic-fluency leadership consolidated (Chart + Times Table/Divide-By maturity + Daily Review as the default classroom habit); GROWTH-B4 (UK MTC simulator) executed in **spring 2027** if validated by then; GROWTH-B3 (grade-page widget) executed if validated; re-baseline GSC/GA4 and decide on a second topical pillar (fractions or further arithmetic depth) only after the above compounds.

## Measurement Plan (lean)

- **Google Search Console:** landing-page clicks/impressions/CTR/avg. position for the times-table cluster (GROWTH-001 baseline), `/create/`, and — post-launch — `/multiplication-chart/`, `/division/divide-by/index/`, and (once shipped) the Daily/Mixed Review page; query-mix check on `/arithmetic-speed-drill/` before building GROWTH-B1; periodic cannibalization check between `/multiplication/facts/` and individual leaves.
- **GA4:** `create_practice_*` and `shared_practice_*` event volumes (already instrumented — GROWTH-008 just dashboards them); new-users-by-landing-page; practice starts/completions; Daily/Mixed Review classroom-session and repeat-visit patterns once shipped.
- **Bing Webmaster Tools:** index-coverage spot check for `/multiplication-chart/` and the new divide-by index once shipped.
- **Stop conditions (summary — each asset's own, not transferable to unrelated assets):** if the times-table leaves already rank top 3–5 in GSC, skip further leaf metadata work and reallocate effort toward the Chart's promotion instead; if the Chart earns no meaningful impressions or referring links within ~90 days of indexing, do not build additional chart variants — this affects only future chart work, **not** Daily/Mixed Review's priority or continuation; if `/arithmetic-speed-drill/` already earns operation-specific-test impressions, skip GROWTH-B1 permanently; if Daily/Mixed Review's actual usage contradicts the SERP-gap hypothesis, adjust that item specifically before further expansion — this does not retroactively count against the Chart or any other shipped asset.
