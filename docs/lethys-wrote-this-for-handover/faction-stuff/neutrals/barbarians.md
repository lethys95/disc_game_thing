# Neutrals: the barbarian clans

> **Pitch (Claude, 2026-10-11), at the user's invitation:** "You could consider playing around with neutral factions.
> We only have three right now. You could make something like... Wildlife, greenskins (or call it something else, but it
> means orcs, trolls, goblins, etc), lizard people (gorgons, naga, lizardmen, medusa, etc), centaur, barbarians
> (shamaness, some axe wearing guys, bows, spears, that sort of thing), so on so forth. There's room to be creative"
> (inspiration: Icewind Dale, Pillars of Eternity: Deadfire's fighter and wizard kits). Everything here is Claude's:
> cut, rename or veto. Names are suggestions. Numbers are provisional (`provisional.md` #81).

> **A caution (Claude):** `design/tribes.md` notes barbarians as "possibly a playable faction later: the user has
> ideas". This is a small neutral tribe for camps, not that faction; if it gets in the way of your plans, it goes.

## The tribe
- **Role:** clans of the cold north raiding the lowlands: axes, spears, bows and a shamaness.
- **How it plays:** the clans test **your burst**. Their berserker refuses to die once, their spears punish anything
  that charges them, their hunters shoot through armor, and the shamaness binds herself to a warrior and takes half its
  wounds. A squad that spreads its damage around struggles; one that focuses and finishes does well.
- **Tiers:** four tier-1 units and a tier-2 warlord.

## Tier 1
### Berserker
- **Role:** melee that won't go down.
- **Stats:** health medium-high · damage medium · armor none · initiative medium.
- **Abilities:** *Last stand* (passive, once per battle): the first blow that would kill it leaves it at 1 health,
  and it hits harder for the rest of the battle (Deadfire's Unbending, made brutal).

### Spearwarden
- **Role:** defensive melee.
- **Stats:** health medium-high · damage low · armor medium · initiative low.
- **Abilities:** *Set spears* (passive): while defending, every melee hit on it hurts the attacker back.

### Hunter
- **Role:** ranged.
- **Stats:** health low · damage low (ranged) · armor none · initiative medium-high.
- **Abilities:** *Piercing shot* (its attack): its arrows ignore armor.

### Shamaness
- **Role:** support.
- **Stats:** health medium · damage very low (ranged) · armor none · initiative medium.
- **Abilities:** *Blood oath* (main action): binds her to an ally: it deals more damage, and half of every wound it
  takes goes to her instead, while she lives.

## Tier 2
### Warlord
- **Role:** leader.
- **Stats:** health very high · damage high · armor low · initiative medium.
- **Abilities:** *War cry* (once per battle, main action): every ally deals more damage until the end of the next round.

## Camps (Claude)
Weak: two Berserkers, Hunter, Shamaness. Medium: Spearwarden, two Berserkers, Hunter, Shamaness (level 2). Strong:
Warlord, Spearwarden, two Berserkers, Hunter, Shamaness (level 4).

## Look (Claude)
Northern raiders: furs over boiled leather, iron torcs, braided hair, blue woad; the berserker bare-chested under a
bear pelt with two axes; the spearwarden behind a round shield; the hunter in white winter hides with a longbow; the
shamaness with bone charms, a staff of antlers and red handprints; the warlord in scaled iron with a great axe.

**Status:** in game as `berserker`, `axe_maiden`, `hunter`, `shamaness`, `warlord` (`?fight=clans`); not on the map.

## Concept log (Claude; every image in `art/candidates/units/neutrals/clans/`)
**Round one (2026-10-11):** all ten hold: the red-bearded berserker under a bear's head, the woad-faced woman with a
shaved head and braid; the hunter under a white wolf hood with a quiver, the one in an antlered deer skull; the
shamaness in a ram's skull, the grey-braided one with red handprints and a raven cloak; the spearwardens (a grey-bearded
shieldbearer; a woman under white fox fur); the horned warlord in a white bear's hide, the iron-crowned woman with
skulls at her belt. All dark furs: they hold together as a tribe, and the props (axes, spears, bows) come next.

## The user's picks and a new unit (2026-10-12)
- **Warlord:** `warlord-iron-turnaround-1000`. **Shamaness:** `shamaness-handprints-turnaround-1000`.
- **Hunter:** `hunter-antlered-turnaround-1000` ("I liked the hunter winter, but his skin is pitch black as in
  actually pitch black, as if missing textures").
- **Berserker:** `berserker-bearpelt-turnaround-1000`.
- **The Spearwarden is cut** ("spearwarden honestly looks too norse"; `spearwarden-shield` was picked first). The user:
  "have berserker-woad replace spearwarden. Make her like... Throw axes and be a non-healing support unit. Midrange,
  I'm thinking." And: "Her attack will hit three tiles out from where she's standing. So if she's in the middle lane,
  she'll hit the first two rows. If she's front row, she can hit all. If she's in the back row, she can only hit the
  front row."

### Axe-maiden (the name is Claude's suggestion)
- **Role:** support that doesn't heal; thrown axes.
- **Stats (Claude):** health medium · damage low (thrown) · armor none · initiative medium.
- **Abilities:** *Hurled axe* (her attack): reaches three tiles out from her own (front row: every enemy row; middle:
  the front two; back: the front row only); the target loses armor until the end of the next round, so the clan's
  blows land (Claude's reading of "non-healing support").
- **Look:** `berserker-woad-turnaround-1000` (the user's pick): tall, a shaved-sided head with a long braid, her face
  and arms painted blue woad, wolf fur, iron arm rings. Axes as a prop sheet.
- **Status:** in game as `axe_maiden`.
- **For Tripo (2026-10-12):** every pick split into views in `shots/tripo/` (`shots/tripo/index.html`, "The five new tribes").
- **Portraits (2026-10-12):** card, bust and icon in the game for every unit, from its pick (`scripts/art/portraits.ts`; `shots/tribe-portraits.html`).
