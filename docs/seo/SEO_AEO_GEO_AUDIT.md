# Math Practice Online — SEO, AEO, GEO & Accessibility Audit

**Status:** Living document. Operating roadmap for post-launch SEO, AEO, GEO, topical-authority, accessibility, performance, and engagement improvements.

- **Site:** MathPracticeOnline.com
- **Created:** 2026-08-02
- **Last updated:** 2026-08-02
- **Purpose:** Give any future human contributor, Claude session, or Codex session a single source of truth for what was audited on this site, what's already fixed, what remains, why each item matters, what order to work in, and which decisions still need explicit human approval.
- **Scope:** Technical SEO, semantic SEO, GEO (Generative Engine Optimization), AEO (Answer Engine Optimization), AI discoverability, topical authority, internal linking, crawl efficiency, page quality, page experience, Core Web Vitals, structured data, metadata, accessibility, engagement, trust signals, and rich-result eligibility. Excludes backlink acquisition, content marketing, and publishing net-new pages — this is entirely about improving what already exists in the codebase.
- **Completed implementation reference:** [PR #116](https://github.com/wesley-perkins-software/math-practice/pull/116) (merged into `development`)
- **Current phase:** Structured-data consolidation (Organization/WebSite identity graph) — see [Implementation Log](#implementation-log).

---

## How this document works

This is the operating roadmap for ongoing site-quality work, not a one-time report. Each recommendation below is a checklist item with the full rationale preserved next to it — the checkbox alone is not the record, the paragraph under it is.

See [Maintenance rule](#maintenance-rule) at the bottom before editing this file.

---

## 1. Origin story: why this audit exists

Three months after launch, MathPracticeOnline.com had picked up steady organic traffic from Google, Bing, Yahoo, DuckDuckGo, and referral traffic from ChatGPT. Engagement was strong (high time-on-page, many answer submissions) and the technical foundation — sitemaps, robots.txt, redirects, canonical URLs, some structured data — was already in place. The site entered a "polish phase": a comprehensive audit across technical SEO, semantic SEO, GEO/AEO, accessibility, and engagement, explicitly scoped to *existing-codebase* improvements only (no new pages, no backlink/content-marketing work), with every recommendation classified by effort:

- **Quick Win** — under an hour
- **Medium Improvement** — a few hours
- **Large Project** — multiple days

A concrete symptom kicked off the investigation: Google was displaying `mathpracticeonline.com` as the site name in search results instead of "Math Practice Online". That question is answered in [Section 3](#3-why-google-was-showing-the-domain-instead-of-the-name).

Two rounds of investigation fed this document:

1. **Broad audit** — three parallel explorations across metadata/structured-data/title architecture, pages/presets/internal linking, and technical SEO infrastructure (sitemap, robots.txt, canonicals, accessibility, Core Web Vitals).
2. **Deep-dive audit** — a second, narrower pass focused specifically on internal linking depth, topical authority, semantic HTML, AEO/GEO, AI discoverability, crawl depth, orphan pages, thin pages, duplicate metadata, and engagement opportunities within the existing architecture.

---

## 2. Already fixed and shipped — PR #116

All of the following were implemented, build-verified (`npm run build`, 68 pages, no errors), and merged into `development` via [PR #116](https://github.com/wesley-perkins-software/math-practice/pull/116).

- [x] Add missing "Math Practice Online" brand suffix to ~15 page titles that were missing it — completed in PR #116. Affected: `math-worksheets/index.astro` and its 4 leaf worksheet pages, `math-facts.astro`, `division/facts.astro`, `division/remainders.astro`, `multiplication/facts.astro`, and the title templates for the 12 generated `/multiplication/times-tables/[table]` pages and 12 generated `/division/divide-by/[divisor]` pages.
- [x] Fix duplicated "Math Practice Online **Online**" titles — completed in PR #116. `src/pages/terms.astro` and `src/pages/privacy.astro` had literal doubled brand text in their `<title>`.
- [x] Add `noindex` support to `BaseLayout` and apply it to the 404 page — completed in PR #116. `404.astro` was previously a self-canonicalizing, indexable soft-404 with no `robots` directive at all.
- [x] Repair Progress dashboard preset paths — completed in PR #116. `src/engine/presets.ts` had nine `path` fields pointing at wrong or dead routes (e.g. `/addition-practice` for presets that actually render on `/addition/1-digit` etc., and `/math-practice` for presets when no such page exists). These `path` values are used as real navigation links in `ProgressDashboard.tsx`, so this was a functional bug, not just an SEO nicety.
- [x] Remove unused `public/og-default.svg` — completed in PR #116. Confirmed dead: not referenced by any meta tag or component.

**Deferred at the time, pending explicit approval (still deferred — see Section 6):**
- Removing/redirecting the duplicate-content `/addition-practice` and `/subtraction-practice` pages — explicitly held back per instruction; **do not implement without explicit sign-off.**
- Consolidating JSON-LD Organization/WebSite schema — **implemented in this update, see Section 4.**
- Centralizing site config, self-hosting fonts, and other Medium/Large items — still deferred, tracked below.

---

## 3. Why Google was showing the domain instead of the name

This was traced to two compounding causes:

1. **Title-tag inconsistency.** Roughly a third of indexable pages never included "Math Practice Online" in their `<title>` at all. Google leans on a consistent, repeated brand string across a site's titles to decide what name to show in the SERP. **Fixed in PR #116** (Section 2).
2. **Fragmented site-identity structured data.** The `WebSite`/`Organization` JSON-LD — the schema Google explicitly uses for SERP site-name identity — existed only on the homepage, and was independently re-authored two more, slightly different ways: a nested `AboutPage.mainEntity.Organization` on `about.astro`, and a third minimal `provider: Organization` object repeated independently across ~30 hub/practice pages' `LearningResource` schema. Three different shapes of the same fact reads as noise, not a consistent signal, to Google. **Fixed in this update** — see Section 4.

---

## 4. Consolidate Organization/WebSite JSON-LD sitewide — ✅ Implemented

- [x] Consolidate Organization/WebSite JSON-LD sitewide — **completed** (this update). See [Implementation Log](#implementation-log) for the PR reference.

**Why it mattered:** Google's SERP site-name feature reads `WebSite`/`Organization` schema, weighted by consistency. Having three different shapes of "Organization" declared independently across the site diluted that signal and risked drifting out of sync (different names, different URLs, different claims) as pages were added.

**Impact:** High — this was the structural half of the SERP-name fix (the title-tag half shipped in PR #116).

**What changed:**

- Added `src/config/site.ts`, exporting exactly four constants: `SITE_NAME`, `SITE_URL`, `ORGANIZATION_ID` (`https://mathpracticeonline.com/#organization`), and `WEBSITE_ID` (`https://mathpracticeonline.com/#website`). This is intentionally minimal — it is **not** the full 38-file `SITE` constant migration described in Section 5; every page's existing local `const SITE = 'https://mathpracticeonline.com'` was left untouched.
- `BaseLayout.astro` now emits one shared JSON-LD `@graph` containing exactly one `Organization` node and one `WebSite` node (with stable, non-www `@id`s) on every page that renders through it — including noindex pages like `/404`, for consistency and simplicity, since noindex pages aren't indexed regardless.
- `index.astro` (homepage): removed its independent `Organization` and `WebSite` JSON-LD blocks (now redundant with the sitewide graph). Its `EducationalApplication` schema was preserved and extended with `isPartOf: { "@id": WEBSITE_ID }` and `publisher: { "@id": ORGANIZATION_ID }`. The homepage's `FAQPage` schema was **not** touched (explicitly out of scope for this update — see Section 6).
- `about.astro`: the nested `AboutPage.mainEntity` Organization object now carries `"@id": ORGANIZATION_ID`, unifying its identity with the sitewide entity while preserving its existing extra claims (`foundingDate`, `areaServed`, `serviceType`) — nothing was invented, nothing was deleted. The `AboutPage` node itself now also references `isPartOf: { "@id": WEBSITE_ID }`.
- **30 pages'** `LearningResource.provider` fields — previously each independently declaring `{ "@type": "Organization", "name": "Math Practice Online", "url": SITE }` (or a 4-line multi-line equivalent on the 4 hub pages + speed drill page) — now reference the shared entity via `{ "@id": ORGANIZATION_ID }`. Full file list: `addition/index.astro`, `addition/1-digit.astro`, `addition/2-digit-no-carrying.astro`, `addition/2-digit-with-carrying.astro`, `subtraction/index.astro`, `subtraction/1-digit.astro`, `subtraction/2-digit-no-borrowing.astro`, `subtraction/2-digit-with-borrowing.astro`, `multiplication/index.astro`, `multiplication/facts.astro`, `multiplication/times-tables/index.astro`, `multiplication/times-tables/[table].astro`, `division/index.astro`, `division/facts.astro`, `division/remainders.astro`, `division/divide-by/[divisor].astro`, `math-facts.astro`, `math-worksheets/index.astro`, `math-worksheets/addition-worksheets.astro`, `math-worksheets/subtraction-worksheets.astro`, `math-worksheets/multiplication-worksheets.astro`, `math-worksheets/division-worksheets.astro`, `for-parents.astro`, `for-teachers.astro`, `arithmetic-speed-drill.astro`, `1st-grade-math-practice.astro`, `2nd-grade-math-practice.astro`, `3rd-grade-math-practice.astro`, `4th-grade-math-practice.astro`, `5th-grade-math-practice.astro`.

**Canonical identity graph shape** (emitted by `BaseLayout.astro` on every page):

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://mathpracticeonline.com/#organization",
      "name": "Math Practice Online",
      "url": "https://mathpracticeonline.com/",
      "logo": "https://mathpracticeonline.com/favicon.svg"
    },
    {
      "@type": "WebSite",
      "@id": "https://mathpracticeonline.com/#website",
      "url": "https://mathpracticeonline.com/",
      "name": "Math Practice Online",
      "publisher": { "@id": "https://mathpracticeonline.com/#organization" },
      "inLanguage": "en-US"
    }
  ]
}
```

The `logo` field was preserved from the homepage's pre-existing (legitimate, already-live) Organization declaration — not newly invented. No unsupported properties were added (no social profiles, no address/phone, no ratings, no employee data).

**Verification performed:**
- `npm run build` — succeeded, 68 pages, no errors.
- `npm run check` (astro's TS/template checker) — **not run**: the project does not have `@astrojs/check`/`typescript` installed as a dependency and the command prompts to install them interactively; declined rather than adding a new dependency outside this task's scope. `npm run build` is the project's documented type-error gate (per `README.md`/`CLAUDE.md`) and was used instead.
- No automated test suite exists in this repository (`package.json` has no `test` script) — none was skipped, none exists to run.
- Inspected generated production HTML (`dist/`) for 7 representative pages: homepage, About page, the Addition hub, a leaf practice page (`/subtraction/2-digit-with-borrowing`), a generated times-table page (`/multiplication/times-tables/7`), a generated divide-by page (`/division/divide-by/8`), and a worksheet page (`/math-worksheets/addition-worksheets`). For every page: exactly one `Organization` node and one `WebSite` node, both with the canonical non-www `@id`s, one consistent `name` value ("Math Practice Online") throughout, valid JSON on every `<script type="application/ld+json">` block, and all pre-existing page-specific schema (`FAQPage`, `BreadcrumbList`, `LearningResource`, `HowTo`, `EducationalApplication`, `AboutPage`) still present and unchanged in substance.
- **External validators (Google Rich Results Test, Schema.org validator) were not run** — no browser/external-network validation tooling was available in this session. This should be done manually before or shortly after merge.

**Risk:** Low — additive/deduplicating change, no visible page content, navigation, or URL changes. The main residual risk is any external tool or third party that had scraped the old per-page Organization objects expecting the exact previous shape; none are known to exist.

**Explicitly deferred from this change (see Section 5):** the full `SITE`-constant migration across all 38 files, self-hosting fonts, the homepage FAQ rewrite, and the division divisor grid were all out of scope for this task and were not touched.

---

## 5. Remaining roadmap

Everything below is **not yet implemented**. Items are grouped the way the original audit grouped them; effort classification and full rationale are preserved in full (not summarized) so a future contributor can act on any item without re-deriving context.

### Structural & data

- [ ] **Resolve the `/addition-practice` and `/subtraction-practice` duplicate hubs** — *Quick Win.* **Do not implement without explicit approval — this is a standing decision boundary, not an oversight.** `/addition-practice` is a full duplicate-content page that conflicts with an existing `redirects` entry in `astro.config.mjs` (page file and redirect target the same path). `/subtraction-practice` has no redirect, no noindex, a self-referential canonical, and — confirmed in the deep-dive audit — is a true orphan with zero inbound internal links from anywhere on the site, yet it's still in the sitemap. Impact: Medium (duplicate-content dilution against `/addition` and `/subtraction`; near-identical titles, >95% match). Files: `src/pages/addition-practice/index.astro`, `src/pages/subtraction-practice/index.astro`, `astro.config.mjs`, `src/pages/1st-grade-math-practice.astro` (its one link to `/addition-practice`). Proposed implementation: delete both page files, add a `'/subtraction-practice': '/subtraction'` redirect to match the existing addition one, repoint the one inbound link to `/addition/1-digit`. Risk: low technically, but it's a content-removal decision — hence the explicit-approval gate.

- [ ] **Centralize site identity into one config file (the *full* migration)** — *Medium.* Note: a *minimal* version of this (`src/config/site.ts` with 4 constants) was introduced in Section 4. This item is the larger, still-undone follow-up: `const SITE = 'https://mathpracticeonline.com'` is still copy-pasted at the top of 38+ page files, and the literal string `"Math Practice Online"` is still hand-typed in header/footer markup and various places outside JSON-LD. Impact: Medium — prevents regression of the SERP-name fix as the site grows. Files: all ~38 page files would import `SITE_URL`/`SITE_NAME` from `src/config/site.ts` instead of re-declaring `SITE` locally. Implementation: mechanical find-and-replace across pages, verify build after the sweep. Risk: Low but wide-reaching — this was explicitly deferred from the Section 4 change to keep that PR focused.

- [ ] **Unify the legacy-route redirect pattern** — *Medium.* `division-practice/*` pages hand-roll noindex + meta-refresh HTML; `multiplication-practice/*` instead call `Astro.redirect()` inside a static, adapter-less build — which likely emits a 200-status meta-refresh page rather than a real 301, and carries no explicit noindex tag of its own. Impact: Low-medium, mostly crawl-budget hygiene; worth a build-output status-code check first. Files: `src/pages/multiplication-practice/*.astro` (5 files), `src/pages/division-practice/*.astro` (pattern to match against). Implementation: move the multiplication-practice paths into `astro.config.mjs`'s `redirects` map (the mechanism already used for `/addition-practice`) for a guaranteed real redirect, or adopt the division-practice noindex+meta-refresh pattern for consistency. Risk: Low.

- [ ] **Add `twitter:site` / `twitter:creator`** — *Quick Win, blocked on input only the site owner has.* No Twitter/X card attribution tags exist anywhere. Harmless today. Impact: Low — cosmetic, X card previews only. Files: `src/layouts/BaseLayout.astro`. Implementation: add `<meta name="twitter:site" content="@yourhandle">` once an X account handle is confirmed to exist/be wanted. Risk: None.

- [ ] **`site.webmanifest` completeness** — *Quick Win.* Missing `start_url`/`scope`; icons are declared `purpose: maskable` only, no plain "any"-purpose icon (some platforms and Lighthouse's PWA audit want both). Impact: Low — PWA/install-prompt polish, not search ranking. Files: `public/site.webmanifest`. Implementation: add `"start_url": "/"`, `"scope": "/"`, and an `"any"`-purpose icon entry alongside the existing maskable ones. Risk: None.

- [ ] **`robots.txt`: explicit AI-crawler policy** — *Quick Win.* `robots.txt` has only a wildcard `User-agent: *` rule — GPTBot, ClaudeBot, PerplexityBot, Google-Extended, and CCBot are all implicitly allowed through it, but the site states no deliberate policy. Given ChatGPT is already a referral source, an explicit, intentional statement is worth making. Impact: Low-medium — deliberateness, not a bug fix. Files: `public/robots.txt`. Implementation: add named `User-agent:` blocks for the above bots with explicit `Allow: /`, keeping the wildcard as fallback. This is a Search-Essentials-safe transparency move, not a ranking trick. Risk: None if kept permissive — don't use this to block anything without a separate, deliberate decision. **Note: explicitly out of scope for the current task; do not implement opportunistically.**

### Internal linking & content depth

- [ ] **Give division a divisor grid, matching multiplication's times-table index** — *Quick Win.* `multiplication/times-tables/index.astro` links to all 12 times-table pages from one grid, keeping every one of them at crawl depth 3. Division has no equivalent — the 12 `divide-by/[divisor]` pages only cross-link via prev/next chains, and `/division/divide-by/8` ends up 4 clicks from the homepage, the single deepest page on the site. Impact: Medium — deep pages get crawled less often and pass less internal authority. Files: new `src/pages/division/divide-by/index.astro` (mirror `multiplication/times-tables/index.astro`), linked from `division/index.astro`. Risk: None — additive. **Note: explicitly out of scope for the current task.**

- [ ] **Link the multiplication hub to the times-table index** — *Quick Win.* `multiplication/times-tables/index.astro` is currently reachable only via breadcrumb from a times-table leaf page — `multiplication/index.astro` never links to it directly, despite linking to individual tables 1, 2, and 9 in its tips copy. Impact: Low-medium — one missing reciprocal link in an otherwise clean hub. Files: `src/pages/multiplication/index.astro`. Risk: None.

- [ ] **Thicken `/progress`'s static, crawlable content** — *Quick Win.* Real prose runs ~170-190 words; the rest (stats, achievements, streak calendar) is client-rendered from `localStorage` and empty for first-time visitors and crawlers — bordering on thin content. Files: `src/pages/progress.astro`. Implementation: expand the static intro/"why track"/"what gets tracked" copy with a couple more concrete paragraphs true regardless of whether the visitor has practiced yet. Risk: None.

- [ ] **Strengthen single-source links to `/math-facts`, `/for-parents`, `/for-teachers`** — *Quick Win.* All three are linked only from the homepage — no hub page, footer, or grade page references them. Not orphans today, but a future homepage redesign would silently orphan all three. Implementation: add these three to the (currently triplicated) footer link block. Risk: None.

- [ ] **Rewrite the homepage FAQ visible text to match its own JSON-LD verbatim** — *Quick Win.* Every other FAQ page generates its visible `<dl>` and its `FAQPage` JSON-LD from the same source array — verbatim by construction. The homepage is the one exception: `index.astro` hand-writes the JSON-LD block and the visible FAQ separately, and all 8 Q&A pairs differ in wording between the two. Answer engines match visible text against JSON-LD to trust it; a mismatch on the single most-crawled page undermines exactly the FAQPage markup meant to be cited. Impact: Medium — directly affects GEO/AEO citation trust on the highest-authority page. Files: `src/pages/index.astro`. Risk: Low — copy-only change. **Note: explicitly out of scope for the current task ("do not rewrite the homepage FAQ"); do not implement opportunistically.**

- [ ] **Fix the homepage's factual error about "Math Drills" as a distinct mode** — *Quick Win.* The homepage FAQ JSON-LD states: *"Math Drills (2 minutes) and Arithmetic Speed Drill (60 seconds) are timed modes."* There is no separate "Math Drills" page or mode — `/math-drills` is only a redirect alias to `/arithmetic-speed-drill`, whose actual duration picker offers 30s/1m/2m/5m as one continuous choice, not two named products. The same phrasing repeats on `progress.astro`. An AI answer engine citing this JSON-LD would state something about the site that isn't true. Impact: Medium — a factual-accuracy issue in structured data an LLM might repeat verbatim. Files: `src/pages/index.astro` (FAQ JSON-LD + visible text), `src/pages/progress.astro`. Risk: None — corrects an inaccuracy. **Note: bundled with the homepage FAQ rewrite above; also out of scope for the current task.**

### AEO / GEO & semantic markup

- [ ] **Extend HowTo schema to the no-carrying/no-borrowing sibling pages** — *Medium.* `addition/2-digit-with-carrying.astro` and `subtraction/2-digit-with-borrowing.astro` both carry HowTo schema matching their visible numbered steps. Their siblings — `2-digit-no-carrying.astro` and `2-digit-no-borrowing.astro` — have the identical visible 3-step "How to Solve" UI but no HowTo schema at all. Impact: Medium — HowTo is a rich-result and AI-answer eligibility signal; half the relevant pages are missing it for no content reason. Files: `src/pages/addition/2-digit-no-carrying.astro`, `src/pages/subtraction/2-digit-no-borrowing.astro`. Risk: Low — verify with Rich Results Test. **Note: explicitly out of scope for the current task.**

- [ ] **Wrap leaf practice pages' educational content in `<article>`** — *Medium.* Leaf pages are structurally long-form articles (intro, "what you'll practice," a how-to walkthrough, FAQ) but render as `<div>`/`<section>` without an `<article>` landmark anywhere on the site. Not invalid HTML, but a missed signal for crawlers/AI extractors isolating "the content" from chrome. Files: `src/layouts/PracticeLayout.astro` (wrap the main content slot; sitewide once changed there). Risk: Low — check for tag-based CSS selectors before changing.

- [ ] **Add an `llms.txt`** — *Quick Win.* No `llms.txt` exists. It's an emerging (not yet standardized) convention some sites use to give AI crawlers a concise, structured description of the site and key pages — plausible upside given ChatGPT is already a referral source, negligible downside. Files: new `public/llms.txt`. Risk: None. **Note: explicitly out of scope for the current task; do not implement opportunistically.**

- [ ] **Fix the stray trailing-slash link inconsistency** — *Quick Win.* One homepage link uses `href="/multiplication/"` (trailing slash) while every other on-page reference uses `href="/multiplication"` — functionally fine, just inconsistent. Files: `src/pages/index.astro`. Risk: None.

### Accessibility & Core Web Vitals

The component-level accessibility audit came back largely clean — `aria-live` feedback regions, labeled inputs, focus rings, and zero raster `<img>` alt-text debt were already correct. What's left:

- [ ] **Self-host Google Fonts** — *Medium.* Plus Jakarta Sans and JetBrains Mono load via a render-blocking `fonts.googleapis.com` stylesheet. JetBrains Mono renders the large problem digits, plausibly the LCP element on every practice page. Impact: Medium — a real Core Web Vitals/LCP opportunity. Files: `src/layouts/BaseLayout.astro`, new static font files under `public/` or via `astro:assets`. Implementation: download the two families' woff2 files, self-host, replace the Google Fonts `<link>` with local `@font-face` declarations plus a `<link rel="preload">` for the mono weight used on digits. Risk: Low — verify licensing (both open-source, permissively licensed) and font-file weight before shipping. **Note: explicitly out of scope for the current task; do not implement opportunistically.**

- [ ] **Consolidate the duplicated header/footer markup** — *Medium.* The same header/footer markup is hand-duplicated across `index.astro`, `PracticeLayout.astro`, and `HubLayout.astro`. Not an SEO defect today, but it's exactly the kind of triplication that let earlier title-consistency and link-completeness issues creep in. Files: `src/pages/index.astro`, `src/layouts/PracticeLayout.astro`, `src/layouts/HubLayout.astro`; new `src/components/SiteHeader.astro`/`SiteFooter.astro`. Risk: Low — visually identical if done carefully; diff each page after the change.

- [ ] **Associate number inputs with a persistent `<label>`** — *Medium.* Answer inputs currently rely on `aria-label` alone rather than an associated `<label for>` element. Functionally accessible today; a real `<label>` is more robust and is what a11y audit tools (axe, Lighthouse) flag as best practice. Files: `src/components/AnswerInput.tsx`, `src/components/WrittenProblemInput.tsx`. Risk: Low.

- [ ] **Manually test the custom number pad with OS accessibility input** — *Large.* `AnswerInput.tsx`/`WrittenProblemInput.tsx` deliberately set `inputMode="none"` to suppress the native mobile keyboard in favor of a custom on-screen `NumberPad`. Reasonable UX call for the common case, but needs verification with switch control, voice control, and screen-reader-driven input on real devices — cannot be confirmed from source alone. Files: `src/components/AnswerInput.tsx`, `src/components/WrittenProblemInput.tsx`, `src/components/NumberPad.tsx`. Implementation: manual test pass with iOS/Android switch control and VoiceOver/TalkBack; add a native-keyboard fallback path if input is found to be blocked. Risk: None from testing itself; scope depends entirely on what's found.

### Deep-dive audit: additional findings (linking depth, orphans, thin pages, duplicate metadata)

- [ ] **Fix the `division/divide-by/8` crawl-depth outlier** — tracked above as the division divisor grid item; called out again here because the deep-dive audit specifically traced the minimum-hop path and confirmed it's the single deepest real content page on the site (4 clicks from home).
- [ ] **`/subtraction-practice` confirmed as a true orphan** — zero inbound internal links from anywhere in `src/`, yet present in the sitemap (missing from `astro.config.mjs`'s sitemap `filter` exclude list, unlike its sibling `/addition-practice`). Tracked under the duplicate-hub resolution item above; **do not implement without explicit approval** (same decision boundary).
- [ ] **`/addition-practice` and `/subtraction-practice` are near-duplicate titles/descriptions of `/addition` and `/subtraction`** (>95% identical titles) — the clearest duplicate-metadata pair found in the deep-dive audit. Same decision boundary as above.
- [ ] **`progress.astro` borderline-thin static content** — tracked above under "Thicken /progress's static, crawlable content."
- [ ] No other duplicate/near-duplicate title or description pairs were found across the remaining ~40 pages (every grade page, worksheet page, and dynamic-route page generates a unique per-parameter string).

### Engagement opportunities within the existing architecture

The site's existing engagement mechanics (streaks, achievements, a 35-day practice calendar, session-over-session comparison) were reviewed and found already well-built. These are **product/UX decisions, not SEO fixes** — listed here for completeness but explicitly not prioritized as SEO roadmap items:

- [ ] Surface a contextual "practice this next" prompt on the post-session score card (`ScoreCard.tsx`) — every page already has hand-curated `links`/`InternalLinks` data with exactly this "next step" information; it's just not wired into the moment right after a session completes.
- [ ] No streak-loss / return-visit nudge exists (no Notification API usage, no service worker); the data needed (`lastSessionDate` vs. today) is already computed in `ProgressDashboard.tsx`.
- [ ] No email/newsletter capture anywhere — consistent with the site's no-accounts positioning, but means there's currently no mechanism to re-engage a lapsed user besides them remembering the URL.
- [ ] Achievement/streak sharing isn't surfaced — no share/print/export action, despite `for-parents.astro`/`for-teachers.astro` already targeting exactly the audiences who'd use it.
- [ ] `WorksheetGenerator.tsx` (printable worksheets) is disconnected from the progress-tracking system — printed practice is never reflected on `/progress`.

---

## 6. Decisions that require explicit human approval

These are standing boundaries, not just deferred work — do not implement any of the following without the site owner explicitly signing off first, even if they appear to be "objectively correct" fixes:

- Deleting or redirecting `/addition-practice` or `/subtraction-practice`.
- Any change to `robots.txt`.
- Adding `llms.txt`.
- Self-hosting fonts.
- Rewriting the homepage FAQ (visible text or JSON-LD).
- Adding the division divisor grid.
- Performing the full `src/config/site.ts` site-config migration across all ~38 files.

---

## 7. Prioritized roadmap (by expected ROI)

Ordered by effort vs. how directly each item moves organic/AI-referral traffic — not by section order above. Items marked ✅ are complete.

| # | Item | Effort | Status | Why it's ranked here |
|---|------|--------|--------|----------------------|
| 1 | Consolidate Organization/WebSite JSON-LD sitewide | Medium | ✅ Done | Completes the SERP-name fix; the title-tag half shipped in PR #116. |
| 2 | Rewrite homepage FAQ to match its own JSON-LD + fix the "Math Drills" factual error | Quick Win | Deferred (approval gate) | Highest-authority page currently ships a factual inconsistency an AI engine could repeat. |
| 3 | Division divisor grid | Quick Win | Deferred (approval gate) | Closes the site's one 4-click-deep page; mirrors a pattern that already exists for multiplication. |
| 4 | Extend HowTo schema to no-carrying/no-borrowing pages | Medium | Not started | Doubles HowTo rich-result eligibility for near-zero new content — visible steps already exist. |
| 5 | Full `src/config/site.ts` migration (all ~38 files) | Medium | Not started | Prevents the exact bug class already fixed twice from recurring as the site grows. |
| 6 | Self-host Google Fonts | Medium | Deferred (approval gate) | Real Core Web Vitals/LCP win on the element most likely to be the LCP candidate sitewide. |
| 7 | Small linking fixes (times-tables index link, `/progress` copy, trailing-slash, footer reach) | Quick Win | Not started | Batch of near-zero-risk, near-zero-effort cleanups. |
| 8 | robots.txt AI-crawler policy + llms.txt | Quick Win | Deferred (approval gate) | Directional GEO investment given ChatGPT is an active referral source. |
| 9 | Resolve `/addition-practice` + `/subtraction-practice` | Quick Win | **Blocked — needs explicit approval** | Fix is scoped and low-risk; waiting on the content decision. |
| 10 | Consolidate header/footer + `<article>` wrapping + `<label>` upgrade | Medium | Not started | Maintainability and semantic-clarity investments. |
| 11 | Manual accessibility test of the custom number pad | Large | Not started | Needs real-device testing before scope is even known. |

---

## Implementation Log

| Date | PR | Work completed | Notes |
|------|----|----------------|-------|
| 2026-08-02 | [#116](https://github.com/wesley-perkins-software/math-practice/pull/116) | Title consistency, 404 noindex, Progress route fixes, dead asset cleanup | Initial direct-fix audit PR |
| 2026-08-02 | Pending | Added `docs/seo/SEO_AEO_GEO_AUDIT.md`; consolidated Organization/WebSite JSON-LD into one sitewide identity graph (`src/config/site.ts`, `BaseLayout.astro`, homepage, About page, and 30 `LearningResource.provider` references) | This update |

---

## Maintenance rule

- Update the checkbox whenever a roadmap item is completed.
- Add the implementing PR to the [Implementation Log](#implementation-log).
- Update "Last updated" at the top of this file.
- Do not mark an item complete unless it has actually been implemented **and** verified (build passes, generated output checked).
- Preserve deferred recommendations unless explicitly rejected by the site owner — don't delete them for being old.
- If a recommendation is rejected rather than deferred, record it (and the reason) in place rather than deleting it, so the decision isn't re-litigated from scratch later.
