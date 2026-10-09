# Status

_Rewritten (not appended) with every commit. Keep under ~50 lines. Older detail: git history and the docs below._

**Updated:** 2026-10-09 (the HUD kit's system, step 1)

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
  `scripts/art/concepts.ts` ANGELS, PRIESTS, MELEE; review pages `shots/jilliath-*.html`). **Picked (13):**
  Seraph, Emissary, Shepherd, Godkin, Reclaimer, Paragon, Acolyte, Pontiff, Doomsayer (+ scroll), Templar (+ rose
  shield), Immortal, Chosen (+ zweihander), Avatar (`roster.md`). **Deferred by the user** until they have an overview of references and designs: the
  Guardian, Empyreal, Torturer, Archon, Cleric (Orzhov reading, maybe the Pontiff with it), Fanatic, the fire casters
  (names first). **Portraits installed (2026-10-09)** for the 13 picked:
  Seraph, Emissary, Shepherd, Godkin, Reclaimer, Paragon, Acolyte, Pontiff, Doomsayer, Templar, Immortal, Chosen, Avatar.
- **Lessons for every faction's art** (`unit-concepts` skill): a unit's own materials line (a shared "steel" line
  made knights of every melee unit), "inhuman" over "woman", name cloth textures; review pages show full prompts.
- **Armor is a percentage with diminishing returns** (the user; #75, `testing/percent-armor`): armor ÷ (armor + 60),
  shown as a percent on the cards and in the codex.
- **The HUD kit's second batch** (`in-progress/ui-kit-grotesques`, `shots/hud-kit.html`): a stone angel whose wings
  are the side panels' frame, tracery with angel corners, end caps, a divider. The user: the angels still feel "bolted
  on", and the kit needs more distinct elements, fewer copies. Researched (`design/hud-references.md`,
  `reference_material/`), inventoried (`reference_material/ui-inventory.md`), and step 1 of four done: the system,
  `design/hud-kit.md`, with eight choices for the user. Next: the battle screen's greybox.
- **The Grove's Water is now Wellspring.**
- **Unreal 5 as a parallel track** (the user: "UE is the king of 3d"; `ongoing/unreal-port`), in its own repo,
  `../disc_unreal`. three.js keeps the pace; Unreal follows as a view, with this repo's TypeScript rules as the only
  rules. Work here goes on as before; the Unreal repo reads this one and never writes to it. Step 1 is done there:
  the `?fight` arena in Unreal looks nearly the same as three.js with today's assets (`disc_unreal/shots/`).

## Next
1. **Finish Jilliath's concepts** with the user (the open nine), then portraits from the picks.
2. **The other factions' missing units** (the alpha needs all three): Nexus melee tier 3, the Grove's mage line, and
   the rest on the board; then their concept art the same way.
3. **The balance pass** once the factions' lines exist, with the user's worry that Jilliath's lines are too long.
4. **Waiting for the user to look** (`testing/`): the mage and support lines, ability power, the front door, codex.

## Try
`?codex`, `?fight` (`=mages`, `=nexus`, `=grove`, `=bandits`, `=carnival`, `=drawn`; `&tarot=3&seed=4`), `?map`,
`?newgame`, `?skirmish`, `?map&capitol=0`. Routes and params: the verify skill.
