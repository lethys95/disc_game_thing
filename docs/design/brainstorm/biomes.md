# Biomes: a brainstorm (Claude's proposals)

The user's direction (map-look.md): several terrain types; a city's possible nodes depend on its terrain ("haunted woods might spawn a witch hut, a regular forest the Cathedral"); forest first. Open: faction terrain (D2, spreading from cities) or HoMM3-style (neutrals belong to their castle's terrain).

## What a biome is (proposal)
A biome is a **region of the map**, fixed when the map is made, each around one or two neutral cities. It decides five things:
1. **Its look**: ground texture, props, fog colour, sky tint, music. The pipeline already swaps these.
2. **Node pool**: which nodes its cities can have.
3. **Tribe**: which neutral tribe guards its camps and dungeons.
4. **Loot flavour**: what its dungeons drop (see items.md, "where it drops says what it is").
5. **One rule**. Exactly one, legible from the map, and felt on the map or in battles fought there. More than one and nobody remembers them.

On faction terrain: I'd **not** spread terrain from cities as D2 did. It fights biomes (whose haunted woods are they?) and it's mostly paint. Instead, a faction's **Capitol sits in its home biome**, and home biomes can appear elsewhere as neutral land. The Grove player feels at home in any forest, the Wastes player in the salt flats.

## Biomes
Each has a name (proposal), its rule, its node pool and a tribe idea (tribes are the user's; these only note what would *fit*).

### Old forest (the baseline; the Grove's home)
- **Rule: cover.** A warband inside a forest is only seen from next to it. You can ambush, and the Mask of many faces matters less here.
- Nodes: Cathedral (user), Kennels, Waystation, Tannery.
- Tribe fit: the user named centaurs and gnolls among options.

### Haunted woods (the user's example)
- **Rule: thin veil.** Units that die in a battle here go to the graveyard at *no* decay: their resurrection costs the minimum at once. Death is cheap for everyone, and the Wastes profit most. Players will choose to fight here, or refuse to.
- Nodes: Witch hut (user), Ossuary, Shrine.
- Look: pale autumn trees, low mist (the Grove's "withered trees for decay" without skeleton trees).

### Salt flats (the Wastes' home; where the spirit bomb fell)
- **Rule: nowhere to hide.** Sight is +2 for everyone, and no warband regenerates here between turns. Crossing is fast but costly.
- Nodes: Ossuary, Foundry (glass kilns), Watchtower.
- Look: white crust, glassed craters, half-buried statues of the empires the bomb woke. The "ancient Egypt" note lives in the ruins.

### Storm scar (Nexus's home; a test range)
- **Rule: charged air.** In battles here, shields regenerate twice as fast, for everyone. Nexus is at home, and a Mutant here is a menace.
- Nodes: Mana node (level 3 mana doubled here), Foundry, Siege workshop.
- Look: fused rock, lightning rods from old experiments, teal glow at night. It tells the Nexus↔Wastes story on the map: the scar is next to the salt flats.

### Pilgrim's plains (Jilliath's home)
- **Rule: open roads.** Plains cost less movement here, and the region has more roads, so warbands meet more often. It's the aggressive biome.
- Nodes: Cathedral, Training yard, Toll bridge, Bell tower.
- Tribe fit: bandits (they already exist, and fit roads and travellers).

### Fen
- **Rule: mud.** In battles here, every unit has −10 initiative, which often means one action fewer. Fights are slower, and the fast Nexus casters lose their edge.
- Nodes: Leech pits, Ferry, Menagerie.
- Tribe fit: the user named trolls.

### Highlands / crags
- **Rule: high ground.** A warband on a crag sees 2 further. In a battle whose defender stands on a crag, the defender's front row gets +5 armor.
- Nodes: Quarry, Watchtower, Scriptorium (a monastery).

## Rules I considered and left out
- **Weather and seasons** changing over turns: interesting, but that makes the map a clock ("surprise, you were on a clock" is on the pillars' not-porting list).
- **Random events in a biome**: RNG, out.
- **Biome-specific movement for each faction** (Grove moves freely in forests): tempting, but it makes one faction's home impassable to others. It's better left to units or items, like the Wayfinder's map.

## Why this is the right size
Seven biomes × one rule each gives seven things to learn, most readable by eye. The node pools make two maps with the same factions play differently; the loot flavour makes exploring worth it. It's all data: a biome would be a record (look slots, node pool, tribe, a battle effect or a map rule), so it extends the architecture rather than bolting onto it.
