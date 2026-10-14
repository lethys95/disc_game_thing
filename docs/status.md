# Status

_Rewritten (not appended) with every commit. Keep under ~50 lines. Older detail: git history and the docs below._

**Updated:** 2026-10-14 (an outside AI plays a seat over MCP; you can play against it at `?join`)

## Where we're going
The board (`.kanban/`, `pnpm board` → `shots/board.html`): a first complete version, far off (the board's README
lists what it needs). Many tracks at once: unit designs come from sessions with the user; meanwhile Claude moves faction
interfaces, the map's look, tools and music installs. The roadmap's milestones are history; the board is the plan.

## Where we are
A playable map game for 2–6 players (hotseat viewer vs AIs) with Jilliath, Ral-Vitahl and the Sylvan; nine tribes
(bandits, gnolls, the Drawn, the carnival, the Wild, the Tuskclans, the Scaled, the Herd, the barbarian clans) on the
map, several per biome; five biomes (temperate, desert, swamp, tundra, haunted woods); cities, nodes, spells, items,
fog, saves (38), tarot and keywords. The AI plays map and battles in a web worker. A front door (title, new game,
skirmish, codex, settings, credits). Architecture: `design/architecture.md`; gotchas: `engineering.md`;
`pnpm verify` before calling anything done (check its exit code, not a grep of its output); `pnpm sizes` for any
interface change.

- **Rosters:** Jilliath's is built but for the joker line. Ral-Vitahl's mages reach tier 3; its melee and support
  stop at tier 2 and 1. The Grove's melee and support lines are in, its mage only at tier 1.
- **Art:** 60 units have card, bust and icon (`shots/portraits.html`, `shots/tribe-portraits.html`); 33 don't
  (`todo/concepts-and-portraits`). The HUD is box-out-then-paint-in (`hud-paint-in` skill); Jilliath's Capitol
  column and garrison are painted. The HUD rests for now (the user, 2026-10-11).
- **Mana is one kind** (the user's call, 2026-10-11). **Armor is a percentage** with diminishing returns.
- **Items:** the sixteen the user took from the brainstorm are built (`testing/items`): bodyguards, double strikes,
  reach, extra actions, items that remember, salted hexes, a suit of armor that fights. Try `&items=` on `?map`.
- **3D figures (the user's Tripo, for Unreal's quality):** the Psychopomp is the first (`assets/models/units/psychopomp.glb`,
  spring bone chains on her cape and skirt by `scripts/art/cloth-bones.py`), walking in Unreal on `disc_unreal`'s
  `card/3d-figures` (`shots/figures/index.html`). Ability icons: all in (`in-progress/icons`; effects and items wait for
  the user's okay on the test, `shots/icons.html`).
- **MCP player (`testing/mcp-player`):** `pnpm mcp` lets an LLM play seat 0 against the map AI, choosing from numbered
  options (forecasts on attacks, previews on battle orders); `pnpm play` is the same on the command line; `?watch`
  follows its game. A Haiku agent played seven turns of it. `?join` plays against it (`testing/mcp-join`): one shared
  game file, each giving their own side's battle orders.
- **Biome props:** the swamp, tundra and haunted woods have their own thirteen props each, on the map
  (`testing/biome-props`, `shots/biome-props.html`).

## Next (the board's todo, in rank order)
1. **Design sessions with the user:** the Grove's mage line (questions #10), Ral-Vitahl's missing tiers, the
   Spiritess tier 4, the joker lines, owners for Evasion, Explode and Soak.
2. **Claude's own, meanwhile:** icons for abilities, effects and items (`icons`, the user's suggestion); looks for
   the units without one (`unit-looks`, Nexus first), then their concepts and portraits.
3. **The user's picks waiting:** the node brainstorm's round two (`design/brainstorm/nodes.md`, questions #6), and
   everything in `testing/`.
4. **The balance pass** once the factions' lines exist, with the user's worry that Jilliath's lines are too long.

## Try
`?codex`, `?fight` (`=mages`, `=nexus`, `=grove`, `=bandits`, `=carnival`, `=drawn`, `=wild`, `=tusk`, `=scaled`,
`=herd`, `=clans`; `&tarot=3&seed=4`), `?map`, `?newgame`, `?skirmish`, `?credits`, `?map&capitol=0`. Routes and
params: the verify skill.
