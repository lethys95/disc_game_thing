# Neutrals: the gnoll tribe

> **Pitch (Claude, 2026-10-04), from the user's ask:** "think of a neutral tribe of gnoll units so we can have more
> available units to fight against in the overworld." Everything here is Claude's: cut, rename or veto. Names are
> suggestions; until you pick, the code would say "Gnoll 1…5".
>
> **Second try (the user, 2026-10-04):** the first pitch (scavengers that feed on the dead) leaned on the Grove's
> Golgari themes: "consider what else gnolls are about instead of more death." The bag was shuffled; this one keeps
> no corpse or death trigger at all.

## What gnolls are about, besides death
Hyena-folk. What a hyena actually is, and what the old gnoll stories make of it:
- **The chase.** Hyenas are endurance hunters: they don't ambush, they run prey down until it can't run any more.
- **The pack and its rank.** A strict pecking order, led by the matriarch; everyone knows their place, and fights
  over it.
- **The jaws.** A bite that cracks bone: armor and shields don't stop it.
- **The laugh.** The cackle is how the pack talks, and it unnerves everything else.
- **Nomads.** Raiders of the open dry country who follow the herds; their land is marked, not walled.

## The tribe
- **Role:** a second tribe beside the bandits (`design/tribes.md`), guarding camps and dungeons, recruitable from a
  tribal outpost (`design/nodes.md`).
- **How it plays (Claude):** the bandits test your armor and your front line; the gnolls test **your tempo**. They
  pick one target and swarm it, get faster as the fight goes on, slow your units down, and don't let you run. A slow,
  heavy squad that wants a long fight struggles; a fast squad that kills the leader first does well.
- **Biome fit (Claude, for questions #6):** the open desert and dry plains: hunters of the open country. It would give
  the desert its tribe without a rule effect.
- **Tiers:** four tier-1 units, as the bandits have, and a tier-2 Matriarch for strong camps only.

## Tier 1

### Gnoll 1: "Packstalker" (suggested)
- **Role:** melee, the pack's spearhead.
- **Intent:** names the prey. Once it has hit a unit, the whole pack goes for that one.
- **Stats:** health medium · damage low · armor none · initiative high.
- **Abilities:** *Prey* (passive): the unit it hits becomes the pack's prey until the end of the next round: every
  gnoll deals more damage to it.
- **Strong against / weak against:** squads that rely on one big unit / many even, cheap units (marking one barely
  matters).

### Gnoll 2: "Bonecracker" (suggested)
- **Role:** heavy melee.
- **Intent:** the jaws. Cracks armor open for the rest of the pack.
- **Stats:** health high · damage medium · armor low · initiative low.
- **Abilities:** *Crack* (passive): each hit takes some of the target's armor away for the rest of combat (it adds up).
  Different from the Marauder, which hits armored units harder but leaves the armor where it was.
- **Strong against / weak against:** Paladins, Templars, Custodians / unarmored swarms and casters.

### Gnoll 3: "Hamstringer" (suggested; a javelin or bola thrower)
- **Role:** ranged.
- **Intent:** the chase: slows the prey down so the pack catches it.
- **Stats:** health low · damage low (ranged) · armor none · initiative high.
- **Abilities:** *Hamstring* (its attack): the target loses initiative until the end of the next round, so it may
  lose an action.

### Gnoll 4: "Cackler" (suggested)
- **Role:** support.
- **Intent:** the laugh: the pack's voice and the enemy's nerves.
- **Stats:** health very low · damage very low · armor none · initiative medium.
- **Abilities:** ~~*Cackle*: every gnoll gains initiative for the round and every enemy loses some~~ (the user: too
  strong; redone below). *Run them down* (passive): while it lives, enemy units can't retreat.

## Tier 2 (strong camps)

### Gnoll 5: "Matriarch" (suggested; real hyena packs are led by females)
- **Role:** leader, heavy melee.
- **Intent:** rank. The pack fights harder for her, and when she falls the pecking order reshuffles instead of
  collapsing.
- **Stats:** health very high · damage high · armor low · initiative medium.
- **Abilities:** *Pecking order* (aura): the other gnolls deal more damage while she's in the fight. If she leaves it,
  the gnoll with the most health left takes up the aura at half strength: the next in line. *Run them down* as well.

## Camps (Claude)
- Weak: Packstalker, Bonecracker, Hamstringer, Cackler.
- Medium: two Packstalkers, Bonecracker, Hamstringer, Cackler, at level 2.
- Strong: Matriarch, Packstalker, Bonecracker, two Hamstringers, Cackler, at level 4.
- Which camps are gnolls: by biome if you take the desert idea (#6); otherwise some of the camps, by the map's seed.
- **Bigger idea, not part of this pitch:** nomads that roam. Gnoll warbands could wander their territory on the map
  instead of sitting in a camp, a new kind of neutral. Larger work; only if you want it.

## Look (Claude's notes, not prompts yet)
Lean, long-legged runners with sloping backs and heavy shoulders; spotted and striped pelts; sun-bleached hide,
beads and painted clan marks (territory, rank); bronze and rawhide gear, javelins and bolas. Accent: the neutral
ember. The style words stay yours (no-silent-style); a concept probe only when you ask.

## Open questions
- Keep, cut or swap any of the five? Names?
- Desert tribe, or everywhere?
- Roaming gnoll warbands: worth it later?

## The user's answer (2026-10-04)
"I accept the gnolls, though be careful with cackle. Changing initiative is very strong. In fact I think I might have
you try to do something else with cackle."
- **Cackle, redone (Claude, for you to judge):** no initiative. The laugh **goads** one enemy: on its next turn it can
  only attack (no spells, healing, defending or waiting; a unit without an attack is left alone). It takes a healer's
  or caster's turn away from its spells. *Run them down* stays.
- **Hamstring** still slows (−5 initiative, one target, until the end of the next round), kept small for the same
  reason; say if it should do something else too.

**Status:** in game as `packstalker`, `bonecracker`, `hamstringer`, `cackler`, `matriarch`: they guard camps and
dungeons in the desert. Numbers `provisional.md` #63.
