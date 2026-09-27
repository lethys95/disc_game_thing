# Status

_Rewritten (not appended) with every commit. Keep under ~50 lines._

**Updated:** 2026-09-27 (M40 merged)

## Where we are
A playable map game for 2–6 players (hotseat viewer vs AIs): two factions (**Jilliath**, **Ral-Vitahl**) with tier-1 melee/support/mage and Nexus mages to tier 3; bandit camps, dungeons with rewards, neutral cities; gold, mana and spells; nodes (gold, Blacksmith, mana, Cathedral); items on leaders; fog of war; retreat and a battle round limit; sound slots with placeholder SFX and music. The AI plays both the map (a list of planners in `world/ai.ts`) and battles, in a web worker.

Architecture: `design/architecture.md`; recipes and gotchas: `engineering.md`. `pnpm verify` before calling anything done. Sims: `pnpm sim:many --seeds 1-16 "p1,p2"` (smoke tests only until factions have their lines).

## Now
**M40 map sizes** (merged into main): Small/Medium/Large/Huge at setup, defaulting by player count; neutrals and structures scale with area. Before that, M39 (unlimited mercenaries, merchant potions and changing wares) and M38 (structures). Save version 19. Routes: `?map&players=N&size=huge`, `?map&structure=merchant`.

## Next
1. **M41 Capitol screen** (user's spec, `design/capitol-screen.md`): home view, right-side tab menu, garrison, research tree, spells.
2. What Claude needs from the user: `questions.md` (now short). Placeholders to overrule: `provisional.md`.

## Recently done
- 2026-09-27: M40 map sizes; M39 merchant wares and potions; M38 map structures; M37 review cleanup; the user's items: Hatchet, Outlaw's pocketwatch, Cathedral node.
- 2026-09-27: M35 items and spoils; M31 sound; music placeholders; map palette; M30 fast sims, retreat, resolve.
- 2026-09-26: M17–M27: cities, players, fog, settings, spells and mana, Nexus tier-3 mages, Jilliath tier-1 Cleric and mage, tier-1 balance.
- 2026-09-25: M1–M16: battles, the map, progression, forks, leaders, saves, art slots. Git history has the detail.
