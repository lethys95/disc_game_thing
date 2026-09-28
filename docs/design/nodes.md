# Nodes (canon)

A node is a map feature that belongs to the nearest city (Warlords 3 style, `pillars.md`); whoever holds the city holds its nodes, and investing raises a node's level. The user's own: gold mine, mana node, Blacksmith (recruits deal +10, for good), Cathedral (recruits carry Holy Water).

## Taken from Claude's brainstorm (user, 2026-09-28)
The user picked these from `brainstorm/nodes.md`, with changes (in the user's words where quoted). Numbers are provisional (`provisional.md`).

### Recruit marks ("born here": units recruited in the node's city carry it for good)
- **Foundry:** recruits carry a shield that regenerates.
- **Leech pits:** recruits heal for part of the damage they deal. "Maybe nerf it a bit" (the brainstorm said 20%).
- **Stables** (the brainstorm's "Kennels"; "maybe stables makes more sense to call it"): a warband with a unit recruited there has +1 movement on the map; doesn't stack.
- **Tannery:** recruits take less from the first hit of each battle. "Maybe buff it a bit if it's only the first hit" (the brainstorm said 5).
- **Siege workshop:** "just the first attack of each fight against cities, for the ones who have the skill": units recruited there ignore a city's fortification with their first attack in a battle against a city's defenders.

### City and map effects
- **Watchtower:** its holder sees the land around it, through fog.
- **Bell tower:** when an enemy warband comes near the city, its holder is told; in a battle at the city, the garrison acts first in the first round.
- **Ossuary:** resurrection in this city (without the Capitol research), cheaper. "It sounds very powerful. Careful."
- **Quarry:** the city's upgrades cost less; its garrison's fortification armor is higher.
- **Menagerie / tribal outpost:** "I really love this one, I think it'd be so fun actually." The city can recruit units of a tribe (bandits for now; the biome's tribe once biomes exist). Neutral units, outside the city's recruit limit (`pillars.md`).

### Not a node: portals
The brainstorm's ferry/waystones become **portals, "not unlike HoMM3"**: a map structure, a linked pair; a warband stepping on one comes out at the other. Nobody holds them.

## Not taken (yet)
Training yard, scriptorium, toll bridge, waystation, mercenary guildhall, aqueduct, the shrine as a node, the level-3 "new clause" idea, per-faction readings of nodes. The user didn't pick them; they stay in the brainstorm.

## Built (M63, 2026-09-28)
All of the above, with provisional numbers (`provisional.md` #56). Each neutral city has an economic node (gold, or mana on the third) and one special node dealt from a seeded shuffle of the twelve kinds (Blacksmith, Cathedral and the ten picks), so maps differ. How they work in the rules:
- Recruit marks are effects (`effects.ts`); the Stables mark gives map movement through the general `mapMovement` field.
- City gifts are data on the node (`nodes.ts` `CityGifts`): upgrade discount, wall armor, raising the dead, sight, warning radius, defender effects, tribe recruits.
- The Bell tower's defenders act first through a general `precedes` hook.
- Portals are neighbors in the movement graph (`map.ts` `exits`); a warband standing on one sees its other end.
