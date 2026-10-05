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
  research.ts        Capitol research (one-time unlocks for the side)
  upgrades.ts        unit-type upgrades (placeholder content: +5 damage per type)
  forks.ts           per-line forks: commitments (fork → branch), allowed units, starting-squad checks
  progression.ts     XP value and evolution
  save.ts            the save format: the world + a header; other versions are refused
  balance.ts         provisional numbers that aren't unit stats or ability params
  ai.ts              battle AI (one ply, generic valuation + traits' aiValue), autoplay
  hex.ts, map.ts     hex math; seeded map generation (sites, nodes, lairs), A*
  world/             state (data + lookups), create, movement, economy, battles (map→battle→map), actions, ai, squads (SquadRef, meeting, transfers),
                     leaders (the leader tree), record (a unit's marks + leader bonuses → battle placement, max HP)
src/view/
  stage.ts           the one renderer/camera/bloom/labels/tween loop
  scene.ts, map.ts   BattleScene, MapView
  landscape.ts       the map's ground: one continuous mesh, blended terrain textures, grass; grid, fog and highlights drawn
                     by its shader from a per-hex state texture (so fog/highlight changes never touch geometry)
  app.ts, campaign.ts battle and map controllers (campaign: game flow, input, AI turns, what goes where)
  map-panels.ts      beside the map: your warbands, your cities, the end banner
  map-text.ts        the hint line and news, pure text over the known world (tested)
  peek.ts            hold-right-click peeks (formations, as last seen)
  fork-prompt.ts     "a unit is ready to evolve" and Decide later
  forecasts.ts       battle forecasts for the hint, from the worker
  spells.ts          the Capitol's Spells tab and the map's spell bar (aiming lives in campaign.ts)
  sound.ts, sound-slots.ts, sound-cues.ts   sound: WebAudio playback (effects, music and ambience loops), the slots with fallback chains, events → cues
  settings.ts        player settings (speed, camera, hotkeys), kept in localStorage; the menu's Settings page edits them
  standee.ts         paper standees: a unit's portrait as a camera-facing card (stand-in battle figures)
  city.ts            a city's screen (City tab: squad grids, recruit on a tile, graveyard; Research tab for the Capitol); also two warbands meeting
  squad-grid.ts      a 3×3 squad grid with drag and drop, empty-tile menus and unit actions
  research.ts        the Capitol's Research tab (archetype tabs, trees with forks and upgrades)
  leader.ts          a leader's screen (the leader tree by prerequisites, its warband)
  members.ts         a squad member's row: HP, XP, track record
  saves.ts, menu.ts  where saves live (localStorage behind a SaveStore interface; file export/import) and the game menu
  art-slots.ts, art.ts  art slots (pure: which content has which slot, fallbacks) and their DOM (image or placeholder)
  hud.ts, setup.ts   panels; dom.ts shared helpers
  secrecy.ts         what a player may see (hidden effects, secret targets)
  ai.worker.ts, ai-client.ts, ai-protocol.ts   the AI off the main thread
```
Imports use `#rules/…`, `#view/…`, `#tests/…` (package.json `imports`), never `../`.

## Art
Art is assigned by **slot**: one per unit (`portrait/<unitId>`), ability (`ability/<id>`), and effect (`effect/<id>`). A unit's art has three framings, each its own file: the card `portrait/<id>` (the standee), the bust `bust/<id>` (the unit card) and the icon `icon/<id>` (turn order, squad grids, lists); a framing falls back to the wider one (icon → bust → card), and the CSS zooms a wider framing toward the face. Portraits come from picked concepts: `scripts/art/portraits.ts` (`--install <card> <bust>` cuts the icon from the bust). A slot's file is `assets/art/<kind>/<id>.webp`, found at build time by `import.meta.glob`, so adding art is dropping a file. A missing file falls back to a family default (`portrait/_<faction>`, `ability/_<tag>`, `effect/_effect`), then to a placeholder in the faction's color with initials, so every spot works before its art exists. The view calls `art(slot, size)`. The UI kit (frames, plaques, buttons, textures) is separate: `assets/ui/<name>.webp`, reaching CSS as `--ui-<name>` (`applyUiKit`); CSS decides where each piece goes.
- `pnpm art report`: which slots have art. `pnpm art generate <kind|key> [seeds]`: candidates for slots without art (prompts from `scripts/art/prompts.ts`: the locked style + the user's `LOOKS`, else the content's name and rules text). `pnpm art accept <png> <key>`: resize to WebP and record prompt/seed in `assets/art/provenance.json`.
- New content gets its slots automatically. `tests/art.test.ts` fails on art files that no slot uses (a rename would orphan them).
- Candidates live in `art/candidates/` (not committed); only accepted art is.
- **Biomes** (`Biome` on each `MapTile`) change only the look: the same terrains under a prefix. Props `terrain/<biome>-<kind>-<n>` (`terrainChain` falls back to the temperate ones), grounds `assets/ground/<biome>-<terrain>-1.webp` (`groundName`), and `GROUND_LOOK` (tone, seamless) for how each biome's grounds are drawn on the map and in battle. The landscape blends the biomes per vertex (`groundDesert`), along the same noisy edges as the terrains. A new biome: a prefix in `BIOME_PREFIX`, its grounds and props, a weight in the landscape.

## Adding content
The step-by-step recipes (units, abilities, effects, nodes, forks, recording the user's design first) live in the `add-content` skill (`.claude/skills/add-content/SKILL.md`), so they come up whenever content is added.

## Conventions
- `applyAction` / `applyWorldAction` structuredClone the state, mutate the draft, and return `{ state, events }`. Events drive animation and the log. Everything is plain data, which is why the AI can run in a worker and battles can be forecast.
- `applyAction` has **already advanced** to the next slot when it returns (start-of-turn bleed, stun skips). Tests about one action should assert on the returned events.
- A definition carries its own rules text (`describe`), so an ability or effect is one place to read and change; `tests/descriptions.test.ts` checks every text renders.
- **Spell charges** (Nexus): a unit's `spellCharges` fills its battery each battle. A spell's params `cost`, `overload` (extra cost) and `replicate` (extra cost per copy) make it draw on it and offer enhanced variants; `overloadChoices` on the behavior says what an overloaded cast reaches. `legalActions` lists each variant as its own option (`enhancement`, `spellCost`); an `Action` names its enhancement and, when replicated, its `copies` (distinct choice indices). The view keys buttons by `optionKey`.
- **Players are not battle sides.** The map has any number of players (`World.players`, a `PlayerId` indexes it; `playerOf(world, id)`); a battle always has exactly two sides, 0 the attacker and 1 the defender, and `Engagement.players` records which player stands on each (null: neutrals). Never compare a battle winner with a player id: map it through the engagement. The battle view draws the viewer's side on the left (`BattleScene.setLeft`).
- **Fog of war: plan from `knownWorld(world, player)`** (`world/vision.ts`), never from the world, whenever a player's view matters: the map AI (`chooseWorldAction` does it first thing), hover previews, forecasts, peeks, and what the map draws (`visionOf` for the fog). Only the rules and the player's own screens (cities, warbands) read the world directly. Anything that changes the world ends with `updateVision`; `move` is planned on the known world and can stop early.
- Nothing outside `abilities/` and `effects.ts` names an ability or effect id. The engine, AI and view use tags, flags (`reschedules`, `secretTarget`, `visibility`, `quiet`) and hooks.
- Anything the design doesn't specify is marked provisional where it's defined and listed in `docs/questions.md`.
- **`src/rules/` imports only `#rules/*`**, and nothing in it is random or reads the clock (`tests/boundaries.test.ts`). Preset squads live in `rules/units/presets.ts`; a faction's name, mana color and default color in `rules/factions.ts`.
- **View building blocks:** `orderButton` (`view/dom.ts`) for any button that gives an order (disabled with the rules' problem as its tooltip); a screen that takes keys is a `KeyLayer` (`view/input.ts`), and `routeKeys` in `main.ts` gives each key to the topmost open one; three.js objects leave the scene through `discard` (`view/stage.ts`), which frees their GPU resources and labels. Colors come from the tokens at the top of `style.css`.
- **Sims are bundled** (`scripts/bundle-sims.sh`, esbuild into `.sim/`) and run as plain node. `pnpm sim:many --seeds 1-16 "a,b" "c,d"` plays whole AI games in parallel, one process per game (about 100 s for 48 games on this machine); run it in the background, or in a worktree, while developing. Profile with `node --cpu-prof .sim/sim-world.mjs <seed>`.
- **AI speed:** the map AI replays battles through a `BattleMemo` the caller keeps (the worker, the sims); the battle context caches trait lists; the engine copies battles by hand (`cloneBattle`), not with structuredClone. A seed that took 65 s takes about 7.
- `pnpm sim:t1` plays tier-1 squads of Jilliath and Nexus against each other (battle only); the balance check while factions grow.
- `pnpm verify` before calling anything done: types, tests, a screenshot, and the click-through playtests (`scripts/playtests/`, one harness).
- **Changing the World's shape? Bump `SAVE_VERSION`** (`src/rules/save.ts`) and update the snapshot (`pnpm vitest -u tests/save.test.ts`); the shape test fails until you do. Old saves are then refused, never migrated.

## Gotchas
- **The renderer is WebGPU (M57): no `onBeforeCompile`, no `ShaderMaterial`.** Custom shading is TSL on node materials (`positionNode`, `colorNode`, `emissiveNode`; see `view/landscape.ts`); post-processing is a `RenderPipeline` of TSL nodes (`view/stage.ts`). Plain materials (`MeshStandardMaterial`, …) still work: WebGPU converts them. Classes from `three` and `three/webgpu` are the same (shared core), so only files that need WebGPU-only things import `three/webgpu`.
- **Never flag a texture `needsUpdate` before its image has loaded** under WebGPU: it crashes reading `image.complete` (WebGL shrugged it off).
- **No MSAA with ambient occlusion:** the AO node can't read a multisampled depth buffer, so the renderer runs without `antialias` and SMAA runs at the end of the chain, after tone mapping (`renderOutput`).
- **Headless WebGPU** runs on Vulkan limited to the Radeon's RADV driver (`VK_ICD_FILENAMES`, `HEADLESS_ENV`) and needs a secure origin (localhost is one).
- **Headless tests render on the CPU's integrated Radeon, not the NVIDIA cards** (`scripts/headless.ts`). Dozens of test browsers a day on the desktop's NVIDIA card left its driver refusing new contexts (`NV_ERR_STATE_IN_USE` in `journalctl -k`), which crashed the user's own browser. Empty `VALIDATE_STATUS false` shader errors mean a GPU problem, not the code. `HEADLESS_SOFTWARE=1` renders on the CPU if the iGPU ever fails.
- **A CSS `background` shorthand resets `background-image`**: a more specific rule using the shorthand silently blanks images set by less specific ones. Use longhands (`background-size`, …) when layering.
- **Chain commits after verify with `&&`, never `;`.** A `;` once merged a failing test into main.
- **CSS2DRenderer positions labels through `transform`.** A CSS animation on `transform` silently overrides it (every float drew at the top-left). Animate an inner element.
- **`[hidden]` loses to author `display:` rules.** A global `[hidden] { display: none !important }` is in `style.css`; keep it.
- CSS2DRenderer only updates labels in the scene it renders; `Stage.show` hides the outgoing scene's labels.
- **Hidden information goes through `view/secrecy.ts`.** Every log and animation path must be masked, and previews use a battle without the player's own hidden effects. The battle AI sees everything; the map AI sees its `knownWorld`.
- `pkill -f <pattern>` kills its own shell when the pattern appears in the command line (exit 144). Kill by PID.
- Tests about one unit's behavior usually need `until(battle, id)` (`#tests/helpers`): turn order is by initiative, and it's easy to query the wrong unit.
- **Percentage stat bonuses add `base × percent`.** Stat hooks run in battlefield order; multiplying the running total makes the result depend on which trait ran first.
- A unit's max HP on the map is `maxHpOf(member, leader)` (`world/record.ts`), not the unit type's: effects it brings can raise it. Battles cap starting HP at the effective max.
- A local variable named like a module helper shadows it: tsc says "not callable".
- pnpm needs build scripts approved (`pnpm approve-builds <pkg>`); esbuild is approved. TypeScript is v7; the config is strict and rejects unused locals and parameters.

## Debt: status after the M37 review (2026-09-27)
Four reviews (battle, world, view, tooling) led to M37. Resolved there: map deaths in one place (`world/fate.ts`); `knownWorld` redacts other players; hits re-read traits per target and `afterAttack` runs once per action; granted abilities carry params; the viewer is a `PlayerId`; hover redraws only on change; the map AI is a list of planners; one faction record; `Camp | Dungeon`; saves check content ids; `flatStat`; tags from the resolving ability; one key router; `orderButton`; CSS tokens; `discard`; one playtest harness; a save-shape fixture; a rules purity test.

Still open, on purpose until something needs them:
- **Actions validate, then re-derive** (`*Problem`, then the apply case finds the same things again). A validate-to-plan shape is cleaner, but the `*Problem` functions are the single source of legality the view and AI rely on; revisit if the two drift.
- **The actor is `world.activePlayer`.** Passing it explicitly matters for hotseat or network play (or an MCP player); not before.
- **`Player` mixes game state and knowledge** (`explored`, `memory`). `knownWorld` redacts correctly; split it when multiplayer needs per-player state sent separately.
- **Tests pin many balance numbers by hand.** New tests should read `UNITS` and `balance.ts`, as the Nexus tests do.
- **Debug routes live on `Campaign`** (`startingXp`, `startingMana`, `revealAll`, `openCapitol`): small, and the screenshot routes need them.
- **The AI is greedy** (battle: one ply plus free follow-ups; map: ordered planners). A look-ahead AI is its own milestone.
- **`App` and `Campaign` are still big controllers.** Keep new screens in their own classes (`view/city.ts`, `view/leader.ts`) the same way.
