# Status

_Rewritten (not appended) with every commit. Keep under ~50 lines. Older detail: git history and the docs below._

**Updated:** 2026-10-11 (UI pass by job done; code review findings 1–3 fixed)

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

## This session (2026-10-07 to 10)
- **Jilliath's roster is built**, joker line aside: the mage line (#72) and the support line (#73, #74);
  `?fight=mages`, `?fight=angels`. Engine: a holy damage type, `BattleUnit.struck`, a `hurt` hook, `revive`, stacking
  burns. Save 33.
- **Jilliath's concept art, in rounds** (`design/units/jilliath-identities.md`; review pages `shots/jilliath-*.html`):
  13 picked with portraits installed (`roster.md`); deferred by the user until they have an overview: the Guardian,
  Empyreal, Torturer, Archon, Cleric, Fanatic and the fire casters. Lessons in the `unit-concepts` skill.
- **Armor is a percentage with diminishing returns** (the user; #75, `testing/percent-armor`).
- **The HUD: box out, then paint in (2026-10-10/11)** (`in-progress/ui-kit-grotesques`; `design/hud-pieces.md`;
  the `hud-paint-in` skill): two greyboxes per layout (`art/greybox/<layout>/`), Krea-2 with its depth Control LoRA
  (`scripts/art/hud-paint-in.ts`), repairs by depth-held inpainting (`hud-inpaint.ts`), the game's HTML in the
  windows. In the game: the map column, the battle bar, the Capitol column and its tabs (the garrison wall; one frame
  for research and spells; `shots/capitol-tabs.html`), and the leader's and structures' screens (one warband column,
  the content in that frame; `shots/warband-screens.html`), the battle's turn order as a strip hanging from the
  top (`shots/turn-order.html`); night one's beam is gone. Krea-2 is the only art model. Pages for the user go in
  `shots/` over Tailscale, never claude.ai artifacts.
- **The Grove's Water is now Wellspring.**
- **Unreal 5 as a parallel track** (`ongoing/unreal-port`), in its own repo, `../disc_unreal`, reading this one and
  never writing to it; three.js keeps the pace. Step 1 done there: the `?fight` arena nearly matches three.js.

## Next
0. **The HUD, interface first** (the user's review, 2026-10-11; `in-progress/ui-kit-grotesques`; the `greybox` skill).
   Greyboxed by job: the Capitol (`shots/capitol-greybox.html`), the leader's and structures' screens
   (`shots/warband-greybox.html`), the title, new game and menu (`shots/front-greybox.html`), all sharing one column, one unit sheet, one squad tile, one branch chooser. A Greybox
   setting draws the still-painted pieces (map column, battle bar, turn order) flat. Next: the map column and battle
   bar by job, then title and menus; paint after a layout is judged, per faction skin. Glass rests.
   **The code review's findings 1–3 are done** (`todo/code-review`): new units can be built; 4 (CSS) and 5 remain.
1. **Finish Jilliath's concepts** with the user (the open nine), then portraits from the picks.
2. **The other factions' missing units** (the alpha needs all three): Nexus melee tier 3, the Grove's mage line, and
   the rest on the board; then their concept art the same way.
3. **The balance pass** once the factions' lines exist, with the user's worry that Jilliath's lines are too long.
4. **Waiting for the user to look** (`testing/`): the mage and support lines, ability power, the front door, codex.

## Try
`?codex`, `?fight` (`=mages`, `=nexus`, `=grove`, `=bandits`, `=carnival`, `=drawn`; `&tarot=3&seed=4`), `?map`,
`?newgame`, `?skirmish`, `?credits`, `?map&capitol=0`. Routes and params: the verify skill.
