# Jilliath: unit identities (the look in words)

Step one of the art (`roster.md`): a look per unit before any concept. Claude drafted them on
`shots/jilliath-identities.html` (2026-10-08); the user's answers are below, quoted. The user: "(might change, we're
still theorycrafting)".

**All angels are female, except the Avatar of Vengeance** (the user, 2026-10-08). The support line is angels; the
Avatar is the vengeance angel at the top of the melee line. Support units carry no swords (the user: "They're support
units").

## The angels (support line)
- **Seraph** (t1), maybe. The user's look: "hooded, closed off, praying". On Claude's wings-as-a-shroud: "I think it'll
  be a bit weird to look at if she's just a bundle of feathers. I understand the idea, but in practice it might just
  be a bit weird on a battlefield, I feel." So: hooded and praying, wings at her back.
- **Emissary** (t2), maybe: "We don't need to hide the face of every angel. But this is intended to be closer to the
  stereotypical angel, likely with some free flowy robes."
- **Guardian** (t3), Claude's (shield-wings) cut: "It's too literaly. We're creating support units. I'm going to say her
  wings are a very brightly lit neon white and she has a twohanded staff of the same color. We might take inspiration
  in Avacyn, which means a strong contrast of black robes, white skin, neon white wings glowing, white staff, white
  sily smooth perfect hair."
- **Shepherd** (t4), keep: wings of stained glass in lead frames (the user's), a shepherd's crook, a face that is itself
  a pane of stained glass (Claude's).
- **Godkin** (t5), keep: the user's bare silhouette of moving sky with god rays (`faction-stuff/jilliath/support.md`).
- **Paragon** (t2, vengeance), maybe: "We're not doing sword on these units. They're support units. You can make the
  halo one of flames." So: her face shown, white wings with blood-red tips, a halo of flames.
- **Empyreal** (t3a), keep: a halo turned into a ring of upward blades; wings red from the tips halfway up; robes over a
  breastplate.
- **Reclaimer** (t3b), Claude's (plucked wings) cut: "I don't like the idea of plucked wings. I think I might say, that
  we'll borrow heavily from platinum angel, in that it's full tight-fit ivory shell-like armor with fully covered
  helmet. Alternatively, lets try to see what krea would do with an iron maiden angel. Maybe that'd be interesting."

## The priests (mage line, faith)
- **Acolyte** (t1), keep: a young novice in a plain grey robe, head shaved, hands bound in strips of red cloth.
- **Cleric** (t2), maybe: "I'm afraid of this becoming generic." (Claude's: a black cassock, a white porcelain mask
  over the mouth, an iron-clasped book on a chain.)
- **Pontiff** (t3), maybe: "It's a bit weak." (Claude's: red and white vestments under a towering iron mitre.)
- **Archon** (t4), maybe, the user's own: "we'll borrow from diablo with the wings. That means weird thick neon white
  bands that are slowly moving up and down in like wave form. There should be maybe 4 or 5 of these bands on each side.
  Make the character completely covered in a black hooded cowl with the same neon lining. You should not see the face.
  If you do, it's just white and no character in there."

## The fire casters (mage line, fanaticism)
- **Doomsayer** (t2), maybe: "This might be very weak. We can try it out just because I don't have many ideas right
  now." (Claude's: a street prophet, ash-white face, burnt proclamations nailed through the robe, a yoke with bells.)
- **Fire mage 3, Fire mage 4, Martyr mage 4**: "we need a name first."

## The melee line
- **Templar** (t3), keep: the Paladin made heavier, a glass reliquary in the breastplate with a finger bone inside.
- **Immortal** (t4), maybe: "Lets try. I fear it might get boring." (Claude's: armour riveted from many broken suits,
  a bronze death mask of its own face as the visor.)
- **Torturer** (t4), Claude's cut: "I think we'll do something iron maiden full metal degeneracy here."
- **Fanatic** (t3), maybe: "We don't need to bring the zealot's mask with us." (Claude's: whip scars, prayer scraps
  nailed into the skin.)
- **Chosen** (t4), Claude's cut: "with red heated metal blade. I think this character might need more or it'll be
  boring."
- **Avatar of Vengeance** (t5, male, the vengeance angel), maybe: "Forget the mask. nothing after zealot needs it. It's
  just zealot." (Claude's: wings of fire tearing out of a human back.)

## Round one of concepts (2026-10-08)
`scripts/art/concepts.ts`: `ANGELS`, `PRIESTS`, `MELEE`; folders `art/candidates/units/jilliath/{angels,priests,melee}`.
Claude's second tries for the two the user found generic or weak: the **Cleric** in an iron scold's bridle (sworn to
silence; castigation is chastising), the **Pontiff** under a crown of burning candles, wax running over a black veil.
The Seraph's prayer is a pose, so her hood carries it (concepts are T-posed models, not scenes). Not yet: the fire
casters (names first), the Chosen (the user: "might need more").

### Angels, round one: Claude's read
- **Shepherd** (`shepherd-glass` 1000, 1001): the stained-glass wings in lead came out strong, red, gold and blue, with a
  blank pale glass oval for a face. The pick of the round.
- **Guardian** (`guardian-glowing`): the user's reading lands: black high-collared robe, white skin and hair, bright
  white wings (bright rather than glowing; the glow can go to the 3D material).
- **Emissary** (`emissary-robed`): the classic angel in flowing white and gold, face shown. As asked.
- **Seraph** (`seraph-hooded`): humble, hooded, grey linen, wings behind. Plain, as a tier 1 may be.
- **Empyreal** (`empyreal-blades` 1001): the halo of blades reads as a spiked sunburst; red-dipped wings, red robes.
- **Godkin** (`godkin-sky` 1001): the sky inside a silhouette works and is strange, but the silhouette is a long dress;
  1000 grew dark wings it wasn't asked for; with wings, the wings stayed feathers instead of sky.
- **Paragon** (`paragon-flame`): the halo came out a thorn crown, not fire; otherwise close to the Empyreal.
- **Reclaimer**: the ivory armour came out a generic knight in a visored helm; the iron maiden came out a dark angel
  with no casket at all. Round two retries both, the Godkin as a bare body, and the Paragon with real fire in white.

### Priests and melee, round one: Claude's read
- **Archon** (`archon-bands` 1000, 1001): the user's look lands: a black cowl lined in glowing white, a dark empty hood,
  wings of four or five thick glowing bands curving in a wave. Strong.
- **Pontiff** (`pontiff-candles` 1001; 1000 draws the side view twice): the crown of burning candles over a black veil,
  red and white vestments, censers. Not weak any more.
- **Acolyte** (`acolyte-bound`): shaved, grey robe, red-bound forearms. As drafted, plain as a tier 1.
- **Doomsayer** (`doomsayer-prophet` 1001): the yoke hung with bells and the nailed scrolls read well; the ash-white
  face didn't come.
- **Cleric** (`cleric-bridle`): the bridle was ignored: a generic priest in a stole, the user's fear exactly. Round two
  leads with the cage.
- **Templar** (`templar-reliquary`): the glass reliquary with a finger bone in the breastplate reads; otherwise a
  crusader knight, as the line is.
- **Fanatic** (`fanatic-scarred`): shaved, bare-chested, chains on the arms; the scars and prayer scraps are faint.
- **Immortal** (`immortal-deathmask`): no death mask, generic knights. **Torturer** (`torturer-maiden`): spiked and
  hooded, no iron maiden. **Avatar** (`avatar-wings`): a dark-winged armoured man, no fire. All three retried.
- **Iron maiden, as the user means it (2026-10-08):** "I don't want a casket for the reclaimer or the torturer. It's the
  metal and the spikes, not the shell." Angels round two's `reclaimer-casket` was already running: off-direction.

### Angels, round two: Claude's read
- **Godkin** (`godkin-bare` 1001): the bare silhouette filled with a daylit sky and shafts of sun is the user's
  description; 1000 grew tufts of dark feathers.
- **Paragon** (`paragon-fire` 1000, 1001): a ring of real fire over her head now, white robe, red-dipped wings; told
  apart from the Empyreal by colour (white against red) and halo (fire against blades).
- **Reclaimer** (`reclaimer-porcelain`): still a visored knight's helm on plate armour, not seamless ivory; Krea
  draws "armor" as knights. `reclaimer-casket` ran before the user's correction and is off-direction.
