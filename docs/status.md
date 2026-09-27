# Status

_Rewritten (not appended) with every commit. Keep under ~50 lines._

**Updated:** 2026-09-27 (M38 merged)

## Where we are
A playable map game for 2–6 players (hotseat viewer vs AIs): two factions (**Jilliath**, **Ral-Vitahl**) with tier-1 melee/support/mage and Nexus mages to tier 3; bandit camps, dungeons with rewards, neutral cities; gold, mana and spells; nodes (gold, Blacksmith, mana, Cathedral); items on leaders; fog of war; retreat and a battle round limit; sound slots with placeholder SFX and music. The AI plays both the map (a list of planners in `world/ai.ts`) and battles, in a web worker.

Architecture: `design/architecture.md`; recipes and gotchas: `engineering.md`. `pnpm verify` before calling anything done. Sims: `pnpm sim:many --seeds 1-16 "p1,p2"` (smoke tests only until factions have their lines).

## Now
**M38 map structures done** (merged into main, tag `m38-structures`): a mercenary camp, a merchant and a mage merchant on every map. Stand a warband on one to trade (the screen opens at the end of the march; the warband panel has "Visit"). Neutral spells come from the mage merchant. The AI uses all three. Save version 18. Stocks and prices are provisional (#54). Route for screenshots: `?map&structure=mercenaries|merchant|mage`.

## Next
1. Waiting on the user: a playtest of M38; #49–54, the Jilliath mage's name, the Grove/Wastes pitch, music.
2. Claude's plan: faction content as the user designs it; meanwhile the open debt in `engineering.md` when something touches it.

## Recently done
- 2026-09-27: M38 map structures; M37 review cleanup; the user's items: Hatchet, Outlaw's pocketwatch, Cathedral node.
- 2026-09-27: M35 items and spoils; M31 sound; music placeholders; map palette; M30 fast sims, retreat, resolve.
- 2026-09-26: M17–M27: cities, players, fog, settings, spells and mana, Nexus tier-3 mages, Jilliath tier-1 Cleric and mage, tier-1 balance.
- 2026-09-25: M1–M16: battles, the map, progression, forks, leaders, saves, art slots. Git history has the detail.
