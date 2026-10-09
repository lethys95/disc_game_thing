---
name: unit-concepts
description: Make 2D concept art for a disc unit (or a line, a tribe) in the 3D concept strategy that worked for the Custodian, the Grove's Decay line, the gnolls and the Drawn - T-pose turnaround sheets for the 3D model (models, not scenes), weapons as separate prop sheets, iterated in rounds Claude reviews itself, every image kept, the user picks. Use whenever a unit needs concept art, a redo of old art, or a portrait/icon source.
---

# Unit concepts, the way that works (user, 2026-10-05: "I think it works well")

The order for every unit is **identity → concept → portrait** (`docs/design/units/roster.md` tracks it): a look in
words, then a picked 2D concept, then the card and icon made from it. Only art made this way counts; anything older
than the Custodian's 3D concepts is a stand-in to redo (the user, 2026-10-05).

## 1. Identity first, in words
- Collect everything the user said about the unit's look (its sheet in `docs/lethys-wrote-this-for-handover/faction-stuff/`,
  `docs/design/units/`, the faction doc). Quote it; it's held fixed in every prompt.
- If there's no look, don't invent one silently: draft one marked (Claude) for the user, or ask. Tribes Claude was
  invited to make are Claude's to describe.
- Read the body plan from the user's words. Don't default to a humanoid or an elf. Asymmetry is the Sylvan melee line's
  rule only (memory: creature-art-asymmetric). Cute is fine when it fits.

## 2. Prompts in `scripts/art/concepts.ts`, one group per line or tribe
- Each group: a materials line in the gothic recipe **word for word** ("Dark gothic fantasy, rich, brooding and ornate,
  desaturated colors with dark accents, grim, weathered and worn physically based materials: <the unit's materials>.
  Serious, adult, not cartoonish."), only the materials swapped; a home-made line drifts out of the game's style
  (the Psychopomp's rounds two and three, the user: "it doesn't fit in style wise"). Examples: `GROVE_3D`,
  `GNOLL_3D`, `DRAWN_3D`. Then a record of subjects (`{ subject, stance, pose? }`), and jobs:
  - **Turnaround** (`turnaround(subject, materials, pose)`, 2048×832): front, side and back of a 3D model asset, flat
    shadowless light, light grey background. The model and rig reference. T-pose for humanoids; `CLEAR_POSE` (or a
    pose of its own, like Deadwood's gorilla lean) for bodies that aren't human.
  - **No stance or action views** (the user, 2026-10-05: "We're creating models, not scenes. If we want one in a
    frenzied stance, we'll likely put them in one later. Right now we just want the t-pose. The figure we're putting in
    the t-pose must fit the design spec"). The design itself (face, armour, body, materials) carries the unit's
    identity and attitude, not a pose. (The gnolls and the Drawn had stance views; that's past practice.) Fallback when
    the turnaround frame keeps failing the design (the Mulch Gorger): a single front view, still in the model's pose.
  - **Weapons are separate models** (decision 2026-10-04): no weapon on the figure ("hands empty and open"), and the
    weapon gets a prop sheet of its own (`-props`, 2048×832).
- **Two or three readings per unit**, each a different body or silhouette around the user's fixed words. In a group,
  give every unit **one standout feature** so they're told apart at a glance (the gnolls: a skull helm, the jaw, nomad
  wraps, jester's rags, the matriarch's mantle). Clothing is a good separator.
- Add the group to `GROUPS` with its folder `art/candidates/units/<faction>/<unit or line>/`; manifests merge per folder.
- Mark Claude's details in comments; quote the user's.

## 3. Generate in rounds (the `krea-images` skill)
- A background subagent runs the exact command (no `model` override; it never edits prompts).
- Two or three seeds. **Krea-2 Turbo varies by prompt, not by seed**: seeds of one prompt come out nearly alike, so a
  new round changes the *wording*, not the seed.

## 4. Review every image yourself, then iterate
- Compose sheets (`magick montage … -tile 3x`, `magick … -append`) into the scratchpad and look at all of them.
- Write a short read per round in the unit's or line's design doc: what worked, what didn't, and the guess why.
- Next round: change the wording where it missed; keep what worked. Keep going until each unit has a candidate you'd
  defend, or say plainly what the model won't do.
- **Every image is kept**, the misses too (the user wants to see the whole path).

### What we've learned (keep adding)
- **Interesting before correct (the user, 2026-10-05):** "on each iteration, you shouldn't just think about whether or
  not it works, you need to think about whether or not it's interesting and easy to differentiate […] If you just make
  Soothsayer into a woman with a crystal ball, then she's just… a very boring lady with a crystal ball." Disciples'
  characters are easy to tell apart, and ours can be too. The literal reading of a role (a blindfolded gunman, a
  fortune teller with a ball) is the boring baseline: give each unit a twist the role doesn't predict (the user's own
  for Omen: a ragged trenchcoat with a pentagram on its back). The trap caught the Punisher's first round. Judge every
  round on three questions: does it match the design, is it interesting, is it unmistakable next to the rest of the
  roster in silhouette and colour.
- **Name the identity, not the inventory.** The Punisher's first round described three designs in full (a cage-helm,
  glowing seams, a bell helm, padlocks, books) and got three bland knights; the user: "very very bland". Round two
  named only what makes him him (a faceless pointed executioner's hood, a cassock, iron grey) and let the model
  design the rest: "he's terrifying". One line alone is too little in the turnaround frame (a hooded rogue with a
  face); a sentence of the identity's two or three defining features is the sweet spot. Old art the user liked is the
  best source for those features.
- **Keep the subject short (about 100–150 words), in the faction's material words, not an outfit list.** The
  Psychopomp drifted from the game's look over rounds two to five as her subject grew to ~280 words of garments,
  colours and accessories: it read as a stylised game-hero sheet and buried the gothic line (the user: "staying
  consistent style wise is pretty essential"). Cut to ~120 grim words, the same features came back dark, ornate and
  worn; moving the gothic line first changed little. Size cues ("large eyes set wide apart", "wide and bulky") push
  toward cartoon proportions. Each round's fixes go *into* a short description, not onto the end of a long one.
- The turnaround frame pulls figures upright, even and human; single views escape it (the Mulch Gorger). For a body
  that must stay strange, a single view can go to Tripo alone.
- A phrase meant as a mood can become the subject: "faces veiled, turned away" put hooded mourners on every card; "an
  object with no limbs" gave gothic women in dresses.
- **No similes for shapes or surfaces**: the model takes the named thing literally ("a doll's face" grew a nose and a
  mouth; "blank as an egg" erased the Zealot's eye holes; the user called it beforehand). Say the thing itself.
- Some words summon whole genres: "tabard" brought a crusader's red cross back twice, even with "no cross" in the
  prompt. Drop the word, not just add a negation.
- **Stay inside the faction's visual language.** Fixing one trait can carry a unit out of its faction: pushing the
  Zealot away from the Paladin ("not a knight") wrapped him in bandages, which read as the Wastes' mummies; the user
  picked round one's crusader-ish zealot instead ("still supposed to be an inquisition faction […] the antithesis to the
  paladin"). Check each round against the faction, not only the trait.
- An early round can be the pick: keep every round in view when the user chooses.
- When two wordings each get half right, join their working halves (the Zealot: one wording's eye holes, the other's
  small hand).
- Turnarounds sometimes draw a view twice or a stray limb: say so when picking; split views skip duplicates.
- "No text" isn't reliable: numerals creep in.
- Some ideas the model won't draw (wings covered in real eyes, after three tries): carry the idea by colour and
  silhouette instead, and say so.
- Two readings that differ by one clause the model ignores come out as near-duplicates on the same seed (the
  Psychopomp's *pits* and *possessed-wolf*: about 1% of pixels differ, the same stray limb in both). To test a single
  detail, give each reading its own seeds; readings meant to differ should differ in more than one clause.
- A colour said of one part can land on its neighbour: the Psychopomp's "ghostly teal" eyes went to the eyes of her
  wolf hood too (which also kept them, despite "empty cut-out holes"). Some details resist for rounds on end (her
  cornrows, her absent look): after three tries, say so and offer to carry them in the 3D model or the effects.
- Symbolic or world art (tarot, UI) shouldn't feature our units (memory: mystery-over-cameos).
- **The materials line dresses the figure** (Jilliath, 2026-10-08): a shared line naming "steel" and "lacquer" turned
  every melee unit into the same plate knight, whatever the subject said (the Torturer three rounds running); one naming
  "linen and black silk" put skirts, and "woman" put high heels, on an angel the user wanted as an inhuman shell. When a
  unit must not be what its group usually is, give it a materials line of its own, and say "inhuman figure" over
  "woman" for a body that isn't human.
- **Name the cloth's texture** (the Seraph, 2026-10-08): under the turnaround's flat shadowless light, "linen" with no
  texture named renders as smooth matte clay. Say the weave, the folds and the fraying ("coarse woven wool, the weave
  visible, heavy soft folds, frayed hems").
- **Say what covers a figure, never only what doesn't** (Jilliath, 2026-10-09): "no robes, no cloth" with "skin between
  them" gave a gilded corset over near-nudity, and "short black robes" on a woman a miniskirt and heels. Name the
  covering itself (a skin of mosaic tiles, a long coat, full-length plates).
- **What leads the subject wins** (the Chosen, rounds nine to eleven): his faceless head came only in the round whose
  description opened with it; opening with "massive and heavy" brought the visored knight back. Put the feature the
  model keeps dropping first.
- **Words, not someone else's art:** a reference from another game (the user's Platinum Angel) is described in words
  (its shapes, materials, colours, what it lacks); the image itself never goes into the model.

## 5. Show the user
- A page in `shots/<unit-or-line>.html` (served over Tailscale at `http://<host>:5173/shots/…`): JPEG-compressed images
  embedded, turnarounds, then props; Claude's read above each concept; every round,
  rejects included.
- The user picks. Record each pick (file id, the user's words) in the unit's doc and the roster. Keep the picked
  prompt in code **byte-identical** (check it against the manifest's prompt for that file); remove unpicked readings
  from code when tidying (their prompts live on in the manifests and git).

## 6. After a pick
- **For Tripo:** split the picked turnaround into single views (1024×1024 on its own grey) with
  `uv run scripts/art/split-turnaround.py <sheet.png> shots/tripo <unit>` (views named front, side, back, then
  view-4 for a duplicate; check the result, since a sheet can draw the same view twice), and add them to
  `shots/tripo/index.html`.
- **Repairs by inpainting** (a flaw in a pick, like views that disagree: the Psychopomp's ears stuck out at the front
  only): add a fix to `FIXES` in `scripts/art/fixes.ts` (the source, a mask, edits to the pick's own prompt, the seed,
  two or three strengths) and run `pnpm exec tsx scripts/art/fixes.ts <fix id>` through the `krea-images` subagent.
  Outside the mask every pixel stays the pick's. Masks live in the unit's folder under `masks/`; build one from colour
  or shape inside a box (numpy/scipy, a few pixels wider), and overlay it in red to check before running. Then split
  the repaired sheet like a pick.
- **Portrait and icon:** come from the concept, never from text alone, so the card, the icon and the 3D model are the
  same creature: `scripts/art/portraits.ts` (add the unit to `UNITS`: its split front view, a one-sentence identity,
  what it holds, where its face sits in the bust). Image-to-image: the card at 0.75–0.9 re-poses the T-pose by
  itself, the bust (a head-and-shoulders crop) at 0.45–0.75 keeps it. `--install <card> <bust>` puts the card, the
  bust and an icon cut from the bust (zoomed on the face) into `assets/art/{portrait,bust,icon}/`. One unit at a
  time; look at each in a battle shot.
