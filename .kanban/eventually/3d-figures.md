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
  how far it stands off the leg bones and rips it free, five chains round it (the Seraph's), the hem keeping 70% of
  Tripo's leg weights: at 40% the mannequin's back kick came out through the robe. Tripo made no thighs under the
  robe, so a wide swing shows a gap there. In the repo as `assets/models/units/zealot.glb`; walking in Unreal
  (`disc_unreal`'s `card/3d-figures`, `shots/figures/zealot-check.html`).
  Made a new way (the user): one HD model at 2 million vertices, retopologized down, where the others came from
  Tripo's Smart mesh straight at game topology. The bake gives him a normal map with real relief (the others' are
  nearly flat), at the cost of one welded shell and a 2k normal map
  (`shots/figures/normal-maps-acolyte-vs-zealot.jpg`).
- **The Templar (2026-10-14):** `templar#1` (FBX), sound at once: 31k triangles, one 4k PBR material (a 4k normal map
  with real relief), no drift. Smart mesh again: the surcoat below the belt is its own piece, tabard, white panels and
  back panel in one shell, so nothing ripped. In the repo as `assets/models/units/templar.glb`: six chains round the
  surcoat, the red tabard on its own between the legs, the hem keeping half of Tripo's leg weights. Walking in Unreal
  (`disc_unreal`'s `card/3d-figures`, `shots/figures/templar-check.html`).
- **The Punisher (2026-10-17):** `punisher#1` (FBX), sound at once: 34k triangles, one 4k PBR material, no drift. Smart
  mesh: the robe below the belt its own piece, the apron part of it. In the repo as `assets/models/units/punisher.glb`:
  six chains round the robe (the Templar's), the apron on the front one; the sash's tail, the chains and the pendants
  hanging off the belt ride the robe's chains; the hem keeps 70% of Tripo's leg weights (at half the robe swung off
  the leading shin). The hood and shoulder cape stay stiff. The mannequin's back kick still brings a boot out
  through the back of the floor-length robe: a walk of his own would fit him.
- **The Paragon (2026-10-17):** `paragon#1` (FBX), sound at once: 43k triangles, one 4k PBR material, no drift. In the
  repo as `assets/models/units/paragon.glb`: wings moved whole onto `spine_03` (the Seraph's), six chains round the
  torn skirt with the red tabard on the front one, and the book on her left hip with its chain, and the chain on her
  right hip, riding the pelvis whole.
- **The Reclaimer (2026-10-17):** `reclaimer#1` came without a rig; `reclaimer#2` (FBX) is rigged and sound: 43k
  triangles, one 4k PBR material, no drift. Plate throughout, so no chains: her wings, separate pieces, ride
  `spine_03` whole (the Seraph's). In the repo as `assets/models/units/reclaimer.glb`.
- **The Chosen, Pontiff and Shepherd (2026-10-17):** `chosen#1`, `pontiff#1`, `shepherd#1` (FBX), all sound at once:
  35–38k triangles, one 4k PBR material, no drift. The Chosen is plate: no chains. The Pontiff, one shell, gets six
  chains round the robe below the belt and his censer on bones of its own from the belt (the Acolyte's lantern). The
  Shepherd's wings ride `spine_03` whole, five chains round her skirt. Both hems keep most of Tripo's leg weights
  (85% and 70%); still, the mannequin's full stride brings the leading leg out through both robes and the back
  kick a boot behind, with or without the springs: walks of their own (a shuffle, a glide) would fit them. In the repo as
  `assets/models/units/<unit>.glb`, walking in Unreal (`shots/figures/{chosen,pontiff,shepherd}-check.html`).
- **Still to model (2026-10-28):** `shots/tripo/to-model.html` lists every unit with a picked concept and no model
  (58 on 2026-10-28), its views from `shots/tripo/<unit>/` to download for Tripo; the Custodian (one front view), the Cyclops, the
  bandits, the Cutpurse and the Snakeoiler were split for it today.
