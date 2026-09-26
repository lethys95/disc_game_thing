# Nexus (Ral-Vitahl): mage line

> Filled in by Claude from your notes (`docs/design/units/nexus-tier1.md`, `docs/design/dichotomies.md`). The stat
> words are Claude's reading of the provisional code. Your word wins.

## The line
- **Role in the faction:** Nexus's strongest line in general (you).
- **Ends at tier:** open. Today it stops at tier 2. (questions.md #35)
- **Forks:** tier 2: **scheme** (Justiciar: foresight, counterplay) vs **overload** (Thaumaturge: power that doesn't care who it hits).
- **Theme:** burst and gimmicks; "Storm" combo play.

## Tier 1

### Apprentice
- **Evolves into:** Justiciar (scheme) or Thaumaturge (overload).
- **Role:** burst caster.
- **Intent:** high burst in a plus shape, only two uses. "High is relative, mind you: the first unit is never strong." A very weak single-target secondary with unlimited uses.
- **Stats (Claude):** health low · damage high burst, very low otherwise · armor none · initiative medium.
- **Abilities:**
  - *Plus Burst* (twice per fight): hits a plus shape.
  - *Bolt* (every turn): very weak single target.
- **Status:** in game as `apprentice`.

## Tier 2

### Justiciar (scheme)
- **Evolves from:** Apprentice.
- **Role:** counterplay.
- **Intent:** activated, not a reaction (a reaction would pause the game all the time). Pick another unit in the queue: the next ability that unit uses is cancelled. The pick is **secret** from the other player. Doesn't use up the Justiciar's own action; once per fight. "Maybe at the cost of initiative next round if too oppressive": not applied unless balance needs it.
- **Stats (Claude):** health low · damage as the Apprentice · armor none · initiative above medium.
- **Abilities:** *Negate* (free action, once per fight), plus the Apprentice's *Plus Burst* and *Bolt*.
- **Status:** in game as `justiciar`.

### Thaumaturge (overload)
- **Evolves from:** Apprentice.
- **Role:** collateral burst.
- **Intent:** power that doesn't care who it hits.
- **Stats (Claude):** health low · damage high burst · armor none · initiative medium.
- **Abilities:** *Homing Lightning* (twice per fight): hits **all** units with the same name as the target, friend and foe. Plus the Apprentice's *Plus Burst* and *Bolt*.
- **Status:** in game as `thaumaturge`.

## Tier 3
Not designed yet.
