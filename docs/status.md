# Status

_Rewritten (not appended) with every commit. Keep under ~50 lines._

**Updated:** 2026-09-25

## Where we are
M1 is **playable**: `pnpm dev`, open the page, and fight a Jilliath mirror match against the greedy AI. You get a 3D arena, placeholder statue figures, a turn-order strip, a unit card on hover, ability buttons, click-to-target with highlights, animations, a log, and a victory/defeat banner. Rules: `src/rules/` (18 tests). View: `src/view/`. Verification tools: `pnpm shot` (screenshot, `?steps=N` fast-forwards, `?auto=1` AI vs AI) and `pnpm playtest` (clicks through real player turns in a headless browser via the `?debug` hook).

## Next
1. Squad picker before battle: choose units and positions from the canon line (it's also a way to show off every ability).
2. Play-feel pass: pacing of AI turns, clearer "whose turn" cue on the figure, ability buttons showing charges, hover preview of damage.
3. Then M1 is done → M2 (hex map, leader walks into a fight).

## Waiting on the user
See `questions.md`. Nothing blocks M1; provisional rules are listed in `design/combat.md`.

## Recently done
- 2026-09-25: M1 battle view playable; initiative ties now alternate sides (playtest showed the player's squad always moved first).
- 2026-09-25: settled with user: tile-pattern targeting (5x5 relative / 3x3 absolute), initiative → order + action count, Defend = D2, art direction (`design/art.md`), pillars read and accepted.
- 2026-09-25: user settled faction names, cores (sacrifice / expedience+burst / ramp / death+numbers), Nexus = teal, melee line = canon; AI-drafted lore removed from design docs.
- 2026-09-25: surveyed four earlier attempts (`prior-attempts.md`), ported the design canon into `design/`, chose the stack, set up the notes system.
