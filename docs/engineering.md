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
  doctrine.ts        forks per faction, commitments, allowed units
  progression.ts     XP value and evolution
  balance.ts         provisional numbers that aren't unit stats or ability params
  ai.ts              battle AI (one ply, generic valuation + traits' aiValue), autoplay
  hex.ts, map.ts     hex math; seeded map generation (sites, nodes, lairs), A*
  world/             state (data + lookups), create, movement, economy, battles (map→battle→map), actions, ai
src/view/
  stage.ts           the one renderer/camera/bloom/labels/tween loop
  scene.ts, map.ts   BattleScene, MapView
  app.ts, campaign.ts battle and map controllers
  hud.ts, setup.ts   panels; dom.ts shared helpers; text.ts rules text from params
  secrecy.ts         what a player may see (hidden effects, secret targets)
  ai.worker.ts, ai-client.ts, ai-protocol.ts   the AI off the main thread
```
Imports use `#rules/…`, `#view/…`, `#tests/…` (package.json `imports`), never `../`.

## Recipes
- **A new ability.** Add a behavior to the right `abilities/<faction>.ts`: `active` with `tags`, `defaults` (params such as `power`, `charges`), `choices` and `resolve`; or `passive` with `hooks`. Deal damage through `ctx.hit(self.unitId, targets, ctx.hitSpec(self, tags))`. Add its rules text to `view/text.ts` (written from params) and a test. A variant is usually the same behavior with other params on the unit (`{ id, params, name }`), not new code.
- **A new effect.** Add a definition to `effects.ts`: stacking, lifetime, visibility, `quiet` if the view shouldn't announce it, hooks, and `aiValue` if the AI should care. Apply it with `ctx.addEffect(target, { def, source, amount, stacks })`.
- **A new mechanic that needs a new hook point.** Add the hook to `Hooks` in `battle/types.ts` and call it from one place in the engine or the damage pipeline. That's the only reason to touch the engine.
- **World → battle.** Anything the world gives a battle (a node, an item, a spell on a warband) becomes effects: side-wide through `BattleContext.sideEffects`, or per unit through `Placement.effects`.
- **A new node kind.** Add it to `nodes.ts` (income, battle effects) and give the map view a model for it.
- **A new unit.** Add it to `units/<faction>.ts`, and to `EVOLUTIONS` / `FACTION_ROOTS` in `units/index.ts` if it's in a tree. Add a figure in `view/figures.ts`.

## Conventions
- `applyAction` / `applyWorldAction` structuredClone the state, mutate the draft, and return `{ state, events }`. Events drive animation and the log. Everything is plain data, which is why the AI can run in a worker and battles can be forecast.
- `applyAction` has **already advanced** to the next slot when it returns (start-of-turn bleed, stun skips). Tests about one action should assert on the returned events.
- Nothing outside `abilities/` and `effects.ts` names an ability or effect id. The engine, AI and view use tags, flags (`reschedules`, `secretTarget`, `visibility`, `quiet`) and hooks.
- Anything the design doesn't specify is marked provisional where it's defined and listed in `docs/questions.md`.
- `pnpm verify` before calling anything done: types, tests, a screenshot, and both click-through playtests.

## Gotchas
- **CSS2DRenderer positions labels through `transform`.** A CSS animation on `transform` silently overrides it (every float drew at the top-left). Animate an inner element.
- **`[hidden]` loses to author `display:` rules.** A global `[hidden] { display: none !important }` is in `style.css`; keep it.
- CSS2DRenderer only updates labels in the scene it renders; `Stage.show` hides the outgoing scene's labels.
- **Hidden information goes through `view/secrecy.ts`.** Every log and animation path must be masked, and previews use a battle without the player's own hidden effects. The AI sees everything.
- Tests about one unit's behavior usually need `until(battle, id)` (`#tests/helpers`): turn order is by initiative, and it's easy to query the wrong unit.
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
