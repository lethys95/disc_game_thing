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

**(Claude, agreed by you):** scheme casters *replicate* (precise: pay per copy, pick every target), overload casters *overload* (wide: pay more, hit everything in reach). One pool per caster; nothing restores charges mid-fight for now.

## Tier 1

### Apprentice
- **Evolves into:** Justiciar (scheme) or Thaumaturge (overload).
- **Role:** burst caster.
- **Intent:** high burst in a plus shape, only two uses. "High is relative, mind you: the first unit is never strong." A very weak single-target secondary with unlimited uses.
- **Stats (Claude):** health low · damage high burst, very low otherwise · armor none · initiative medium.
- **Abilities:**
  - *Burst* (costs a spell charge): hits a plus shape.
  - *Bolt* (every turn): very weak single target.
- **Status:** in game as `apprentice`.
- **look** (semi placeholder) We're keeping apprentice hooded and robed, so there's ambiguity at the gender split between scheme and overload.

## Tier 2

### Justiciar (scheme)
- **Evolves from:** Apprentice.
- **Role:** counterplay.
- **Intent:** activated, not a reaction (a reaction would pause the game all the time). Pick another unit in the queue: the next ability that unit uses is cancelled. The pick is **secret** from the other player. Doesn't use up the Justiciar's own action; once per fight. "Maybe at the cost of initiative next round if too oppressive": not applied unless balance needs it.
- **Stats (Claude):** health low · damage as the Apprentice · armor none · initiative above medium.
- **Abilities:** *Counter* (free action, costs a charge; replicable: several secret marks at once), plus the Apprentice's *Burst* (replicable) and *Bolt*.
- **Status:** in game as `justiciar`.
- **look** (semi placeholder, we're making scheme female and overload male)

### Thaumaturge (overload)
- **Evolves from:** Apprentice.
- **Role:** collateral burst.
- **Intent:** power that doesn't care who it hits.
- **Stats (Claude):** health low · damage high burst · armor none · initiative medium.
- **Abilities:** *Homing Lightning* (costs a charge, one enemy; **overloaded**: every unit with the target's name, friend and foe, your original design). Plus the Apprentice's *Burst* (overloaded: every enemy) and *Bolt*.
- **Status:** in game as `thaumaturge`.
- **look** (semi placeholder, we're making scheme female and overload male)

## Tier 3

### Etherborn
- **Evolves from:** Justiciar
- **Role:** counterplay, semi support.
- **intent:** Same usage of secrets as justiciar, but has more secrets. Also uses spells to counter enemy healing. Semi support unit, reactionary countering of damage and healing. Loses burst. Bolt turns into absorb. It's up the user not to mess up with the unit. Dead end evolution.
- **look:** Blue skin, like stars underneath the skin, noble robes, no facial features, no eyes, no mouth. Hands surrounded by purple/pink arcane energy. Female shaped.
- **Abilities**:
    - Counter: secret Counterspell, costs charge
    - Negate: secret damage/healing negation on target. Works against shields too. costs charge. Any target who would be healed, is damaged by that amount instead once. Any target who would be damaged is healed for that amount instead once.
    - Absorb: basic attack replacement. Can target either enemy or ally. If enemy, deal very small amount of damage, next time they would deal damage, reduce the damage by x, and heal etherborn by the damage prevented. If ally, prevent y and heal etherborn by the damage prevented.
- **Stats (Claude):** health below medium · damage very low · armor none · initiative high.
- **Status:** in game as `etherborn` (provisional readings in questions.md #50).


### Backlasher
- **Evolves from** Justiciar
- **Role:** offensive counterplay
- **intent:** counterspells with penalties, more offensive power. 
- **Abilities:**
    - Bolt
    - Burst
    - backlash: negate but upgraded. If an ability is prevented this way, and the ability, deal x amount of damage.
- **look**: 
- **Stats (Claude):** health below medium · damage low · armor none · initiative high.
- **Status:** in game as `backlasher` (provisional readings in questions.md #50).


### Maelstrom 
- **Evolves from** Thaumaturge
- **Role** burst
- **intent:** Has two more charges, and an additional spell. Linear upgrade.
- **Abiliites:**
    - Bolt
    - Burst
    - Homing Lightning
    - Combustion: Costs 1 charge. Free action. Spells cast by this unit which cost charges become free actions this turn.
- **Stats (Claude):** health below medium · damage low, high burst · armor none · initiative medium.
- **Status:** in game as `maelstrom` (provisional readings in questions.md #50).
