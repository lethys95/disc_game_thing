# Unit design sheet: template

Copy the parts you need; leave out what you don't know yet. This is design **intent**, not a spec: no numbers.
Claude turns intent into provisional numbers in code and tunes them by simulation and playtests.

## How to fill it
- **Stats are relative to other units of the same tier** (across all factions), on one scale:
  *none · very low · low · medium · high · very high*. Say only what matters: "high health, low damage" is enough.
- **Abilities**: what it does and why it exists. Uses as words ("once per fight", "twice", "every turn"), and
  whether it costs the unit's turn ("free action") or is always on ("passive").
- **Look** describes the unit's appearance in your own words. Claude turns it into image prompts.
- Anything written by Claude rather than you is marked **(Claude)**. Change or delete it freely; your word wins.
- **Status** is Claude's line: idea · designed · in game as `unit_id`.

---

# <Faction>: <line> line

## The line
- **Role in the faction:** what this line is for, and how central it is.
- **Ends at tier:**
- **Forks:** at which tier, and what each side stands for (e.g. "tier 2: faith preserves vs faith consumes").
- **Theme:** what the line is about.

## Tier N

### <Name, or a placeholder like "Sylvan mage 1">
- **Evolves from / into:** (and which side of a fork it is)
- **Role:** one line: wall, burst, disabler, healer, swarm…
- **Intent:** what having it in your squad should feel like; why it exists.
- **Stats (for its tier):** health · damage · armor · initiative (· shield, for Nexus)
- **Abilities:**
  - *Name* (passive / free action / main action; uses): what it does, and why.
- **Strong against / weak against:** what it counters, and what counters it.
- **Look:**
- **Open questions:**
- **Status:**
