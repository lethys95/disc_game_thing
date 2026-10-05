# Tarot card art

> The user (2026-10-05): "Generate some art for the typical tarot card types (fool, death, lovers, etc)… Think about how
> to do so creatively within the scope of this gothic/fantasy themed game. Obviously this here will just be 2d art.
> I'm considering whether or not there should be just a slightly different color scheme instead of just more grey.
> Maybe like browns. Try things out. Be creative… you can also review your own work, and try different iterations if
> something didn't work. It should be that mysterious enigmatic themes you usually see with tarot cards, but within our
> universe here."

## Approach (Claude)
- **The deck:** the 22 Major Arcana. Each keeps its classic image so it reads as tarot at a glance, with motifs from
  the game's world where they fit: the Fool as a carnival jester; the Hermit's lantern circled by moths (the Drawn);
  the Magician and the Tower with Nexus-teal lightning; the Empress a druid queen in an autumn forest (the Grove);
  the Hierophant a masked inquisitor (Jilliath's zealot mask); Justice blindfolded like Omen; Death's skeleton grown
  through with roots; Temperance pouring water; the Moon with moths rising to it; the Chariot drawn by hyenas.
  Motifs only; no lore.
- **No text in the art:** generated lettering garbles; the card's name and numeral belong to the UI.
- **Colour (the user's question):** round one compares four looks on the same four cards: the game's grey (the
  portraits' recipe, as the baseline), a hand-tinted woodcut in sepia and umber, dark oils in browns and old gold, and
  a gilded illuminated-manuscript look on dark brown.
- Prompts: `scripts/art/tarot.ts`; images: `art/candidates/ui/tarot/` (every round kept).

## Log
