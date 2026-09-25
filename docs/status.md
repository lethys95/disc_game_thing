# Status

_Rewritten (not appended) with every commit. Keep under ~50 lines._

**Updated:** 2026-09-25

## Where we are
Git: tags `m2-playable`, `m3-whole-game`, `m4-progression`, `m5-neutrals` mark tested states. Work happens on a branch per milestone, merged into `main` when it works.

**M1–M5 done.** Setup → pick each side's faction (**Jilliath** with a doctrine, or **Ral-Vitahl**) → **Fight** or **March**.
- March: a 61-hex map with Capitols and Guardians, neutral cities guarded by **bandits**, bandit **camps**, and guarded **dungeons** with one-time rewards.
- Also gold, recruiting, elevation, XP and evolution, branch investment, and the graveyard.
- Engine: shields, ranged, area spells (2x2, plus), stun, anti-armor. Punishment is capped at 3 stacks.
- Unit designs from the user: `design/units/*.md`. Numbers are provisional (`questions.md`).

Rules: `src/rules/` (48 tests). View: `src/view/`. Tools: the `verify` skill; `A=<doctrine|nexus> B=… pnpm sim:world`.

## Next
1. **Spar with the user on Nexus** (only tier 1 exists; the melee line is "short"; casters are the strongest line) and the other factions.
2. Open design questions: finite neutral XP and cold wars (#19), a gold sink (#20), provisional numbers (#21).
3. Polish for human play: compact the warband panel, show enemy composition before attacking, add evolution feedback.
4. Art spike: on hold for the user's image-model research.

## Waiting on the user
See `questions.md`. Nothing blocks M1; provisional rules are listed in `design/combat.md`.

## Recently done
- 2026-09-25: M5: bandit neutrals (guarded cities, camps, dungeons with rewards), Ral-Vitahl tier 1, shields/ranged/area engine, Punishment cap.
- 2026-09-25: M4 done: XP, evolution, branch investment, graveyard/resurrection; AI invests and resurrects; cold wars persist (design gap).
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
