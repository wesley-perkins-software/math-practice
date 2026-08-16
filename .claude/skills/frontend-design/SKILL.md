---
name: frontend-design
description: Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps classify the interface type, choose an aesthetic direction appropriate to it, and validate the result by rendering and interacting with it — not just reading the code.
license: Complete terms in LICENSE.txt
---

# Frontend Design

Approach this the way a good design lead approaches any brief: understand what's actually being built before deciding how it should look. Some briefs call for a bold, memorable point of view. Others call for something that disappears into fast, confident, repeated use. Getting that distinction right matters more than any individual aesthetic choice.

## 1. Classify the interface before designing

Name what you're building. It changes almost everything downstream:

- **Marketing/landing** — one-time or occasional visits, persuasion is the job, novelty and a strong point of view are assets.
- **Utility/tool** — a person comes to do one thing and leave; the primary task *is* the hero, not a marketing moment.
- **Educational app** — repeated use, often by children or under supervision; clarity and calm beat novelty. See `references/design-review.md` for state/accessibility depth and treat cognitive load, encouraging error feedback, and touch-target size as design constraints, not decoration.
- **Dashboard / data-dense professional software** — density, scanability, and consistency matter more than visual flourish; the user will look at this hundreds of times.
- **Form/workflow application** — completion rate and error recovery are the product; minimize friction over impressing.
- **Content/reference site** — reading experience and findability are the job; typography does most of the work.
- **Ecommerce** — trust, product clarity, and frictionless purchase; novelty only where it doesn't cost conversion.

If the brief doesn't say which of these it is, decide and state your choice, the same way you'd pin down subject and audience below. **Reflexive marketing-page instincts — a hero as thesis, one signature aesthetic risk, an orchestrated motion moment — belong to the marketing/landing case.** Applying them to a settings panel or a data table is a mismatch, not a strength. For repeated-use product surfaces, distinctiveness should come from clarity, coherence, and getting the details right — not from novelty.

## 2. Ground it in the subject

If the brief doesn't pin down what the product or subject is, pin it yourself before designing: name one concrete subject, its audience, and the interface's primary job, and state your choice. Use anything you know about the human's preferences, prior work, or existing brand as a hint. Note real constraints too — device/input context, existing design system, accessibility needs, performance budget — these are as much a part of "the brief" as the visual references are. The subject's own world — its materials, instruments, vernacular — is where distinctive choices come from. Build with the brief's real content and subject matter throughout, not lorem ipsum.

## 3. Design principles

**For marketing/brand-defining surfaces**, the hero is a thesis: open with the most characteristic thing in the subject's world — a headline, an image, a live demo, an interactive moment. A big number with a small label and a gradient accent is the template answer; use it only if it's genuinely the best option for this brief. **For product/utility surfaces**, the primary task is the hero — get the person to it immediately, with as little marketing framing around it as the brief allows.

Typography carries meaning through fitness for its role, not through unfamiliarity. Separate roles — brand/display, interface, and (where numbers matter) numeric/data — and choose each for legibility, audience, and content, never merely for being unusual or merely for being popular. See `references/typography.md` before committing to a typeface for anything with numbers, math, or sustained reading.

Structure is information. Numbering, eyebrows, dividers, and labels should encode something true about the content, not decorate it — numbered markers only belong where order is real (a process, a timeline). Question every structural device before including it.

Color is a system, not a swatch list. Distinguish brand, surface, semantic (success/warning/error/info), interaction (hover/active/selected/focus/disabled), and data-visualization roles, and derive related colors from each other rather than picking hexes independently. See `references/accessibility.md` for the contrast and non-color-alone requirements every palette must satisfy.

Spacing and grouping come before containers. Use proximity, alignment, and typography to communicate structure first; reach for a card or box only when it clarifies something spacing alone can't. Nested cards-in-cards are a smell, not a default — check for it during self-critique.

Motion earns its place by communicating a state change, preserving continuity, or confirming an action — not by making something "feel premium." Marketing surfaces can support an orchestrated motion moment if the brief calls for it; product surfaces should default to fast, functional feedback. `prefers-reduced-motion` must always be respected.

Match complexity to the vision: maximalist directions need elaborate execution, minimal directions need precision in spacing, type, and detail. Elegance is executing the chosen vision well, at every density and every screen size.

Consider written content as design material, not decoration — see the writing section below.

## 4. The anti-template test

AI-generated design still clusters toward a narrow, recognizable band: Inter used reflexively rather than for fit, indigo-to-purple gradients as a default rather than a brand choice, three-card grids imposed on content that isn't three parallel things, cards nested in cards as the default grouping method, uniform oversized radii, decorative glassmorphism, pills and eyebrows used as generic decoration. None of these are wrong in themselves — a gradient, a card, Inter, rounded corners are all correct choices in the right context. They become tells when they're defaults instead of decisions.

The durable test, for every non-trivial choice: **can you explain it from the subject, the audience, the task, the environment, or the content?** If not, it's a default, not a decision — revise it. This test doesn't expire the way a list of specific looks does, and it won't push you toward a *different* reflexive aesthetic (deliberately "handmade" or anti-AI styling) as a new default to avoid the old one.

## 5. Process

Work in passes, scoped to how open the brief actually is:

1. **Brief interpretation** — subject, audience, primary job, interface type, environment/device context, brand and accessibility constraints (section 1–2 above).
2. **Explore, when it earns its cost** — for a genuinely open, brand-defining brief (most marketing/landing work), sketch 2–3 *structurally* different directions (different composition/hierarchy, not just different colors) before committing. For incremental work inside an existing product or design system, skip this — the direction is already set by the system, and exploring from scratch just adds ceremony.
3. **Build the token system** — before inventing anything, check the codebase for existing tokens, primitives, and components and reuse them. Only define new tokens for genuine gaps, and add them to the shared system rather than as one-off values. Describe the plan compactly: color (roles, not just hexes), type (2–3 roles), layout (prose + ASCII wireframe if useful), and — for marketing surfaces only — a signature element.
4. **Critique the plan against the anti-template test** (section 4) before writing code. If any part reads like the generic default for any similar brief, revise it and note what changed and why.
5. **Implement** — exact typography, color, spacing, radii, shadows, motion, and responsive behavior, derived from the token system, across every state the surface needs (see `references/design-review.md` for the states checklist).
6. **Render, inspect, and interact** — this is required whenever tooling allows it, not optional. See `references/responsive-validation.md` for the protocol: real screenshots at real width×height combinations (mobile through ultrawide, tablet included, short-height checked, and the actual constrained width the component will live in if it's not full-viewport), plus actually clicking, tabbing, resizing, and triggering loading/empty/error states. A screenshot is evidence, not proof; reading the code is not evidence at all. Do not declare a frontend task complete without having rendered and interacted with the real result.
7. **Self-critique against the full rubric** in `references/design-review.md`, then revise and re-render until it stabilizes.

## 6. Performance guardrails

A beautiful interface that damages Core Web Vitals or fails on ordinary hardware is a failed design:
- Don't block the largest visible element (often hero text or an image) on a slow-loading resource. Font loading is a deliberate decision, not a reflex — see `references/typography.md` for when `swap` vs. `optional` and when preloading is actually justified; don't preload every font/weight by default.
- Give images, video, embeds, and reserved ad/dynamic-content space explicit dimensions — no layout shift.
- Keep interaction-triggered work off the main thread where possible; heavy animation or layout thrash on click/tap costs responsiveness (INP), not just aesthetics.
- Hydrate only what's actually interactive; don't pay client-JS cost for static content.
- Serve appropriately sized images per viewport rather than shipping desktop assets everywhere.

## 7. Restraint and self-critique

Spend boldness where the brief supports it — on a marketing surface, that means one memorable signature element with everything else quiet around it. On a product surface, restraint isn't rationed boldness; it's the whole job. Not taking a risk can itself be a risk on the right brief — but taking one on the wrong brief (a settings page, a data table) is a mismatch, not a strength.

Build to a real quality floor, not an announced one: composed intentionally across mobile, tablet (portrait and landscape), laptop, and desktop — including realistic heights, not just widths — not just "shrinks under 768px" (`references/responsive-validation.md`); a clearly visible focus indicator, touch targets at least 24×24px, contrast met, reduced motion respected (without going visually inert), and every interaction state designed, not just the happy path (`references/accessibility.md`, `references/design-review.md`).

Consider Chanel's advice: before leaving the house, look in the mirror and remove one accessory. If you have somewhere to jot notes about what you've tried, use it — it helps avoid converging on the same answer next time.

## Writing in design

Words appear in a design for one reason: to make it easier to understand, and therefore easier to use. They are design material, not decoration. Bring the same intentionality to copy that you bring to spacing and color.

Write from the end user's side of the screen. Name things by what people control and recognize, never by how the system is built — a person manages notifications, not webhook config. Describe what something does in plain terms rather than selling it.

Use active voice as default. A control says exactly what happens when it's used: "Save changes," not "Submit." An action keeps its name through the whole flow — a "Publish" button produces a "Published" toast. Vocabulary consistency is how people learn their way around a product.

Treat failure and emptiness as moments for direction, not mood. Explain what went wrong and how to fix it, in the interface's voice. Errors don't apologize and are never vague. An empty screen is an invitation to act.

Keep the register conversational and tuned: plain verbs, sentence case, no filler, tone matched to brand and audience. Let each element do exactly one job — a label labels, an example demonstrates, nothing does double duty.

## Reference files

- `references/design-review.md` — the self-critique rubric (including cognitive load) and states-completeness checklist; read before declaring any interactive surface done.
- `references/accessibility.md` — WCAG 2.2-grounded checklist (focus, contrast, target size, motion, live regions, forms, screen readers) — with correct criterion levels, and normative requirements distinguished from stronger internal design targets.
- `references/typography.md` — type roles, variable fonts and optical sizing, contextual numeral guidance, mathematical-glyph and typeface evaluation protocols, loading strategy, line length/rhythm.
- `references/responsive-validation.md` — the responsive validation contexts (mobile / tablet portrait / tablet landscape / laptop / desktop), viewport height and constrained-width validation, and the render-and-interact protocol.
