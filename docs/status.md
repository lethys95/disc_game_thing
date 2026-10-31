# Status

_Rewritten (not appended) with every commit. Keep under ~50 lines. Older detail: git history and the docs below._

**Updated:** 2026-10-31 (icons for every effect and item, `shots/icons-2.html`; the Storm capacitor a tesla coil)

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
- **Art:** 73 units have card, bust and icon: 60 accepted by the user (2026-10-26; `shots/portraits.html`,
  `shots/tribe-portraits.html`), the thirteen looks' new ones Claude's picks waiting for the user
  (`shots/looks-portraits.html`); 22 don't (`todo/concepts-and-portraits`). The HUD is box-out-then-paint-in (`hud-paint-in` skill); Jilliath's Capitol
  column and garrison are painted. The HUD rests for now (the user, 2026-10-11).
- **Mana is one kind** (the user's call, 2026-10-11). **Armor is a percentage** with diminishing returns.
- **Items:** the sixteen the user took from the brainstorm are built (`testing/items`): bodyguards, double strikes,
  reach, extra actions, items that remember, salted hexes, a suit of armor that fights. Try `&items=` on `?map`.
- **3D figures (the user's Tripo, for Unreal's quality):** the Psychopomp is the first (`assets/models/units/psychopomp.glb`,
  spring bone chains on her cape and skirt by `scripts/art/cloth-bones.py`), walking in Unreal on `disc_unreal`'s
  `card/3d-figures` (`shots/figures/index.html`). The Seraph is the second
  (`assets/models/units/seraph.glb`, chains round her mantle and skirt, wings on her back), walking there too
  (`shots/figures/seraph-check.html`). The Acolyte is the third (`acolyte.glb`: stole and robe on chains, his
  lantern on bones of its own that Unreal swings under gravity; `shots/figures/acolyte-check.html`). The Zealot is the
  fourth (`zealot.glb`: one fused piece, the robe told from the legs by its distance off the leg bones, five chains),
  walking in Unreal (`shots/figures/zealot-check.html`). The Templar is the fifth (`templar.glb`: the surcoat its own
  piece, six chains, the tabard between the legs; `shots/figures/templar-check.html`). The Punisher (`punisher.glb`: six chains round the robe, the belt's hangings riding them; the walk's back kick still pokes a boot through the robe) and the Paragon (`paragon.glb`: wings on the chest, book and hip chains on the pelvis, six chains round the skirt) walk in Unreal too (`shots/figures/punisher-check.html`, `paragon-check.html`). The Reclaimer (`reclaimer.glb`, from `reclaimer#2`: plate, wings on the chest, no chains) walks too (`reclaimer-check.html`). The Chosen (plate), the Pontiff (six chains round the robe, the censer hanging from the belt) and the Shepherd (wings on the chest, five chains round the skirt) walk in Unreal too (`shots/figures/chosen-check.html`, `pontiff-check.html`, `shepherd-check.html`); the mannequin's full stride puts a leg through both robes. The Paragon's face failed in Tripo: no view showed it clear, so her left side was repainted from the pick (`shots/tripo/paragon/side-left.png`). Ability icons: all in (`in-progress/icons`; effects and items wait for
  the user's okay on the test, `shots/icons.html`).
- **MCP player (`testing/mcp-player`):** `pnpm mcp` lets an LLM play seat 0 against the map AI, choosing from numbered
  options (forecasts on attacks, previews on battle orders); `pnpm play` is the same on the command line; `?watch`
  follows its game. A Haiku agent played seven turns of it. `?join` plays against it (`testing/mcp-join`): one shared
  game file, each giving their own side's battle orders.
- **Nodes by biome (`testing/biome-nodes`):** each neutral city deals two special nodes from its biome's pool (the
  user's pools, 2026-10-15); nine new nodes, the Oasis, Dog yard and the user's Waystone (Way portal recalls a warband to the city its leader was
  elevated in; any held city elevates now); outposts and mercenary camps hire the biome's tribe. Levels add a clause at the
  top (`testing/node-clauses`); merchants sell their biome's list; the Scriptorium gives each faction's casters their own gift.
- **Capitol Guardians (`in-progress/capitol-guardians`):** one per faction, all on the old stat line until the user
  sets them apart; looks okayed by the user (each bound to its Capitol its faction's way), concepts in three rounds
  waiting for the user's picks (`shots/guardians.html`).
- **Biome props:** the swamp, tundra and haunted woods have their own thirteen props each, on the map, accepted by
  the user (2026-10-26; some may become Tripo models later, `maybe/tripo-props`).

## Next (the board's todo, in rank order)
1. **Design sessions with the user:** the Grove's mage line (its Decay side at tier 2 is damage over time, the user 2026-10-30; questions #10), Ral-Vitahl's missing tiers, the
   Spiritess tier 4, the joker lines, owners for Evasion, Explode and Soak.
2. **Claude's own, meanwhile:** icons: every effect and item has one (`shots/icons-2.html`, waiting for the user's
   look); the Fire
   Eater's concepts in rounds (`carnival-concepts.md`); then concepts and portraits as looks get picked. No skirts on
   female figures, no children anywhere (`art.md`).
3. **The user's picks waiting:**
   everything in `testing/`.
4. **The balance pass** once the factions' lines exist, with the user's worry that Jilliath's lines are too long.

## Try
`?codex`, `?fight` (`=mages`, `=nexus`, `=grove`, `=bandits`, `=carnival`, `=drawn`, `=wild`, `=tusk`, `=scaled`,
`=herd`, `=clans`; `&tarot=3&seed=4`), `?map`, `?newgame`, `?skirmish`, `?credits`, `?map&capitol=0`. Routes and
params: the verify skill.
