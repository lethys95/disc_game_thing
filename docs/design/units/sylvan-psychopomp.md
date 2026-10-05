# Sylvan: Psychopomp

> User, 2026-09-25: the Grove's first unit, then only a name and a look. Since 2026-09-29 she is the Spiritess line's tier 3 with Spiritwalk (`faction-stuff/sylvan/support.md`); stats `provisional.md` #59.

**Look (user, canon):** a woman, an elf with pointed ears. Shamanistic, druidism. Psychedelic: life, sprawling with life, confusion. Hypnotic eyes. Multiple different spectral, blurry shapes, barely visible, brush out from her face. Trinkets and baubles in her hair; a rough hairstyle. Greens, roots and vines; purples for pulses.

**Art intent (user):** a completely different message from the Zealot in a similar art style: "it should be clear that these two characters come from the same game."

**Look, refined (user, 2026-09-30):** closer to the original ink portrait than the painted tries. Stronger: **eyes glowing blue, mouth open, a ghastly smoke pouring out.** The ghosts are **full bodies trying to glitch out of her form**, not blobs following her around. In the final version: rapid, glitchy, bluish ghostly spectres skipping out of her frame, like an evasion effect in some games, but blue. As if she's **possessed or haunted**. Wild (the Grove's character, `factions/sylvan.md`). The user (2026-10-05), removing Claude's "not a pretty elf" from her prompt: "She's not intended to be ugly, beauty is just not the point."

**Casting animation reference (user, 2026-09-30):** Baldur's Gate 3's Circle of Spores druid casting: palms down, back bowed backwards in a strange arch, eyes glowing, a beam of (greenish, as the user remembers it) light down to the ground. "Pretty rad." A reference for her cast clip when units get animations, not a copy.

## Concepts in the 3D strategy (2026-10-05)
The user: "psychopomp is not done art wise. It needs more work"; the old ink pick predates the strategy. "I'm probably
going to be fairly picky with her… Give it a whirl for first round, then let's have a look after first round. I'm
curious to see what it produces before you iterate further." Prompts: `scripts/art/concepts.ts` (`PSYCHOPOMPS`);
images: `art/candidates/units/grove/psychopomp/`.
- **Round one** (Claude): three readings, T-pose turnarounds, the Grove's materials, her refined look fixed in each;
  they vary how much of the ghosts and smoke sits on the body, since those are likely effects in the game rather than
  mesh: *possessed* (the look at full strength), *shaman* (the druid first, the ghosts faint after-images), *vessel*
  (a clean body for the model, the ghosts barely there).
- **Round one, read:** the druid herself is consistent and of the Grove in all nine (wild hair braided with roots,
  bones and beads; moss, bark and leather; vines). But nothing reads as possessed: calm faces, mouths closed, pale
  violet-blue eyes that don't glow, no smoke. *Possessed* (the full look) got no ghosts at all; *shaman* got them as
  separate translucent blue figures standing beside her; *vessel* is the cleanest body. Page: `shots/psychopomp.html`.
  Waiting on the user before round two.

## The user's direction for round two (2026-10-05)
"I think we need to remove the beauty stuff from the prompt entirely. Remove the ghosts, we'll add a glitch in effects
instead. Style wise these are all way too boring, and we need to borrow more features from other concepts… I'm
thinking shamaness from the original Disciples 2, psychopomp from Bloodline Champions, as well as some Golgari +
Selesnya sprinkled in there. Add tribal tattoos over her body. Give her a hood which looks like the upper side of a
wolf head with the eyes and lower jaw carved out (that's basically the shamaness headgear). More focus in the bluish
haunted hypnotized estranged eyes and mouth. She's barely here, mentally. Let's have more whites on her clothes,
contrasting further from her skin and the rest of the units, trying to reach that ghostly vibe. Let's give her gloves
with red tipped fingers. The gloves themselves should be ivory white, except those blood like scarlet fingers (like she
put the tips of her fingers in a jar of blood.) Hair wise: let's have cornrow braids. She should be thin."
- **Claude's translation for the prompt:** the features as stated, without naming the games (a named reference pulls
  toward an average of that game; the user's features are specific). Golgari and Selesnya become the palette and feel:
  white, ivory and deep green, with rot and bone. The ghosts and the smoke are gone (effects later).
- **Round two** (`PSYCHOPOMPS_2`, materials `SHAMANESS_3D`): two readings, *shamaness* (the direction as stated) and
  *shamaness-veiled* (plus torn white strips from the sleeves and a necklace of small skulls), seeds 1000–1002.
- **Round two, read:** much closer, and no longer boring: a thin tattooed shamaness in white and ivory with moss, roots
  and a dark sash, under a wolf-head hood with the upper teeth over her brow. The tattoos (green and black, arms, neck,
  face) and the whites came through in all six; the veiled strips read ghostly in silhouette. Misses: the hood is a
  whole wolf head, its own yellow eyes still in, nothing carved out; her eyes are brown and stern with the mouth closed,
  so the absent, hypnotised look didn't come through (the third round in a row where the eyes ignore the prompt); the
  braids are long loose braids, not cornrows; the gloves are ivory but no fingertip is scarlet (no red pixels in any
  sheet); her skin is mid-tan rather than dark. Seed 1000 of both readings draws the side view twice. Guesses for a
  round three, if wanted: describe the hood's eye sockets as "empty holes" with nothing in them; say "her irises are
  pale ice blue" as a plain colour fact; describe cornrows as rows "flat against the scalp"; name the red as "scarlet
  red fingertips on the white gloves" up front, not at the end of the prompt. Waiting on the user.

## The user's direction for round three (2026-10-05)
"I think she looks too much like a human right now. Also her closed off robe makes her look too civilized… Not sure how
to word that though. I think we're closer, but we might actually have too much white now. Also her skin should probably
have that same woodelf type color as in the first ink trial. Pale greenish. Give her face tattoos too in the next one.
Shoes should be some pretty large fluffy things, burrowing a bit from shamaness there. Mouth and eyes still aren't that
ghostly teal though. Should have that glow, though that can probably be added in vfx. Strips are problematic due to 3D
physics, I agree. Add that, modify things a bit, add in your own suggestions here, and try again."
- **Round three** (`PSYCHOPOMPS_3`, materials `SHAMANESS_3_3D`), Claude's choices: the elven features named one by one
  (long ears out through slits in the hood, gaunt narrow face, wide-set large eyes, long neck, long fingers); the hood's
  eyes as "empty cut-out holes with nothing inside them"; cornrows "flat against her scalp"; teal irises as a plain
  colour fact; the gloves and the fur boots named before the clothes; white down to an accent. Three ways of wearing
  clothes that aren't tailored: *wrapped* (knotted ivory cloth, bare shoulders and midriff, a fur mantle), *pelted*
  (mostly furs and hide, a pelt over one shoulder), *overgrown* (hide and cloth bound on by living roots, moss and
  lichen growing on her: a touch of the Golgari rot). Every cloth end short and close to the body (3D cloth).
- **Round three, read:** the biggest step yet. She no longer reads as a human woman in a costume:
  - green-grey skin, long ears out through the hood, a gaunt face with tattoos across brow, cheeks and chin;
  - big shaggy fur boots;
  - open, tied-on clothes with bare midriff and shoulders;
  - white down to scraps.

  Misses:
  - The skin came out a mid green-grey, not pale. With fur everywhere she now risks reading as an orc or a dark-elf
    huntress, and the overall figure is dark. The white may now be too little (the user's "too much white" swung far).
  - The wolf's eyes are still in the hood, and now they glow teal: the colour went to the nearest eyes it found.
  - Her eyes are pale teal-grey with a slight glow, but her face is stern with the mouth closed, not absent and slack.
  - Still loose braids, not cornrows (three rounds).
  - The gloves are the nearest yet: ivory fingers darkening into pointed dark-red tips, a dip but dark blood, not
    scarlet.

  Seed 1000 of each reading draws the side twice. *Wrapped* is the cleanest model; *pelted* the darkest; *overgrown*
  has the Golgari touch in the moss and lichen.
