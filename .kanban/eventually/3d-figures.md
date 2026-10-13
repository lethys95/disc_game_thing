# 3D battle figures

- **What:** Tripo models from the picked turnarounds (`shots/tripo/`), replacing the paper standees.
- **When (the user, 2026-10-07):** not before most units exist, at least every playable faction's: "we're not going
  continue making 3d models before we have most of the units of the game". Then the known ones via Tripo first,
  before anything as picky as the sky-silhouette angel.
- **Why:** Standees are stand-ins, not what ships.
- **Not local (the user, 2026-10-11):** "We've just tried all blender and local and whatever else, and we cannot compete
  with Tripo." Claude doesn't make models; it integrates Tripo's.
- **Done when:** 
- **Who:** The user (Tripo is the user's account); Claude integrates.
- **The first (2026-10-13):** the user started with the Psychopomp in Tripo, for Unreal ("We're moving this project
  to ue5 […] for the quality reasons"). What the tests settled: one unsegmented mesh, PBR textures, about 48k
  triangles, 4k, Tripo's rig (61 bones named like Unreal's mannequin), FBX (Tripo's GLB wrote the rig's bind matrices
  corrupt at this size). Loose cloth gets bone chains for spring physics (`scripts/art/cloth-bones.py`); the braids
  wait, fused into the hood in this generation. In the repo as `assets/models/units/psychopomp.fbx`.

