# disc

A deterministic, Disciples II–inspired turn-based strategy game: squads on 3x3 grids, a small 3D hex overworld, four asymmetric factions. Built mostly by Claude across many short sessions. The user suggests; Claude drives.

## Every session
1. Look at the board: `ls .kanban/*/` (conventions in `.kanban/README.md`; `pnpm board` renders it to
   `shots/board.html`). It says where we're going (the alpha) and what's next. Then `docs/status.md` for where
   things stand.
2. Read other docs only when the task touches them:
   - `docs/roadmap.md` — milestones, each ending in something playable
   - `docs/design/` — the game design canon (pillars, combat, abilities, art, factions, units, lore)
   - `docs/lethys-wrote-this-for-handover/faction-stuff/` — the user's unit design sheets (intent, no numbers; `_template.md`); read the relevant sheet before adding or changing a unit
   - `docs/questions.md` — what Claude needs from the user (short; check for inline answers)
   - `docs/provisional.md` — placeholder numbers and rules Claude picked; the user overrules when something bothers them
   - `docs/decisions.md` — why things are the way they are
   - `docs/engineering.md` — code map, engine conventions, gotchas that cost time before
   - `docs/prior-attempts.md` — why this repo works the way it does (read once)
3. **Take notes as you go, not at the end.** A session can end at any moment. Move board stories as their status
   changes and capture every new idea of the user's as a `maybe/` story the moment it comes up. Update `docs/status.md` with each commit (rewrite it; keep it short), record a decision in `docs/decisions.md` when you make one, a placeholder in `docs/provisional.md` when you pick one, and a question in `docs/questions.md` only when you're blocked or the choice is clearly the user's. The repo is the only memory that survives between sessions.

## Rules
- **Playable first.** Build only what the current milestone needs. No speculative systems: no save framework, event bus, plugin registry, or catalog loader until a milestone requires one.
- **Never invent mechanics, names, or lore.** If the design is silent, implement the simplest provisional rule, mark it provisional where it's defined, and list it in `docs/provisional.md`. Placeholder names stay plainly placeholder ("Capitol A", "unit_1"). Past AIs filled this project with invented content (see `docs/prior-attempts.md`).
- **`src/rules/` is pure.** Plain serializable data + pure functions. It never imports three.js, the DOM, or `src/view/`. No randomness; the game is deterministic.
- **Verify what you build.** `pnpm verify` (types, tests, screenshot, playtests) before calling anything done; for visual work use the `verify` skill and look at the PNGs. Don't call visual work done without having seen it.
- **Extend through the architecture** (`docs/design/architecture.md`, recipes in `docs/engineering.md`): new mechanics are traits, effect definitions, params and tags. The engine, AI and view never name an ability or effect id.
- Git: commit at natural checkpoints (work chunk done, tests green) with descriptive messages. Never push.

## Commands
```bash
pnpm dev --host   # vite dev server; the user connects over Tailscale
pnpm verify       # everything: tsc + vitest + screenshot + all playtests
pnpm check        # tsc + vitest
pnpm shot [out.png] [route]      # headless render (routes/params: see the verify skill)
pnpm playtest [name…]            # scripted clicks: battle, map, save, city, settings, setup (title → new game), spells
pnpm sim          # AI-vs-AI matrix of the preset squads (balance)
pnpm board        # the board (.kanban/) as shots/board.html
```
Image generation (Krea-2 in the local ComfyUI, on the second GPU) always runs in a background subagent with exact parameters: the `krea-images` skill. Unit concept art follows the `unit-concepts` skill (identity → concept → portrait; T-pose turnarounds in rounds, then `scripts/art/portraits.ts`).
Package manager is pnpm; build scripts need approval (`pnpm approve-builds <pkg>`).

## TypeScript style
- `strict` plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. No `any`, no `as` casts to silence the checker.
- Model data with `type`/`interface` and discriminated unions; use classes only for view objects that own three.js resources.
- No mutable module-level state. No backwards-compatibility shims: rename directly and delete what's unused.
- Comments only for a non-obvious *why*.

## Layout
```
src/rules/    game state + rules (pure): battle/, abilities/, units/, world/, effects.ts, balance.ts
src/view/     three.js scene + HTML UI; renders state, turns input into actions
src/main.ts   entry
scripts/      dev tooling (shot.ts)
docs/         notes and design (above)
```
