# Create Practice Architecture

This document is the durable product and domain contract for configurable practice. The system remains frontend-first and no-login.

## Product model and responsibilities

The product has three distinct experiences:

1. **Existing skill pages** are searchable, canonical landing pages for practicing a particular skill immediately. They remain playable without setup and do not host the full builder; a small contextual Create Practice link may be added later.
2. **`/create/` — Create Custom Math Practice** will configure one practice type, its skill-specific options, and common session options; preview the result; and create/copy a durable link. Printable output may follow.
3. **`/practice/`** will execute a validated `PracticeDefinition` in a minimal student-facing runner. It will not expose builder controls, and configured query variants will not become separate SEO pages.

Neither new route exists yet.

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

## URL direction

The eventual transport is conceptually `/practice/?v=2&skill=multiplication-facts&facts=6,7,8&mode=untimed&questions=20`. This PR defines the structured object contract only: it does not implement a V2 URL codec and does not replace the proven narrow Public Preset V1 codec.

## Deferred scope

Deferred: multi-skill assignments, accounts, rosters, teacher dashboards, grading/reporting, a backend/database, QR, projector mode, saved cloud assignments, AI, a standards system, public URL seeds, custom assignment titles, advanced filters, and the printable integration itself.

## Rollout

1. PracticeDefinition and registry
2. Shared `/practice/` runner
3. `/create/` builder
4. Full arithmetic integration
5. Discoverability
6. Analytics
