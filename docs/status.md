# Status

_Rewritten (not appended) at the end of every session. Keep under ~50 lines._

**Updated:** 2026-09-25

## Where we are
Workspace set up; no game code yet. Stack is TypeScript + Three.js + Vite (see `decisions.md`). `pnpm shot` renders the app headlessly and saves a screenshot, and it works; the scene is only a placeholder hex patch.

## Next
Start **M1 — one battle** (`roadmap.md`). First steps:
1. `src/rules/`: battle state as plain data, abilities as `{id, params}` + behavior registry (`design/abilities.md`), Congregant/Paladin/Zealot records, pure `applyAction(state, action)`.
2. Vitest tests for armor, initiative order, the melee front-row rule, Zealot must-attack, Congregation stacking.
3. `src/view/`: two 3x3 grids with placeholder unit tokens, HTML HUD for actions, click to target.
4. A dumb opponent (attacks the lowest-HP valid target) so a battle can be played solo. Mirror match (decided).

## Waiting on the user
See `questions.md`. Nothing blocks M1; provisional rules are listed in `design/combat.md`.

## Recently done
- 2026-09-25: surveyed four earlier attempts (`prior-attempts.md`), ported the design canon into `design/`, chose the stack, set up the notes system.
