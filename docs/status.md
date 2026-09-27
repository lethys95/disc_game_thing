# Status

_Rewritten (not appended) with every commit. Keep under ~50 lines._

**Updated:** 2026-09-27 (M37 cleanup, branch `m37-cleanup`)

## Where we are
A playable map game for 2–6 players (hotseat viewer vs AIs): two factions (**Jilliath**, **Ral-Vitahl**) with tier-1 melee/support/mage and Nexus mages to tier 3; bandit camps, dungeons with rewards, neutral cities; gold, mana and spells; nodes (gold, Blacksmith, mana, Cathedral); items on leaders; fog of war; retreat and a battle round limit; sound slots with placeholder SFX and music. The AI plays both the map (a list of planners in `world/ai.ts`) and battles, in a web worker.

Architecture: `design/architecture.md`; recipes and gotchas: `engineering.md`. `pnpm verify` before calling anything done. Sims: `pnpm sim:many --seeds 1-16 "p1,p2"` (smoke tests only until factions have their lines).

## Now
**M37: code review cleanup** (`docs/review-2026-09-27.md` is the checklist; delete it when done). Done: map deaths in one place (`world/fate.ts`), redacted `knownWorld`, damage pipeline per target, granted abilities with params, the viewer as a player, hover redraws, map AI planners, one faction record (`rules/factions.ts`), Capitol `Site.start`, presets in the rules with a purity test, `Camp | Dungeon`, save content check (version 17), shared test helpers.
Left: validate-to-plan actions, stat-effect factory and packet riders, `Player` split, view input/GPU/CSS debt, playtest harness, save-shape fixture.

## Next
1. **M38 map structures** (user, 2026-09-27): mercenary camps (a few select neutral units to hire, per map), an item merchant (buy and sell), a mage merchant (sells spells).
2. Waiting on the user: #49–53, the Jilliath mage's name, the Grove/Wastes pitch, music.

## Recently done
- 2026-09-27: M37 cleanup (above); the user's items: Hatchet, Outlaw's pocketwatch, Cathedral node.
- 2026-09-27: M35 items and spoils; M31 sound; music placeholders; map palette; M30 fast sims, retreat, resolve.
- 2026-09-26: M17–M27: cities, players, fog, settings, spells and mana, Nexus tier-3 mages, Jilliath tier-1 Cleric and mage, tier-1 balance.
- 2026-09-25: M1–M16: battles, the map, progression, forks, leaders, saves, art slots. Git history has the detail.
