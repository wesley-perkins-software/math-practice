# Typography reference

## The rule

Choose typefaces by role and fitness, not by novelty or popularity in either direction. A typeface being popular (Inter, system-ui) does not disqualify it — it may be exactly the right, most legible choice for a UI role. A typeface being unusual does not justify it — it must earn its place on legibility, audience fit, and content demands, the same as every other design decision. Never load more than 2–3 families on one interface.

## Separate roles

- **Brand/display** — identity, used sparingly and at sizes large enough that minor optical imperfections don't matter. This is where a characterful, less-common face can genuinely earn its place, especially on a marketing surface.
- **Interface/UI** — labels, controls, running body copy. Optimize for legibility at small sizes, consistent rendering across operating systems' font hinting/rendering engines, and a full weight range you'll actually use. This is the role where popular, extremely-legible faces are usually the *correct* choice, not a compromise.
- **Numeric/data/math** (when relevant — this matters a great deal for any interface displaying arithmetic, statistics, or tabular data) — needs unambiguous glyph shapes (1/l/I, 0/O must be visually distinct) and, for anything involving real mathematical notation, correct operator/fraction glyphs. Whether it also needs *tabular* figures is contextual — see Numerals below, and see Mathematical glyph evaluation for how to actually check a candidate face rather than assume.

Typography **roles do not imply separate font families.** One well-chosen family can cover interface and numeric/data roles, and on many products the entire interface — brand included. Introduce a second or third family only when a specific role genuinely can't be served well by the first (e.g., the interface face lacks the numeral quality a data-heavy screen needs), and weigh that against the added visual surface and the extra font payload.

## Variable fonts and optical sizing

Variable fonts (single file, multiple registered axes: weight, width, slant, italic, optical size) are production-ready and reduce both file count and the risk of mismatched static cuts. Where a face has an optical-size (`opsz`) axis, use `font-optical-sizing: auto` so the letterforms actually adapt to their rendered size — a typeface's small-size cut and its large-display cut are often genuinely different letterform designs, not just a scaled version of each other.

## Numerals

Tabular figures are not a universal upgrade — they're a fix for a specific problem (digits shifting width and disturbing layout), and they cost something: proportional figures are usually better-spaced and more readable in isolation. Choose per context:

- **Use `font-variant-numeric: tabular-nums`** where digit-width changes would cause distracting movement or misalignment: numbers stacked in a table/column, a timer or counter that updates in place, a scoreboard, a streak count next to a static label — anywhere layout stability matters more than the numeral's individual spacing.
- **Prefer the font's default (usually proportional) figures** for a large standalone number, a number inside a headline, or a number inside ordinary prose — a big arithmetic expression rendered as a display element, a hero stat, a sentence with a number in it. These aren't updating in place or aligning against neighbors, so proportional spacing typically reads better.
- If a candidate typeface is being considered for a numerically dense role, confirm it actually *has* tabular figures before committing — don't assume a font with attractive default numerals also has a tabular variant.

## Mathematical glyph evaluation

Attractive letterforms don't guarantee attractive math. For any interface that displays mathematics or numeric expressions as content (not just UI chrome), inspect the actual glyphs a candidate typeface produces before committing — don't assume quality carries over from the letters. As applicable to the domain, check: digits, `+`, the true minus sign `−` (U+2212, distinct from a hyphen) where the domain calls for it, `×`, `÷`, `=`, decimal point, thousands comma, parentheses, fraction forms, `%`, and any other domain-specific symbols.

Evaluate each for: glyph distinction (is `×` clearly a multiplication sign and not a stray lowercase x; is `−` visually distinct from a hyphen), optical weight relative to the digits it sits next to, vertical alignment and baseline relationship (does `=` sit centered against the digits, does a fraction's bar align sensibly), spacing around operators, and readability at both the smallest and largest sizes the interface actually uses — a symbol that reads fine at UI-label size may look wrong blown up as a large display expression, or vice versa.

Do this by rendering representative production strings in context, at real sizes, not by reading a font's specimen page. The exact strings depend on the product's domain; the point is to test real expressions, not the alphabet. Illustrative examples of the *kind* of string to render (not requirements for any specific product):

```
8 × 7 = ?
144 ÷ 12 = ?
1,204 − 978
00:47
12 correct
Streak: 8
```

## Typeface evaluation protocol

Never select a typeface from a specimen page or font-marketplace preview alone — evaluate it inside the actual interface. Before committing:

1. Render real headings, paragraphs, labels, buttons, and controls in the candidate face — not lorem ipsum, the product's actual copy.
2. Render the longest realistic strings the interface will actually show (a long label, a wrapping button, an overflowing name) to see how the face wraps and breaks.
3. Render the numerals and, if applicable, the domain's mathematical symbols (see above).
4. Check all of the above at the actual production sizes and weights, across the responsive contexts in `references/responsive-validation.md` — a face that looks great at a 48px desktop heading can degrade at a 14px mobile label.
5. Compare candidates on: readability, product/brand fit, density (how much content fits without crowding), wrapping behavior, hierarchy (does the weight range actually differentiate levels), numeral and symbol quality, how it sizes inside existing control components (buttons, inputs — does line-height push them taller than intended), rendering consistency across operating systems, layout stability (does swapping to it shift things), and performance cost (file size, number of weights actually needed).

## Line length, line height, and scale

- Sustained-reading body text: roughly 45–75 characters per line.
- Line-height scales inversely with size — tighter for large display text, looser for small body text.
- Prefer a fluid type scale built with `clamp()` over a fixed set of per-breakpoint font sizes; it reduces the number of discrete jumps and reads better across the full responsive range (see `references/responsive-validation.md`).
- `text-wrap: balance` (short headings) and `text-wrap: pretty` (body paragraphs) can improve line-breaking where supported — but they're layout decisions with real support and performance characteristics (browser support varies, and `balance` in particular has a line-count limit and a non-trivial layout cost on some engines), not a costless default. Use them deliberately where ragged lines are actually a problem, not everywhere as a reflex.

## Loading and performance

Font-loading strategy is a set of decisions to make deliberately, not a fixed recipe to apply everywhere. For each font actually shipped, decide:

- **`font-display` value** — `swap` (show fallback immediately, swap when ready) is a reasonable default for body/UI text, but consider `optional` for a non-essential display/brand face where a layout-shifting late swap would cost more than just keeping the fallback for that visit. Choose per font, not as a blanket rule.
- **Whether to preload it at all.** Preloading is for the specific font(s) actually needed for above-the-fold, LCP-relevant text — not every weight and style shipped. A preload competes with other LCP-critical resources (hero image, critical CSS); reflexively preloading every font file can *hurt* LCP rather than help it. Justify each preload.
- **How many weights/styles are genuinely used.** Every additional static weight is another file; a variable font can replace several static cuts with one file, but only where the actual design uses a range of weights rather than one or two fixed ones — evaluate the tradeoff rather than defaulting to either approach.
- **Fallback behavior** — does the interface truly need the custom face to eventually load and replace the fallback, or is the fallback acceptable to keep showing for slow connections? This should be a stated decision, not an accident of default browser behavior.
- Match a system-font fallback's metrics to the custom font (via `size-adjust`/`ascent-override`/`descent-override` `@font-face` descriptors) to minimize the layout shift caused by whichever swap behavior is chosen.
- Subset to the character set actually used; don't ship a full multi-script font file for a Latin-only interface.
- Prefer self-hosting over third-party font CDNs where practical — both for load-time predictability and because third-party font requests are a real, easily-avoided privacy leak (they report visitor IPs/behavior to the font host).

## Fallback stacks

Always specify a realistic fallback stack (a close-metrics system font, then a generic family) — never let a failed custom-font load fall back to an arbitrary default.
