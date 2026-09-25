# Status

_Rewritten (not appended) with every commit. Keep under ~50 lines._

**Updated:** 2026-09-25

## Where we are
Git: tags `m2-playable` and `m3-whole-game` mark tested states; work happens on a branch per milestone and merges into `main` when it works.

**M1–M3 done.** Setup → **Fight** (one battle) or **March** (a whole game). The game has a 61-hex map with both Capitols (Guardian = loss condition) and three neutral cities with gold mines. Walk in to capture, recruit Congregants at the Capitol, elevate garrison units into new warbands, and heal at home. The map shows an AI battle forecast before you attack. The map AI forecasts fights both ways (skips losing fights, avoids stopping where it would be caught) and reinforces a threatened Capitol. All M3 numbers are provisional (`questions.md` #12–14).
Rules: `src/rules/` (29 tests). View: `src/view/`. Tools: see the `verify` skill; `pnpm sim:world` for whole AI-vs-AI games.

## Next
1. **Art spike** (`roadmap.md`): one Paladin through both routes in `design/asset-pipeline.md`, shown in the battle scene. Blender works; ComfyUI runs at :8188. Needs the Qwen-Image models downloaded (~40 GB); check disk first.
2. Then **M4 progression** (XP → evolution tiers, branch investment, graveyard). Evolution should also break the AI cold wars (`design/combat.md`).
3. Design gate: a second faction needs unit designs from the user.

## Waiting on the user
See `questions.md`. Nothing blocks M1; provisional rules are listed in `design/combat.md`.

## Recently done
- 2026-09-25: M3 done: Capitols and Guardian, cities and gold, recruiting, elevation, healing, map forecast, safer map AI; Guardian tuned by simulation.
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
