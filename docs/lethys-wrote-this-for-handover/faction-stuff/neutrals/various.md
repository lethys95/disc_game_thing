# Neutrals

> Filled in by Claude from your notes (`docs/design/units/neutrals-bandits.md`). The stat words are Claude's reading
> of the provisional code. Your word wins.

Neutral groups guard neutral cities, camps and dungeons. Cleared camps currently regrow, stronger later in the
game (provisional, questions.md #19).

## Bandits (tier 1)

### Brigand
- **Role:** basic melee.
- **Intent (you):** basic unit with a one-turn stun directly in front; single use.
- **Stats (Claude):** health medium · damage low · armor none · initiative medium.
- **Abilities:** *Stun* (once per fight): the enemy directly in front loses its next turn.
- **Status:** in game as `brigand`.

### Marauder
- **Role:** armor-breaker.
- **Intent (you):** deals extra damage if the opponent has armor.
- **Stats (Claude):** health medium · damage low, higher against armor · armor very low · initiative medium.
- **Status:** in game as `marauder`.

### Bandit
- **Role:** fast archer.
- **Intent (you):** basic bow unit with just an attack; high initiative.
- **Stats (Claude):** health low · damage low (ranged) · armor none · initiative high.
- **Status:** in game as `bandit`.

### Hedge Mage
- **Role:** area caster.
- **Intent (you):** mage unit, 2×2 ranged spell, low health.
- **Stats (Claude):** health very low · damage low, in a 2×2 area (fire) · armor none · initiative low.
- **Status:** in game as `hedge_mage`.

## Not a faction unit

### Capitol Guardian
- **Role:** the chess king. Can't leave the Capitol; if it falls, the game is lost (pillars.md).
- **Intent:** powerful but immobile; the anti-rush mechanism. Strong but killable (no D2 90%-armor monstrosity).
- **Stats (Claude):** health enormous · damage high · armor high (tier-1 units barely scratch it) · initiative high.
- **Status:** in game as `capitol_guardian`.
