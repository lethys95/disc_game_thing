---
name: tripo-figure
description: Turn a unit's Tripo model into a rigged 3D figure that walks in Unreal - the Tripo settings that worked, the checks every download gets, physics bone chains for its capes, skirts and strips, the GLB export, and the import into disc_unreal with retargeted motions and spring physics. Use when the user hands over a Tripo model (a .glb, .fbx or zip in ~/Downloads), asks what settings to use in Tripo, or asks to get a figure into Unreal. Worked out on the Psychopomp, 2026-10-13.
---

# A Tripo model to a figure that walks in Unreal

The user makes the models in Tripo (their account; `eventually/3d-figures`); Claude checks them, rigs their loose
cloth and brings them into Unreal (`disc_unreal`, which reads this repo's committed assets). The Psychopomp went
through every step on 2026-10-13: `assets/models/units/psychopomp.glb`, `shots/figures/index.html`. Claude never
calls Tripo itself unless `~/.claude/CLAUDE.md` grants it (it doesn't, as of 2026-10-13).

## 1. What to ask Tripo for
Input: the unit's front, side and back from `shots/tripo/<unit>/` (one folder per unit, one image per view).
- **One mesh, unsegmented.** Segmentation gave 35 pieces with 35 materials and textures shrunk to the piece (down to
  128 px). Ask for one segmented generation too only when part labels are needed (step 3).
- **PBR textures** (colour, normal, roughness/metal); colour alone looked flat under Unreal's light.
- **About 48k triangles, quad topology if offered**; 11k looked faceted in the fur. **4k textures** for Unreal.
- **Rigged** (Tripo's rig: 61 bones named like Unreal's UE4 mannequin, which makes retargeting automatic).
- **Download FBX.** Tripo's GLB export wrote the rig's inverse bind matrices corrupt at this size (twice, the same
  bytes); its FBX of the same model was fine. Files go to `art/candidates/models/units/<unit>/` (not committed).

## 2. Check every download
`blender -b --python scripts/art/figure-check.py -- <model> <out> shots/tripo/<unit>` prints the numbers (triangles,
materials, textures, bones, skinned meshes, a GLB's bad bind values, NaN vertices once posed, height) and writes
`<out>-views.png`: the concept, the model front/side/back under light, and a test pose. Look at it. Red flags: bad
bind values above 0 or NaN vertices (a broken rig: the model collapses when posed), more than one material, a height
far from 1 (Tripo's are a metre tall), a pose that tears or pinches.

## 3. Which parts dangle (the one step that is the unit's)
Read the concept and the unit's sheet: a cape, a skirt's flaps, long strips, a tabard. Hair or braids that the
generation fused into a hood stay rigid (the Psychopomp's). Each dangling part needs its vertices named:
- **Part labels from a segmented generation:** `blender -b --python scripts/art/part-labels.py -- <segmented.glb>
  <model.fbx> <out>` gives every vertex the part of the nearest segmented surface (median 5 mm on a 1 m figure) and
  renders the parts in colours; a per-part sheet (each part highlighted, front and back) tells which number is what.
  Segmentation keeps a hood and its cape as one part: split those by position (behind the body, below the neck).
- `scripts/art/cloth-bones.py` holds the Psychopomp's choices in its constants (`SKIRT_PARTS`, the cape's rule, the
  chains: two down the cape under `spine_03`, four round the skirt under `pelvis`). A second unit gets its own: move
  them into a per-unit setting when it comes, not before.

## 4. Chains, rips and weights
`blender -b --python scripts/art/cloth-bones.py -- <model.fbx> <labels.json> <out>` adds the chains, rips the moving
pieces free where Tripo fused them to the body (the cape's hem into the belt, strips into the thighs: without the
rips they tore into long sheets), ramps each chain's weight in from nothing at the piece's top, and writes
`<out>.glb` and `<out>.blend`. Then `blender -b <out>.blend --python scripts/art/cloth-check.py -- <out>`: it swings
the chains a little and counts edges stretched past twice their length (the Psychopomp: 14 of 53,544, all in one
skirt panel; 501 before the rips) and renders the swing. Tears near zero, and the pieces hang, or fix it first.

**Always GLB out of Blender, never FBX:** Blender's FBX puts its metres-to-centimetres on the root bone (a scale of 100
in the reference pose). The figure renders at rest in Unreal, but a retargeted animation writes the root's scale as 1
and it shrinks to a hundredth, invisible.

## 5. Into the repo
Copy `<out>.glb` to `assets/models/units/<unit>.glb` (a model slot per unit: `MODEL_CHAINS.figure`), add a paragraph
to `assets/models/SOURCES.md` (which test, which settings, which chains), `pnpm check`, commit. The commit is what
Unreal reads.

## 6. In Unreal (`../disc_unreal`, its own rules: read its `CLAUDE.md` first)
Work on a card branch in a sibling worktree when another session is in its main (`git worktree add
../disc_unreal_<card> -b card/<card>`, copy `node_modules`, `Import`, `Content`, `Binaries`, `Intermediate` from main).
- `pnpm snapshot <new_disc commit>`, add the unit to `FIGURES` in `Scripts/editor/import_figures.py`, then
  `Scripts/editor_py.sh Scripts/editor/import_figures.py`: imports the GLB, copies the UE4 mannequin from the
  engine's Third Person template, retargets its idle, walk and run onto the figure (IK Rigs auto-generated; the
  retargeter aligns her T pose to its A pose). `DISC_FIGURE_<UNIT>=<file.glb>` tries a file before committing it.
- `Scripts/figure.sh <unit> <out> [size] [seconds…]` (`MOTION=idle|walk|run|none`, `NOSPRINGS=1`): the figure alone
  on a lit floor walking a circle. Look at the shots. A sequence every 0.1 s with and without springs, side by side
  in an mp4, goes in this repo's `shots/figures/` for the user.
- The springs are `UFigureAnimInstance` (C++, no Blueprint: the project allows none): chains found by name
  (`cape_*_01`, `skirt_*_01`), verlet particles pulled to the animated pose, gravity, a 45° swing limit, capsules
  round the spine and legs that never push a joint past where it rests.

## Gotchas met
- Unreal culled the figure as a few centimetres big: its bounds came from the physics asset the import made.
  `bComponentUseFixedSkelBounds`.
- A player controller without a pawn takes the view back from a camera unless `bAutoManageActiveCameraTarget` is off.
- glTF imports into subfolders by kind; the script renames the mesh to `/Game/Figures/<unit>/<unit>`. Renaming the
  skeleton too broke the mesh's reference to it.
- Figures face +Y at rest. The probe once walked her backwards (yaw off by 180°).
- An asset that already exists can't be recreated headless (the editor can't ask): reuse it.
