# Concepts and portraits for every built unit

- **What:** The `unit-concepts` skill for each unit with a look, then `scripts/art/portraits.ts`. 60 units have card,
  bust and icon (`shots/portraits.html`, `shots/jilliath-portraits.html`, `shots/tribe-portraits.html`): the Grove's
  Decay line and Psychopomp, 15 of Jilliath's, the Custodian and Etherborn, the gnolls, the Drawn, the Soothsayer and
  Omen, and all 25 of the five tribes. Crops come from `scripts/art/portrait-frames.py` (a pose model), and `--fresh`
  paints a card from words when it must show more than the concept (the Godkin).
- **Still without (22):** Jilliath's Congregant and Paladin (candidates, none picked) and the nine the user deferred
  until an overview (Guardian, Empyreal, Cleric, Archon, Torturer, Fanatic, the three fire casters,
  `jilliath-identities.md`); Ral-Vitahl's Apprentice (its round was rejected); the Grove's six placeholders (names
  first); the three Capitol Guardians (looks first, `capitol-guardians`); the Fire Eater (three rounds, Claude's picks
  wait for the user, `shots/fire-eater.html`).
- **Why:** The alpha is painted.
- **Done when:** Every alpha unit has card, bust and icon.
- **Who:** Claude iterates; the user picks concepts. Needs ComfyUI.
- **Portraits for the thirteen looks (2026-10-30, Claude on its own):** the Cyclops, Mutant, Technician, Justiciar,
  Thaumaturge, Backlasher, Maelstrom, the four bandits, the Cutpurse and the Snakeoiler, each from the picked concept's
  front view in `scripts/art/portraits.ts` (its sources moved to `shots/tripo/<unit>/front.png` with the to-model
  page). Round one running: one pose each, at 0.75 and 0.9.
- **The thirteen installed (2026-10-30), Claude's picks:** every one came through in round one; the Backlasher and the
  Cyclops at 0.75 (at 0.9 her shards became a skirt and its pipes ran off the top), the rest at 0.9. The pose model
  framed twelve; the Cyclops by hand. For the user: `shots/looks-portraits.html` (card, bust, icon, the other strength,
  each prompt as sent). Misses noted there: no lightning in the Thaumaturge's hands, the Technician's clockwork arm
  hidden, the Cutpurse's V neckline. 73 units have portraits now.
