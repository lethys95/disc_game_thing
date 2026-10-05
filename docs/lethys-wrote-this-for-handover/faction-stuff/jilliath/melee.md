# Jilliath: melee line

> Filled in by Claude from the canon (`docs/design/units/jilliath-melee-line.md`, which keeps the original numbers).
> The stat words are Claude's reading of those numbers against the other units of each tier. Your word wins.

## The line
- **Role in the faction:** the core of the army; the line everything else supports.
- **Ends at tier:** 5 on the self-sacrifice branch; 4 on the other two.
- **Forks:**
  - tier 2: **faith preserves** (Paladin: self-preservation, protection) vs **faith consumes** (Zealot: self-sacrifice, fanaticism).
  - tier 3, Zealot side: **punishment** (Punisher: control, degrading the enemy) vs **self-sacrifice** (Fanatic: martyrdom).
  - Branch choice is free and permanent per line; units that reach an undecided fork ask (pillars.md).
- **Theme:** what faith costs. Punishment is a utility, not an identity, so it stops at tier 4; martyrdom is the Inquisition's ceiling, so it climbs to tier 5.

## Tier 1

### Congregant
- **Evolves into:** Paladin (faith preserves) or Zealot (faith consumes).
- **Role:** cheap swarm; the neutral baseline, a common faithful not yet committed.
- **Intent:** strength in numbers. Filling the front with Congregants is cost-efficient and mutually reinforcing; upgrading one takes it out of the network. (You, 2026-09-25:) meant to be an angry mob, hence the passive that stacks with numbers; not rugged knights.
- **Stats (Claude):** health medium · damage low alone, high in a crowd · armor none · initiative medium.
- **Abilities:**
  - *Congregation* (passive): more damage for each other Congregant in the squad. Back-row Congregants still buff, though they can't reach the enemy.
- **Strong against / weak against (Claude):** strong in numbers against unarmored units; walled completely by armor (a Paladin shrugs off their hits).
- **Status:** in game as `congregant`.

## Tier 2

### Paladin (faith preserves)
- **Evolves from / into:** Congregant → Templar.
- **Role:** the wall; the unit that doesn't die.
- **Intent:** walls swarm units completely; big hits still hurt it. Survives one big hit, patches itself up, holds the line.
- **Stats (Claude):** health medium · damage medium · armor high · initiative medium.
- **Abilities:**
  - *Lay on Hands* (free action, once per fight): heals itself a lot (scaled on its damage). Free, so it can still attack or defend that turn.
- **Strong against / weak against:** swarms and many small hits / a few big hits, where armor stops mattering.
- **Status:** in game as `paladin`.

### Zealot (faith consumes)
- **Evolves from / into:** Congregant → Punisher (punishment) or Fanatic (self-sacrifice).
- **Role:** burst that burns itself out; a ticking clock.
- **Intent:** either wins before it burns out, or it dies. No stalling with a Zealot. Buffs are double-edged: they raise its output and its self-harm alike.
- **Stats (Claude):** health high · damage very high · armor none · initiative medium.
- **Abilities:**
  - *Zeal* (passive): every attack also hurts the Zealot for half the damage it deals.
  - *Must attack* (passive): has to attack every turn; can't wait or defend.
- **Strong against / weak against (Claude):** anything that can't kill it first / armor-less trades it can't win in time, and being stalled.
- **Look (user):** a mask covers the whole head, featureless except two wide, staring eye holes with black behind them (no skin shows). On the forehead, a burning outstretched hand with spread fingers. Ominous, strange, inhuman: "this is wrong, grotesque, deranged and twisted". Spiked, tattered armor. A serrated two-handed sword. Pale colors, strong contrast of black, white and red. **Update (user, 2026-10-05):** the eye holes show his eyes, wild and staring ("how wild his eyes are"), rather than black behind them.
- **Status:** in game as `zealot`.

## Tier 3

### Templar (faith preserves)
- **Evolves from / into:** Paladin → Immortal.
- **Role:** wall that spreads its protection; force multiplier.
- **Intent:** in the center of the front line, the units beside it become nearly as hard to kill as the Templar itself.
- **Stats (Claude):** health medium · damage medium · armor high · initiative medium.
- **Abilities:**
  - *Lay on Hands* (free action, once per fight): as the Paladin's, bigger.
  - *Devotion Aura* (passive): adjacent allies gain its armor.
- **Status:** in game as `templar`.

### Punisher (punishment)
- **Evolves from / into:** Zealot → Torturer.
- **Role:** control; doesn't kill fast, degrades the enemy's ability to fight back.
- **Intent:** the fanaticism redirected from self-destruction into control. Drops the Zealot's restrictions (may defend again).
- **Stats (Claude):** health medium · damage low for its tier, but it hits the whole front line · armor none · initiative medium.
- **Abilities:**
  - *Flail* (the attack): hits the entire enemy front row.
  - *Punishment* (passive): everything the flail hits loses damage and initiative for the rest of the fight, stacking (now capped at 3 stacks by balance). Losing initiative can cost the enemy whole actions.
- **Status:** in game as `punisher`.

### Fanatic (self-sacrifice)
- **Evolves from / into:** Zealot → Chosen.
- **Role:** martyr burst; the start of the faction's deepest commitment.
- **Stats (Claude):** health very high · damage very high · armor none · initiative medium.
- **Abilities:**
  - *Fanaticism* (passive): must attack; self-damage of half the damage it deals.
  - *Hysteria* (passive): on a kill, a free extra attack with double the self-damage penalty; up to twice per turn, doubling again.
- **Strong against / weak against (Claude):** finishing weakened lines in one turn / armor and healing that outlast it.
- **Status:** in game as `fanatic`.

## Tier 4

### Immortal (faith preserves; end of the branch)
- **Evolves from:** Templar.
- **Role:** the capstone wall: can't be killed through normal means, and starts to save others.
- **Stats (Claude):** health high · damage medium · armor high · initiative medium.
- **Abilities:**
  - *Divine Lay on Hands* (twice per fight): on itself as a free action; on an ally as its main action.
  - *Devotion Aura* (passive): as the Templar's.
  - *Guardian Spirit* (passive, once per fight): a killing blow leaves it at 1 HP for the rest of the turn instead: a window to heal.
- **Status:** in game as `immortal`.

### Torturer (punishment; end of the branch)
- **Evolves from:** Punisher.
- **Role:** domination: the enemy gets weaker and slower every turn.
- **Stats (Claude):** health medium · damage medium (front-row sweep) · armor none · initiative medium.
- **Abilities:**
  - *Flail* and *Punishment*: as the Punisher's.
  - *Domination* (passive): half its damage becomes a stacking bleed that ticks at the start of the victim's turn.
  - *Hook* (main action, once per fight): pulls a unit from the second or third row to the front and stuns it for a round; needs a clear straight line. Drags casters out of safety.
- **Status:** in game as `torturer`.

### Chosen (self-sacrifice)
- **Evolves from / into:** Fanatic → Avatar of Vengeance.
- **Role:** faster, fiery martyr burst.
- **Stats (Claude):** health very high · damage very high (fire) · armor none · initiative high.
- **Abilities:** *Fanaticism* and *Hysteria*, as the Fanatic's; its attacks deal fire damage.
- **Status:** in game as `chosen`.

## Tier 5

### Avatar of Vengeance (self-sacrifice; the faction's capstone)
- **Evolves from:** Chosen.
- **Role:** turns the whole battlefield fanatic.
- **Stats (Claude):** health very high · damage very high (fire) · armor none · initiative high.
- **Abilities:**
  - *Fanaticism Aura* (passive): every unit on the battlefield suffers Fanaticism and Hysteria; nobody can defend.
- **Status:** in game as `avatar_of_vengeance`.
