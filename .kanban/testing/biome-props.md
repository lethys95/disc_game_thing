# Props for the swamp, tundra and haunted woods

- **What:** The three new biomes used the temperate props. Thirteen kinds each (trees, crags, hills, rocks,
  bushes) are described in `scripts/art/props.ts` (2026-10-12), and `scripts/art/rebuild-props.sh` turns them into
  meshes: Krea-2 concepts, then TRELLIS.2.
- **Why:** A biome should read as one at a glance (the user named the three, 2026-10-12).
- **Who:** Claude builds; the user judges.
- **2026-10-12:** first batch: 11 of 39 meshes. The other 28 ran out of GPU memory, with ComfyUI still holding
  Krea-2 on the same card (`engineering.md`, Gotchas). The script now unloads it first.
- **Built (2026-10-13):** all 39, on the map (a biome's props are found by name). The 28 rebuilt from the same
  concepts; the snow-laden fir cluster (`tundra-tree-2`) overflowed TRELLIS.2's simplifier and was meshed with TRELLIS
  v1. Review page `shots/biome-props.html`.
- **Done when:** the user has seen them: keep, redo or cut.
