# Punisher: concepts in the 3D strategy

> Jilliath melee, tier 3 (punishment branch): control, a flail that hits the whole enemy front row and leaves
> Punishment (`faction-stuff/jilliath/melee.md`). Weapon (canon): a multi-headed flanged flail. The old portraits
> (`anchors/punisher-1000/1001`, hooded executioners) predate the strategy; the user liked both.
> Prompts: `scripts/art/concepts.ts` (`PUNISHERS`, `PUNISHER_FLAILS`); images: `art/candidates/units/jilliath/punisher/`.

## Direction (the user, 2026-10-05)
"In Disciples, the transition between units aren't always that obvious. We don't need to think about the zealot all
that much. We should rather think about how to make punisher distinct, memorable and readable. I can imagine less
white colors, more towards metal. What else rings punisher without going too much into torturer? I think the latter
will be heavily inspired by iron maidens."

## Claude's take, accepted ("sounds good")
- Punishment is public and judicial (the sentence carried out before everyone, by the faith's law); torture is
  private and drawn out. The Punisher draws on the town square, the Torturer on the dungeon.
- Body: tarnished, riveted, blackened iron plate; red as the accent; almost no white. Heavy, upright, deliberate: a
  bailiff of the faith, not a madman.
- Left to the Torturer: spikes inside things, cages around bodies, hooks in flesh.
- **Round one:** three readings with one standout feature each, under 90 words each, the gothic recipe word for word:
  *bridle* (a scold's bridle cage-helm, padlocks, manacles), *brand* (red-hot glowing seams, bare branded forearms,
  open helm), *bell* (a bell-shaped closed helm with one eye slit, shackles, a chained book). The flail as two prop
  sheets: cold iron and red-hot heads.
- **Round one, read:**
  - All nine came out as the same stocky knight in ornate engraved plate, with a mail skirt and a red sash. It's
    metal and has no white, but it's knightly: it risks reading as a Paladin. "Riveted iron plate" summons a knight.
  - *Bell* is the one that works, in all three: the bell helm with one eye slit is an odd, readable silhouette.
    Shackles with broken chains hang from both wrists, and the book is chained at his hip.
  - *Bridle* gave ordinary visored helms (no cage, no mouth plate). *Brand* gave a red hood, but no glow and no bare
    branded arms.
  - The flail: three chains on an iron-banded haft, drawn twice mirrored. The heads came out as spiked balls, not
    flanged. The hot version has no glow.
  - Bell 1000 draws a stray forearm by the side view.
  - Next, if wanted: the bell as the base, and a body that isn't a knight's (heavy plate pieces over leather, mail and
    a gambeson, a bailiff's coat); describe flanged heads as ridged blades round a core, not spikes.

## Round two (2026-10-05)
The user: "sorry to say, but they're all very very bland. Can you look at the original punisher drawings?" There are
no ink Punishers; the originals are the first batch's two painted ones (`anchors/punisher-1000/1001`,
`shots/punisher-originals.html`). Claude's read of 1001: a faceless hood (only black inside); cloth, not armour (a
long stained cassock with blood red, a stiff pitted hooded mantle), the iron only accents; the flail over the shoulder
makes the silhouette. Its subject was one line ("an executioner of a militant faith carrying a heavy multi-headed
flanged flail, standing in a neutral pose") and the model designed the rest: round one told it exactly what to draw,
and it drew exactly that, blandly. The user: "try. Still need gothic fantasy, we can never drop that."
- **Round two** (`PUNISHERS_2`): *executioner* (the original's line alone), *hood* (its features in ~40 words),
  *iron* (the same in dark iron-grey cloth and more iron, the user's "less white, more metal"); the gothic recipe word
  for word with the original's materials. The flail again with flanged heads described as blades round a core.
- **Round two, read:**
  - *Hood* and *iron* work: the tall pointed executioner's hood with only black inside, faceless in all six. It's a
    strong, unmistakable silhouette.
  - Both have a long dark cassock under a hooded mantle, clawed iron gauntlets and a chain belt. *Hood* has a pale
    stained apron down the front, or pale shoulders. *Iron* is all dark iron-grey: the most metal and the darkest.
  - The blood red came through in none of them.
  - *Executioner* (the one line alone) gave an ornate hooded rogue with his face showing: in the turnaround frame the
    one line isn't enough.
  - The flail heads are still spiked balls, not flanged.
  - Worth weighing: the tall pointed hood (a capirote) is the Spanish Inquisition's, fitting the faction, but it also
    calls up the Klan; in black, and on a figure this dark, the second reading is weaker.

## Picked (2026-10-05)
The user: "I'd say iron 1000. I didn't really intend for the completely straight cone hood, but it works. It certainly
is terrifying… Dark Souls also have hoods like these… I'd totally go with iron 1000. He's terrifying."
**Concept: `punisher-iron-turnaround-1000`** (round two). In code as `PUNISHER_SUBJECT` / `PUNISHER_3D`,
byte-identical to the manifest; the other readings were removed from code (manifest and git keep them). Split for
Tripo: `shots/tripo/punisher-{front,side,back}.png`. **The flail is not picked:** the heads keep coming out as spiked
balls, not the canon's flanged heads (`PUNISHER_FLAIL`, still in code).
