# Model sources

Every model here was generated locally; the recipe regenerates it exactly.

| File | Concept (Krea-2 Turbo via ComfyUI) | Mesh | Cleanup |
|---|---|---|---|
| `site/capitol-jilliath.glb` | `scripts/art/props.ts`, id `capitol-jilliath`, seed 2 | TRELLIS v1 (Microsoft, MIT), `~/programs/image-to-3d/run_trellis1.sh`, defaults | `scripts/art/prop_cleanup.py`, 12000 triangles, 1024 px |
| `structure/mage.glb` | `scripts/art/props.ts`, id `mage`, seed 3 | TRELLIS v1, defaults | `scripts/art/prop_cleanup.py`, 6000 triangles, 1024 px |
| `site/capitol-nexus.glb` | `scripts/art/props.ts`, slot `site/capitol-nexus`, seed 2 | TRELLIS v1, defaults | 12000 triangles, 1024 px |
| `site/city.glb` | slot `site/city`, seed 3 | TRELLIS v1 | 10000, 1024 px |
| `structure/merchant.glb` | slot `structure/merchant`, seed 1 | TRELLIS v1 | 6000, 1024 px |
| `structure/mercenaries.glb` | slot `structure/mercenaries`, seed 3 | TRELLIS v1 | 6000, 1024 px |
| `node/gold.glb` | slot `node/gold`, seed 1 | TRELLIS v1 | 5000, 1024 px |
| `node/blacksmith.glb` | slot `node/blacksmith`, seed 2 | TRELLIS v1 | 5000, 1024 px |
| `node/mana.glb` | slot `node/mana`, seed 1 | TRELLIS v1 | 5000, 1024 px |
| `node/cathedral.glb` | slot `node/cathedral`, seed 2 | TRELLIS v1 | 5000, 1024 px |
| `lair/dungeon.glb` | slot `lair/dungeon`, seed 2 | TRELLIS v1 | 5000, 1024 px |
| `terrain/<kind>-<n>.glb` (trees 1–4, mountains 1–3, hills 1–2, rocks 1–2, bushes 1–2) | `scripts/art/props.ts`, slot `terrain/<kind>-<n>`, seed 1 | TRELLIS v1 | trees, hills 3000; mountains 5000; rocks, bushes 2000; 512 px |

Ground textures (`assets/art/ground/<terrain>-<n>.webp`): `scripts/art/ground.ts`, seeds 1–3, resized to 512 px WebP.

The prompts are keyed by slot in `scripts/art/props.ts` (the first two predate that: ids `capitol-jilliath` and `mage`, same text). Cleanup is always `scripts/art/prop_cleanup.py`.

Placeholders for the M42 spike (2026-09-27): the art direction isn't settled (`docs/design/art.md`).
