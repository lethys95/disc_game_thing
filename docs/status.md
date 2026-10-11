# Status

_Rewritten (not appended) with every commit. Keep under ~50 lines. Older detail: git history and the docs below._

**Updated:** 2026-10-11 (handover: three painted HUD pieces in the game; the Capitol's tab panels next)

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
  the procedure is the `hud-paint-in` skill). A layout is drawn as two greyboxes (values and depth,
  `art/greybox/<layout>/`), Krea-2 paints them with its depth Control LoRA (`scripts/art/hud-paint-in.ts`), broken
  parts are repaired by depth-held inpainting (`scripts/art/hud-inpaint.ts`), the game's HTML fills the windows. In
  the game: **the map column** (3×3 squad in a stained-glass window, the angel and the succubus holding the spell-book
  gem, End turn an hourglass socket), **the battle bar** (acting unit left, hovered unit right, red health globes that
  drain behind their figures via `scripts/art/hud_drain.py`, round and four knobs, sockets in painted wells, unit
  sheet on a held right-click on the portrait, log on demand, painted extensions for wide monitors), **the Capitol
  column** (no beam; name, purse, tier, four tab niches, facts, Back to the map as a seal held by a mason and an
  abbess). Krea-2 is the only art model (Qwen dropped: licence, quality). Pages for the user go in `shots/` over
  Tailscale, never claude.ai artifacts.
- **The Grove's Water is now Wellspring.**
- **Unreal 5 as a parallel track** (the user: "UE is the king of 3d"; `ongoing/unreal-port`), in its own repo,
  `../disc_unreal`. three.js keeps the pace; Unreal follows as a view, with this repo's TypeScript rules as the only
  rules. Work here goes on as before; the Unreal repo reads this one and never writes to it. Step 1 is done there:
  the `?fight` arena in Unreal looks nearly the same as three.js with today's assets (`disc_unreal/shots/`).

## Next
0. **The HUD, screen by screen** (`hud-paint-in` skill). Next: **the Capitol's tab panels** (garrison grids and
   graveyard, research tree, spells; still interim tablets): one painted frame for a tab's content, with the
   Disciples II ideas in `reference_material/disciples/notes.md` (research connectors as iron rods, empty cells as
   corner marks, locked research sealed). Then the leader and structure screens (still on the interim beam), the
   battle's turn order (interim beam), title and menus. Open in the battle: right-click on a field unit to open its
   sheet; real glyphs for the knobs (», A, ☰ are stand-ins); screens narrower than 16:9 crop the bar's ends.
1. **Finish Jilliath's concepts** with the user (the open nine), then portraits from the picks.
2. **The other factions' missing units** (the alpha needs all three): Nexus melee tier 3, the Grove's mage line, and
   the rest on the board; then their concept art the same way.
3. **The balance pass** once the factions' lines exist, with the user's worry that Jilliath's lines are too long.
4. **Waiting for the user to look** (`testing/`): the mage and support lines, ability power, the front door, codex.

## Try
`?codex`, `?fight` (`=mages`, `=nexus`, `=grove`, `=bandits`, `=carnival`, `=drawn`; `&tarot=3&seed=4`), `?map`,
`?newgame`, `?skirmish`, `?credits`, `?map&capitol=0`. Routes and params: the verify skill.
