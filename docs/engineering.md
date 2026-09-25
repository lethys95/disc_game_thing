# Engineering notes

How the code is laid out, how to extend it, and what has bitten before. The rules model itself is explained in `design/architecture.md`; read that first when touching `src/rules/battle/`.

## Map
```
src/rules/
  battle/types.ts    battle data, events, Hooks (the trait interface), EffectDef, Behavior, Ctx
  battle/engine.ts   turn flow, legality, actions, effect lifetimes, createBattle (with context), makeCtx
  battle/damage.ts   the damage pipeline (hit, receive, lose)
  battle/traits.ts   which traits apply: a unit's effects, then its passives (own and granted)
  battle/grid.ts     3x3 geometry, front lines, melee reach
  abilities/         behaviors by faction (core, jilliath, nexus, neutral) + index (registry, paramsOf)
  effects.ts         effect definitions
  units/             unit catalogue by faction + index (UNITS, roots, recruit costs, evolutions)
  nodes.ts           city node kinds (income, battle effects)
  forks.ts           per-line forks: commitments (fork → branch), allowed units, starting-squad checks
  progression.ts     XP value and evolution
  balance.ts         provisional numbers that aren't unit stats or ability params
  ai.ts              battle AI (one ply, generic valuation + traits' aiValue), autoplay
  hex.ts, map.ts     hex math; seeded map generation (sites, nodes, lairs), A*
  world/             state (data + lookups), create, movement, economy, battles (map→battle→map), actions, ai,
                     leaders (the leader tree), record (a unit's marks + leader bonuses → battle placement, max HP)
src/view/
  stage.ts           the one renderer/camera/bloom/labels/tween loop
  scene.ts, map.ts   BattleScene, MapView
  app.ts, campaign.ts battle and map controllers
  hud.ts, setup.ts   panels; dom.ts shared helpers
  secrecy.ts         what a player may see (hidden effects, secret targets)
  ai.worker.ts, ai-client.ts, ai-protocol.ts   the AI off the main thread
```
Imports use `#rules/…`, `#view/…`, `#tests/…` (package.json `imports`), never `../`.

## Adding content
The step-by-step recipes (units, abilities, effects, nodes, forks, recording the user's design first) live in the `add-content` skill (`.claude/skills/add-content/SKILL.md`), so they come up whenever content is added.

## Conventions
- `applyAction` / `applyWorldAction` structuredClone the state, mutate the draft, and return `{ state, events }`. Events drive animation and the log. Everything is plain data, which is why the AI can run in a worker and battles can be forecast.
- `applyAction` has **already advanced** to the next slot when it returns (start-of-turn bleed, stun skips). Tests about one action should assert on the returned events.
- A definition carries its own rules text (`describe`), so an ability or effect is one place to read and change; `tests/descriptions.test.ts` checks every text renders.
- Nothing outside `abilities/` and `effects.ts` names an ability or effect id. The engine, AI and view use tags, flags (`reschedules`, `secretTarget`, `visibility`, `quiet`) and hooks.
- Anything the design doesn't specify is marked provisional where it's defined and listed in `docs/questions.md`.
- `pnpm verify` before calling anything done: types, tests, a screenshot, and both click-through playtests.

## Gotchas
- **CSS2DRenderer positions labels through `transform`.** A CSS animation on `transform` silently overrides it (every float drew at the top-left). Animate an inner element.
- **`[hidden]` loses to author `display:` rules.** A global `[hidden] { display: none !important }` is in `style.css`; keep it.
- CSS2DRenderer only updates labels in the scene it renders; `Stage.show` hides the outgoing scene's labels.
- **Hidden information goes through `view/secrecy.ts`.** Every log and animation path must be masked, and previews use a battle without the player's own hidden effects. The AI sees everything.
- Tests about one unit's behavior usually need `until(battle, id)` (`#tests/helpers`): turn order is by initiative, and it's easy to query the wrong unit.
- **Percentage stat bonuses add `base × percent`.** Stat hooks run in battlefield order; multiplying the running total makes the result depend on which trait ran first.
- A unit's max HP on the map is `maxHpOf(member, leader)` (`world/record.ts`), not the unit type's: effects it brings can raise it. Battles cap starting HP at the effective max.
- A local variable named like a module helper shadows it: tsc says "not callable".
- pnpm needs build scripts approved (`pnpm approve-builds <pkg>`); esbuild is approved. TypeScript is v7; the config is strict and rejects unused locals and parameters.

## Debt: status after the consolidation (2026-09-25)
Resolved:
- Effects scattered through the engine → effect definitions with hooks, lifetimes and stacking.
- No ability params → `{ id, params, name }` with behavior defaults.
- Hard-coded ids outside abilities → tags and flags (this also fixed casters and archers having no default attack).
- `world.ts` monolith → seven modules.
- AI special cases → generic valuation plus traits' `aiValue`.
- AI on the main thread → a worker, with per-decision forecast memoisation.
- Duplicated DOM helpers; playtests outside the check → `pnpm verify`.
- Balance numbers scattered → `balance.ts`, plus params and unit stats.

Still open:
- **The AI is one ply deep.** It plays greedily. A better AI (look-ahead, or rollouts with the forecast machinery) is its own milestone.
- **`App` and `Campaign` are still big controllers** mixing input, state and rendering. Fine at this size; split them when the next screen (e.g. a city screen) arrives.
- **Stats are recomputed often** (`stats()` walks every trait on the battlefield). It's fast enough at 18 units; memoise per action if battles grow.
