# Status

_Rewritten (not appended) with every commit. Keep under ~50 lines._

**Updated:** 2026-09-25

## Where we are
**M1 done.** `pnpm dev` → skirmish setup (pick a doctrine and a formation for each squad) → battle against the greedy AI, or watch AI vs AI. Hovering a target previews its exact outcome. Rules: `src/rules/` (19 tests). View: `src/view/`. Tools: `pnpm shot [out] [route]` (`?fight` skips setup, `?steps=N` fast-forwards, `?auto=1` AI vs AI) and `pnpm playtest` (real clicks, headless).

## Next
**M2: walk into a fight** (`roadmap.md`). Plan:
1. `src/rules/world.ts`: axial hex map (radius 4 = 61 hexes, inside the pillars' 50–80 range), provisional terrain costs, leaders with a squad and movement points, A* pathing, alternating faction turns. Units keep HP between battles, so `Placement` gains an optional hp.
2. Moving into the enemy leader's hex starts a battle; survivors are written back into the world.
3. `src/view/map.ts`: 3D hex map, rotatable camera, click a hex to see the path and cost, click again to move.
4. Greedy map AI: walk toward the player's leader.

## Waiting on the user
See `questions.md`. Nothing blocks M1; provisional rules are listed in `design/combat.md`.

## Recently done
- 2026-09-25: M1 finished: skirmish setup with doctrines, exact hover preview, full battles run clean in the browser.
- 2026-09-25: M1 battle view playable; initiative ties now alternate sides (playtest showed the player's squad always moved first).
- 2026-09-25: settled with user: tile-pattern targeting (5x5 relative / 3x3 absolute), initiative → order + action count, Defend = D2, art direction (`design/art.md`), pillars read and accepted.
- 2026-09-25: user settled faction names, cores (sacrifice / expedience+burst / ramp / death+numbers), Nexus = teal, melee line = canon; AI-drafted lore removed from design docs.
- 2026-09-25: surveyed four earlier attempts (`prior-attempts.md`), ported the design canon into `design/`, chose the stack, set up the notes system.
