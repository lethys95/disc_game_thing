# Model sources

Every model here was generated locally; the recipe regenerates it exactly.

| File | Concept (Krea-2 Turbo via ComfyUI, `scripts/art/props.ts`, by slot) | Mesh | Cleanup (`scripts/art/prop_cleanup.py`) |
|---|---|---|---|
| `site/capitol-jilliath.glb` | seed 2 | TRELLIS.2, `run_trellis2.sh --pipeline 1024_cascade` | 40000 triangles, 2048 px |
| `site/capitol-nexus.glb` | seed 2 | TRELLIS.2, 1024_cascade | 40000, 2048 px |
| `site/city.glb` | seed 3 | TRELLIS.2, 1024_cascade | 30000, 2048 px |
| `structure/mage.glb` | seed 3 | TRELLIS.2, 1024_cascade | 20000, 2048 px |
| `structure/merchant.glb` | seed 1 | TRELLIS.2, 1024_cascade | 20000, 2048 px |
| `structure/mercenaries.glb` | seed 3 | TRELLIS.2, 1024_cascade | 20000, 2048 px |
| `node/{gold,blacksmith,mana,cathedral}.glb` | seeds 1, 2, 1, 2 | TRELLIS.2, 1024_cascade | 16000, 2048 px |
| `node/{foundry,leech_pits,stables,tannery,siege_workshop,quarry,ossuary,watchtower,bell_tower,tribal_outpost}.glb` | seed 1 (M63, the user's node picks) | TRELLIS.2, 1024_cascade, `--faces 16000 --texture 2048` | 16000, 2048 px |
| `structure/portal.glb` | seed 1 | TRELLIS.2, 1024_cascade, `--faces 20000 --texture 2048` | 20000, 2048 px |
| `lair/dungeon.glb` | seed 2 | TRELLIS.2, 1024_cascade, `--faces 20000 --texture 2048` | 20000, 2048 px |
| `terrain/tree-{1,2,3,4}` | seeds 4, 1, 1, 1 (the lighter-green prompts, 2026-09-28) | TRELLIS.2, 1024_cascade, `--faces 8000 --texture 1024` | 8000, 1024 px |
| `terrain/hill-{1,2}` | seed 1 | TRELLIS.2, 1024_cascade, `--faces 8000 --texture 1024` | 8000, 1024 px |
| `terrain/bush-{1,2}` | seed 1 | TRELLIS.2, 1024_cascade, `--faces 6000 --texture 1024` | 6000, 1024 px |
| `terrain/mountain-{1,2,3}`, `terrain/rock-{1,2}` | seed 1 | TRELLIS.2, 1024_cascade | mountains 16000, rocks 6000; 1024 px |

TRELLIS.2 runs are offline and never use a stored login (`run_trellis2.sh`). `1536_cascade` runs out of memory on a 24 GB card (hole filling in the decoder); `1024_cascade` is the most that fits. Where Blender's collapse decimation stalls (seams, loose islands), TRELLIS.2's own `--faces` target does the reduction and rebakes the texture.

Ground textures (`assets/ground/<terrain>-<n>.webp`): `scripts/art/ground.ts`, seeds 1–3, resized to 512 px WebP.

Sky (`assets/sky/map.webp`): `scripts/art/sky.ts`, seed 1, shifted up by 24% of its height so the painted misty mountains sit on the horizon, the gap below filled with the horizon mist (`HORIZON_MIST` in `src/view/map.ts`).

The prompts are keyed by slot in `scripts/art/props.ts` (the first two predate that: ids `capitol-jilliath` and `mage`, same text). Cleanup is always `scripts/art/prop_cleanup.py`.

Placeholders for the M42 spike (2026-09-27): the art direction isn't settled (`docs/design/art.md`).
