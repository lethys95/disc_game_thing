# Status

_Rewritten (not appended) with every commit. Keep under ~50 lines. Older detail: git history and the docs below._

**Updated:** 2026-10-10, past midnight (the battle, map, Capitol, codex and title painted and installed)

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
- **The HUD kit: every screen is on it, most of them painted** (`in-progress/ui-kit-grotesques`; the morning
  write-up `shots/hud-battle.html`). After the angels felt "bolted on": research (`design/hud-references.md`), an
  inventory, the system (`design/hud-kit.md`, accepted; motifs provisional #76), a greybox, then each screen painted
  as one picture and cut into pieces (`scripts/art/hud-paint.ts`, `assets/ui/<screen>/`). The user handed control to
  Claude ("I'm giving you control"). Painted: the battle (the turn order in the beam's arcade, the card a monument
  whose angel holds the portrait, the hourglass and marionette hanging from the beam), the map (an angel holding up
  the End turn bell, a book for Menu), the Capitol (an angel on the rail carrying the beam, the tabs as niches, the
  city painting as the window behind every tab), the codex as an open book (the credits written in it), the title's
  menu as one stele. On the kit's pieces: the leader and structure screens, the new game, the settings, the moments.
  Documents are on the codex's parchment; the card's instruments are engraved silver emblems; words wait under a held
  right-click.
- **The Grove's Water is now Wellspring.**
- **Unreal 5 as a parallel track** (the user: "UE is the king of 3d"; `ongoing/unreal-port`), in its own repo,
  `../disc_unreal`. three.js keeps the pace; Unreal follows as a view, with this repo's TypeScript rules as the only
  rules. Work here goes on as before; the Unreal repo reads this one and never writes to it. Step 1 is done there:
  the `?fight` arena in Unreal looks nearly the same as three.js with today's assets (`disc_unreal/shots/`).

## Next
0. **The HUD kit goes on** (Claude's): the moments' keystone, the saves on parchment, the new game's emblems and March
   as a held object, the codex's ribbons and capitals; then the faction skins.
1. **Finish Jilliath's concepts** with the user (the open nine), then portraits from the picks.
2. **The other factions' missing units** (the alpha needs all three): Nexus melee tier 3, the Grove's mage line, and
   the rest on the board; then their concept art the same way.
3. **The balance pass** once the factions' lines exist, with the user's worry that Jilliath's lines are too long.
4. **Waiting for the user to look** (`testing/`): the mage and support lines, ability power, the front door, codex.

## Try
`?codex`, `?fight` (`=mages`, `=nexus`, `=grove`, `=bandits`, `=carnival`, `=drawn`; `&tarot=3&seed=4`), `?map`,
`?newgame`, `?skirmish`, `?credits`, `?map&capitol=0`. Routes and params: the verify skill.
