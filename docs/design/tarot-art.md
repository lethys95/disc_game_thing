# Tarot card art

> The user (2026-10-05): "Generate some art for the typical tarot card types (fool, death, lovers, etc) […] Think about how
> to do so creatively within the scope of this gothic/fantasy themed game. Obviously this here will just be 2d art.
> I'm considering whether or not there should be just a slightly different color scheme instead of just more grey.
> Maybe like browns. Try things out. Be creative […] you can also review your own work, and try different iterations if
> something didn't work. It should be that mysterious enigmatic themes you usually see with tarot cards, but within our
> universe here."

## Approach (Claude)
- **The deck:** the 22 Major Arcana, each its classic image (so it reads as tarot at a glance), made strange and gothic,
  about no one in particular. Claude first threaded the game's units in (a carnival jester for the Fool, moths, Nexus
  lightning, a masked inquisitor, hyenas); **the user (2026-10-05):** "You don't need to attempt to stuff all our units
  into the arts […] you risk making our universe look smaller I think. Tarot cards are about mystery. If we just see more
  of our units, it becomes less so." Dropped from round two on; round one (the colour probe) still carries some.
- **No text in the art:** generated lettering garbles; the card's name and numeral belong to the UI.
- **Colour (the user's question):** round one compares four looks on the same four cards: the game's grey (the
  portraits' recipe, as the baseline), a hand-tinted woodcut in sepia and umber, dark oils in browns and old gold, and
  a gilded illuminated-manuscript look on dark brown.
- Prompts: `scripts/art/tarot.ts`; images: `art/candidates/ui/tarot/` (every round kept).

## Log
- **Round one, the colour probe** (Fool, Death, Lovers, Moon × grey, engraving, oil, gilded × seeds 1000/1001; still
  with unit motifs): **grey** is atmospheric but flat and monotone; **engraving** is lovely and readable but bright and
  storybook, a classic deck reprinted, and it slipped Roman numerals in despite "no text"; **oil** (browns, umber,
  old gold, a carved gilt frame) is mysterious, gothic and warm: Claude's lead, and the answer to the user's browns
  question; **gilded** (an illuminated manuscript, deep reds and gold leaf) is striking and strange but less dark, worth
  carrying as a second look (it also made a numeral). The two seeds of each card came out nearly identical: Krea-2
  Turbo varies by prompt, not by seed. Round two: all 22 in oil and gilded, one seed each.
- **Round two, the full deck** (all 22 in oil and gilded, seed 2000, the mystery-only prompts): **oil** is a coherent,
  handsome deck: one carved gilt frame, browns, red and old gold, every card reads as its arcana, one stray numeral
  (the High Priestess's "V"). **Gilded** is gorgeous and strange but garbled numerals crept into most headers, and its
  brighter reds sit further from the game. Claude's critique of the oils: faithful but literal, classic paintings more
  than mysteries. Round three: a **nocturne** variant (the same palette sunk in shadow, one dim light, veiled or
  turned-away faces, mist, empty space), and card backs.
- **Round three** (nocturne × 22 and its back; oil and gilded backs): the nocturne's mood is right but "faces veiled,
  turned away or lost in shadow" became a subject: every card filled with the same hooded, candle-holding mourners. A
  near miss, to retry without that phrase. Backs: the **oil back** (a closed eye ringed by crescent moons and stars in a
  gothic frame) suits the oil deck: installed as the card back. The gilded back has haloed saints; the nocturne back
  has the mourners again.
