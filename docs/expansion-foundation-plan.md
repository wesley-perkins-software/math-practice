# MathPracticeOnline Expansion Foundation Plan

## 1. Strategic Goal

Prepare the existing arithmetic platform for safe, configurable, shareable classroom practice while preserving current URLs, the current default experience, and the no-login/local-first architecture.

The long-term direction is to support:

- organic traffic and topical-authority growth;
- classroom adoption and teacher sharing;
- longer, repeated, and more engaging practice sessions; and
- reusable infrastructure for future practice and content expansion.

## 2. Existing Architecture Baseline

The site already has:

- a generalized `PracticeConfig`;
- a shared arithmetic generator and shared `PracticeWidget`;
- addition, subtraction, multiplication, division, remainder, and mixed-operation support;
- timed and untimed practice;
- local progress, streaks, recent sessions, and personal bests;
- client-side worksheets using the shared generator;
- the `/math-facts/` hub;
- Times Tables 1–12; and
- Divide By 1–12.

This is an extension program, not a rewrite. Preserve and extend the existing seams rather than rebuilding working systems.

## 3. Protected Assets / Compatibility Contract

> With no valid public configuration, existing routes must behave exactly as they do today.

Protect:

- all existing canonical route families, especially `/addition/`, `/subtraction/`, `/multiplication/`, `/multiplication/facts/`, Times Tables URLs, `/division/`, `/division/facts/`, Divide By URLs, `/division/remainders/`, `/arithmetic-speed-drill/`, and `/math-facts/`;
- worksheet and grade-guide URLs;
- redirects, sitemap behavior, clean trailing-slash canonicals, and static route generation;
- existing `storageKey` identities and readable user progress;
- vertical arithmetic, long-division rendering, and quotient/remainder input semantics;
- keypad, keyboard, focus/caret, and feedback behavior;
- Speed Drill timer and personal-best semantics;
- GA4 and AdSense infrastructure; and
- the static, frontend-only, no-login, local-first operating model.

Parameterized practice state must not change route content, title, H1, canonical metadata, or internal identity.

## 4. Foundation PR Sequence

1. **PR 1 — Test Harness and Production Characterization**
2. **PR 2 — Injectable RNG Boundary and Seeded Helper**
3. **PR 3 — Public Practice Preset V1 and Route Capability Policy**
4. **PR 4 — Legacy Storage Validation and Versioned New-Record Adapters**
5. **PR 5 — Readable URL Preset Codec and SEO Contract Tests**
6. **PR 6 — Optional Question-Count Session Semantics**
7. **PR 7 — `/multiplication/facts/` Configure-and-Share Pilot**
8. **PR 8 — Minimal Pilot Analytics**
9. **PR 9 — First evidence-based reuse**

The durable preset transport and SEO rules are maintained in
[`public-practice-preset-url-contract.md`](./public-practice-preset-url-contract.md).

Keep each PR independently reviewable and deployable. PR 4 may proceed partly in parallel with PRs 2–3, but it must merge before persisted new session behavior or the pilot ships.

## 5. Key Architecture Decisions

- Do not migrate canonical URLs.
- `/math-facts/` remains the cross-operation hub, not a migration target.
- Extend the existing `PracticeConfig`; do not replace it.
- Never expose internal `PracticeConfig` directly through public URLs.
- Public input cannot control `storageKey`, path, renderer identity, feedback delays, analytics identity, canonical metadata, or other internal fields.
- Use readable, validated query parameters for shareable presets.
- Parameterized states retain the clean base-route canonical.
- Do not create static routes for arbitrary parameter combinations.
- Only validated, distinct search intents may become canonical pages later.
- A seed is generation context, not route or storage identity.
- Preserve `Math.random()` as the default when no random source is supplied.
- Defer a major `PracticeWidget` refactor unless a concrete feature blocker appears.
- Enhance the current worksheet generator rather than rebuilding it.
- Defer remainder configurability until its operand-range and generation semantics are intentionally designed.
- Keep unrelated data lifecycles out of existing page-stat records; use versioned records for new concepts.

## 6. Public Preset V1 Direction

The first public configuration vocabulary should support:

- `v=1`;
- selected multiplication facts from 1–12;
- timed or untimed mode;
- a supported duration; and
- a supported question count.

Example:

`/multiplication/facts/?v=1&facts=6,7,8&questions=20&timer=120`

This URL must retain `/multiplication/facts/` as its canonical.

Validation must be route-aware, bounded, and fail as a unit: malformed or unsupported recognized settings apply no partial configuration and safely restore the route's normal preset. Unknown unrelated parameters must not influence practice state.

Operand ranges, ordinary-practice seeds, projector preferences, and arbitrary internal fields are not part of V1. Duration and question-count values should initially be narrow supported choices rather than unrestricted numbers.

## 7. Foundation Acceptance Gates

Foundation work may progress only when the relevant gate is satisfied:

- Existing generator constraints for every operation are characterized.
- Canonical route-to-preset mappings and `storageKey` identities are locked.
- Session start, feedback, replay, streak, timer, result, input, and focus behavior are protected.
- Current stats, personal bests, session logs, and progress aggregation remain compatible.
- Seeded generation is deterministic when explicitly requested.
- Unseeded calls remain backward-compatible and default to current randomness.
- Public configuration cannot mutate internal identity, rendering, timing-delay, analytics, or canonical fields.
- Invalid, excessive, duplicate, or route-incompatible URL state safely falls back to the untouched route preset.
- Existing local-storage records remain readable; unavailable, malformed, or full storage never blocks practice.
- Canonicals, sitemap output, redirects, static routes, titles, H1s, and page content remain unchanged.
- No-parameter routes render and behave identically to the current site.
- No major widget refactor or new canonical SEO route occurs during foundation.

## 8. First Visible Growth Release

Pilot configure-and-share on `/multiplication/facts/`:

- Existing practice still starts immediately with no setup wall.
- A secondary, collapsed **Customize practice** control exposes safe options.
- Users may select fact families 1–12.
- Sessions may remain endless or use 10, 20, 30, or 50 questions.
- Sessions may be untimed or use a supported timer.
- An explicit action starts the configured session.
- A valid configuration produces a copyable, readable share URL.
- Invalid or unsupported state falls back to ordinary multiplication-facts practice.
- A restore-defaults action returns to the normal route preset.

The pilot does **not** include QR sharing, saved presets, projector mode, or arbitrary operand ranges.

## 9. Growth Features Unlocked Later

Once the pilot is stable and measured, the foundation can support:

- configurable division facts;
- teacher quick-start presets;
- reproducible worksheet sharing and count controls;
- QR sharing;
- projector/fullscreen mode;
- a deterministic Daily Challenge;
- selective operation-specific timed practice;
- configurable mixed facts;
- carefully validated fact-strategy practice; and
- broader K–5 practice expansion.

Prioritize reuse proven by the multiplication pilot before widening the configuration surface.

## 10. Deferred / Out of Scope

Explicitly defer:

- a major `PracticeWidget` refactor;
- remainder range or public remainder-configuration work;
- a saved-preset library;
- QR until URL sharing is stable and proven useful;
- projector/fullscreen until sharing is stable;
- Daily Challenge until seeded generation and versioned storage are established;
- arbitrary public operand ranges;
- fractions, place value, word problems, and middle-school expansion;
- new grade pages and fact-strategy SEO pages;
- navigation redesign and new ad placements;
- accounts, backend services, databases, or cloud sync; and
- new canonical SEO routes until separate search-intent and content validation is complete.

## 11. Documentation Policy

- Keep this document concise, decision-oriented, and current.
- Do not create one Markdown planning file per PR.
- Add a second maintained document only when the public preset/URL contract is implemented and stable enough to require a dedicated reference.
- Prefer executable tests and focused code comments for implementation-specific details.
- Update this plan when a durable architectural decision changes; do not use it as a progress diary.
