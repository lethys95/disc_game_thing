# Carnival and Etherborn: concepts in the 3D strategy

> The user (2026-10-05, going to sleep): "You can try out the three units… if you could self iterate. The main thing
> I'd worry about from your angle is how to not make this boring. It's been a trap a couple of times, especially when
> we tried out the punisher. Disciples characters were very easy to differentiate, and ours can be too… We need to be
> creative. So on each iteration, you shouldn't just think about whether or not it works, you need to think about
> whether or not it's interesting and easy to differentiate. The three characters can have plenty of soul and
> contrast. But they're also very easy to make boring." Prompts: `scripts/art/concepts.ts` (`OMENS`, `SOOTHSAYERS`,
> `ETHERBORNS`); images: `art/candidates/units/neutrals/carnival/<unit>/`, `art/candidates/units/nexus/etherborn/`.

## The user's looks
- **Omen** (carnival, tier 2, ranged): "twin flintlocks, blinded by bands over his eyes" (earlier). Now: "Omen can't
  just be a dude with a blindfold on and two revolvers. He'll like wear a ragged trenchcoat, hell throw a pentagram on
  the back of it. Inject character."
- **Soothsayer** (carnival, tier 2, ranged): "that one ball hovering in one of her hands, a hand of cards in the other.
  Robes, veil around mouth, loose robes." And: "If you just make Soothsayer into a woman with a crystal ball, then
  she's just… a very boring lady with a crystal ball."
- **Etherborn** (Nexus, tier 3 mage): "Blue skin, like stars underneath the skin, noble robes, no facial features, no
  eyes, no mouth. Hands surrounded by purple/pink arcane energy. Female shaped." Now: "Etherborn's skin should read as
  galaxies, and we'll likely end up doing some vfx stuff there too." The Nexus (`factions/ral-vitahl.md`): a haughty
  noble house of inventors, arcane high society, "definitely not worn, weathered and repaired".

## Claude's twists (round one), each held to the user's words
- **Omen, a blind prophet-gunslinger of a swindlers' carnival.** The trenchcoat and pentagram are fixed. Three heads:
  - *barker*: a battered top hat with tarot cards tucked in its band;
  - *preacher*: a wide flat-brimmed hat and a stole of strung bones;
  - *hanged*: bare-headed, a frayed noose still around his neck.

  His blindfold has a pair of eyes painted on it, staring.
- **Soothsayer: the ball is a glass orb with a single living eye floating inside it.** Her veil is a curtain of
  hanging coins. Three bodies:
  - *tent*: robes cut from faded striped carnival tent canvas;
  - *crone*: ancient and hunched, wild white hair braided with charms;
  - *stilts*: an unnaturally tall figure on hidden stilts, her robes falling to the ground.
- **Etherborn: an arcane noble whose body is a window into deep space.** Three crowns:
  - *orrery*: brass armillary rings orbiting her blank head;
  - *collar*: a tall, stiff fan of a collar in gold and black behind her head;
  - *veil*: a sheer veil over the featureless face, with a tall headdress.
- **Materials:** the gothic recipe word for word, with each unit's materials. For the Nexus, "weathered and worn" is
  "immaculate", by the user's own Nexus canon.
- **Props:** the Omen's flintlocks and the Soothsayer's orb and cards are prop sheets. The figures' hands are empty.

## Round one, read (Claude)
- **Omen:** the trenchcoat and the red pentagram on its back came through in all nine. The coats are striped grey
  canvas, ragged at the hem, with bandoliers and holsters. *Barker*'s top hat is the strongest silhouette.
  - Missed: the eyes painted on the blindfold and the gold-toothed grin. Every face is a plain, stern man under a red
    band.
  - **Is it interesting? Not yet.** He reads as a generic gunslinger in a duster, and a grey one at that: the trap the
    user warned about. Next: the face has to carry it, and the coat needs colour.
- **Soothsayer:** the coin veil works in all nine and is a strong mark. *Tent*'s red and mustard striped canvas is
  unmistakably carnival and the most distinctive. *Crone*'s wild white hair is good. *Stilts* didn't come out taller,
  just a pointed hood. The orb prop works: an eye floating in smoky glass on a brass stand. The props sheet also
  invented a striped canvas ball and a gloved hand holding the cards.
  - **Is it interesting? Halfway.** Tent and crone together could be. Next: join them, and give the robe a motif of
    its own.
- **Etherborn:** coherent and noble: violet and black, gold filigree, the featureless starry head, magenta fire in her
  hands. *Collar* has the strongest silhouette, *orrery* the most original idea.
  - Missed: the galaxies are mostly on the robes. Her skin barely shows (head and hands only), so the user's "skin
    should read as galaxies" isn't there.
  - Next: bare arms, shoulders and collarbones, the robes plain black silk.
- **Props:** the flintlocks are good: dark wood, brass, striped grips, skull studs.

## Round two, read (Claude)
- **Omen: the trap is escaped.** The oxblood coat, the black pentagram and the top hat make a figure unlike anything
  else on the roster.
  - *Grin*: a wide gold-toothed leer, the most character.
  - *Crow*: a black feather mantle and feathers in the hat band, the strongest silhouette.
  - *Greasepaint*: a white face, but the grin got lost.
  - Still weak: the painted eyes on the blindfold, only faint white marks.
  - Next: crow and grin together, the painted eyes said once more, plainly.
- **Soothsayer: all three work.** The ancient crone with wild white hair, the coin veil and the red and mustard
  striped tent canvas is unmistakable. *Eyes* (dozens of painted eyes staring off the robe) is the most distinctive and
  fits a seer. *Cards* has a cloak of tarot cards sewn on like scales, striking from the back.
  - Next: eyes on the robe, the card cloak on her back.
- **Etherborn: the galaxies are on her skin now** (arms, shoulders, neck and head), but the gown went plain black and
  she lost round one's nobility. *Bare-collar* is the best: the fan collar, starry skin, a starfield panel down the
  front. *Constellations*' gold lines barely show.
  - Next: the collar and the bare starry skin, with round one's rich noble gown back.

## Round three, read (Claude), and the picks for the user
- **Omen (*crowgrin*):** a top hat with feathers and tarot cards, the crow mantle, the red coat and the pentagram:
  the strongest silhouette. But joining the two cost the grin (only seed 1002 smiles), and the painted eyes on the
  blindfold never came through in any round: a job for the model's texture. Claude's picks: *grin* 1001 for the face,
  *crow* 1001 or *crowgrin* 1002 for the silhouette.
- **Soothsayer (*seer*):** the painted eyes on the striped canvas robe and the tarot-card cape both landed, in all
  three seeds. Claude's pick: *seer* 1001 (or 1000).
- **Etherborn:** *regal* is the noblest (a violet silk gown with gold filigree), but her arms are sleeved and the
  galaxies drift onto the gown. *Lined* puts the starfield in a coat lining. The trade-off: *bare-collar* 1001 (round
  two) shows the galaxy skin best; *regal* 1000 is the most noble.
- Page: `shots/carnival.html`. **Stopped here for the user's picks;** portraits follow from the picked concepts.

## The user's verdict (2026-10-06)
"Generally I'd say this went rather well actually!" **Picked:**
- **Omen:** `omen-grin-turnaround-1001` with the pistols `omen-pistols-props-1000`.
- **Etherborn:** `etherborn-lined-turnaround-1001`, "the sleeved one. It feels more noble to me."

**Soothsayer, not yet:** "seeing old ladies on a battlefield just doesn't make much sense to me… she doesn't look like
she belongs on a battlefield, but rather in a nursing home. Also, I'd rather see the cards as something she wields
rather than a mantle she wears. That's a bit too much. So try to make her younger, less decrepit… Keep the eye jacket,
that one is cool… shuffle the bag a bit. Try things out."
- **Round four** (`SOOTHSAYERS_4`): the eye jacket and the coin veil held; four different women around them, each
  someone who belongs in a fight, no hat (the Omen owns the top hat):
  - *duelist*: a lean card-duelist in her prime, the jacket fitted, leather breeches, boots, bracers;
  - *dancer*: young, wiry, barefoot, coin-threaded braids, the jacket cropped short;
  - *hooded*: a deep hood of the same canvas, only her eyes showing, one milky and glowing;
  - *gambler*: a scarred cardsharp with a knowing smile, the jacket open over a corset.
- The cards she wields get a prop sheet: oversized metal tarot cards with gilded razor edges, an eye on each back.
