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

## The user's direction for round four (2026-10-05)
"I noticed that you're not using the prompt that includes the gothic fantasy style and it shows. It doesn't fit in
style wise with the rest of the game right now. Anyway, gloves are too large. They should be for only the hands, think
short fingerless gloves, but where the fingerlessness is just red soaked. Tattoos are much better. Let's continue from
wrapped, I agree. The wolf having eyes isn't a problem as long as the eyes it has aren't regular wolf eyes. They either
need to be dark gouged out pits, or completely wide blue as if possessed. Maybe less bone on the model, more bangles,
leather wraps. I think she's too skinny here too, so maybe try removing that one too. See what happens, then come back
to me."
- The miss behind the style: rounds two and three wrote their own materials line and dropped half the shared gothic
  recipe ("ornate, desaturated colors with dark accents, grim") for a palette sentence. Round four uses the recipe word
  for word with her materials, as the other groups do (lesson in the `unit-concepts` skill).
- **Round four** (`PSYCHOPOMPS_4`): *wrapped* with the user's changes; two readings for the hood's eyes, *pits* and
  *possessed-wolf*. Every thin word gone. Claude's: paler skin, ivory lining on the fur mantle, the slack face said as
  relaxed brows and parted lips.
- **Round four, read:** closer to the game's look: more desaturated and grim, the same family as the gnolls.
  - Came through:
    - paler sage-green skin, near the ink trial;
    - short fingerless ivory gloves, hand only;
    - leather wraps and stacks of bronze bangles on the forearms, and less bone;
    - her eyes pale, nearly white-teal under heavy lids, the most absent yet (mouth still closed).
  - Missed:
    - both hood readings ignored the hood clause (ordinary yellow or green wolf eyes in all six), so on the same seeds the two readings
      are near-duplicates (checked at the user's ask: different files and prompts, but about 1% of pixels differ,
      the same stray forearm in both);
    - the fingers are bare green with dark nails, no red at all (the desaturated recipe plus the red sitting late in
      the prompt);
    - the body is still slender, only a little fuller.
  - Seed 1000 of both readings draws a stray forearm floating by the side view.
  - Guesses for a round five: give the hood's eyes a sentence of their own near the start; put the blood-red fingers
    in the first sentence about her.

## Round five: a last shot at the vibe (2026-10-05)
The user: "I think I'm tempted to call Pits: psychopomp-pits-turnaround-1001 the final one here, however, I think I want
to see a last shot at getting closer to the gothic/fantasy vibe we're trying to reach. I'm just afraid of this
character here not fitting in with the other units in the faction. Maybe adding 'pretty, but beauty isn't the point'
back? Maybe something like 'not anime'? Idk."
- Claude's read of the gap, beside the Grove's picks and the Matriarch: those are dark, filthy, weathered and dense
  with detail; she is clean, smooth and tidy (neat fur tufts, spotless skin), closer to a stylised game character.
- **Round five** (`PSYCHOPOMPS_5`): the pick's prompt held fixed plus one change, so each reading's seed 1001 shows the
  change on the pick: *pits-pretty* (the user's words: "Pretty, but beauty is not the point. Not anime."),
  *pits-grim* (Claude's: grime, mud-stained cloth, matted wet fur, the Grove's wet moss and roots growing on her, the
  same gothic recipe with those materials), *pits-grim-pretty* (both).
- **Round five, read:** none of the three changes moved her much.
  - Against the same seed of the pick, 1–3% of pixels differ on seed 1001 and up to 7% on seed 1000.
  - *Pretty* changed nothing visible.
  - *Grim* gave a slightly darker belt and a little staining on the cloth, but no mud, moss or matted fur.
  - The look is held by the long subject: words added at the end weigh little.
  - The cleanness comes from the subject, not the frame (the Grove's bark creatures are grimy in the same frame).
  - Options for the user: take pits 1001 and put the grime into the 3D model's textures and the portrait (made from
    the concept, painted in the game's style); or one more round with the grime and the faction's materials at the
    very start of her description.
  - Seeds 1000 again draw stray or doubled side views.

## Why round two turned cartoonish (checked against the manifests, 2026-10-05; the user asked)
- The same model, the same turnaround frame and the gothic line in every round.
- The gothic line: rounds two and three had cut it short ("ornate, desaturated colors with dark accents, grim" gone).
  From round four it is the Bog Giant's word for word, apart from the materials and "not cute".
- The change from round one to two is the subject. Round one's was short and moody: possessed, ghastly smoke, rough
  wild hair, roots and vines. From round two on it is a long outfit list: exact garments, colours, gloves, boots,
  bangles.
- Prompt lengths:

  | Prompt | Words in total | The gothic line starts at word |
  |---|---|---|
  | Bog Giant | 249 | 162 |
  | Round one | 230 | 142 |
  | Round two | 315 | 232 |
  | Round three | 424 | 334 |
  | Round four | 434 | 366 |

  Round five showed that words at the end weigh little, so the style line is drowned by the outfit.
- The outfit list reads as a game-hero design sheet. Some of its words are stylised cues in themselves: "large eyes
  set wide apart", "large shaggy boots, wide and bulky", green skin with big ears.
- The Bog Giant's subject is itself grim material (sludge, peat, rot), so its subject and style agree. Hers don't.
- A test that would settle it: pits 1001's features with the style line first and the subject cut to essentials
  (same seed).
