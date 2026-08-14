# Responsive standard and validation protocol

## Five contexts — validation targets, not five mandatory layouts

"Responsive" does not mean building for desktop and stacking everything under a mobile breakpoint. It also doesn't mean designing five separate compositions. Treat the following as **contexts to validate the result in**, and compose intentionally for whichever of them actually need different treatment — use the fewest compositional changes that produce an excellent experience everywhere, and let breakpoints emerge from where the content/layout actually breaks, not from the existence of a device category:

- **Mobile** — typically touch-primary, narrow viewport. Use modern viewport units (`svh`/`lvh`/`dvh`) and safe-area insets so content isn't hidden behind browser chrome or device notches/home indicators.
- **Tablet portrait** — meaningfully wider than mobile; a layout that merely stacks like mobile-but-wider is wasting the format. Frequently used propped up or handheld at a different distance than a phone.
- **Tablet landscape** — can support genuinely different composition — side-by-side panels, a persistent sidebar — where the content justifies it.
- **Laptop** — the usual default "desktop" design target for most product work.
- **Desktop / ultrawide** — don't just stretch content full-bleed. Cap the readable measure and use extra width for real layout structure (panels, persistent navigation, multi-column composition) where there's genuinely more to show.

Treat "mobile = touch, no hover" and "laptop/desktop = pointer + keyboard, hover available" as useful priors, not guarantees — a keyboard-and-trackpad-equipped tablet in landscape, a touchscreen laptop, or a desktop user on a trackpad all break the naive mapping. Use capability queries (`@media (hover: hover)`, `(pointer: coarse)`) to reason about actual input capability where it matters, rather than inferring it solely from viewport width.

## Viewport height is first-class, not an afterthought

Width-only validation misses a common real failure: a page that's fine at every width but buries the primary task below the fold at ordinary heights. For any task-oriented interface, validate height as deliberately as width:

- Is the primary task/action visible without unnecessary scrolling at a realistic viewport height?
- Did introductory/marketing content push the actual product below the fold?
- Are sticky headers/footers/toolbars consuming so much vertical space that little is left for content?
- Does landscape orientation (wide but short) cause a failure that portrait at the same device didn't?
- Does a short laptop screen (e.g. 1366×768) behave differently from a tall desktop monitor at a similar width?
- Does mobile browser chrome (address bar, bottom toolbar) meaningfully eat into the usable height, and does the layout handle that gracefully (`dvh` rather than a unit that ignores it)?

**Validate width × height pairs, not widths alone.** Representative fixtures — test fixtures to sanity-check against, not breakpoint definitions, and to be adjusted to the actual product/audience where real device data exists:

| Context | Illustrative fixture |
|---|---|
| Mobile | 390×844 |
| Tablet portrait | ~768×1024 or ~820×1180 |
| Tablet landscape | ~1024×768 or ~1180×820 |
| Short laptop | 1366×768 |
| Laptop/desktop | 1440×900 |
| Wide desktop | 1728×900 or 1920×1080 |

## Constrained and reserved width

The browser viewport is frequently not the width the interface actually receives. A component or page may have to live inside less space than its raw viewport suggests: a navigation rail, a sidebar, an inspector/detail panel, a reserved ad rail, a split-screen multitasking pane, or a host application's embedded frame. Test the component/page at the width it will *actually* be given in its real placement, not only at full viewport width — this is a general layout-robustness concern, not specific to any one kind of side content. Where a component's ideal composition depends on the space it's actually rendered in rather than the total screen size, use **container queries** rather than viewport-width media queries.

## Technique

- **Container queries** for any component that should respond to its layout slot (sidebar vs. full-width, constrained vs. generous) rather than only the viewport.
- **Fluid sizing via `clamp()`** for type and spacing to reduce the number of discrete breakpoint jumps needed.
- **Orientation changes** are a real state to check, especially on tablets — not just a width to hit once.
- **Responsive density, not just responsive width** — the same content may want looser spacing on a touch-primary layout and tighter spacing on a pointer-primary one, independent of raw viewport size.

## Tablet, specifically

Tablet is a first-class context, not "large mobile" and not automatically a unique third composition either — let the content and task decide. Review, where relevant to the product: portrait and landscape use, touch interaction, keyboard/trackpad-equipped use (common in classroom/Chromebook-adjacent contexts), available vertical space in each orientation, and split-screen/multitasking behavior on platforms that support it.

## State preservation across resize and orientation change

Static screenshots at fixed widths aren't sufficient — verify the interface survives being resized or rotated *during* active use, not just that it looks right when loaded fresh at each size. Where relevant, resize or change orientation mid-interaction and confirm: typed input isn't lost, in-progress task state (an answer entered, a step reached) survives, selection state survives, keyboard focus isn't lost or stranded, scroll position doesn't jump unexpectedly, important content doesn't disappear, and the component doesn't silently remount/reset. This matters most for genuinely interactive applications (forms, exercises, multi-step flows) — a static content page has less at stake here.

## Validation protocol (required whenever tooling allows rendering and interacting)

1. **Baseline** — inspect the current/existing state before changing anything.
2. **Implement** the change.
3. **Capture screenshots at representative width×height fixtures spanning the contexts above** — not one "it's responsive" screenshot at a single width, and not width alone. Include at least one short-height fixture and, if the component will live inside a constrained layout slot (sidebar, panel, rail), the actual width it will receive there.
4. **Compare against intent** — does hierarchy read correctly at each size? Does anything clip, overlap, get cut off vertically, or require horizontal scrolling it shouldn't?
5. **Interact, not just look**:
   - Click/tap through the primary flow.
   - Tab through the full keyboard focus order and confirm it's visible and logical at each size.
   - Resize the viewport (and rotate, where orientation applies) live and mid-interaction where possible, don't only test fixed snapshot sizes.
   - Type unusually long content into text inputs and labels to check overflow handling.
   - Deliberately trigger loading, empty, and error states rather than only ever observing the happy path.
6. **Critique** the actual rendered, interacted-with result against `references/design-review.md`.
7. **Revise and re-render** — repeat steps 3–6 until the result is stable across the contexts that matter for this surface.
8. **Only then** consider the responsive work complete.

A screenshot is evidence, not proof. Reading the CSS/JSX and reasoning that "this should be responsive" is not evidence at all — render it, look at it, and interact with it before calling it done.
