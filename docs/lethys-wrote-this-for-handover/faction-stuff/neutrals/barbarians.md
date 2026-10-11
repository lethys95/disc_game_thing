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

**Status:** in game as `berserker`, `spearwarden`, `hunter`, `shamaness`, `warlord` (`?fight=clans`); not on the map.
