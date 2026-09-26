# Nexus (Ral-Vitahl): melee line

> Filled in by Claude from your notes (`docs/design/units/nexus-tier1.md`, `docs/design/dichotomies.md`).
> Nexus stats were never given as numbers; the stat words are Claude's reading of the provisional code. Your word wins.

## The line
- **Role in the faction:** the front; not Nexus's strongest line (casters are).
- **Ends at tier:** short evolution chain (your words). Today it stops at tier 2. **Open:** does it go further? (questions.md #35)
- **Forks:** tier 2: **scheme** (automata: foresight, counterplay) vs **overload** (mutants: raw power that doesn't care who it hits).
- **Theme:** expedience; "mutants will be the melee line primarily" (you).

## Tier 1

### Custodian
- **Evolves into:** Battery (scheme) or Mutant (overload).
- **Role:** golem front-liner on a shield.
- **Intent:** a shield is temporary health on top of a small max HP. It regenerates fully after the fight, but the unit can't take a large beating, hence expedience and speed. Normal healing can't restore shields, only shield-specific effects.
- **Stats (Claude):** health low · shield high · damage medium · armor none · initiative medium.
- **Look (you):** a golem.
- **Status:** in game as `custodian`.

## Tier 2

### Battery (scheme)
- **Evolves from:** Custodian.
- **Role:** shield bank for the squad.
- **Intent:** higher shield; spreads it to others and usually loses some doing so.
- **Stats (Claude):** health low · shield very high · damage low · armor none · initiative medium.
- **Abilities:**
  - *Equalize*: shares shields with a unit until both are equal. Shields handed out this way perish on the Battery's next turn.
- **Status:** in game as `battery`.

### Mutant (overload)
- **Evolves from:** Custodian.
- **Role:** the menace that grows.
- **Intent:** higher max HP. "You must attack this thing or it becomes a menace."
- **Stats (Claude):** health medium · shield medium · damage medium, growing · armor none · initiative medium.
- **Abilities:**
  - *Mutate* (passive): when its shield is restored while already full, it gains damage (stacking for the fight).
- **Status:** in game as `mutant`.

## Tier 3
Not designed yet.
