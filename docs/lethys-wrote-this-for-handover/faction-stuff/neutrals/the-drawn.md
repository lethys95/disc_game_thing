# Neutrals: the Drawn

> **Claude's own tribe (2026-10-04).** The user: "What if I told you to just generate your own idea for a neutral
> tribe, create skills and concept art? And you don't have to wait for approval with concept art, you can check
> yourself and give it multiple tries, just don't delete the tries you didn't enjoy… Try to be creative with it."
> Everything below is Claude's: names, abilities, numbers, look. Cut, rename or veto any of it. In game as units and
> abilities (`?fight=drawn`), **not placed on the map** until you say where they belong.

## The idea
Moth-folk, drawn to light and to magic. They come out of the dark toward whatever burns brightest: a lantern, a
healer's glow, a mage's spell. Gothic by nature: dusty wings with staring eyespots, pale fur, candle wax, old lace
and smoked glass.

**How they fight, in one line: they go for your light.** They fly over your front line to reach the back, drink the
blessings and shields off your units, hold them still with the eyes on their wings, and the ones you leave alone
hatch into something worse. Against them, a squad that leans on its healers, shields and casters suffers; a plain,
heavy front line that hits hard does fine.

What's new for the game (each as data, no engine names):
- **Flight:** a melee attack that reaches any row (Flit). The first melee unit that hunts back lines.
- **A cleanse that works against you:** Drink the light strips what a unit's own side gave it.
- **A sleep that breaks:** Mesmerize skips a turn unless the target is hurt first, so focusing fire has a cost.
- **A transformation mid-fight:** the Chrysalis does nothing but endure, then splits open.

## Tier 1

### Dustwing
- **Role:** flying skirmisher, back-line hunter.
- **Stats:** health low · damage medium · armor none · initiative high.
- **Abilities:** *Flit* (its attack): flies over the front line and strikes any enemy. *Dust* (passive): the enemy
  whose hit kills it is dusted, and that enemy's next hit lands as nothing.
- **Strong against / weak against:** casters and healers in the back / anything that kills it cheaply (it's frail),
  ranged units that pick it off.

### Chrysalis
- **Role:** a wall that becomes a threat.
- **Stats:** health high · damage medium (once emerged) · armor low · initiative low.
- **Abilities:** *Metamorphosis* (passive): it can't attack while it pupates; at the start of its third turn it
  emerges, back to full health, +12 damage, and it flies (Flit).
- **The choice it gives you:** burn it down before it hatches (it's tanky), or ignore it and face a fresh flier at
  full health.

### Lightdrinker
- **Role:** support that unmakes the other side's support.
- **Stats:** health low · damage low · armor none · initiative medium.
- **Abilities:** *Drink the light* (main action, ranged): an enemy loses every effect its own side gave it (heals over
  time, blessings, lent shields) and its shield; the Lightdrinker heals 10 per effect and half the shield. *Shoot*.
- **Strong against / weak against:** the Grove's heals over time, Nexus shields, Jilliath blessings / squads with
  none of that.

### Eyespot
- **Role:** disabler.
- **Stats:** health low · damage low · armor none · initiative medium.
- **Abilities:** *Mesmerize* (main action, ranged, twice per fight): an enemy loses its next turn, unless it's hurt
  first. *Shoot*.
- **Counterplay:** hit the mesmerized unit yourself to wake it (an area spell does it for free), or leave it and
  fight without it.

## Tier 2 (strong camps)

### Pale Mother
- **Role:** the brood's centre. A big pale moth with her wings full of eyes.
- **Stats:** health high · damage medium · armor low · initiative medium.
- **Abilities:** *Dust veil* (aura): her side has +5 armor (doesn't stack). *Open the eyes* (main action, once per
  fight): the whole enemy front row is mesmerized. *Flit*.

## Camps (Claude)
- Weak: Dustwing, Chrysalis, Eyespot, Lightdrinker. Medium: two Dustwings, Chrysalis, Eyespot, Lightdrinker, at
  level 2. Strong: Pale Mother, Chrysalis, Dustwing, two Eyespots, Lightdrinker, at level 4.
- Where: nowhere yet. Ideas: a night or haunted biome; dungeons (dark places, lights inside); or near mana nodes,
  since they're drawn to magic.

## Look (Claude)
Moth-folk standing upright: large dusty wings with staring eyespots, pale fur on the thorax, feathered antennae,
large dark compound eyes, thin clawed limbs; clothing scraps of old lace, velvet and wax-stiffened cloth; smoked glass,
tarnished silver, candle wax. Each unit has its own silhouette: the Dustwing small and all wings; the Chrysalis a
cocoon of silk, wax and wrapped cloth with something moving inside; the Lightdrinker gaunt with a long coiled
proboscis; the Eyespot with huge wings spread like a fan of eyes; the Pale Mother large and veiled, wings folded like a
cloak. Concepts: `scripts/art/concepts.ts` (`DRAWN`), `art/candidates/units/neutrals/drawn/`. The user (2026-10-04): keep every image, the rejected ones too ("I'd like to see what you made afterwards, even what you decided not to go with"); the code and prompts change freely. The final page shows every round.

**Status:** in game as `dustwing`, `chrysalis`, `lightdrinker`, `eyespot`, `pale_mother` (`?fight=drawn`); numbers
`provisional.md` #64. `scripts/balance/tribes.ts`: against the 14 setup formations they win 0% weak, 11% medium, 43%
strong (bandits and gnolls 0 / 0 / 36%); head to head they lose to bandits at weak and medium and win at strong. The
AI uses everything (across the formations: 20 Mesmerize, 8 Open the eyes, 10 Drink the light; Chrysalises emerged 14
times).

## Concept log (Claude's art direction; every image kept in `art/candidates/units/neutrals/drawn/`)
- **Round one** (`<unit>-stance|turnaround-1000…1002`): one shared moth body for all five. The tribe reads as one
  people, and the **Pale Mother** (veiled, ivory, a crown of lit candles) is a keeper. But the rest are one creature in
  different clothes: the same fluffy round head and button eyes (cute, which the world isn't), the same grey eyespot
  wings; the Dustwing and the Eyespot are near twins; the Eyespot's spots are just moth spots; the Chrysalis is a moth
  bound in cord with its wings out, not a cocoon; the Lightdrinker's proboscis never shows. The Chrysalis turnarounds
  1000 and 1002 drew a separate cocoon next to the figure, which hints at what it should be.
- **Round two** (`dustwing-ragged`, `chrysalis-cocoon`, `lightdrinker-deathshead`, `eyespot-eyes`): a different moth
  and body for each (a ragged clothes moth; a cocoon with nothing outside but a split; a death's-head hawkmoth with the
  skull on its thorax and a long proboscis; wings covered in real-looking eyes), and gaunt insect faces for all.
- **Round two, read:** the **Lightdrinker** as a death's-head hawkmoth is the best of the tribe so far (black fur, a
  skull face, banded body, vials; still no long proboscis, and it doesn't need one). The **Dustwing** improved a lot:
  six thin clawed limbs, holed and tattered wings, gaunt; its six-armed turnaround is properly creepy. The
  **Chrysalis** single views are finally a true cocoon (a scaled silk shroud bound in wire, almost a sarcophagus), but
  its turnarounds grew a cloaked figure with wings again. The **Eyespot** failed again: plain moth spots, grey wings
  like the Pale Mother's.
- **Round three** (`eyespot-fan`, `eyespot-blind`, `chrysalis-object`): the Eyespot with four wine-red wings in a
  peacock's fan set with human eyes, or with an eyeless head and bloodshot eyes on its wings; the Chrysalis turnaround
  as an object with no limbs.
- **Round three, read:** the wine-red **fan Eyespot** works as a silhouette (a veiled widow in a black coat before four
  dark wings); the eyes never became real eyes in three tries, so the colour and the veil carry it. The eyeless
  Eyespot turned into a pretty elf in its turnarounds. The Chrysalis "object" turnaround came out as gothic women in
  feathered dresses, one beside a cocoon: turnarounds won't keep it a thing.
- **Picks (Claude's):** Dustwing `dustwing-ragged-turnaround-1001` (stance 1000); Chrysalis
  `chrysalis-cocoon-stance-1002`, a single view for 3D; Lightdrinker `lightdrinker-deathshead-turnaround-1001`
  (stance 1000); Eyespot `eyespot-fan-turnaround-1000` (stance 1001); Pale Mother `pale-mother-turnaround-1002`
  (stance 1000). Page with every round: `shots/drawn.html`.

## The user on the concepts (2026-10-05)
"Not everything has to be grotesque. The cuteness here is fine." (Claude had called round one's fluffy moths too cute;
that was Claude's call, and it's overruled.) "The models did generally come out fine. I might veto some of it. Death's
head works well, and the wings of each look very intricate. I think it's interesting that moths would essentially
steal the light away from the enemy, maybe blinding them? Either way, it gives us some wiggle room to play around with
lighting."
