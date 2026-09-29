# Status

_Rewritten (not appended) with every commit. Keep under ~50 lines._

**Updated:** 2026-09-29 (M71 the Grove)

## Where we are
A playable map game for 2–6 players (hotseat viewer vs AIs): two factions (**Jilliath**, **Ral-Vitahl**) with tier-1 melee/support/mage and Nexus mages to tier 3; bandit camps, dungeons with rewards, neutral cities; gold, mana and spells; nodes (gold, Blacksmith, mana, Cathedral); items on leaders; fog of war; retreat and a battle round limit; sound slots with placeholder SFX and music. The AI plays both the map (a list of planners in `world/ai.ts`) and battles, in a web worker.

Architecture: `design/architecture.md`; recipes and gotchas: `engineering.md`. `pnpm verify` before calling anything done. Sims: `pnpm sim:many --seeds 1-16 "p1,p2"` (smoke tests only until factions have their lines).

## Now
**M71 the Grove** (branch `m71-grove`): the Sylvan Grove is a playable faction (green mana) with the user's melee line: tier 1 regenerates; tier 2 forks into **Regrowth** (more regeneration; tier 3 supports with Grove mend and attacks weakly) and **Decay** (no regeneration; a share of damage rots in over later turns; tier 3 withers enemies that hit it). Placeholder names; numbers `provisional.md` #57. Grove units gain 50% more per level past their line (the user). An id clash (the Grove's "mend" replaced the Cleric's) is now caught by a test. Try: `?fight=grove`, `?fight=grove:decay`, `?map=grove`, or pick Sylvan in the setup. Next: the user's names and look for these units; more Grove lines; the Wastes as a faction (its resurrection hook is agreed).

## Performance (user, 2026-09-28, `?fps`)
Server desktop (RTX 3090 Ti): a solid 60 fps on the map. User's laptop: about 6 fps. Candidates for the laptop: bounce light off (Settings → Display), then instanced trees and grass.

## Next
1. Waiting on the user: `questions.md` (unit designs first: Jilliath's tier-2 support and mage, then Grove/Wastes tier 1, then tribes).
2. Claude's plan: things that don't need designs: the map's look (grass, terrain), AI scouting on big maps, research-tree connectors, tribes' foundation (a neutral faction type the bandits move into).

## Recently done
- 2026-09-28: brainstorm on items, nodes and biomes for the user to pick from (`design/brainstorm/`, not canon); M52 tab emblems, tests off the NVIDIA cards; M50 map polish.
- 2026-09-27: M49 TRELLIS.2 models; M48 UI kit everywhere; M47 city screen filled; M46 framed city view; M45 UI kit pilot; M44 battlefield; M43 dressed map; M42 3D props spike; M41 Capitol screen; questions review; M40 map sizes; M39 merchant wares and potions; M38 map structures; M37 review cleanup; the user's items: Hatchet, Outlaw's pocketwatch, Cathedral node.
- 2026-09-27: M35 items and spoils; M31 sound; music placeholders; map palette; M30 fast sims, retreat, resolve.
- 2026-09-26: M17–M27: cities, players, fog, settings, spells and mana, Nexus tier-3 mages, Jilliath tier-1 Cleric and mage, tier-1 balance.
- 2026-09-25: M1–M16: battles, the map, progression, forks, leaders, saves, art slots. Git history has the detail.
