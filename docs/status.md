# Status

_Rewritten (not appended) with every commit. Keep under ~50 lines._

**Updated:** 2026-09-26 (m19)

## Where we are
**Foundation rebuilt (m7-foundation).** Rules are traits (passives and effects share one hook interface), effect definitions with lifetimes and stacking, a typed damage pipeline, ability params and tags, and world context entering battles as effects (the Blacksmith node; a fire-only shield works). The AI runs in a web worker. See `design/architecture.md` and the recipes in `engineering.md`. Run `pnpm verify` before calling anything done.

Git: tags `m2-playable` … `m7-foundation` mark tested states. Work happens on a branch per milestone, merged into `main` when it works.

**M1–M6 done.** Setup → pick each side's faction (**Jilliath** or **Ral-Vitahl**) and a formation → **Fight** or **March**.
- March: a 61-hex map with Capitols and Guardians, neutral cities guarded by **bandits**, bandit **camps**, and guarded **dungeons** with one-time rewards.
- Also gold, recruiting, elevation, XP and evolution, free per-line branch choices (with a prompt when a unit reaches an undecided fork), and the graveyard.
- Engine: shields (and lent shields), ranged, area spells, stun, anti-armor, secret Counter marks, same-name lightning, Mutate. Punishment is capped at 3 stacks.
- Nexus forks scheme vs overload (Cyclops, Mutant, Justiciar, Thaumaturge). The Counter mark is hidden from the marked side (`src/view/secrecy.ts`, tested).
- Unit designs from the user: `design/units/*.md`. Numbers are provisional (`questions.md`).

Rules: `src/rules/` (93 tests). View: `src/view/`. Tools: the `verify` skill; `A=<preset|nexus> B=… pnpm sim:world`.

## Next
**M26: Jilliath's tier-1 backline** (user, 2026-09-26: "keep it simple"): the Cleric (heal scaled by missing health, weak ranged attack) and "Jilliath mage 1" (placeholder name; Condemn: damage plus a share of the target's missing health). Recruitable; new recruits fill by line (melee from the front, the rest from the back). **Hovering an ability button previews it on every target it can reach** (the user asked for numbers, not abstractions). Sims are smoke tests only until both factions have their lines; `pnpm sim:t1` is the tier-1 balance check (#52).
1. **Waiting on the user:** a name for the mage; playtest; #40–51; colors (#43). Sonniss GDC 2015–2020 downloaded and extracted (81 GB, `~/programs/sfx-libraries/sonniss/`, `INDEX.md` lists the best fits); 2021–2024 blocked by Sonniss's site, 2026 over its Google Drive quota (retry in a browser).
2. Candidates next: sound slots and playback with the Sonniss material; more of the backline lines when the user designs them.
3. Open design: Nexus tiers 4–5 (#35), Jilliath lines past tier 1, fourth archetype (#37), real spells (#51), leader experience (#33).

## Waiting on the user
See `questions.md`. Nothing blocks M1; provisional rules are listed in `design/combat.md`.

## Recently done
- 2026-09-26: M27 tier-1 balance pass (`pnpm sim:t1`): Custodian shield 65, Apprentice Burst 35; a heal-vs-shield stalemate found (#52).
- 2026-09-26: M26 Jilliath tier-1 Cleric and mage; ability hover previews.
- 2026-09-26: M25 spells and mana.
- 2026-09-26: M24 setup for more players.
- 2026-09-26: M22 settings menu.
- 2026-09-26: M21 Nexus tier-3 mages; renames Cyclops, Technician, Counter.
- 2026-09-26: `view/campaign.ts` split (606 → 390 lines): map panels, hint and news text, peeks, fork prompt, forecasts.
- 2026-09-26: M19 Fog of war.
- 2026-09-26: M18 Players: any number of players in the rules, battles two-sided.
- 2026-09-26: M17 Cities (steps 1–5); all AI games end.
- 2026-09-26: m16 merged (levels, playtest fixes, player colors). M17 steps 1–2: charge pips, fork peek, squad grids, city screens, meeting warbands.
- 2026-09-26: m16 (branch `m16-playtest` on top of `m15-levels`, worktree `../new_disc-levels`; merge after the user's playtest): support abilities default by target, portrait turn queue with hover focus, gold coin and movement pips, tougher neutrals (#41), player colors.
- 2026-09-26: m15 (branch `m15-levels`, worktree `../new_disc-levels`; merge after the user's playtest): levels past the end of a line.
- 2026-09-26: m14: Nexus spell charges with overload and replicate.
- 2026-09-26: m13 (part 1): siege-planning map AI, camp regrowth (provisional); AI games end.
- 2026-09-26: m12: paper standees; roadmap rewritten around the vertical slice.
- 2026-09-26: m11: saves (snapshots, versioned, localStorage behind an interface, file export/import, autosave), game menu.
- 2026-09-26: m10: art slots with fallbacks and placeholders, the art pipeline CLI, first art in the game.
- 2026-09-25: art spike: Krea 2 set up; four rounds of style fishing with the user; the ink-brush style holds across the Zealot and the Grove's Psychopomp.
- 2026-09-25: m9: fallen leaders stay and are revived; Capitol archetype tabs; a leader screen; D/W hotkeys (the playtest presses D).
- 2026-09-25: m8: unit-type upgrades (non-retroactive, stamped as marks) and the HoMM-style Capitol screen; the side panel only summarises.
- 2026-09-25: m8: leader tree v1 and marks (a unit's lasting effects with their source, shown as its track record). Screenshot route `?map&xp=N`.
- 2026-09-25: m8: per-line forks replace doctrines: free choice in the Capitol, a prompt at undecided forks, setup formations imply the choices.
- 2026-09-25: first playtest fixes: the enemy's fights with neutrals resolve off-screen; effect tooltips and pinned cards; leader crowns; formation peek; Leadership replaces the fixed squad size (5).
- 2026-09-25: consolidation: the engine rebuilt on traits and effect definitions, a damage pipeline, params and tags, city nodes as data (Blacksmith), world split, AI in a worker, `pnpm verify`. The preset battle matrix is identical before and after.
- 2026-09-25: M6: per-faction forks; Nexus scheme vs overload with Cyclops, Mutant, Justiciar, Thaumaturge.
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
