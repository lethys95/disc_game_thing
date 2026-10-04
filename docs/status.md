# Status

_Rewritten (not appended) with every commit. Keep under ~50 lines._

**Updated:** 2026-10-04 (M78 Decay names and the Mulch Gorger)

## Where we are
A playable map game for 2–6 players (hotseat viewer vs AIs): two factions (**Jilliath**, **Ral-Vitahl**) with tier-1 melee/support/mage and Nexus mages to tier 3; bandit camps, dungeons with rewards, neutral cities; gold, mana and spells; nodes (gold, Blacksmith, mana, Cathedral); items on leaders; fog of war; retreat and a battle round limit; sound slots with placeholder SFX and music. The AI plays both the map (a list of planners in `world/ai.ts`) and battles, in a web worker.

Architecture: `design/architecture.md`; recipes and gotchas: `engineering.md`. `pnpm verify` before calling anything done. Sims: `pnpm sim:many --seeds 1-16 "p1,p2"` (smoke tests only until factions have their lines).

## Now
**M78 Decay line (2026-10-04, the user's design):** names Sproutling (tier 1), Moldling, Bog Giant, Deadwood; the Decay line forks again at tier 4 into Deadwood or the **Mulch Gorger** (a plant skeleton: every death or corpse used heals it and adds damage for the rest of combat, no cap). New engine hook `remains` (a death, or a corpse used/destroyed) and `ctx.spendCorpse`. Save version 24. Numbers #57; judged by composition, not parity. Gnolls: Claude's pitch for the user (`faction-stuff/neutrals/gnolls.md`); built once approved.
**Battle music (2026-10-03):** both sides' themes play and the winning side's is heard (tug of war, `provisional.md` #62); every faction's tracks come from a bucket (shuffle bag). The Grove has the user's seven Suno battle tracks. Try `?fight=grove`.
**Balance by composition (2026-09-30):** `pnpm sim:comps [tier]` pits every squad a faction can field at a tier against the others' (the user: composition matters, not unit parity). Retuned: Thaumaturge lightning 80 → 55 (its pair was undefeated), Grove tier-2 melee and Spiritess up. Best squads now tier 1 J 88 / N 94 / G 81, tier 2 94 / 90 / 75, tier 3 89 / 79 / 89 (`provisional.md` #61). Open: Regrowth vs Jilliath (questions #10), the Etherborn (no damage carry; AI plays secrets poorly), Nexus tier-3 melee (content gap). The frame-rate readout is a stored setting now.
**M77 the desert** (branch `m77-desert`, the user's ask: a desert biome, mostly cosmetic): every map has one desert, about a fifth of it (`provisional.md` #60). No rule changes: the same terrains drawn as sand, palm groves and thorn scrub, dunes, sandstone mesas, oases, with sparse dry tufts for grass; battles fought there get its ground and props. Its 14 props are meshed (TRELLIS.2, all first try); the boulder cluster came out dark and pitted, more lava than sandstone (a redo candidate). Try: any `?map&reveal`, `?fight&biome=desert`. Next: the user's look at it.
Ability icons: all 47 have art, approved by the user. The Capitol montage spike (real-time scene) was turned down: no interior, and close-ups magnify the models; next is a probe of painted interiors (`design/capitol-screen.md`). **M76 Spiritess branch**: Spiritess 2 (Spirit bloom, Burst mend), Psychopomp (Spiritwalk: absent units, a new engine idea as effect data), HoTs stack per healer (#59). **M75 Grove backline**: tier-1 support (Bloom), Decay support 2 (corpse growth and corpse explosion), tier-1 mage (Cycle, whose ally side rots in and feeds Lash out); corpses in battle (#58). **M74 Decay tier 4** (Lash out, the user's win condition); M73 auras don't stack; M72 Grove retuned. **M71 the Grove** (branch `m71-grove`): the Sylvan Grove is a playable faction (green mana) with the user's melee line: tier 1 regenerates; tier 2 forks into **Regrowth** (more regeneration; tier 3 supports with Grove mend and attacks weakly) and **Decay** (no regeneration; a share of damage rots in over later turns; tier 3 withers enemies that hit it). Placeholder names; numbers `provisional.md` #57. Grove units gain 50% more per level past their line (the user). An id clash (the Grove's "mend" replaced the Cleric's) is now caught by a test. Try: `?fight=grove`, `?fight=grove:decay`, `?map=grove`, or pick Sylvan in the setup. Next: the user's names and look for these units; more Grove lines; the Wastes as a faction (its resurrection hook is agreed).

## Performance
The user's laptop ran the map at about 6 fps on 2026-09-28, before the terrain went from 7.1M to 2.5M triangles (2026-09-29): stale, awaiting a new reading. Headless integrated Radeon now (`scripts/perf.ts`): 17 fps with bounce light, 40 without. The readout is a setting now (Settings → Display → "Show the frame rate", stored), no longer `?fps`.

## Next
1. Waiting on the user: `questions.md` (unit designs first: Jilliath's tier-2 support and mage, then Grove/Wastes tier 1, then tribes).
2. Claude's plan: things that don't need designs: the map's look (grass, terrain), AI scouting on big maps, research-tree connectors, tribes' foundation (a neutral faction type the bandits move into).

## Recently done
- 2026-09-28: brainstorm on items, nodes and biomes for the user to pick from (`design/brainstorm/`, not canon); M52 tab emblems, tests off the NVIDIA cards; M50 map polish.
- 2026-09-27: M49 TRELLIS.2 models; M48 UI kit everywhere; M47 city screen filled; M46 framed city view; M45 UI kit pilot; M44 battlefield; M43 dressed map; M42 3D props spike; M41 Capitol screen; questions review; M40 map sizes; M39 merchant wares and potions; M38 map structures; M37 review cleanup; the user's items: Hatchet, Outlaw's pocketwatch, Cathedral node.
- 2026-09-27: M35 items and spoils; M31 sound; music placeholders; map palette; M30 fast sims, retreat, resolve.
- 2026-09-26: M17–M27: cities, players, fog, settings, spells and mana, Nexus tier-3 mages, Jilliath tier-1 Cleric and mage, tier-1 balance.
- 2026-09-25: M1–M16: battles, the map, progression, forks, leaders, saves, art slots. Git history has the detail.
