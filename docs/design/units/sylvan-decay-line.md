# Sylvan: the Sproutling and the Decay line

> The user's design (2026-09-29 and 2026-10-04: `faction-stuff/sylvan/melee.md`). What each unit does is the user's;
> the numbers are Claude's (`provisional.md` #57). **Look concepts are Claude's** (marked) for the user to pick from;
> the Mulch Gorger's look is the user's. The world is dark and gothic, and the Grove is wild, fierce and not noble
> (`factions/sylvan.md`): nothing here should read cute or pretty.

```
Sproutling (1) ─┬─ Regrowth 2 ── Regrowth 3                     (life; placeholder names)
                └─ Moldling (2) ── Deadwood (3) ─┬─ Bog Giant (4)
                                                 └─ Mulch Gorger (4)
```

Shared look (Claude): the Custodian's turnaround recipe (a 3D model sheet, front, side and back, flat light on light
grey) with the Grove's materials (bark, wet moss, rotting wood, fungus) and its accent, a deep moss green glow. The
user (after round one): not humanoid by default, and never symmetrical. Prompts: `scripts/art/concepts.ts` (`GROVE`); images:
`art/candidates/units/grove/` (round one in `round-1/`).

## Sproutling (tier 1, `sproutling`)
- **Play (user):** "some regen": the persistent front. Heals a share of its max HP at the start of its turns.
  Forks at tier 2 into Regrowth (life) or Decay (death).
- **Picked (user, 2026-10-04):** `sproutling-stump-turnaround-1002`, a small treant.
- **Look concepts (Claude):** not a cute sprout: it's the raw material both branches grow from.
  1. *Graft:* a gaunt, feral elf warrior whose ritual scars sprout pale shoots; wounds closed with bark scabs; a carved
     war mask. The regeneration made visible.
  2. *Husk:* a tall, thin wicker-like effigy of briars and dead roots around a hollow, with a carved tribal mask. The
     tribe's thing, not a person.
  3. *Sapling:* a hunched berserker with a young tree rooted in the spine, branches like antlers, roots under the
     skin. The plant is using them as much as they use it.

## Moldling (Decay tier 2, `moldling`)
- **Play (user):** no regeneration; a share of the damage it takes rots in instead and is lost over its next turns.
  Tankier than Regrowth, and it needs a support backline.
- **Look concepts (Claude):** the delayed damage is something soft that soaks the blow and spoils later.
  1. *Bloom:* a broad brute under a thick coat of grey-white and green mold, puffballs on the shoulders, mold filling
     its wounds.
  2. *Litter:* an elf wrapped in damp rotting leaf litter like a ghillie cloak, shelf fungus pauldrons, a bracket
     fungus mask.
  3. *Mycelium:* black rotting wood held together by white mycelium threads like tendons and bandages.

> **Swap (user, 2026-10-04, after round two):** tier 3 is now **Deadwood** and tier 4 the **Bog Giant**, for the look
> (small tree → dead tree → swamp or corpse); each tier kept its kit. The round-one concepts below were made under the
> old names (Bog Giant = tier 3, Deadwood = tier 4).

- **Picked (user, 2026-10-04):** `moldling-mycelium-hunched-turnaround-1000`: "It's good enough, I don't know what
  else to do with it."

## Deadwood (Decay tier 3, `deadwood`)
- **Play (user):** Decay, plus *withering*: an enemy that hits it deals less damage for the rest of combat.
- **Look (user):** "pretty much just an animated dead tree […] the face being strange and ghostly. Nothing about it looks
  humanoid. Both arms are massive stumps", moving "more like a gorilla than a human". **Picked:**
  `deadwood-blasted-turnaround-1002` ("a bit too literal with the gorilla, but we'll just take it anyway. It's good
  enough"). Its half-human face makes it "a decent transition to both bog giant and mulch gorger".
- Round one (under the old tier-4 name): *Blasted*, *Knight*, *Gaunt*.

## Bog Giant (Decay tier 4, `bog_giant`)
- **Play (user):** "the more it suffers, the more it lashes back": *Lash out* (main action) deals the rot inside it
  to the whole enemy front row; the rot stays and its countdown restarts. The melee line's win condition, late game;
  it needs healers behind it. Keeps Decay and Withering.
- **Look (user):** "more a hunk of bark, asymmetric sludge and basically whatever you associate with a swamp", the
  right arm huge; fog later as a VFX. **Picked:** `bog-giant-hulk-turnaround-1002`.
- Round one (under the old tier-3 name): *Peat*, *Idol*, *Troll*.

## Mulch Gorger (Decay tier 4, `mulch_gorger`)
- **Play (user):** "whenever someone dies or a corpse gets interacted with (resurrection, corpse explosion, etc) it
  heals and gains damage for the rest of combat, stacking indefinitely." End of the line.
- **Kit:** Decay, Withering, *Gorge* (heals and hits harder per death or spent corpse, either side, no cap). Claude's
  reading: it keeps the line's Decay and Withering.
- **Look (user):** "a plant skeleton […] the wood and plant matter receding into showing its nature parasitically
  infesting a corpse with bark, vines, moss and other such related plant matter." Likely the only direct skeleton or
  zombie in the faction.
- **Look concepts (Claude, within the user's look):**
  1. *Skeleton:* a human skeleton with bark grown over the bones like a cast, vines threaded through, moss in the
     ribcage, the plant matter receding in places to show bone.
  2. *Mound:* a hulking mass of mulch and roots with the skeleton showing where it slides away: a jaw of root teeth.
  3. *Puppet:* a tall elf skeleton in bark splints, moved by vines like strings.

## First round (2026-10-04, seeds 1000 and 1001; Claude's read, awaiting the user's)
Page: `shots/grove-decay.html`. Claude's picks: Sproutling *sapling*, Moldling *bloom*, Bog Giant *peat*, Mulch Gorger
*mound*; Deadwood has no clear winner (*blasted* is closest, *knight* came out as metal plate, *gaunt* as a
friendly tree spirit). Across the set: the moss-green glow only showed on the Bog Giant's peat; three sheets drew a view
twice or a stray arm (graft 1000, sapling 1000, mycelium 1000, blasted 1000); the Mulch Gorger *skeleton* barely shows
any plant matter.

## The user's direction after round one (2026-10-04)
- **Not everything humanoid.** "I don't think I had in mind that we'd have elves in this line." The skeleton at tier 4
  is "more of a surprise type thing". "I might actually retry everything. But! We did learn."
- **Asymmetry, for this line (the user: "the melee line of sylvans here"; other factions will have plenty of symmetry):** "We shouldn't have them be symmetrical. Symmetry is pleasing. We're not trying to please."
- **Sproutling:** a redo. Less human, "probably closer to a small treant".
- **Moldling:** *mycelium* "is pretty good, but make it skinnier. The face is great, the shrooms are probably too large
  and too symmetrical."
- **Bog Giant:** "more a hunk of bark, asymmetric sludge and basically whatever you associate with a swamp." The right
  arm huge. Fog maybe later as a VFX, not in the 2D image (it won't render well).
- **Deadwood:** "pretty much just an animated dead tree. I imagine the face being strange and ghostly. Nothing about it
  looks humanoid. Both arms are massive stumps", and it would move "more like a gorilla than a human".
- **Mulch Gorger:** a redo; *mound* was closest, "but I was not just looking for leaves and dirt. I'd imagine the mouth
  being open, and the cranium lolling back. The host isn't really there. Bark, fungi, leaves and other plant matter,
  try to be grotesque. Don't make it fat either. Feet are stumps. Think of t4 mulch as a corpse being possessed by the
  worst nature has to offer."
- Round two (`scripts/art/concepts.ts`, `GROVE`; images in `art/candidates/units/grove/`): two readings per unit,
  three seeds, every subject told to be lopsided and uneven; the non-humanoid ones drop the T-pose for a neutral pose
  with the limbs held clear (Deadwood leans on its arm stumps).

## Round two (2026-10-04, seeds 1000–1002; Claude's read, awaiting the user's)
Page: `shots/grove-decay-2.html`. What worked: the Bog Giant *hulk* (the huge right arm came through, lopsided, reeds
and cattails) and the Deadwood *blasted* (half charred, half bleached, a ghostly face in the split, gorilla hunch);
the Moldling kept the user's face and lost the big symmetric shrooms (its two readings converged). What didn't: the
Deadwood's arms end in hands, not stumps; the Sproutling *stump* is the closest to a small treant but still fairly
even, the *sapling* reads tall and dryad-like; the Mulch Gorger missed in both readings (a tidy leaf-wrapped
skeleton in a T-pose: no gaping mouth, no lolling skull, no stump feet). Claude's guess: the T-pose and the
turnaround frame pull toward a clean, upright, even figure; a single front or three-quarter concept first may get the
grotesque pose, then a turnaround from it.

## Round three: the Mulch Gorger (2026-10-04)
**Picked (user):** `mulch-gorger-heap-turnaround-1000`: "is great. We're taking it." (The turnaround, not a single
view.)

The user on round two: "mulch gorger still fails. It looks like a human. Maybe not mention skeleton, maybe just say
skull. It's too humanoid. I really don't need any flesh on this model at all. It's just skull and plant matter. More
asymmetry, less human." Three readings, no "skeleton", no body under the plant matter, no T-pose; plus a single
three-quarter view of each (Claude's test: does the turnaround frame pull toward an upright, even figure?).

Result (Claude's read; page `shots/grove-decay-3.html`): the single three-quarter views are far less human than the
turnarounds of the same prompts, which stand upright like a person again. Best: the *stalk* front (the skull hanging
off a long vine neck), then the *heap* front (the skull sunk into a hunched mass). Tripo takes a single image, so a
front view can go to it as is.

## Open
- Picked: every unit of the Sproutling and Decay line (all `art/candidates/units/grove/`, prompts in `GROVE`). The picks split into single views for Tripo: `shots/tripo/` (index page) (the user tries how
  Tripo handles the more complex shapes).
