# Status

_Rewritten (not appended) with every commit. Keep under ~50 lines. Older detail: git history and the docs below._

**Updated:** 2026-10-07 (the Jilliath mage line built)

## Where we're going
The board (`.kanban/`, `pnpm board` → `shots/board.html`): the alpha is the three playable factions (Jilliath,
Ral-Vitahl, the Sylvan) with every unit line designed, built and painted, playable from the title to victory; then
balance; then look and sound. Unit designs are the user's and gate the rest.

## Where we are
A playable map game for 2–6 players (hotseat viewer vs AIs) with Jilliath, Ral-Vitahl and the Sylvan; tribes (bandits,
gnolls; the Drawn and the carnival in fights only), cities, nodes, spells, items, fog, saves, tarot and keywords. The AI
plays map and battles in a web worker. A front door (title, new game, skirmish, codex, settings, credits).
Architecture: `design/architecture.md`; gotchas: `engineering.md`; `pnpm verify` before calling anything done (and
check its exit code, not a grep of its output); `pnpm sizes` for any interface change.

## This session (2026-10-07 to 09)
- **Jilliath's roster is built**, joker line aside: the mage line (priests: Acolyte → Cleric → Pontiff → Archon; fire:
  Doomsayer → Fire mage 3 → Fire mage 4 / Martyr mage 4; #72) and the support line (angels: Seraph → Emissary →
  Guardian → Shepherd → Godkin; Paragon → Empyreal / Reclaimer; #73, #74). `?fight=mages`, `?fight=angels`. Engine: a
  holy damage type, `BattleUnit.struck`, a `hurt` hook, `revive`, stacking burns. Save 33.
- **Jilliath's concept art, in rounds** (`docs/design/units/jilliath-identities.md`, every quote and read;
  `scripts/art/concepts.ts` ANGELS, PRIESTS, MELEE; review page `shots/jilliath-concepts.html`). **Picked (10):**
  Seraph, Emissary, Shepherd, Godkin, Reclaimer, Acolyte, Pontiff, Doomsayer (+ scroll), Templar (+ rose shield),
  Immortal (`roster.md`). **Generating:** the user's directions for the Guardian, Paragon, Chosen (+ zweihander),
  Torturer, Avatar, and Claude's for the Empyreal and Archon. **Waiting on the user:** the Cleric (Orzhov reading, maybe
  the Pontiff with it), the Fanatic (deferred), the fire casters (names first). Portraits come later, from the picks.
- **Lessons for every faction's art** (`unit-concepts` skill): a unit's own materials line (a shared "steel" line
  made knights of every melee unit), "inhuman" over "woman", name cloth textures; review pages show full prompts.
- **Armor becomes a percentage with diminishing returns** (the user; `todo/percent-armor`): Claude's curve
  armor ÷ (armor + 60) awaits a yes.
- **The Grove's Water is now Wellspring.**

## Next
1. **Finish Jilliath's concepts** with the user (the open nine), then portraits from the picks.
2. **The other factions' missing units** (the alpha needs all three): Nexus melee tier 3, the Grove's mage line, and
   the rest on the board; then their concept art the same way.
3. **Percent armor** (`todo/percent-armor`): confirm the curve, build, rerun the matrix. Then the balance pass, with
   the user's worry that Jilliath's lines are too long.
4. **Waiting for the user to look** (`testing/`): the mage and support lines, ability power, the front door, codex.

## Try
`?codex`, `?fight` (`=mages`, `=nexus`, `=grove`, `=bandits`, `=carnival`, `=drawn`; `&tarot=3&seed=4`), `?map`,
`?newgame`, `?skirmish`, `?map&capitol=0`. Routes and params: the verify skill.
