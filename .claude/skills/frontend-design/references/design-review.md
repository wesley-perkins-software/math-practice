# Design review rubric

Use this before declaring any non-trivial frontend surface complete. It's a gate, not a suggestion — a task that hasn't been checked against this hasn't been finished, regardless of how correct the code looks.

## The review lenses

**Product** — Can the user accomplish the primary job quickly, with the interface type from `SKILL.md` section 1 in mind? A utility that requires hunting for the primary action has failed regardless of how it looks.

**Hierarchy** — Does attention go to the right thing first? Squint-test it: what reads first, second, third? Does that order match what actually matters?

**Cognitive load** — How many decisions are visible at once? How many visual groups are competing for attention? Is secondary information (promo, metadata, chrome) competing with the primary task instead of receding behind it? Could anything be progressively disclosed instead of shown up front? Does the interface make the user hold information in their head that it could just show them again? For anything repeated-use, is the primary interaction *faster to understand* on the second, tenth, and hundredth visit — not just clear on first impression? Note: the goal is *appropriate* load for the task and audience, not minimalism for its own sake — a data-dense professional tool legitimately shows more at once than a single-task utility, and removing real affordances in the name of looking clean is its own failure.

**Distinctiveness** *(scope to interface type)* — For a marketing/brand surface: could this belong to ten unrelated products? If yes, revise. For a product/utility surface: is it *consistent* with the rest of the product and clear on its own terms? Novelty is not the goal here — coherence is.

**Typography** — Are role, scale, rhythm, and readability all correct? Are numeral figures (tabular vs. proportional) matched to context — tabular where digits align or update in place, proportional for standalone/display/prose numbers? For any interface showing real mathematical notation, were the actual operators and symbols checked in context, not assumed from the letterforms? (`references/typography.md`)

**Color** — Does every color have a role (brand / surface / semantic / interaction / data)? Is anything communicated by color alone that should have a redundant cue?

**Spacing** — Is proximity communicating structure before any container was added? Are there cards nested inside cards? Could a box be replaced with spacing and still read clearly?

**Interaction** — Are controls obvious and satisfying to use? Does every clickable/tappable thing look clickable/tappable? Is feedback immediate?

**Responsive** — Was the interface validated across the five responsive *contexts* (mobile, tablet portrait, tablet landscape, laptop, desktop — usage contexts to check, not five mandatory distinct layouts), including short-height and constrained-width scenarios, or was one layout just scaled/stacked? Was it tested at the width (and height) it will *actually* receive in production — inside a nav/sidebar/panel/host-app frame, not just a bare full-width browser tab? (`references/responsive-validation.md`)

**Accessibility** — Can this be operated and perceived in more than one way (pointer, keyboard, screen reader, zoomed, high-contrast mode)? (`references/accessibility.md`)

**Performance** — Did any aesthetic choice impose an unnecessary cost (layout shift, blocked LCP, heavy interaction-thread work)?

**Consistency** — Did this change introduce a new one-off color, spacing value, or component where an existing token/primitive would have worked? A new one-off value should be treated the way a new dependency would be — justify it or remove it.

**Restraint** — What can be removed without reducing usefulness? Apply Chanel's rule: look once more, remove one thing.

## States-completeness checklist

Before calling an interactive surface done, confirm each relevant state has actually been designed and rendered — not merely theoretically supported by the code:

- Initial
- Hover
- Focus
- Active / pressed
- Selected
- Disabled
- Loading
- Empty
- Partial / skeleton
- Success
- Error
- Offline (where applicable)
- Destructive-action confirmation
- Overflow / very long content (a name, a number, a label that's much longer than the design mock assumed)
- Localization expansion (where applicable — some languages run 30%+ longer than English)

Check the **transitions** between these states too, not just each state as a static screenshot — does focus move sensibly when a loading state resolves into content? Is a meaningful state change (an error appearing, a task completing) actually announced to assistive tech, without also announcing every trivial intermediate update along the way (see the live-region guidance in `references/accessibility.md`)?

## Definition of done

A frontend task is done when:
1. It's been rendered and interacted with at real width×height combinations spanning the five responsive contexts, including the width/height it will actually receive in production and at least one short-height scenario (not inferred from reading the code).
2. Every state in the checklist above that's relevant to this surface has been triggered and inspected, not just the happy path.
3. It passes the accessibility checklist in `references/accessibility.md`.
4. Every color, spacing value, and typographic choice traces to an existing or newly-added system token — no unexplained one-offs.
5. This rubric has been applied and anything it flagged has been fixed or explicitly accepted with a stated reason.
