# Neutrals: the Tuskclans (orcs, goblins, trolls)

> **Pitch (Claude, 2026-10-11), at the user's invitation:** "You could consider playing around with neutral factions.
> We only have three right now. You could make something like... Wildlife, greenskins (or call it something else, but it
> means orcs, trolls, goblins, etc), lizard people (gorgons, naga, lizardmen, medusa, etc), centaur, barbarians
> (shamaness, some axe wearing guys, bows, spears, that sort of thing), so on so forth. There's room to be creative"
> (inspiration: Icewind Dale, Pillars of Eternity: Deadfire's fighter and wizard kits). Everything here is Claude's:
> cut, rename or veto. Names are suggestions. Numbers are provisional (`provisional.md` #81).

## The name
"Greenskins" is a word the user avoids (`design/tribes.md`). Suggested: **the Tuskclans**, for the tusks orcs and
trolls share and the clan bones goblins wear. Rename freely.

## The tribe
- **Role:** raiding clans of the hills and swamps: orcs who fight for the next kill, goblins who strike the hurt, and
  trolls that won't stay down.
- **How it plays:** the Tuskclans test **your staying power and your fire**. A kill feeds an orc, a wounded unit draws
  goblins, and a troll knits its wounds every turn unless something burns it (Jilliath's fire and Nexus's combustion
  finally matter against a neutral). A slow squad that trades blows loses; a squad that burns the troll and kills the
  orcs before they get going wins.
- **Tiers:** four tier-1 units and a tier-2 ogre chieftain.

## Tier 1
### Goblin Cutthroat
- **Role:** fast finisher.
- **Stats:** health low · damage low · armor none · initiative high.
- **Abilities:** *Kick them while they're down* (passive): deals much more to a unit below half its health.

### Orc Ravager
- **Role:** melee that snowballs.
- **Stats:** health medium-high · damage medium · armor low · initiative medium.
- **Abilities:** *Bloodlust* (passive): each kill gives it more damage for the rest of the battle.

### Troll
- **Role:** regenerating wall (Icewind Dale's trolls).
- **Stats:** health high · damage medium · armor none · initiative low.
- **Abilities:** *Regenerate* (passive): at the start of each of its turns it heals a good part of its health, unless
  fire hit it since its last turn.

### Goblin Hexer
- **Role:** support.
- **Stats:** health very low · damage very low (ranged) · armor none · initiative medium.
- **Abilities:** *Frenzy* (main action): an ally deals more damage and takes more damage until the end of the next
  round. Reckless, like the clans.

## Tier 2
### Ogre Warchief
- **Role:** leader, heavy melee.
- **Stats:** health very high · damage high · armor low · initiative low.
- **Abilities:** *Cleave* (its attack): hits its target and the enemies beside it in the same row.

## Camps (Claude)
Weak: two Goblin Cutthroats, Orc Ravager, Goblin Hexer. Medium: Troll, Orc Ravager, two Goblin Cutthroats, Goblin
Hexer (level 2). Strong: Ogre Warchief, Troll, two Orc Ravagers, Goblin Cutthroat, Goblin Hexer (level 4).

## Look (Claude)
Not cartoon greenskins: hard, scarred people of the bogs. Orcs grey-green and heavy-jawed under iron and bone; goblins
small, wiry and hooded, in stolen scraps; the troll gaunt, long-armed and mossy, its wounds visibly closing; the ogre a
hulk in a chain shirt with a clan totem of skulls on its back.

**Status:** in game as `goblin_cutthroat`, `orc_ravager`, `troll`, `goblin_hexer`, `ogre_warchief` (`?fight=tusk`); not on the map.

## Concept log (Claude; every image in `art/candidates/units/neutrals/tusk/`)
**Round one (2026-10-11):** the strongest tribe on the first try. Each reads apart: the hooded cutthroat in stolen
plates and the skull-masked one in a patchwork cloak; the hexer under crow feathers with rat skulls, and the one under
a huge spore-shedding mushroom cap (the most interesting); the topknot orc with chains and the horned orc hung with
skulls; the bog troll with barnacle growths (one view draws a stray arm) and the gaunt, long-armed mossy troll (the
Icewind Dale troll); the ogre in a bell crown and the ogre under a totem of skulls. My picks if you want them: mossy
troll, mushroom hexer, totem ogre, chained orc, skull-masked cutthroat.
**Round four (2026-10-12):** the bog troll again, "a single figure with two long arms": no stray arm in either seed,
and the arm grown back thinner reads in seed 1001.

## The user's picks (2026-10-12)
- **Goblin Cutthroat:** `goblin-cutthroat-hood-turnaround-1000` ("the other one is too tall").
- **Goblin Hexer:** `goblin-hexer-mushroom-turnaround-1000` ("it matches in height with the other").
- **Ogre Warchief:** `ogre-warchief-totem-turnaround-1000` ("more interesting").
- **Orc Ravager:** `orc-ravager-trophies-turnaround-1000`.
- **Troll:** `troll-r4-bog-turnaround-1000`.
- **For Tripo (2026-10-12):** every pick split into views in `shots/tripo/` (`shots/tripo/index.html`, "The five new tribes").
