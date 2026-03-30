# Math Practice

A scalable, front-end-only arithmetic practice platform. The goal is both SEO acquisition (many unique pages for long-tail queries) and a habit-forming interactive practice tool.

**Live site:** https://www.mathpractice.com
**Deploy target:** Netlify (static)

---

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | [Astro 6](https://astro.build) (static output) | File-based routing, real HTML per URL |
| UI | [React 19](https://react.dev) (islands only) | `client:load` only on the practice widget |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) | via `@tailwindcss/vite` — **not** `@astrojs/tailwind` |
| Hosting | Netlify | `netlify.toml` configured, zero server-side |

> **Critical:** Tailwind v4 uses the Vite plugin (`@tailwindcss/vite`), not the old `@astrojs/tailwind` integration. Theme tokens are defined with `@theme {}` in `src/styles/global.css`. There is no `tailwind.config.js`.

---

## Architecture

### Core idea: one engine, many pages

Every practice page is a static `.astro` file that:
1. Imports a named `PracticeConfig` preset from `src/engine/presets.ts`
2. Passes it to `<PracticeWidget client:load config={PRESET} />`
3. Provides its own unique H1, meta description, intro copy, and internal links

Adding a new page never requires changing any config files — only adding a preset and a `.astro` file.

### Engine layer (`src/engine/`) — zero framework dependencies

| File | Purpose |
|---|---|
| `types.ts` | All TypeScript interfaces (`PracticeConfig`, `Problem`, `SessionResult`, `PageStats`) |
| `generator.ts` | Problem generation with carrying/borrowing constraints, whole-number division |
| `scorer.ts` | Answer checking, session scoring, normalized timed scores (per-60s) |
| `storage.ts` | localStorage helpers (try/catch for private browsing), namespaced keys `mp_stats_{key}` |
| `presets.ts` | One named `PracticeConfig` constant per page — single source of truth for every page's behavior |

The engine has **no imports from React or Astro**. It's pure TypeScript and can be tested or used independently.

### React components (`src/components/`)

The `PracticeWidget` owns an `idle → active → complete` state machine and accepts a `PracticeConfig` prop. It knows nothing about which page it's on.

| Component | Role |
|---|---|
| `PracticeWidget.tsx` | Orchestrator — state machine, session logic, localStorage sync |
| `ProblemDisplay.tsx` | Vertical stacked problem format (operandA / operator+operandB / rule) |
| `AnswerInput.tsx` | Controlled input; `onMouseDown` preventDefault on submit button keeps mobile keyboard open |
| `FeedbackBanner.tsx` | Correct/incorrect flash with `aria-live="polite"`, auto-dismiss at 700ms |
| `ProgressBar.tsx` | Time remaining (timed) or problems done (untimed) |
| `TimerDisplay.tsx` | MM:SS countdown, turns orange at <10s |
| `ModeToggle.tsx` | Timed / Untimed toggle, persisted to `mp_mode_pref` |
| `DurationPicker.tsx` | 30s / 60s / 2m / 5m, persisted to `mp_duration_pref` |
| `ScoreCard.tsx` | End-of-session results, personal best detection, Play Again |
| `StatsPanel.tsx` | Read-only localStorage stats display (hydrates client-side only) |
| `InternalLinks.tsx` | Pure presentational link grid — no state |

### Layouts (`src/layouts/`)

- `BaseLayout.astro` — `<html>` shell with `<title>`, `<meta name="description">`, `<link rel="canonical">`, Open Graph tags
- `PracticeLayout.astro` — extends Base; adds header, breadcrumb, named slots for h1 / intro / widget / links / footer

### Pages (`src/pages/`)

24 static pages at launch. Each has a unique title, H1, description, canonical URL, and internal link set.

```
pages/
├── index.astro                          # / — hub, no widget
├── math-practice.astro                  # /math-practice
├── math-drills.astro                    # /math-drills
├── mental-math-practice.astro           # /mental-math-practice
├── arithmetic-speed-drill.astro         # /arithmetic-speed-drill
├── math-facts-practice.astro            # /math-facts-practice
├── addition-practice/
│   ├── index.astro                      # /addition-practice
│   ├── 1-digit.astro
│   ├── 2-digit.astro
│   └── 2-digit-carrying.astro
├── subtraction-practice/
│   ├── index.astro
│   ├── 1-digit.astro
│   ├── 2-digit.astro
│   └── 2-digit-borrowing.astro
├── multiplication-practice/
│   ├── index.astro
│   ├── facts.astro
│   └── 1-12.astro
├── division-practice/
│   ├── index.astro
│   └── facts.astro
└── math-worksheets/
    ├── index.astro
    ├── addition-worksheets.astro
    ├── subtraction-worksheets.astro
    ├── multiplication-worksheets.astro
    └── division-worksheets.astro
```

---

## Key Conventions

### Path alias
`@/*` resolves to `./src/*`. Use this everywhere:
```ts
import { ADDITION_1_DIGIT } from '@/engine/presets';
import PracticeWidget from '@/components/PracticeWidget';
```

### Adding a new practice page
1. Add a `PracticeConfig` export to `src/engine/presets.ts` with a unique `storageKey`
2. Create `src/pages/<slug>.astro` following the pattern of any existing page
3. Run `npm run build` to verify — no other config changes needed

### PracticeConfig shape
```ts
interface PracticeConfig {
  storageKey: string;           // unique per page — used for localStorage namespacing
  operation: 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed';
  mode: 'untimed' | 'timed';
  timerDuration: 30 | 60 | 120 | 300;
  operandA: { min: number; max: number };
  operandB: { min: number; max: number };
  carrying?: boolean;           // addition: false = no carrying guaranteed
  borrowing?: boolean;          // subtraction: false = A >= B guaranteed
  factsMode?: boolean;          // multiplication/division: use 1–12 facts
  maxFactor?: number;           // default 12
  problemCount?: number;        // untimed sessions, default 20
  operations?: Operation[];     // explicit list when operation === 'mixed'
}
```

### localStorage keys
- Per-page stats: `mp_stats_{storageKey}`
- Global mode preference: `mp_mode_pref`
- Global duration preference: `mp_duration_pref`

All localStorage access is wrapped in try/catch for private browsing compatibility.

### Styling
- Tailwind v4 utility classes throughout
- Custom color tokens defined in `src/styles/global.css` under `@theme {}`
- Key colors: accent `#3B82F6`, bg `#F8F9FB`, surface `#FFFFFF`, border `#E2E8F0`
- Font: Inter (loaded via Google Fonts in `BaseLayout.astro`)

### React + Astro islands
- React components only load where `client:load` is specified
- `PracticeWidget` and `InternalLinks` are the only components used as islands
- All other components are children of `PracticeWidget` and render client-side with it

---

## Local Development

```bash
npm install
npm run dev      # dev server at http://localhost:4321
npm run build    # production build → dist/
npm run preview  # preview the dist/ build
```

Always run `npm run build` before committing. TypeScript and Astro errors surface here, not in `dev`.

---

## Design System

| Token | Value | Use |
|---|---|---|
| accent | `#3B82F6` | Buttons, active states, operator symbols |
| accent-dark | `#2563EB` | Button hover |
| bg | `#F8F9FB` | Page background |
| surface | `#FFFFFF` | Cards |
| border | `#E2E8F0` | Card and input borders |
| text-primary | `#1E293B` | Body text |
| text-muted | `#64748B` | Captions, secondary text |
| success | `#22C55E` | Correct answer feedback |
| error | `#EF4444` | Wrong answer feedback |
| timer-warn | `#F97316` | Timer at <10s |

Problem display uses a vertical stacked format (operandA on top, operator+operandB below, horizontal rule) matching how math problems appear on paper.

---

## Deployment

Connect the GitHub repo to Netlify. Settings are in `netlify.toml`:
- Build command: `npm run build`
- Publish directory: `dist`
- 404: redirects to `/404`

No environment variables needed. No server. Pure static files.
