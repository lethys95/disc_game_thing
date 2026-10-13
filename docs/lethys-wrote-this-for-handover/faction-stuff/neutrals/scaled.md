# Neutrals: the Scaled (lizardfolk, naga, a medusa)

> **Pitch (Claude, 2026-10-11), at the user's invitation:** "You could consider playing around with neutral factions.
> We only have three right now. You could make something like... Wildlife, greenskins (or call it something else, but it
> means orcs, trolls, goblins, etc), lizard people (gorgons, naga, lizardmen, medusa, etc), centaur, barbarians
> (shamaness, some axe wearing guys, bows, spears, that sort of thing), so on so forth. There's room to be creative"
> (inspiration: Icewind Dale, Pillars of Eternity: Deadfire's fighter and wizard kits). Everything here is Claude's:
> cut, rename or veto. Names are suggestions. Numbers are provisional (`provisional.md` #81).

## The tribe
- **Role:** the swamp and ruin peoples: lizardmen, a naga, and the medusa who rules them.
- **How it plays:** the Scaled test **your health over time and your answers to control**. Venom eats health each turn
  and halves the healing a unit gets, the naga holds one of your units in its coils for as long as it keeps squeezing,
  and the medusa turns one unit to stone. A squad that relies on healing struggles; one that kills the coiler or
  outdamages the venom does well.
- **Tiers:** four tier-1 units and a tier-2 medusa.

## Tier 1
### Scaleblade (lizardman)
- **Role:** melee skirmisher.
- **Stats:** health medium · damage low · armor low · initiative medium.
- **Abilities:** *Venom* (passive): the unit it hits is envenomed: it loses health at the start of each of its turns
  and heals only half, for a few turns. More venom adds up to a cap.

### Spitter (lizardman)
- **Role:** ranged.
- **Stats:** health low · damage very low (ranged) · armor none · initiative medium-high.
- **Abilities:** *Venom* on its spit, as the Scaleblade's.

### Naga Coiler
- **Role:** holder.
- **Stats:** health high · damage low · armor low · initiative medium.
- **Abilities:** *Constrict* (main action): squeezes an enemy in its reach: the enemy takes a little damage and loses
  its turns until the naga's next turn. Held for as long as the naga keeps choosing to squeeze, at the cost of its
  own turn (different from the Brigand's single stun).

### Shedskin (a scale-priest)
- **Role:** support.
- **Stats:** health low · damage very low (ranged) · armor none · initiative medium.
- **Abilities:** *Shed skin* (main action): an ally sheds everything the enemy laid on it, and heals a little.

## Tier 2
### Medusa
- **Role:** leader, controller.
- **Stats:** health high · damage medium · armor low · initiative medium.
- **Abilities:** *Venom* on her strikes (the snakes). *Stone gaze* (twice per battle, main action): one enemy turns to
  stone: it loses its next turn, but takes half damage while it's stone (Pillars' petrify, softened).

## Camps (Claude)
Weak: two Scaleblades, Spitter, Shedskin. Medium: Naga Coiler, two Scaleblades, Spitter, Shedskin (level 2). Strong:
Medusa, Naga Coiler, two Scaleblades, two Spitters (level 4).

## Look (Claude)
Lizardmen tall and lean, crested, in bronze scale and reed, spears and bone; the spitter with a swollen throat sac;
the naga a serpent body below a gaunt armored torso, coiled; the shedskin trailing a moulted skin like a mantle; the
medusa veiled in verdigris bronze, her snakes lifting the veil.

**Status:** in game as `scaleblade`, `spitter`, `naga_coiler`, `shedskin`, `medusa` (`?fight=scaled`); not on the map.

## Concept log (Claude; every image in `art/candidates/units/neutrals/scaled/`)
**Round one (2026-10-11):** the medusas (crowned with a bare stone-grey face; veiled in verdigris) and the nagas
(a hooded armoured coiler; a pale banded one in a great coil) are strong; the scaleblades split well (crested and
armoured; white-striped with a reed kilt); the frilled spitter, its frill spread like a ruff, is the standout. The
Shedskin missed in both readings: robed lizards with no shed skin to be seen. **Round two:** the shed skin first.
**Round two (2026-10-12):** the cloak reading shows the moulted skin hanging from it, limbs and tail dangling: odd, and
the first time the idea reads. The peeling reading shows no peeling; the model won't draw skin coming away after two
tries, so the cloak is the one to judge.
**Round four (2026-10-12; the user: "some of this art is weird"):** the medusas now have serpent tails coiled on the
ground (opening the subject with the tail did it), crowned or veiled, both seeds each; the scaleblade has no stray arm;
the spitter has no wings (its throat sac doesn't show; its reed cloak does). The Shedskin: the hooded reading is a
calm robed lizard priest (the shed skin as such doesn't show); the pale reading has pale scales and a dark mantle,
the clearest so far. The model won't draw an empty skin cleanly; the pale scales carry the idea best.

## The user's picks (2026-10-12)
- **Medusa:** `medusa-r4-coils-turnaround-1001`.
- **Naga Coiler:** `naga-coiler-armored-turnaround-1000`.
- **Spitter:** `spitter-r4-turnaround-1000`.
- **Shedskin:** "use r4-hood" (`shedskin-r4-hood-turnaround`, seed not named: 1000 until said).
- Scaleblade: not picked yet.
- **Claude's pick, at the user's word:** Scaleblade `scaleblade-r4-turnaround-1001`.
- **For Tripo (2026-10-12):** every pick split into views in `shots/tripo/` (`shots/tripo/index.html`, "The five new tribes").
- **Portraits (2026-10-12):** card, bust and icon in the game for every unit, from its pick (`scripts/art/portraits.ts`; `shots/tribe-portraits.html`).
- **Weapons (2026-10-12, Claude's pick):** the Scaleblade's spear (1000), `shots/tripo/scaleblade/spear.png`. The rest fight bare-handed.
