# Status

_Rewritten (not appended) with every commit. Keep under ~50 lines. Older detail: git history and the docs below._

**Updated:** 2026-10-12 (docs and board audited against the code)

## Where we're going
The board (`.kanban/`, `pnpm board` → `shots/board.html`): a first complete version, far off (the board's README
lists what it needs). Many tracks at once: unit designs come from sessions with the user; meanwhile Claude moves faction
interfaces, the map's look, tools and music installs. The roadmap's milestones are history; the board is the plan.

## Where we are
A playable map game for 2–6 players (hotseat viewer vs AIs) with Jilliath, Ral-Vitahl and the Sylvan; nine tribes
(bandits, gnolls, the Drawn, the carnival, the Wild, the Tuskclans, the Scaled, the Herd, the barbarian clans) on the
map, several per biome; five biomes (temperate, desert, swamp, tundra, haunted woods); cities, nodes, spells, items,
fog, saves (37), tarot and keywords. The AI plays map and battles in a web worker. A front door (title, new game,
skirmish, codex, settings, credits). Architecture: `design/architecture.md`; gotchas: `engineering.md`;
`pnpm verify` before calling anything done (check its exit code, not a grep of its output); `pnpm sizes` for any
interface change.

- **Rosters:** Jilliath's is built but for the joker line. Ral-Vitahl's mages reach tier 3; its melee and support
  stop at tier 2 and 1. The Grove's melee and support lines are in, its mage only at tier 1.
- **Art:** 60 units have card, bust and icon (`shots/portraits.html`, `shots/tribe-portraits.html`); 33 don't
  (`todo/concepts-and-portraits`). The HUD is box-out-then-paint-in (`hud-paint-in` skill); Jilliath's Capitol
  column and garrison are painted. The HUD rests for now (the user, 2026-10-11).
- **Mana is one kind** (the user's call, 2026-10-11). **Armor is a percentage** with diminishing returns.

## Running now
- **Biome props** (`in-progress/biome-props`): TRELLIS.2 meshes for the swamp, tundra and haunted woods, building
  in the background; placing them on the map comes next.

## Next (the board's todo, in rank order)
1. **Design sessions with the user:** the Grove's mage line (questions #10), Ral-Vitahl's missing tiers, the
   Spiritess tier 4, the joker lines, owners for Evasion, Explode and Soak.
2. **Claude's own, meanwhile:** looks for the units without one (`unit-looks`, Nexus first), then their concepts and
   portraits; the sixteen items the user took (`items`, designed, none built).
3. **The user's picks waiting:** the node brainstorm's round two (`design/brainstorm/nodes.md`, questions #6), and
   everything in `testing/`.
4. **The balance pass** once the factions' lines exist, with the user's worry that Jilliath's lines are too long.

## Try
`?codex`, `?fight` (`=mages`, `=nexus`, `=grove`, `=bandits`, `=carnival`, `=drawn`, `=wild`, `=tusk`, `=scaled`,
`=herd`, `=clans`; `&tarot=3&seed=4`), `?map`, `?newgame`, `?skirmish`, `?credits`, `?map&capitol=0`. Routes and
params: the verify skill.
