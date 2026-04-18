# Math Practice — Project Instructions

## Repository

- **Repo**: `wesley-perkins-software/math-practice`
- **Working branch**: always develop on `claude/math-practice-platform-mrVjl`
- **PR target**: always target the `development` branch

## Workflow Rules

### Pull Requests
After implementing and pushing code changes, **always create a pull request** targeting the `development` branch as the final step. Do not wait to be asked.

Use the `mcp__github__create_pull_request` tool with:
- `owner`: `wesley-perkins-software`
- `repo`: `math-practice`
- `base`: `development`
- `head`: current working branch

### Stack
- Astro 6 (static output) + React 19 (islands) + Tailwind CSS v4
- Tailwind is configured via `@tailwindcss/vite` — do NOT use `@astrojs/tailwind`
- Path alias: `@/*` → `./src/*`

### Adding Pages
1. Add a preset to `src/engine/presets.ts`
2. Create a new `.astro` file in `src/pages/`
3. No config changes needed — Astro picks it up automatically

### Build Verification
Always run `npm run build` before committing to catch TypeScript or Astro errors.
