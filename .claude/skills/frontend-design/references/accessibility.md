# Accessibility reference

Grounded in WCAG 2.2 (the current W3C Recommendation as of 2026). Treat this as a running design constraint, checked at implementation and again at review (`references/design-review.md`) — not a cleanup pass applied after the design is otherwise finished.

## Structure

- Semantic HTML first. Reach for ARIA only to fill a genuine gap semantic elements can't cover, not as a default.
- One landmark structure that matches the page's actual regions (header/nav/main/aside/footer), not a div soup with ARIA roles bolted on.
- One `h1`, no skipped heading levels, heading order matches visual/logical order.
- Keyboard tab order matches visual reading order (WCAG 2.4.3). If a component reorders visually (e.g. via CSS grid `order`), verify the DOM/tab order wasn't silently left behind — this is a common source of confusing keyboard experiences in dynamically-styled layouts.

## Focus

Every interactive element needs a visible focus indicator, and two WCAG 2.2 criteria apply here — don't conflate them:

- **WCAG 2.4.11 Focus Not Obscured (Minimum) — AA (normative conformance target).** When a component receives keyboard focus, it must not be *entirely* hidden by other author-created content (a sticky header, a cookie banner, a floating action button). This is about occlusion, not the indicator's size or contrast.
- **WCAG 2.4.13 Focus Appearance — AAA (not required for AA conformance; adopt as an internal design-quality target).** Specifies the indicator's own visibility characteristics: roughly a 2px-thick perimeter (or equivalent area) around the focused element, and at least 3:1 contrast between the focused and unfocused states. Most products only need to conform to AA, so treat this criterion as a stronger bar we're choosing to hold ourselves to for indicator quality, not as a compliance requirement.
- Never remove a focus outline without replacing it with something that's clearly visible and adequately contrasted — `outline: none` alone is a defect, not a stylistic choice.
- Manage focus deliberately on dynamic changes: when a dialog opens, move focus into it; when it closes, return focus to what triggered it; when content a user is reading gets removed/replaced (e.g., a form field disappearing mid-interaction), don't strand or silently relocate their focus.

## Screen readers and dynamic content

- Give every control an accessible name — especially icon-only buttons, which need an explicit label, not just a visual icon.
- Use live regions (`aria-live`) for status messages and async results — but treat every announcement as something to justify, not a default. Before adding one, ask: does this update actually need to be spoken, or is it visually obvious to a sighted user in a way a screen-reader user needs the equivalent of? Rapidly-updating UI (timers, running scores, live validation-as-you-type, streak counters, progress ticks) is exactly where over-announcing turns a live region into noise that buries the updates that actually matter — batch, throttle, or only announce meaningful deltas (a countdown reaching zero, a final score, a completed attempt) rather than every intermediate tick.
- Choose politeness level deliberately: `polite` (wait for a pause, the default for most status updates) vs. `assertive` (interrupts immediately — reserve for genuinely time-critical or blocking information, like a session about to expire or a critical error). Assertive-by-default is a common overuse.
- Be specifically careful with dynamic DOM changes near an element the user currently has focus on or is being read by a screen reader — reordering, removing, or replacing content out from under an active interaction is one of the most disorienting failures an interface can have.

## Target size and touch

- **WCAG 2.5.8 Target Size Minimum (AA): at least 24×24 CSS px**, or an equivalent spacing/exception. Treat this as the accessibility floor, not the design target.
- Default to platform touch-target guidance (roughly 44–48px) for primary touch controls, and larger still for any child-facing or motor-control-sensitive context (see the educational-product note in `SKILL.md`).
- Nothing should require a hover-only or drag-only interaction without a pointer/keyboard alternative.

## Color and contrast

- Text contrast: WCAG 1.4.3 (4.5:1 normal text, 3:1 large text) at minimum.
- Non-text/UI-component contrast: WCAG 1.4.11 — this covers input borders, icon-only controls, and focus indicators, not just body text.
- Color is never the sole means of conveying information (WCAG 1.4.1) — pair it with text, icon, or pattern redundancy (error states, chart series, status badges).
- Support `prefers-contrast`/`forced-colors` media features so the interface degrades gracefully rather than breaking under a user's OS-level high-contrast mode.

## Motion

- Respect `prefers-reduced-motion`, but treat it as "remove non-essential *movement*," not "remove all feedback." Under reduced motion: eliminate or substantially shrink spatial movement, zooming/scaling, parallax, large transforms, and anything that pans or shifts the viewport — the categories actually linked to vestibular discomfort. Opacity and color-based feedback, and small, functional state changes, may remain; deleting all visual feedback in reduced-motion mode trades one accessibility failure (motion sickness) for another (no confirmation an action registered).
- Functional feedback that a person genuinely needs — a save confirmed, an error appeared, an answer was accepted — must not silently disappear just because reduced motion is on. Re-express it without large-scale movement (a color/opacity change, an icon swap, a static message) rather than omitting it.
- **WCAG 2.3.3 Animation from Interactions — AAA (not required for AA conformance; adopt as an internal design-quality target).** Any animation triggered by a user interaction (not just autoplay, which is covered separately by 2.2.2 Pause, Stop, Hide at Level A) should be possible to disable, unless the motion itself is essential to the function (e.g., a drag-and-drop reorder). Honoring `prefers-reduced-motion` is the practical way to meet this regardless of which conformance level the product targets.

## Zoom, resize, and reflow

- Content must reflow without loss of information or function at 400% zoom / narrow-viewport-equivalent width (WCAG 1.4.10) — no horizontal scrolling required to read primary content, no clipped or overlapping text.
- Don't hard-cap font sizes in a way that defeats browser text-resizing.

## Forms and errors

- Associate error messages programmatically with their field (`aria-describedby` or equivalent), not just visually adjacent (WCAG 3.3.1).
- Identify what's wrong and how to fix it in text, not color alone.
- Label every input; placeholder text is not a substitute for a label.

## Validation

Run an automated scanner (e.g. axe-core or equivalent) when tooling allows it — treat it explicitly as a floor. Automated tools catch roughly a third of real accessibility issues at best; they do not replace an actual keyboard walk-through (tab through the whole flow, confirm focus is always visible and logical) and, where feasible, a screen-reader spot-check of the primary flow.
