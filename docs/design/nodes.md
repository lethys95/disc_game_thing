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

## Taken in the second review (user, 2026-10-15, the phone page)
From round two of the brainstorm and round one's leftovers. The user's notes are quoted.

### Recruit marks
- **Venom distillery** (swamp): recruits' first hit in each battle envenoms.
- **Witch hut** (haunted woods): whoever kills a recruit is Punished.
- **Hunting lodge** (temperate): recruits deal more to neutral units.
- **Training yard** (anywhere): recruits arrive a level up.

### City and map effects
- **Gallows** (haunted woods): enemy units that die in battles at this city can't be raised by their owner. "Potentially very powerful."
- **Waystation** (anywhere): the holder's warbands that start a turn next to it heal. "Buff to 25" (the brainstorm said 10%).
- **Shrine** (haunted woods), as a node: holding its city keeps a hidden evolution route open. "It just means that we have more units to make, and upgrades might become complicated." It waits for those routes to be designed.
- **Waystone** (anywhere): the user's own (below), now taken as a node.

### The economy
- **Caravanserai** (desert): merchants and mercenary camps sell to its holder cheaper. "Just make sure there is no dodgy loop between buying cheaply and selling stuff again."
- **Bog iron** (swamp): the city's recruits cost less gold.
- **Granary** (temperate): the city's garrison heals faster, and its tier upgrades cost less.

### Maybe
- **Oasis** (desert): "Wording is weird. Only the owner can be inside cities. Also i think i'd change it to units recruited there or resting in the town have 2x regeneration."
- **Dog yard** (tundra): the holder's warbands starting in the city's radius cross rough ground at plain cost. The user asked whether slow ground exists: it does (forest and hills cost more; the sure-footed item already ignores it).
- **Scriptorium** (temperate): "You need this to do different things for the other factions then. Otherwise it's just a stub for the others which isn't fun."
- **Toll bridge** (temperate): "cool thematically although I'm not sure those chokepoints exist in the game currently." They don't (no rivers or chasms yet).

### Not taken
Rune circle ("too strong"), Drowned bell ("too difficult to visualize"), Moth lantern ("disguises isn't a large enough feature to warrant this"), Mercenary guildhall (a duplicate of the Caravanserai), Aqueduct ("just not enough nodes on each city to justify").

### Two ideas taken
- **Level 3 adds a clause:** levels 1 and 2 raise a node's number; level 3 adds something new, so the last upgrade is a choice.
- **A node reads differently per faction**, "as long as nodes aren't stubs for other factions": a faction reading must be a real effect for every faction, not a flavor line for one.

## Biome pools (user, 2026-10-15)
A neutral city's special nodes come only from its biome's pool plus the "anywhere" pool ("a swamp city never has a Granary"). Each neutral city gets **two** special nodes.
- **Anywhere:** Blacksmith, Siege workshop, Tribal outpost (Menagerie), Training yard, Waystation, Waystone.
- **Temperate:** Cathedral, Stables, Tannery, Bell tower, Hunting lodge, Granary, Toll bridge, Scriptorium.
- **Desert:** Foundry, Watchtower, Oasis, Caravanserai.
- **Swamp:** Leech pits, Venom distillery, Bog iron.
- **Tundra:** Quarry, Watchtower, Dog yard.
- **Haunted woods:** Ossuary, Witch hut, Gallows, Shrine.

The Tribal outpost recruits one of its biome's tribes, chosen by the city's place, as camps are. A biome's structures differ: what merchants sell and whom mercenary camps hire fit the biome; mage merchants stay the same everywhere ("probably not mage merchant, but the others yes").

## Built (M63, 2026-09-28)
All of the above, with provisional numbers (`provisional.md` #56). Each neutral city has an economic node (gold, or mana on the third) and one special node dealt from a seeded shuffle of the twelve kinds (Blacksmith, Cathedral and the ten picks), so maps differ. How they work in the rules:
- Recruit marks are effects (`effects.ts`); the Stables mark gives map movement through the general `mapMovement` field.
- City gifts are data on the node (`nodes.ts` `CityGifts`): upgrade discount, wall armor, raising the dead, sight, warning radius, defender effects, tribe recruits.
- The Bell tower's defenders act first through a general `precedes` hook.
- Portals are neighbors in the movement graph (`map.ts` `exits`); a warband standing on one sees its other end.

## The user's own idea: the Waystone (2026-09-29, from the items notes)
"Could add like a waystone node for cities. Gain spell 'way portal' if controlled. Units elevated to leader in the city get teleported to the city when cast. All units stop counting as having been elevated there if the city is taken." Built 2026-10-15, once the user let every city elevate leaders (`provisional.md` #85).

## Idea (the user, 2026-10-06): an offensive Cathedral
"The only way for 5 congregants to work, would be if somehow you attached it to a city which provided them with ranged
attacks, which we'll get later probably. Like cathedral but offensive." A node whose recruits get a ranged attack (or
one that lets back-row melee strike), making all-melee squads viable. Not designed yet; for later.

## Built (2026-10-15)
The pools, two specials per city, the outpost's and mercenary camps' tribes by biome, and every taken node but the Shrine (the Waystone since, #85), with the maybes the user put in pools (the Oasis in the user's wording, the Dog yard). Claude's readings and numbers: `provisional.md` #84. Not built yet: the Shrine (hidden evolution routes don't exist), the Scriptorium and Toll bridge (maybes), level-3 clauses, per-faction readings, and merchants' wares by biome.

## Third review: level-3 clauses, faction readings, merchants (user, 2026-10-16, the phone page)
From Claude's proposals (`brainstorm/nodes.md`, round three). The user's notes are quoted.

**Levels:** at level 3 the node's number still grows **and** its clause arrives. Nodes with no number are "just missing upgrades": they get a growing number ("Cathedral could have a better holy water, oasis could increase movement more"); "for things like waystone, yeah, two levels".

### Clauses taken
- **Mana node:** your first spell each turn aimed near the city costs half ("very close to it though").
- **Caravanserai:** you see every merchant's wares and every camp's hires from anywhere.
- **Bog iron:** enemy units fighting at the city have less armor.
- **Granary:** provisions: your warbands leaving the city heal as if resting for two more turns.
- **Blacksmith:** recruits' attacks ignore part of their target's armor.
- **Cathedral:** Holy Water also cleanses harmful effects. "It might be worth having some kind of debuff flag, so you're not just manually removing these effects here [...] more debuffs will exist in the future."
- **Foundry:** healing past full health goes into the shield: "Only 50% of overfill, doesn't stack."
- **Leech pits:** a kill heals the bearer as much as the killing blow dealt.
- **Venom distillery:** every hit on an already envenomed target adds a dose.
- **Witch hut:** the curse passes on: the killer is hexed in turn.
- **Hunting lodge:** trophies: gold for each neutral a hunter's warband kills.
- **Training yard:** units resting in its garrison gain a little XP each turn ("not much please").
- **Watchtower:** it also shows the items of the warbands it sees, and where each last moved.
- **Gallows:** a warband wiped out at the city leaves its leader's items to the holder. "I'm really unsure whether or not Gallows should actually be in the game at all. It seems like it just breaks the game dynamics."
- **Waystation:** +1 movement for warbands starting next to it.
- **Oasis:** enemy warbands near the city "regenerate nothing, rather. Healing should still be possible."
- **Waystone** (the user's own clause, two levels): units brought by Way portal get a small amount of extra movement.

### Clauses not taken
Gold mine ("this makes people not want to upgrade"), Stables, Tannery, Siege workshop, Quarry, Ossuary, Bell tower, Dog yard, Claude's Waystone clause. **Tribal outpost** is a maybe: a tribe unit can already be elevated; instead "maybe we can say that there's a strong bonus if you decide to elevate a neutral unit through the tribal outpost". **Wording:** "I don't like how 'march' is used in our game right now. I don't know what it means. A turn?"

### Faction readings
Only the **Scriptorium** reads per faction ("very strong I think, but okay"): Jilliath's casters' first use of their own health each battle costs none; Ral-Vitahl's casters start each battle with an extra spell charge; the Grove's casters' heals over time last a turn longer. Everywhere else, one effect for all: "Holy water all around", "just lifesteal all around", "just Punished".

### Merchants by biome
Strict, like the node pools: a merchant lays out its biome's list plus "anywhere" (the potions everywhere). The lists are Claude's hints, taken as they were:
- **Anywhere:** Iron helm, Plate armor, Swift charm, War banner (the four placeholders), Storm capacitor, Wayfinder's map.
- **Temperate:** Hatchet, Outlaw's pocketwatch, Reaching spear, Banner of the vanguard, Spyglass helm, Veteran's standard.
- **Desert:** Deck of cards, Ankh, Crown of the pretender, Salt of the old kings, Hourglass of borrowed time, Gold item.
- **Swamp:** Twin knives, Seedpod reliquary, Hatchet, Deck of cards.
- **Tundra:** Grudgebearer, Penitent's chains, Veteran's standard, Banner of the vanguard.
- **Haunted woods:** Burial wrappings, Hollow plate, Deck of cards, Hourglass of borrowed time, Ankh.

Built 2026-10-16 (`provisional.md` #86): the clauses, the levels, the Scriptorium in the temperate pool, the merchants' lists, and a "harmful" flag on every debuff (the user's suggestion) that the Cathedral's Holy Water cleanses. "March" is gone from the game's words: a warband moves.
