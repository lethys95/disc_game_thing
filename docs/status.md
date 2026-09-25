# Status

_Rewritten (not appended) with every commit. Keep under ~50 lines._

**Updated:** 2026-09-25

## Where we are
**Foundation rebuilt (m7-foundation).** Rules are traits (passives and effects share one hook interface), effect definitions with lifetimes and stacking, a typed damage pipeline, ability params and tags, and world context entering battles as effects (the Blacksmith node; a fire-only shield works). The AI runs in a web worker. See `design/architecture.md` and the recipes in `engineering.md`. Run `pnpm verify` before calling anything done.

Git: tags `m2-playable` … `m7-foundation` mark tested states. Work happens on a branch per milestone, merged into `main` when it works.

**M1–M6 done.** Setup → pick each side's faction (**Jilliath** or **Ral-Vitahl**) and doctrine → **Fight** or **March**.
- March: a 61-hex map with Capitols and Guardians, neutral cities guarded by **bandits**, bandit **camps**, and guarded **dungeons** with one-time rewards.
- Also gold, recruiting, elevation, XP and evolution, branch investment, and the graveyard.
- Engine: shields (and lent shields), ranged, area spells, stun, anti-armor, secret Negate marks, same-name lightning, Mutate. Punishment is capped at 3 stacks.
- Nexus forks scheme vs overload (Battery, Mutant, Justiciar, Thaumaturge). The Negate mark is hidden from the marked side (`src/view/secrecy.ts`, tested).
- Unit designs from the user: `design/units/*.md`. Numbers are provisional (`questions.md`).

Rules: `src/rules/` (63 tests). View: `src/view/`. Tools: the `verify` skill; `A=<doctrine|nexus> B=… pnpm sim:world`.

## Next
**From the user's first playtest (`design/playtest-2026-09-25.md`):** done: the neutral-control bug, effect tooltips (click a unit to pin its card), leader crowns, right-click-hold formations on the map, Leadership 5. Next milestone: **the Capitol screen** (HoMM-style inside view: trees, recruit, garrison, graveyard, later buildings) **and the leader tree** (levels give points, Leadership among them; later the options depend on the elevated unit). Both need content sparring with the user.
1. **Sparring on factions**: Nexus's Arcane Engineer has no tier 2; tiers 3+ are open; Sylvan and Vexumphat have no units yet (`design/dichotomies.md`).
2. Open design questions: finite neutral XP and cold wars (#19), a gold sink (#20), provisional numbers (#21).
3. Polish for human play: compact the warband panel, show enemy composition before attacking, add evolution feedback.
4. Art spike: on hold for the user's image-model research.

## Waiting on the user
See `questions.md`. Nothing blocks M1; provisional rules are listed in `design/combat.md`.

## Recently done
- 2026-09-25: first playtest fixes: the enemy's fights with neutrals resolve off-screen; effect tooltips and pinned cards; leader crowns; formation peek; Leadership replaces the fixed squad size (5).
- 2026-09-25: consolidation: the engine rebuilt on traits and effect definitions, a damage pipeline, params and tags, city nodes as data (Blacksmith), world split, AI in a worker, `pnpm verify`. The preset battle matrix is identical before and after.
- 2026-09-25: M6: per-faction forks; Nexus scheme vs overload with Battery, Mutant, Justiciar, Thaumaturge.
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
