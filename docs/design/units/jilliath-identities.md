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

### The last round (2026-10-08): Claude's read
All misses, in one pattern: "armor" and "knight" pull every figure to the same plate-armoured knight. The Cleric's
iron bridle was ignored twice (`cleric-cage`), the Immortal's death mask twice (`immortal-bronze`), the Torturer's
spikes (`torturer-spikes`: a cage-visored knight) and the iron Reclaimer's spikes (`reclaimer-iron`: a dark angel); the
Avatar's fire wings came out flat orange shapes (`avatar-fire`). Next try for the spiked ones: without the word
"armor"; or carry the detail in the 3D model.

**All rounds on one page for the user:** `shots/jilliath-concepts.html`. Claude's picks: Shepherd `shepherd-glass`
1000, Godkin `godkin-bare` 1001, Guardian `guardian-glowing` 1000, Paragon `paragon-fire` 1001, Empyreal
`empyreal-blades` 1001, Archon `archon-bands` 1000, Pontiff `pontiff-candles` 1001, Doomsayer `doomsayer-prophet`
1001, Templar `templar-reliquary` 1001; Emissary, Seraph and Acolyte either seed; the Fanatic possibly 1000. No pick
yet: Reclaimer, Cleric, Immortal, Torturer, Avatar.

## The user on rounds one and two (2026-10-08)
- **Picked:** the **Godkin** `godkin-bare` 1001 ("has captured what I intended, yes. It can look better, I'm sure
  though. Much more light effects, godrays etc when in game. Though it doesn't make much sense to make more art of it
  here"); the **Pontiff** ("looks good"; Claude's seed 1001); the **Emissary** ("looks great. I guess there's plenty of
  material to take from there").
- **Seraph:** "looks like a kid. We can't have that."
- **Vengeance t2 and t3:** "you can make t2 and t3 vengenace much much more extreme. They'll be difficult to make
  though." **Paragon:** "paragon's halo can be a flat 2d plane regardless of angle, not unlike how it is in some old art
  of angels, instead of a crown. Have that 2d flat fixed plane be filled. What exactly should be inside it, I don't
  know." **Empyreal:** "looks too much like Paragon, and I have ideas. make the blades HUGE. As in all encompassing
  massive, and have her eyes glow a bright orange, have her skin be cracked and colored like the canvas of ancient
  paintings, her face shaped into a constant intense glare staring directly through you. It's supposed to be utterly
  intense."
- **Reclaimer:** "I don't want a skirt on reclaimer. Give her greaves."
- **Archon:** "the concept is true, but the size of those bands make them look like wet noodles. They need to be
  massive, like he's the centre body of a spider ( don't frame it like that, or you'll actually get a spider I think )."
- **Acolyte:** "extremely boring and it needs work." **Cleric:** "extremely boring." **Fanatic:** "boring."
- **Doomsayer:** "he looks good, but I'd rather have him hold a huge scroll than carry pieces of parchment on his body."
- **Templar:** "Remove the finger bone. It's weird. Give him a kite shield and have that shield have a large silver rose
  on it."
- **Avatar:** "This is fail." **Immortal:** "There is nothing that looks like it's a step up from templar. We can do much
  better." **Torturer:** "We're not there."
- **Shepherd:** "I'd agree the stained glass wings are great on that angel, but the rest is boring and forgetable."
- **Guardian:** "It needs more, I think. Dress is boring."
- **Chosen:** "He should be in abstract painted armor and he should have a sword of heated metal."

### Round three: Claude's read (all on `shots/jilliath-concepts.html`)
- **Lands:** Empyreal `empyreal-glare` 1000 (enormous blades, orange eyes, a stare; no painting-craquelure skin);
  Shepherd `shepherd-window` 1000 (glass robes too); Seraph `seraph-adult` 1000 (an adult now); Templar `templar-rose`
  1000 with `templar-shield-props` 1000 (the silver rose, excellent); Chosen `chosen-painted` 1000 with
  `chosen-sword-props`; Cleric `cleric-weeping` 1000 (the gilded weeping mask: not generic at last); Doomsayer
  `doomsayer-plain` 1001 with `doomsayer-scroll-props`; Archon `archon-massive` 1000 (heavier bands to the ground).
- **Halfway:** Paragon `paragon-icon-gold` (the flat gold icon disc lands; blood and fury don't); Guardian
  `guardian-silver` (silver filigree; still restrained); Acolyte `acolyte-branded` (blindfold and lantern; no brand);
  Immortal `immortal-kintsugi` (crest, halo, cape: a step up; no gold seams); Fanatic `fanatic-nails` (the crown of
  nails); Avatar `avatar-flamehead` 1001 (a burning head, charred wings).
- **Still missing:** Torturer (a knight for the third round), Reclaimer (a knight with a skirt), Cleric `cleric-sewn`.
  Krea keeps reaching for plate knights; next tries describe the body first.

## The user on round three (2026-10-08)
- **Picked:** the **Acolyte** `acolyte-branded` ("We can take acolyte as he is now I think"; seed 1001, Claude's); the
  **Doomsayer** `doomsayer-plain-turnaround-1001` ("Doomsayer is fine. 1001 and I'll let you pick the scroll": Claude
  picks `doomsayer-scroll-props-1000`); the **Templar** `templar-rose-turnaround-1001` and `templar-shield-props-1001`;
  the **Immortal** `immortal-kintsugi-turnaround-1000` ("he looks awesome. idon't know what weapon to use with him
  though").
- **Shepherd:** "Give t4 support a face." **Seraph:** "better, but bland. idk if we can do something about it. Make her
  clothes blue or something."
- **Empyreal:** "better. But idk if it works. Clips with wings right now. Lets give her three pairs of wings too." Later:
  "I actually think we need to rethink Empyreal in a way. like, I don't really know what sense it makes to have a giant
  metal halo thing of blades, and then not use blades. It's the visual design that has to change. I think I need better
  ideas. I like the idea of oil canvas skin, glare. Red wings work. but overall just needs more work I think."
- **Paragon:** "Boring. Even more boring than before. Also the halo might be more of an effect. I basically would want
  it to be flat from the side too. We're breaking the dimensions again, which makes it hard to sculpt. Which means we
  can skip it, but it means that she needs character in a different way still."
- **Guardian:** "still bored honestly. I don't really know how we should get 'more', ideas?"
- **Reclaimer:** "actually getting close to the platinum angel at ivory-greaves, and given how much it struggles with the
  iron maiden, I'd reckon we should try more on platinum angel. Her helmet should be more part of the suit. You
  basically need to think exoskeleton armor/shell instead of a full plated armor set. No skirt, rather tight fitting.
  Wings should probably be metal colored too. Bladed feathers maybe, idk."
- **Archon:** "wings just look like thicker wet noodles now. The rest of him looks great though. Idk maybe we can give
  him some other effect that indicates ascension then, instead of wings and weird tentacle things."
- **Cleric:** "no. We need to go back to the drawing board with cleric, it's not working."
- **Chosen:** "extremely boring." **Fanatic:** "better but not good. I think we need to drag him back to the drawing
  board." **Avatar:** "I'm dragging avatar of vengeance back too. I need to read the prompts of these very closely I
  think. Same with torturer. I need to look at the prompt, something makes it go into knight and it's not where i want
  to go."

### Round four: Claude's read
- **Shepherd** `shepherd-window-face` (either seed): a calm pale face and long silver hair on the all-glass figure.
- **Seraph** `seraph-blue` 1000: faded deep blue, adult, hooded, part of the face showing.
- **Reclaimer** `reclaimer-shell-gold` 1001: the closest to the user's exoskeleton yet: a smooth head-shell joined to
  the body, tight shell legs, metal wings with bladed feathers. A cloth panel still hangs front or back;
  `reclaimer-shell` (ivory) grew a whole skirt again.

## The user on round four (2026-10-08)
- **Shepherd:** "face of stained glass." **Seraph:** "seraph's cloak looks like clay. Why is that?" (Claude: flat,
  shadowless light on a cloth with no texture named renders as smooth matte; round five names coarse woven wool.)
- **Reclaimer:** "Closer, but like... Why skirt and high heels? So annoying." The user's reference is MTG's Platinum
  Angel card art: an inhuman, slender figure, a body of segmented pale platinum plates, a small head-shell fused to the
  body with no face, small gold diamond inlays, legs with no feet tapering into scaled points, huge stone-grey wings
  going dark teal at the tips. (Claude: "woman" and the angels' linen-and-silk materials line dressed her; round five
  drops both and gives her a materials line of her own. The reference is described in words, not fed to the model.)

### Round five: Claude's read
- **Reclaimer** `reclaimer-platinum` 1001 (and `-blades` 1001): the user's reference, in words, lands: an inhuman
  slender segmented shell, no skirt or heels, a fused head-shell with a gold diamond, legs tapering to teal points; the
  chest diamonds didn't come. Her own materials line and "inhuman" over "woman" did it.
- **Shepherd** `shepherd-glassface` 1001: a calm face divided into panes by black lead.
- **Seraph** `seraph-wool` 1000: woven wool with weight and fraying; no more clay.

### Round six, a bulkier Reclaimer (the user: "make the reclaimer bulkier"): Claude's read
`reclaimer-platinum-heavy` 1002 (pick), 1000 next: thicker plates layered over chest, shoulders and thighs, a broader
frame, still inhuman and clothless; 1002 grew a second, lower pair of wings. Heels creep back in some side views
(heavy 1001, heavy-blades 1000); heavy-blades 1001 shows a face under the shell.
- **Picked (the user):** `reclaimer-platinum-heavy-turnaround-1000`: "I think reclaimer-platinum-heavy-turnaround-1000
  is probably the best one."

## The user, after round six (2026-10-08)
- **Shepherd, picked:** "With shepherd I'm going to go back and choose the original shepherd-glass-turnaround-1001. I
  think iteration just gets worse with shepherd."
- **The Seraph, not the Acolyte:** "Acolyte is just too boring. idk what to do with it", then: "I meant I don't know
  what to do with seraph rather. It's just so boring". The Acolyte stays picked; the Seraph is open.
- **The Seraph (the user, 2026-10-08):** "No, why would you bound wings. She's not captured, she's just humble. Make
  her hooded. Hide her face, give her robes. She'll be praying in her posture in game. Robes are black and white
  cloth/silk. Wings are brown and plain. Try that. I'm sure we can make her seem humble and less boring."
- **Seraph, the user's look: Claude's read.** `seraph-silk-white` 1002 (pick), then `seraph-silk` 1002: hooded, the
  face lost in shadow, layered black and white robes, plain brown wings. White over black, draped across the body,
  reads softer and humbler; black over white is starker, and its hands came out black. Seeds 1000 of both draw the side
  view twice.
- **Seraph, picked (the user):** `seraph-silk-turnaround-1002`: "I think I'll say seraph-silk-turnaround-1002 works.
  The posture will do a lot for us too in practice I think. Either way the character is now both interesting and
  humble, and we can move on."

## The user's directions for the open units (2026-10-09)
Quoted whole (the user, after `shots/jilliath-remaining.html`). "Keep the gothic stuff on all of these."
- **Guardian:** "Skin like cracked porcelain, streaks of light pouring out from cracks. Ancient pure clean abstract
  alien chestplate from a forgotten age. [trying to shuffle the box a bit I suppose]"
- **Paragon:** "Blazingly red hair covering right side of face. Fairly free flowing light armor. Emblem of flaming palm
  on right pauldron. Book on a chain at left waist. Hands and forearms end in runic tattoos, fingertips pale gradient
  into pale blue. Calm facial expression."
- **Empyreal** and **Archon:** "Try yours" (Claude's: the icon painting come alive; the Archon's ascension without
  wings, `shots/jilliath-remaining.html`).
- **Cleric:** "I'll come back to you after having looked at some Orzhov material from mtg. I might pull back pontiff
  too after that to make them match more."
- **Chosen:** "I don't think this prompt works. Lets try something like inhuman male shaped juggernaught completely
  covered in form-fitting shell-like armor brutish champion massive heated metal zweihander, red and white cape."
- **Torturer:** "No, your idea is just not how I'm imagining it. You're driving him down the same route as what fanatic
  was before. Try this - Metal skin, hellrazor, iron-maiden mask of anguish, cold grey metal plated inhuman grotesque
  metal husk riddled with cone-like spikes, evil gauntlets of hanging chains, not showing skin anywhere, disastrous,
  torturer."
- **Avatar:** "Three layers of illusory layered wings ending in flames, white-red angelic hooded armor glowing rims and
  edges covered in abstract symbols, gauntlets and boots gradient into heated metal."
- **Fanatic:** deferred again.
- "Next time we look at these, you'll give me the full unsimplified prompt of each, please."

### Silhouettes of the picked concepts (2026-10-09, Claude; `shots/jilliath-silhouettes.png`)
The front views as flat black shapes. In the T-pose every figure shares the spread arms, so what separates them is the
head and shoulder line: the Punisher's pointed hood, the Pontiff's candle crown, the Immortal's halo, the Doomsayer's
yoke, the Acolyte's lantern, the Godkin's bare body, the Reclaimer's thin legs. The Seraph and the Shepherd share an
outline (hooded head, folded wings, long gown); the Templar and the Zealot are close. The user: "I don't think these
models will be as small as you think they will", so detail inside the outline will carry too.

### The user's directions, round eight: Claude's read (`shots/jilliath-open.html`, full prompts shown)
- **Paragon** `paragon-runes` 1001: lands: red hair over the right side, calm face, runic forearms, a book on a chain,
  the burning-hand emblem, light armour, blood-tipped wings.
- **Empyreal** `empyreal-icon` 1001: the gold disc, orange eyes, three pairs of red wings, painted robes; but the
  "cracked oil paint darkened under varnish" came out as charcoal-dark skin with no visible cracks, so she may read as
  a dark-skinned figure, not a painting. The plain version is weaker.
- **Archon** `archon-floating` 1000: the hem fading into light works, subtly; the crack and the ring were ignored.
- **Chosen** `chosen-juggernaut`: bulky shell plates and the cape; still a helmeted knight. `chosen-zweihander-props`
  1000: excellent.
- **Torturer** `torturer-husk`: chains and spikes, but a knight's helm and plate; "metal plated" still pulls to a knight.
- **Avatar** `avatar-illusory` 1001: hooded white-red armour, translucent layered wings; no flames, no heated gauntlets.
- **Guardian** `guardian-porcelain`: missed: no porcelain cracks, the old breastplate.

## The user on round eight (2026-10-09)
"I think paragon 1001 is good enough in the latest batch. Chosen is very close and torturer is getting closer.
Guardian, avatar still need help. Archon is probably also close, though I might be sort of worried that he really won't
seem much like a step up from whatever pontiff is going to look like, but we'll see. I'm also worried that archon in his
current form here doesn't actually fit into our gothic universe all that much." **Picked:** the Paragon,
`paragon-runes-turnaround-1001`.

### Round nine: Claude's read (`shots/jilliath-round9.html`)
Each prompt led with what round eight dropped. **Chosen** `chosen-faceless` 1000: faceless at last, a smooth head fused to
a massive shell body, the cape: the inhuman juggernaut. **Torturer** `torturer-anguish` 1002: an iron face for a mask
(grim, not screaming), spikes, chains; still plate below. **Avatar** `avatar-flames` 1000: red-hot gauntlets, red-tinged
translucent wings; no flames at the tips. **Guardian** `guardian-cracks`: hairline cracks on face and chestplate, a more
abstract chestplate, but no light from the cracks (Krea draws the crack, not the glow; the glow can be an emissive
texture in 3D).

## The user on round nine (2026-10-09)
- **Chosen:** "looking too much like a superhero now. I think in part the cloak makes it worse, so we should probably
  remove it. He's also too broad."
- **Torturer:** "1002 is closer, I'd agree. But I'd say something is still definitely missing."
- **Avatar:** "illusory wings isn't really landing. I meant something like this but red" (MTG's Illusory Angel card
  art, linked) "Also I can still see his face for some reason. Idk he's just looking very generic. As he looks now,
  he'd pass as a t2 angel in support line on the same tier as paragon, and he has no particular link to the t4 step
  before him, which is chosen. Like, he looks inherently weaker. So we can't use this."
- **Guardian:** "not following the rules we're trying to set at all. We need to take apart the prompt and remove the
  things that drags it in the wrong directions or something."
- **Empyreal** (round eight): "misses the skin effect we wanted entirely. I'd say the golden back halo plate thing works
  pretty well in this case. Red wings work as well, though i'd like the third pair. Robes are very very generic and we
  need to think about how we turn it more interesting."
