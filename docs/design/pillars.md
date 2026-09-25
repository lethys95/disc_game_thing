# Design pillars

> Provenance: written by an AI from a design sparring session with the user (C# attempt, 2026-07-27, "captures all settled design directions from the sparring session"). The decisions are the user's; specific wording and numbers may be AI elaboration. Flag anything that looks invented.

Settled decisions that make DISC more than a Disciples II clone (inspirations: Disciples II, Warlords 3, a bit of HoMM3). These came from the user across earlier attempts. Change them only with the user.

## Faction cores (user, 2026-09-25)
| Faction | Core | Mana color (2024 notes) |
|---|---|---|
| Jilliath, Inquisition | sacrifice | red — "Scarlet Crusade-esque" |
| Ral-Vitahl, Nexus | expedience and burst | teal — lightning, "Izzet basically" |
| Sylvan, Grove | ramp | green |
| Vexumphat, Wastes | death and numbers | yellow — "ancient egypt theme, animated armor, ethereals" |

Capitals are unnamed. (Names from the C# attempt, like "Burning Faith" and "Nexus Prime", were AI inventions and are rejected.)

## No RNG
No hit chance, crits, damage rolls, or morale. Outcomes are deterministic. Depth comes from richer units instead: multiple mechanics, activated abilities. A healer can still attack (poorly). A tank can still use abilities. Units are not single-trick.

## Leader elevation
Leaders are not unique unit types. Any unit can be elevated to leader at any time, irreversibly. Elevation grants squad command, overworld movement, equipment slots, and leader upgrades — **no combat stat boost**. A tier-3 Paladin leader fights exactly like a tier-3 Paladin.
- No leader cap. Spreading thin is self-punishing: concentrated squads win.
- Leaders evolve through the same tiers as regular units.
- Vexumphat is the exception: spread out, more leaders, weaker squads.

## Capitol Guardian
A unique unit type (not a leader, not a regular unit) that cannot leave the Capitol. The chess king: powerful but immobile. Guardian defeated = game over. It is the primary loss condition and the anti-rush mechanism. Strong but killable (no D2 90%-armor monstrosity).

## Graveyard & resurrection
Dead units and leaders go to a faction graveyard instead of being lost. Resurrect at the Capitol for gold:
- Immediate resurrection is expensive; the cost decays each turn you wait.
- Cost scales with investment (tier, equipment, upgrades).
- Ankh: consumable item; if its holder dies, resurrection is free or heavily discounted.
- Losing the Capitol = losing the game.

## Armor & shields
D2's percentage reduction was cheesy at high values. Instead:
- **Armor**: flat subtraction from each hit, floored at 1. Strong vs weak attacks (swarm counter), irrelevant vs big hits. "20 armor, 25 damage, 5 gets through."
- **Shields**: separate pool that absorbs hits and regenerates. Not reduction. When down, full damage hits health.
- Nexus automatons use shields, not armor. Vexumphat may use shields broadly (TBD).

## Faction healer identities
| Faction | Healing | Flavor |
|---|---|---|
| Jilliath | most healing, with side effects | martyrdom, self-sacrifice, ultimatums |
| Ral-Vitahl | none — shield rechargers | can't save non-automatons |
| Sylvan | heal over time | restoration, slower pace |
| Vexumphat | shields + life drain + overheal | low baseline health, disposable horde |

## Unit evolution
Units evolve through tiers at XP thresholds, cheaper than D2 (whose last tiers were practically unreachable):
- Tiers 2–3 common; tier 4 needs focused investment; tier 5 rare (long games, heavy investment).

**Branch investment**: where an evolution line forks, the *faction* permanently commits to one branch by spending gold in the tech tree. No refund, no rechoice. You cannot field both Paladins and Zealots. Open: public information? does it affect already-evolved units?

## Cities & nodes
- Ordinary cities: linear upgrade levels (D2 style), gold only. Upgrades raise fortification capacity, stationed-unit armor and regeneration. No buildings, population, city HP, or training queues.
- Capitol: its own progression (dwellings, base upgrades) and the guardian.
- Map nodes (gold, mana, blacksmith, …) belong to a nearby city, Warlords 3 style: control the city → control its nodes. Nodes replace D2's mana crystals / banner carriers.
- A city has a leaderless fortification squad and optionally a visiting (leader's) squad.

## Overworld
- Hex grid, 3D, rotatable camera.
- 50–80 hexes. Smaller and denser than HoMM3; games shouldn't sprawl.
- Procedural and handcrafted maps, eventually both.
- No faction limits: any faction × any number of players. Only campaigns restrict.
- Combat starts when a leader moves into a hex with an enemy leader.
- Fog of war: unexplored hidden; explored-not-visible shows last-known state.

## Spells
Overworld spells, cast on the map (HoMM3-ish), paid in typed mana. Not combat abilities. Targets: ally, enemy, empty tile, area.

## Not porting from D2
Morale · rod arc system · thief class (RNG; may return as leader upgrade paths) · corruption/purification · Capitol invincibility · faction player limits · hidden timers ("surprise, you were on a clock").
