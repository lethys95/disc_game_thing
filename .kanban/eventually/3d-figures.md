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
  wait, fused into the hood in this generation. In the repo as `assets/models/units/psychopomp.glb` (Blender's FBX export scaled the root bone; GLB doesn't). Walking in Unreal with springs on the cape and skirt: `disc_unreal`'s `card/3d-figures`, `shots/figures/index.html`.
- **The Seraph (2026-10-14):** `seraph#1`, checked (`shots/figures/seraph-check.html`). 27k triangles, one 4k PBR
  material. The GLB's joints had no transforms (`scripts/art/glb-joints.py` rebuilds them); the FBX (`seraph#1.zip`)
  is sound and the one to use. In the repo as `assets/models/units/seraph.glb`: wings moved whole onto `spine_03`
  (Tripo had them on the upper arms), five spring chains round the open mantle and five round the skirt, whose hem
  keeps 40% of Tripo's leg weights. Walking in Unreal (`disc_unreal`'s `card/3d-figures`); the mannequin's stride
  still shows the leading boot's toe under her hem: a gliding walk of her own would fit her.
- **The Acolyte (2026-10-14):** `acolyte#1` (FBX), sound at once: 24k triangles, one 4k PBR material, no drift. In the
  repo as `assets/models/units/acolyte.glb`: a chain down each strip of the red stole, five round the robe below the
  belt (the Seraph's), and the lantern on bones of its own (`hang_lantern_01–02`, links and lantern): Tripo put it on the forearm, and with
  the arms down it sat inside the robe. Walking in Unreal (`disc_unreal`'s `card/3d-figures`), the lantern swinging from his hand under gravity alone, the arm held a little out (`shots/figures/acolyte-check.html`).
- **The Zealot (2026-10-14):** `zealot#1` (FBX), sound at once: 19k triangles, one 4k PBR material (a 2k normal
  map), no drift. One piece of mesh, the robe fused to the armoured legs under it: `cloth-bones.py` tells the robe by
  how far it stands off the leg bones and rips it free, five chains round it (the Seraph's). Tripo made no thighs
  under the robe, so a wide swing shows a gap there. In the repo as `assets/models/units/zealot.glb`.
