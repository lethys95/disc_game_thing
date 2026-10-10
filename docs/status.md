# Status

_Rewritten (not appended) with every commit. Keep under ~50 lines. Older detail: git history and the docs below._

**Updated:** 2026-10-10 (the HUD: box out, then paint in, on Krea-2; the map column)

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
- **The HUD: box out, then paint in (2026-10-10)** (`in-progress/ui-kit-grotesques`; `design/hud-pieces.md`). After
  the one-painting reset and a round of single pieces, the method that works: draw a layout as two greyboxes (values
  and depth, `art/greybox/<layout>/`) and let Krea-2 paint them with its depth Control LoRA
  (`scripts/art/hud-paint-in.ts`). The map's right-hand column, built the way Disciples II's is (one object, joined
  sections, light only where you read or press, two small angels in relief holding End turn), holds its layout with
  the game's real content in its windows: `shots/column-probe.html`. Qwen models tried and dropped (licence, quality).
- **The Grove's Water is now Wellspring.**
- **Unreal 5 as a parallel track** (the user: "UE is the king of 3d"; `ongoing/unreal-port`), in its own repo,
  `../disc_unreal`. three.js keeps the pace; Unreal follows as a view, with this repo's TypeScript rules as the only
  rules. Work here goes on as before; the Unreal repo reads this one and never writes to it. Step 1 is done there:
  the `?fight` arena in Unreal looks nearly the same as three.js with today's assets (`disc_unreal/shots/`).

## Next
0. **The HUD column into the game:** the painted map column behind the live HTML (the Menu socket back in, glyphs on
   the round sockets), checked at 720p, 1080p, 1440p; then the battle screen the same way.
1. **Finish Jilliath's concepts** with the user (the open nine), then portraits from the picks.
2. **The other factions' missing units** (the alpha needs all three): Nexus melee tier 3, the Grove's mage line, and
   the rest on the board; then their concept art the same way.
3. **The balance pass** once the factions' lines exist, with the user's worry that Jilliath's lines are too long.
4. **Waiting for the user to look** (`testing/`): the mage and support lines, ability power, the front door, codex.

## Try
`?codex`, `?fight` (`=mages`, `=nexus`, `=grove`, `=bandits`, `=carnival`, `=drawn`; `&tarot=3&seed=4`), `?map`,
`?newgame`, `?skirmish`, `?credits`, `?map&capitol=0`. Routes and params: the verify skill.
