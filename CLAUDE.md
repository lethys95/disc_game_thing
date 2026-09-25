# disc

A deterministic, Disciples II–inspired turn-based strategy game: squads on 3x3 grids, a small 3D hex overworld, four asymmetric factions. Built mostly by Claude across many short sessions. The user suggests; Claude drives.

## Every session
1. Read `docs/status.md` first. It says where things are and what's next.
2. Read other docs only when the task touches them:
   - `docs/roadmap.md` — milestones, each ending in something playable
   - `docs/design/` — the game design canon (pillars, combat, abilities, factions, units, lore)
   - `docs/questions.md` — open questions for the user; check for inline answers
   - `docs/decisions.md` — why things are the way they are
   - `docs/prior-attempts.md` — why this repo works the way it does (read once)
3. Before ending (or at a milestone), **rewrite** `docs/status.md`, append any decisions, and add questions. This is the only memory that survives between sessions, so keep it short and accurate.

## Rules
- **Playable first.** Build only what the current milestone needs. No speculative systems: no save framework, event bus, plugin registry, or catalog loader until a milestone requires one.
- **Never invent mechanics.** If the design is silent, implement the simplest provisional rule, mark it provisional where it's defined, and add a question to `docs/questions.md`.
- **`src/rules/` is pure.** Plain serializable data + pure functions. It never imports three.js, the DOM, or `src/view/`. No randomness; the game is deterministic.
- **Verify what you build.** `pnpm test` for rules; `pnpm shot` and look at the PNG for anything visual. Don't call visual work done without having seen it.
- Git: commit at natural checkpoints (work chunk done, tests green) with descriptive messages. Never push.

## Commands
```bash
pnpm dev          # vite dev server (the user opens it in a browser)
pnpm test         # vitest
pnpm typecheck    # tsc (TypeScript 7)
pnpm shot [out.png] [route]   # headless render → shots/latest.png by default
```
Package manager is pnpm; build scripts need approval (`pnpm approve-builds <pkg>`).

## TypeScript style
- `strict` plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. No `any`, no `as` casts to silence the checker.
- Model data with `type`/`interface` and discriminated unions; use classes only for view objects that own three.js resources.
- No mutable module-level state. No backwards-compatibility shims: rename directly and delete what's unused.
- Comments only for a non-obvious *why*.

## Layout
```
src/rules/    game state + rules (pure)
src/view/     three.js scene + HTML UI; renders state, turns input into actions
src/main.ts   entry
scripts/      dev tooling (shot.ts)
docs/         notes and design (above)
```
