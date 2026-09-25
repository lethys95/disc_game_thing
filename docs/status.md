# Status

_Rewritten (not appended) with every commit. Keep under ~50 lines._

**Updated:** 2026-09-25

## Where we are
Git: tags `m2-playable`, `m3-whole-game`, `m4-progression` mark tested states. Work happens on a branch per milestone, merged into `main` when it works.

**M1–M4 done.** Setup → **Fight** (one battle) or **March** (a whole game). March now has **progression**:
- Winners split the fallen enemies' worth as XP; units evolve along the canon tree.
- Branch investment happens at the Capitol, and the new "Uncommitted" doctrine starts with Congregants only. Units at an uninvested fork wait with a full bar.
- The dead go to a graveyard; resurrection costs 3× the base price at once and drops each turn you wait.

The map AI invests and resurrects too. All numbers are provisional (`questions.md` #12–16).
Rules: `src/rules/` (36 tests). View: `src/view/`. Tools: the `verify` skill, plus `A=… B=… pnpm sim:world [seeds]`.

**Key finding:** AI-vs-AI games still freeze into cold wars. XP only comes from battles, and the cautious AI starts none it forecasts losing. That's a design gap: nothing neutral to fight (questions.md #15).

## Next
1. **Design gate** (`roadmap.md`): XP sources and neutral encounters (#15), a second faction's units, the Guardian vs Punishment (#12). Needs the user; don't invent.
2. Meanwhile, safe work: a play-feel pass for human play (compact warband panel, clearer turn and evolution feedback, and a way to see the enemy warband's composition before attacking).
3. **Art spike: on hold** until the user brings image-model picks.

## Waiting on the user
See `questions.md`. Nothing blocks M1; provisional rules are listed in `design/combat.md`.

## Recently done
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
