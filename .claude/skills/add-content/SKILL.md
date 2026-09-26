---
name: add-content
description: Add game content to disc — a unit, ability, effect, city node, neutral group, or faction fork — especially when the user describes a new design ("here's a new unit…", "this faction should have…"). Covers recording the user's design, implementing it through the rules architecture, and verifying it.
---

# Adding content to disc

The rules model is in `docs/design/architecture.md`; read it if you haven't this session. The engine, AI and view never name an ability or effect id, so content goes in through definitions, params and tags. If something truly can't be expressed that way, add a hook (step 3), don't special-case.

## 1. Record the design first, in the user's words
- Put it in `docs/design/` (a unit page in `units/`, a faction in `factions/` or `dichotomies.md`) **before** writing code, quoting the user and marking provenance ("user, <date>").
- Never invent names, mechanics or lore. Where the user gave no numbers, the stats are **provisional**: say so where they're defined and add them to `docs/questions.md`.
- If a detail is ambiguous, pick the simplest reading, note it as provisional, and ask. Don't stall.

## 2. Implement through the architecture
- **Unit**: `src/rules/units/<faction>.ts` (stats, `abilities` as `{ id, params?, name? }`). If it's in a tree, update `EVOLUTIONS` / `FACTION_ROOTS` in `units/index.ts`, If the tree branches, give each branch a `label` (the dichotomy the user named); `forks.ts` treats any unit with two evolutions as a fork, so nothing else changes. Add a setup formation to `FORMATIONS` in `view/squads.ts` if it helps.
- Every ability and effect definition has a required `describe` (its rules text, written from its own params or numbers). Numbers shared by a rule and its text are constants next to the definition (e.g. `PUNISHED_PER_STACK`), never repeated.
- **Active ability**: `src/rules/abilities/<faction>.ts` with `tags` (`attack`, `basic`, `melee`, `ranged`, `spell`, `damage`, `heal`, `area`), `defaults` (`power`, `charges`, amounts), `choices`, `resolve`. Deal damage with `ctx.hit(self.unitId, targets, ctx.hitSpec(self, tags))`. A variant of an existing ability is usually **params on the unit**, not new code.
- **Passive ability**: `kind: "passive"` with `hooks` (see `Hooks` in `src/rules/battle/types.ts`).
- **Effect**: `src/rules/effects.ts`: stacking (`unique` / `merge` with an optional cap / `perSource`), lifetime (`battle`, `untilOwnTurn`, `untilRoundEnd`, `untilSourceTurn`), visibility (`hiddenFromBearerSide` for secrets), `quiet` for bookkeeping, `aiValue` if the AI should care. Apply it with `ctx.addEffect(target, { def, source, amount, stacks })`.
- **City node**: `src/rules/nodes.ts` (income, battle effects) plus a model in `src/view/map.ts`.
- **Something from the world that affects battles** (items, spells on a warband, upgrades): effects via `BattleContext.sideEffects` or `Placement.effects`, built in `src/rules/world/battles.ts`.
- **Neutral group**: its units in `src/rules/units/neutral.ts`; group formations in `src/rules/world/state.ts`.
- **A new hook point** (only if nothing existing fits): add it to `Hooks`, and call it from one place in `battle/engine.ts` or `battle/damage.ts`. Update `design/architecture.md`.
- Balance numbers that aren't unit stats or ability params go in `src/rules/balance.ts`.

## 3. The view
- A figure in `src/view/figures.ts` (silhouette by unit; the accent comes from the faction).
- Presets in `src/view/squads.ts` if the setup screen should offer it.

## 4. Verify
- Tests next to similar ones (`tests/*.test.ts`, helpers in `#tests/helpers`; use `until(battle, id)` because turn order is by initiative).
- `pnpm verify`. For visuals, screenshot a battle that shows it (`?fight=nexus:…`, `?fight=bandits`, or add a route) and look at the PNG.
- `pnpm sim` / `pnpm sim:world` if it could shift balance; note surprises in `docs/design/combat.md`.

## 5. Notes
Update `docs/status.md`, add provisional numbers and open questions to `docs/questions.md`, commit.

## Art
New units, abilities and effects get art slots automatically (placeholders until filled; see `docs/engineering.md` → Art). If the user describes how something looks, add it to `LOOKS` in `scripts/art/prompts.ts` (by slot key, e.g. `portrait/zealot`) and record it in the unit's design doc.

## The user's design sheets
The user writes unit intent in `docs/lethys-wrote-this-for-handover/faction-stuff/<faction>/<line>.md` (format: `_template.md`): relative stats ("high health for its tier"), abilities and why, look. Read the sheet first; turn intent into provisional numbers relative to the other units of that tier; keep the sheet's **Status** line current (`in game as <id>`). Anything Claude writes there is marked **(Claude)**. Don't delete the user's text; per their `note.md`, raise conflicts with existing units instead of removing either.

## Spells that draw on spell charges (Nexus casters)
Give the unit `spellCharges` (its battery) and give the spell a `cost` param. For the enhancements: `overload` (extra cost) plus an `overloadChoices` on the behavior (what the wider cast reaches), or `replicate` (extra cost per copy; copies reuse the normal choices, each on a different target). Scheme casters replicate, overload casters overload (decisions.md). Nothing else changes: legality, the AI, the preview and the buttons pick the variants up.
