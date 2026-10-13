# Props for the swamp, tundra and haunted woods

- **What:** The three new biomes still use the temperate props. Thirteen kinds each (trees, crags, hills, rocks,
  bushes) are described in `scripts/art/props.ts` (2026-10-12), and `scripts/art/rebuild-props.sh` turns them into
  meshes: Krea-2 concepts, then TRELLIS.2.
- **Why:** A biome should read as one at a glance (the user named the three, 2026-10-12).
- **Done when:** The meshes are in `assets/models/terrain/`, the biomes place their own props, and the user has seen
  them on the map.
- **Who:** Claude builds; the user judges.
- **2026-10-12:** first batch: 11 of 39 meshes. The other 28 ran out of GPU memory, with ComfyUI still holding
  Krea-2 on the same card (`engineering.md`, Gotchas). The script now unloads it first.
- **2026-10-13:** the 28 rerun from the same concepts (`CONCEPTS=0`); placing the props comes after.
