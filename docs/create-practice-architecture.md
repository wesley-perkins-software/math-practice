# Create Practice Architecture

This document is the durable product and domain contract for configurable practice. The system remains frontend-first and no-login.

## Product model and responsibilities

The product has three distinct experiences:

1. **Existing skill pages** are searchable, canonical landing pages for practicing a particular skill immediately. They remain playable without setup and do not host the full builder; a small contextual Create Practice link may be added later.
2. **`/create/` — Create Custom Math Practice** is a single-page, progressive-disclosure builder that configures one practice type, its skill-specific options, and common session options; previews the result; and creates/copies a durable link. Printable output may follow.
3. **`/practice/`** executes a validated `PracticeDefinition` in a minimal student-facing runner. It does not expose builder controls, and configured query variants do not become separate SEO pages.

The creator and shared runner now exist. The creator starts empty and embeds no practice engine. Its current controls are the assignment—there is no draft/applied distinction. It validates the candidate with the V2 validator, serializes it with the V2 serializer, and derives both Copy Practice Link and Start Practice from that one live URL. `/create/` is indexable, self-canonical, and included in the sitemap.

## Taxonomy

The domain model is:

> Category → Practice Type → Skill Options + Session Options

A V2 definition selects exactly one practice type. Versioning is the escape hatch if evidence later supports mixed or segmented practice.

Initial categories are Addition, Subtraction, Multiplication, and Division. Addition and subtraction use separate types for the existing 1-digit, 2-digit without regrouping, and 2-digit with regrouping skills because these are distinct learner choices backed by distinct trusted generator presets. Multiplication facts accepts selected `facts`; division facts accepts selected `divisors`; division with remainders remains separate because its problem and answer behavior is fundamentally different.

Times Table and Divide By pages are specializations, not types: Times Table 6 is `multiplication-facts` with `facts: [6]`, and Divide By 6 is `division-facts` with `divisors: [6]`. This avoids combinatorial identities.

## PracticeDefinition V2

The stable shell separates public intent from implementation:

```ts
{
  version: 2,
  practiceType: PracticeTypeId,
  skillOptions: {},
  sessionOptions: { mode: 'untimed', questionCount: 20 }
}
```

`skillOptions` is always present and is validated by the selected registry entry. Common sessions are untimed or timed for 30, 60, 120, or 300 seconds, with an optional 10, 20, 30, or 50 question boundary. Timed finite sessions end at whichever boundary occurs first.

Runtime validation is strict at every level: missing and unknown fields, unknown practice types, malformed skill options, and malformed session options reject the entire definition. Validators never salvage a partial definition. Selected facts and divisors reject duplicates and normalize to ascending order, producing a stable object shape for future serialization.

## Registry and progress identity

The small, plain-data Practice Type Registry owns stable IDs, category and display metadata, validation/defaults, a canonical immediate-practice page, and a reference to an existing trusted `PracticeConfig`. It does not duplicate generator configuration or describe builder layout.

Public/custom state cannot choose routes, storage keys, renderers, feedback timing, analytics identity, or generator internals. Resolution obtains those values from the trusted preset. Shared/custom practice maps to that preset's existing progress identity; option combinations never create storage keys.

## Expansion

Fractions, decimals, place value, rounding, number sense, percentages, measurement, geometry, and factors/multiples can add implemented categories and registry entries with their own skill-option validators and base configurations. For example, `equivalent-fractions` or `place-value-identify-digit` changes neither the definition shell nor the creator/runner responsibilities. Speculative types are not registered before implementations exist.

## V2 URL and runner contract

The flat transport is `/practice/?v=2&skill=multiplication-facts&facts=6,7,8&mode=untimed&questions=20`. Canonical parameter order is `v`, `skill`, the applicable `facts` or `divisors`, `mode`, timed-only `duration`, then optional `questions`. `v`, `skill`, and `mode` are required. Multiplication facts requires `facts`; division facts requires `divisors`; other registered types accept no skill-specific parameter. Timed sessions require `duration`; question count is optional in either mode.

The codec rejects unknown/duplicate parameters, empty values, non-ASCII or noncanonical integer syntax, whitespace, and malformed scalar/list syntax before constructing a candidate. It applies small transport bounds because a definition can contain at most 12 selected values. Percent encoding is decoded exactly once by `URLSearchParams`; an encoded comma is therefore a valid list separator, while encoded whitespace or plus signs remain invalid. The existing strict V2 validator remains authoritative for types, ranges, combinations, duplicate selections, and ascending selection normalization. The URL never represents trusted runtime identity or generator internals.

The browser shows no practice widget until parsing, validation, and registry resolution succeed. Missing or invalid query state shows a generic invalid-link message and never starts a fallback practice. Valid replay remains inside the mounted widget and therefore retains the same resolved definition and options while generating normally random new questions.

Shared practice is a focused assignment session, so it neither presents nor updates canonical streak mechanics. It still records attempts, completed sessions, scores, and session history against the registry-resolved base progress identity. Its completion view emphasizes attempted-answer score and accuracy (plus the answered target when finite), with replay as the sole action; it does not imply assignment-specific reporting.

For timed runtime results, the public `duration` remains only the configured countdown limit. The session result separately records the actual elapsed practice time (from the existing first-submission timer start), the configured time limit, and whether the time or question boundary won. A final accepted answer reserves a question-limit completion before its normal feedback delay, so that presentation delay neither inflates elapsed time nor lets a later countdown tick replace the winning boundary. These fields are runtime/history data and are never serialized into a practice URL. Older history entries without them remain valid.

`/practice/` has one clean canonical URL, is `noindex,follow`, and is excluded from the sitemap. Query combinations never create static routes or query-specific canonicals. Public Preset V1 remains a separate intact contract.

## Deferred scope

Deferred: multi-skill assignments, accounts, rosters, teacher dashboards, grading/reporting, a backend/database, QR, projector mode, saved cloud assignments, AI, a standards system, public URL seeds, custom assignment titles, advanced filters, and the printable integration itself.

## Rollout

1. PracticeDefinition and registry
2. Shared `/practice/` runner
3. `/create/` builder
4. Full arithmetic integration
5. Discoverability
6. Analytics (implemented)

Create Practice analytics reuse the site's fail-open GA4 event seam and are aggregate-only. The creator page is measured by the existing path-only `page_view`; conversion and valid shared-runner events carry only registry-backed practice/category values, four finite session-mode buckets, optional bounded duration/question values, and single/multiple/all selection breadth. They never carry full URLs, query strings, selected fact/divisor lists, problems, answers, storage/session/assignment identifiers, or exact performance. All dimensions come from a normalized, validated V2 definition.
