# Nexus (Ral-Vitahl): mage line

> Filled in by Claude from your notes (`docs/design/units/nexus-tier1.md`, `docs/design/dichotomies.md`). The stat
> words are Claude's reading of the provisional code. Your word wins.

## The line
- **Role in the faction:** Nexus's strongest line in general (you).
- **Ends at tier:** 5, possibly with several tier-5 options (you, 2026-09-26).
- **Forks:** tier 2: **scheme** (Justiciar: foresight, counterplay) vs **overload** (Thaumaturge: power that doesn't care who it hits).
- **Theme:** burst and gimmicks; "Storm" combo play.

## Spell charges (you, 2026-09-26; agreed, in game since m14)
Nexus casters aren't real spellcasters: their power comes from batteries and equipment. Each caster has **finite spell charges** per fight, restored after combat and rarely otherwise. Spells can be **enhanced by spending more charges**, like MTG Izzet's *overload* (pay double: the spell hits "each" instead of one target) and *replicate* (pay again per copy, choosing new targets). The Apprentice is the simplest version (a limited area spell); later casters offer choices. The default attack is always weak: momentum matters, time is never on your side. Not sci-fi.

**(Claude, agreed by you):** scheme casters *replicate* (precise: pay per copy, pick every target), overload casters *overload* (wide: pay more, hit everything in reach). One pool per caster; nothing restores charges mid-fight for now. Provisional numbers: Apprentice 2 charges, Justiciar and Thaumaturge 4; each spell costs 1, +1 to overload or per copy.

## Tier 1

### Apprentice
- **Evolves into:** Justiciar (scheme) or Thaumaturge (overload).
- **Role:** burst caster.
- **Intent:** high burst in a plus shape, only two uses. "High is relative, mind you: the first unit is never strong." A very weak single-target secondary with unlimited uses.
- **Stats (Claude):** health low · damage high burst, very low otherwise · armor none · initiative medium.
- **Abilities:**
  - *Burst* (1 spell charge; the Apprentice has 2): hits a plus shape.
  - *Bolt* (every turn): very weak single target.
- **Status:** in game as `apprentice`.

## Tier 2

### Justiciar (scheme)
- **Evolves from:** Apprentice.
- **Role:** counterplay.
- **Intent:** activated, not a reaction (a reaction would pause the game all the time). Pick another unit in the queue: the next ability that unit uses is cancelled. The pick is **secret** from the other player. Doesn't use up the Justiciar's own action; once per fight. "Maybe at the cost of initiative next round if too oppressive": not applied unless balance needs it.
- **Stats (Claude):** health low · damage as the Apprentice · armor none · initiative above medium.
- **Abilities:** *Negate* (free action, 1 charge; replicable: several secret marks at once), plus the Apprentice's *Burst* (replicable) and *Bolt*.
- **Status:** in game as `justiciar`.

### Thaumaturge (overload)
- **Evolves from:** Apprentice.
- **Role:** collateral burst.
- **Intent:** power that doesn't care who it hits.
- **Stats (Claude):** health low · damage high burst · armor none · initiative medium.
- **Abilities:** *Homing Lightning* (1 charge, one enemy; **overloaded**: every unit with the target's name, friend and foe, your original design). Plus the Apprentice's *Burst* (overloaded: every enemy) and *Bolt*.
- **Status:** in game as `thaumaturge`.

## Tier 3
Not designed yet.
