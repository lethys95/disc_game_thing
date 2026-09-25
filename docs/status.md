# Status

_Rewritten (not appended) with every commit. Keep under ~50 lines._

**Updated:** 2026-09-25

## Where we are
M1 in progress. **Rules core done**: `src/rules/` has the battle engine (passes by initiative, attack pipeline, effects), the whole canon Jilliath melee line (10 units, 17 abilities), and a greedy AI. 18 tests pass, including an AI mirror match that ends identically every run. Next is the 3D view.

## Next
1. `src/view/`: 3D battle scene (two 3x3 grids, placeholder statue figures, dark lighting per `design/art.md`), per-ability tile highlights, HUD (turn order, unit card, ability buttons, log), click to target.
2. Player = side 0, greedy AI = side 1; `?auto=1` for AI vs AI; `?steps=N` to fast-forward for screenshots.
3. Then: squad picker from the canon units; animations for events.

## Waiting on the user
See `questions.md`. Nothing blocks M1; provisional rules are listed in `design/combat.md`.

## Recently done
- 2026-09-25: settled with user: tile-pattern targeting (5x5 relative / 3x3 absolute), initiative → order + action count, Defend = D2, art direction (`design/art.md`), pillars read and accepted.
- 2026-09-25: user settled faction names, cores (sacrifice / expedience+burst / ramp / death+numbers), Nexus = teal, melee line = canon; AI-drafted lore removed from design docs.
- 2026-09-25: surveyed four earlier attempts (`prior-attempts.md`), ported the design canon into `design/`, chose the stack, set up the notes system.
