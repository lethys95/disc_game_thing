# Neutrals: the gnoll tribe

> **Pitch (Claude, 2026-10-04), from the user's ask:** "think of a neutral tribe of gnoll units so we can have more
> available units to fight against in the overworld." Everything here is Claude's: cut, rename or veto. The names are
> suggestions; until you pick, the code would say "Gnoll 1…5".

## The tribe
- **Role in the game:** a second tribe beside the bandits (`design/tribes.md`), guarding camps and dungeons, and
  recruitable from a tribal outpost (`design/nodes.md`). Bandits are a cross-section of people (stun, armor-breaker,
  archer, mage); gnolls should feel different to fight.
- **Theme (Claude):** a scavenger pack. They follow battles and eat the dead, finish off the wounded, and grow
  bolder as things die. Laughter as a weapon. Not evil, not noble: hungry.
- **Why it plays differently:** the bandits test your armor and your front line; the gnolls test **how you take
  losses**. A squad that trades units badly feeds them. Corpses matter in our battles now (the Grove), and gnolls
  compete for them, so they also cut into the Grove's corpse abilities and feed a Mulch Gorger.
- **Biome fit (Claude, for questions #6):** hyenas fit the **desert** (savanna, carrion). It would give the desert its
  tribe without a rule effect. The bandits stay on roads and temperate land.
- **Tiers:** four tier-1 units, as the bandits have, and one tier-2 leader for strong camps only, so strong camps
  differ from weak ones by more than levels.

## Tier 1

### Gnoll 1: "Pack hunter" (suggested)
- **Role:** melee finisher.
- **Intent:** goes for the wounded. Ignoring a hurt unit of yours is a mistake against them.
- **Stats:** health medium · damage low · armor none · initiative medium-high.
- **Abilities:** *Finish the weak* (passive): deals 50% more damage to a target below half its health.
- **Strong against / weak against:** chip-damage fights, healers who fall behind / big health pools that stay
  topped up, armor.

### Gnoll 2: "Carrion eater" (suggested)
- **Role:** melee bruiser that feeds on corpses.
- **Intent:** a front-liner that eats the dead to stay up: a race for the corpses with the Grove, and a tax on
  any side that loses units early.
- **Stats:** health high · damage low · armor very low · initiative low.
- **Abilities:** *Feed* (main action): eats a corpse of either side; heals a large amount and deals more damage for
  the rest of combat. The corpse is used up (no corpse growth, no explosion; it feeds a Mulch Gorger).
- **Strong against / weak against:** long fights with deaths / a clean fight where nothing dies; the Grove's corpse
  users take its food.

### Gnoll 3: "Bone thrower" (suggested)
- **Role:** ranged.
- **Intent:** hits leave wounds that keep bleeding, which sets up the Pack hunter's half-health bonus.
- **Stats:** health low · damage low (ranged) · armor none · initiative high.
- **Abilities:** *Jagged throw* (its attack): part of the hit bleeds over the target's next turns (the existing
  bleed).

### Gnoll 4: "Cackler" (suggested)
- **Role:** support / debuffer.
- **Intent:** the laugh that makes the other side flinch. No damage spell; it weakens.
- **Stats:** health very low · damage very low · armor none · initiative medium.
- **Abilities:** *Cackle* (main action): every enemy deals less damage until the end of the round. *Bolder with
  every death* (passive aura, its squad): when any unit dies, the gnolls gain a little initiative for the rest of
  combat (the pack smells blood).

## Tier 2 (strong camps)

### Gnoll 5: "Matriarch" (suggested; real hyena packs are led by females)
- **Role:** leader and heavy melee.
- **Intent:** the reason a strong camp is scary. Kill her first and the pack falters.
- **Stats:** health very high · damage high · armor low · initiative medium.
- **Abilities:** *Pack leader* (aura): other gnolls deal more damage while she lives; when she dies, they lose
  initiative instead.

## Camps (Claude)
- Weak: Pack hunter, Carrion eater, Bone thrower, Cackler (like the bandits' four).
- Medium: two Pack hunters, Carrion eater, Bone thrower, Cackler, at level 2.
- Strong: Matriarch with two Pack hunters, two Bone throwers and a Cackler, at level 4.
- Which camps are gnolls: by biome if you take the desert idea (#6); otherwise half the camps, by the map's seed.

## Look (Claude's notes, not prompts yet)
Hyena-folk: hunched, long-armed, spotted pelts, scavenged armor and trinkets pulled from other factions' dead (a
Jilliath tabard, a Nexus cable), bone fetishes. Accent: the neutral ember. The style words stay yours
(no-silent-style); a concept probe only when you ask.

## Open questions
- Keep, cut or swap any of the five? Names?
- Desert tribe, or everywhere?
- Can a tribal outpost recruit the Matriarch, or only tier 1?

**Status:** idea (Claude's pitch).
