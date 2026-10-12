# Concepts and portraits for every built unit

- **What:** The `unit-concepts` skill for each unit with a look, then `scripts/art/portraits.ts`. 60 units have card,
  bust and icon (`shots/portraits.html`, `shots/jilliath-portraits.html`, `shots/tribe-portraits.html`): the Grove's
  Decay line and Psychopomp, 15 of Jilliath's, the Custodian and Etherborn, the gnolls, the Drawn, the Soothsayer and
  Omen, and all 25 of the five tribes. Crops come from `scripts/art/portrait-frames.py` (a pose model), and `--fresh`
  paints a card from words when it must show more than the concept (the Godkin).
- **Still without (33):** Jilliath's Congregant and Paladin (candidates, none picked) and the nine the user deferred
  until an overview (Guardian, Empyreal, Cleric, Archon, Torturer, Fanatic, the three fire casters,
  `jilliath-identities.md`); Ral-Vitahl's other eight (looks first, `unit-looks`; the Apprentice's round was
  rejected); the Grove's six placeholders (names first); the bandits, Cutpurse, Snakeoiler and Capitol Guardian
  (looks first); the Fire Eater (Claude's look, no concept yet).
- **Why:** The alpha is painted.
- **Done when:** Every alpha unit has card, bust and icon.
- **Who:** Claude iterates; the user picks concepts. Needs ComfyUI.
