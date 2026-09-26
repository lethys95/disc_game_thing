# Design pillars

> Provenance: written by an AI from a design sparring session with the user (C# attempt, 2026-07-27). The user read the summary on 2026-09-25 ("sounds correct"). Treat as canon; details can still be questioned.

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

## Leadership and the leader tree (user, 2026-09-25)
- A warband starts at **5 units including the leader** (D2 started with leader + 3). Capacity comes from the leader's **Leadership** stat, which grows.
- Leaders gain experience and level like other units, and each level also gives **points in a leader tree** (D3-style); Leadership is one of its stats.
- Eventually, **which skills the tree offers depends on which unit was elevated** to leader.

## The Capitol screen (user, 2026-09-25)
A HoMM-style view inside your castle for the research/evolution trees and "various stuff you can do and build". Its content is still to be designed with the user.

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

## Neutrals, dungeons and map structures (user, 2026-09-25)
- The map has **neutral groups**. **Neutral cities are guarded** by a neutral garrison. **Dungeons are guarded** by neutral groups.
- Dungeon rewards follow the user's 2024 Unreal design (`legacy/disc/Script/Map/Dungeon.as`): one-time loot of **treasure items, gold, a creature that joins you, or a leader that joins you**; looted once.
- Neutral unit designs don't exist yet. Until they do, placeholders are plainly labelled and marked for replacement (pending user OK, questions.md).

## Spells
Overworld spells, cast on the map (HoMM3-ish), paid in typed mana. Not combat abilities. Targets: ally, enemy, empty tile, area.

## Not porting from D2
Morale · rod arc system · thief class (RNG; may return as leader upgrade paths) · corruption/purification · Capitol invincibility · faction player limits · hidden timers ("surprise, you were on a clock").

## Leader tree v1 (user, 2026-09-25)
One shared tree to begin with ("we can explore the other stuff later"; per-unit trees are possible eventually). Keep it simple:
- **Extra overworld movement.**
- **+10% health.**
- **+1 Leadership** = +1 unit in the squad. Max Leadership 9 (the full 3x3 grid, leader included).
- **"Leader heals the squad a little each turn"** (Claude decides passive or action).
- At the end of the tree: a **leadership aura**, e.g. the squad deals +5% damage.
Games aren't expected to last long enough to fill the whole tree.

## A fallen leader stays the leader (user, 2026-09-25)
- "The leader should still be the dead unit. In D2, if your leader dies, you have to go back and ress." No other unit takes over: that would break per-unit leader trees and invite abuse (let the leader die on purpose).
- Implemented: the leader's corpse stays in its squad at 0 HP, isn't fielded, gives no leader bonuses and earns no XP; the warband can still march home, where the leader is revived for gold (priced like a resurrection). A wiped-out warband is gone, as in D2.
- Open (user unsure): a separate line of experience earned *while being a leader*, and whether leader abilities should come from XP alone (questions.md #33).

## Doctrines are per tree, not per faction (user, 2026-09-25)
The dichotomies are **thematic**, not a faction-wide lock. D2's elves are roughly wild vs nobility, but you can go wild in one tree and noble in another. "Just because I as a Jilliath player go faith in melee, doesn't mean I want faith in support." Each line's fork is chosen independently; the faction's dichotomy flavors the pairs. (This matches the canon branch-investment page: commitments are per divergence point and "do not affect independent evolution lines".)

## Evolution is never gated by resources (user, 2026-09-25)
- D2's worst part: you couldn't go from tier 1 to tier 2 without paying an obscene amount, so you froze, waited for gold and stopped fighting neutrals: "the game encouraging you NOT to play". Shared resources for units and upgrades are fine (WC3, HoMM3); gating the *level-up itself* is not.
- **Branch choice is free.** Choose each line's branch in the Capitol for free. If a unit reaches a fork before you've chosen, you choose at that moment, with a warning that it locks that branch for all similar units.
- **Shrines (later):** map sites that unlock *hidden* evolution routes you otherwise couldn't get, as an alternative to the baseline. Never a gate on the baseline, which would be "screwed by rng".

## Unit-type upgrades: what gold buys (user, 2026-09-25)
- In the Capitol you buy upgrades for a unit type, e.g. Congregants +5 attack. **Not retroactive**: units you already have don't get it; new ones do. That rewards early action.
- The upgrade **stays with the unit through evolution** (an upgraded Congregant keeps its +5 as a Paladin).
- Upgrades can target what makes a unit unique, not just stats: "punish stacks one more time", "all new technicians get a stun grenade".
- **Timing rule (user, 2026-09-25):** an upgrade for type T reaches a unit when it *becomes* a T after the purchase: recruited as T, evolved into T, or acquired as T another way (merc camps, recruiting neutrals in rare situations as D2 allowed; both later). A unit that became a Punisher before you bought the Punisher upgrade doesn't get it. A Congregant recruited *before* the Punisher upgrade still gets it if it evolves into a Punisher *after*. Each step up the ladder offers upgrades for the next rank.
- **Track record (user, 2026-09-25):** a unit shows what makes it differ from baseline and *where each difference came from*: upgrades, stat changes, and e.g. abilities from where it was recruited ("a Sacred Cathedral … gives all units recruited there … 'holy water', once per battle heals a unit by 20"; an example of the idea, not a designed building).
- Balance of upgrades (risk/reward) is tuned after more playtesting.

## The Capitol screen and the economy (user, 2026-09-25)
The Capitol screen holds units, upgrades (unlocking evolutions), spells (a spell tree later), and the rest. The user questions D2's model: city upgrades are "insanely expensive", they lock you in place and push you back, and losing units is expensive too. Unit evolution stays, but should unlocks cost gold at all? What else is gold for? Being sparred on (see decisions.md once settled).

## Levels past the end of a line (user, 2026-09-26; D2's rule)
You can't max out on XP. A unit with no further evolution (the end of its line, or a unit without a line, like a neutral) keeps leveling **without changing tier**: each level gives minor stat bonuses, smaller than a tier upgrade, and the XP needed for the next level **stays fixed**. So lower-tier units level more often (smaller requirement), while higher-tier units gain more from each level.

## Cities (user, 2026-09-26, after the playtest)
Captured cities should do a lot more:
1. Open a city pane and control the city's defenses (its garrison).
2. Recruit new units there. Numbers are limited by the city's tier; neutral units garrisoned in a city aren't bound by that limit.
3. Upgrade the city (tiers): more garrison slots, and a small armor bonus for the garrison and the visiting squad.
4. Drag and drop units between the garrison and the visiting squad.
5. If researched in the Capitol, resurrect units at cities, at a slight premium.
6. Possibly invest in the nodes around cities.
7. It should be clear visually which nodes belong to which city.
8. Nodes are tied to the closest city (Capitols count as cities). In Warlords 3 cities can be destroyed, so nodes converge on the remaining city and pool their recruitment benefits there, at the cost of the strategic advantage of more cities. Destructible cities: not sold, to spar on.

The Capitol gets the same layout: **tabs**: *City* (the garrison and visiting grids, recruiting) and *Research* (the trees); later *Spells*. **Recruiting** happens by clicking a tile in the grid and picking the unit from a drop-down, instead of the list on today's Capitol screen.

## Warbands meeting (user, 2026-09-26)
Two of your warbands directly next to each other anywhere on the map can trade units, through the same drag-and-drop grids as the garrison.
