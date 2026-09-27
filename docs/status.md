# Status

_Rewritten (not appended) with every commit. Keep under ~50 lines._

**Updated:** 2026-09-27 (M46 merged)

## Where we are
A playable map game for 2–6 players (hotseat viewer vs AIs): two factions (**Jilliath**, **Ral-Vitahl**) with tier-1 melee/support/mage and Nexus mages to tier 3; bandit camps, dungeons with rewards, neutral cities; gold, mana and spells; nodes (gold, Blacksmith, mana, Cathedral); items on leaders; fog of war; retreat and a battle round limit; sound slots with placeholder SFX and music. The AI plays both the map (a list of planners in `world/ai.ts`) and battles, in a web worker.

Architecture: `design/architecture.md`; recipes and gotchas: `engineering.md`. `pnpm verify` before calling anything done. Sims: `pnpm sim:many --seeds 1-16 "p1,p2"` (smoke tests only until factions have their lines).

## Now
**M46 city view** (merged into main): the city screen opens on a framed painting of the city from the inside (per faction; `assets/city/`), drifting slowly, a placeholder for the montage the user sketched (`design/capitol-screen.md`); tabs in a framed column. M45's UI kit (frame, plaque, buttons, medallions, gargoyle) is on the city screen only, waiting for the user's verdict before it spreads.

## Next
1. Waiting on the user: `questions.md` (unit designs first: Jilliath's tier-2 support and mage, then Grove/Wastes tier 1, then tribes).
2. Claude's plan: things that don't need designs: the map's look (grass, terrain), AI scouting on big maps, research-tree connectors, tribes' foundation (a neutral faction type the bandits move into).

## Recently done
- 2026-09-27: M46 framed city view; M45 UI kit pilot; M44 battlefield; M43 dressed map; M42 3D props spike; M41 Capitol screen; questions review; M40 map sizes; M39 merchant wares and potions; M38 map structures; M37 review cleanup; the user's items: Hatchet, Outlaw's pocketwatch, Cathedral node.
- 2026-09-27: M35 items and spoils; M31 sound; music placeholders; map palette; M30 fast sims, retreat, resolve.
- 2026-09-26: M17–M27: cities, players, fog, settings, spells and mana, Nexus tier-3 mages, Jilliath tier-1 Cleric and mage, tier-1 balance.
- 2026-09-25: M1–M16: battles, the map, progression, forks, leaders, saves, art slots. Git history has the detail.
