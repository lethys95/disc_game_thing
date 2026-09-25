# Status

_Rewritten (not appended) with every commit. Keep under ~50 lines._

**Updated:** 2026-09-25

## Where we are
**M1 and M2 done.** Setup screen → **Fight** (a single battle) or **March** (both squads on a 61-hex map). On the map your leader walks by clicking hexes (path and reach shown); walking into the enemy leader, or being walked into, starts a battle. Wounds carry over and the survivor returns to the map. Battles have an **Auto-battle** toggle. Rules: `src/rules/` (26 tests). View: `src/view/` (one `Stage` renderer; `BattleScene` and `MapView` take turns). Tools: `pnpm shot [out] [route]`, `pnpm playtest` (battle clicks), `pnpm playtest:map [seed]` (march → battle → return). Useful URL params: `?fight`, `?map&seed=N`, `?steps=N`, `?auto=1`, `?fast`, `?debug`.

## Next
**M3: a tiny whole game** (`roadmap.md`): alternating faction turns with a Capitol + guardian (loss condition), neutral cities with gold nodes, recruiting at the Capitol, elevating a unit to leader, more than one leader per side. Needs design calls first; check `design/pillars.md` for cities/Capitol and log questions for gaps (the guardian's stats, recruit costs, income numbers).

## Waiting on the user
See `questions.md`. Nothing blocks M1; provisional rules are listed in `design/combat.md`.

## Recently done
- 2026-09-25: Blender works headless; order decided: M3 next, then the art spike (`roadmap.md`).
- 2026-09-25: researched the AI asset pipeline (`design/asset-pipeline.md`): two routes to bake off; Blender needs a system upgrade to start.
- 2026-09-25: added the `verify` skill (`.claude/skills/verify`), `docs/engineering.md`, `pnpm check`, `pnpm sim`.
- 2026-09-25: fixed floating damage numbers: a CSS animation on `transform` overrode CSS2DRenderer's positioning, so every number drew in the top-left corner.
- 2026-09-25: M2: hex map, leaders marching, battles from collisions, wounds persist, auto-battle, map playtest script.
- 2026-09-25: M1 finished: skirmish setup with doctrines, exact hover preview, full battles run clean in the browser.
- 2026-09-25: M1 battle view playable; initiative ties now alternate sides (playtest showed the player's squad always moved first).
- 2026-09-25: settled with user: tile-pattern targeting (5x5 relative / 3x3 absolute), initiative → order + action count, Defend = D2, art direction (`design/art.md`), pillars read and accepted.
- 2026-09-25: user settled faction names, cores (sacrifice / expedience+burst / ramp / death+numbers), Nexus = teal, melee line = canon; AI-drafted lore removed from design docs.
- 2026-09-25: surveyed four earlier attempts (`prior-attempts.md`), ported the design canon into `design/`, chose the stack, set up the notes system.
