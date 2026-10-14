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
- **One mesh, unsegmented, always.** Segmentation gave 35 pieces with 35 materials and textures shrunk to the piece
  (down to 128 px). Never ask for a segmented generation: the parts step 3 needs come from the unsegmented mesh's own
  loose parts.
- **PBR textures** (colour, normal, roughness/metal); colour alone looked flat under Unreal's light.
- **Two ways to the game mesh.** *Smart mesh* generates straight at game topology (the Psychopomp, Seraph, Acolyte):
  separate shells per garment (step 3's pieces come free), but a near-flat normal map lifted from the colour. *HD
  then retopology* (the Zealot, 2026-10-14: a 2-million-vertex HD model retopologized to 19k triangles): a normal
  map baked from the HD sculpt, with real plates, rivets and folds, far better under light; but one welded shell (the
  robe fused to the legs: `off_legs` in step 3), nothing modelled where clothing hid it (hollow thighs), and the
  normal map came at 2k.
- **About 48k triangles, quad topology if offered**; 11k looked faceted in the fur. **4k textures** for Unreal.
- **Rigged** (Tripo's rig: 61 bones named like Unreal's UE4 mannequin, which makes retargeting automatic).
- **Download FBX.** Tripo's GLB export wrote the rig's inverse bind matrices corrupt at this size (twice, the same
  bytes); its FBX of the same model was fine. The Seraph's GLB (2026-10-14) had sound bind matrices but no transform
  on any joint: `blender -b --python scripts/art/glb-joints.py -- <in.glb> <out.glb>` rebuilds them from the bind
  matrices. Files go to `art/candidates/models/units/<unit>/` (not committed).

## 2. Check every download
`blender -b --python scripts/art/figure-check.py -- <model> <out> shots/tripo/<unit>` prints the numbers (triangles,
materials, textures, bones, skinned meshes, a GLB's bad bind values, NaN vertices once posed, height) and writes
`<out>-views.png`: the concept, the model front/side/back under light, and a test pose. Look at it. Red flags: bad
bind values above 0, skin drift at rest above a millimetre, or NaN vertices (a broken rig: the model collapses at rest
or when posed), more than one material, a height
far from 1 (Tripo's are a metre tall), a pose that tears or pinches.

## 3. Which parts dangle (the one step that is the unit's)
Read the concept and the unit's sheet: a cape, a skirt's flaps, long strips, a tabard. Hair or braids that the
generation fused into a hood stay rigid (the Psychopomp's). Each dangling part needs its vertices named:
- **The mesh's own loose parts:** an unsegmented Tripo mesh is still one material but several pieces of geometry that
  don't touch (the Seraph's: wings, hood, mantle, skirt, sleeves, belt, feet; the Acolyte's: robe, mantle, stole
  strips, forearms, and the lantern in twenty bits). `blender -b --python scripts/art/figure-pieces.py -- <model.fbx>
  <out> [count]` prints the largest pieces' sizes and bounds and writes `<out>-sheet.png`, each piece highlighted
  front and back, which tells which number is what. Pieces that are really apart need no rips.
- **A robe fused to the legs** (the Zealot's: the whole figure one piece): `off_legs(clear, top)` in
  `cloth-bones.py` picks what stands more than `clear` off the leg bones below `top`, or faces them (the lining),
  smoothed over the mesh so flaps pressed to a knee don't rip holes; `"rip": "moving"` tears it free of the legs.
  Check the pick in colour before rigging, and look under it: Tripo leaves the legs hollow where the robe hid them.
- (The Psychopomp alone takes its parts from labels, `scripts/art/part-labels.py`, transferred from a segmented test
  generation made before the rule above; nothing new goes that way.)
- Each unit's choices are its entry in `FIGURES` in `scripts/art/cloth-bones.py`: where its parts come from (labels
  or pieces), which pieces ride one bone whole (the Seraph's wings on `spine_03`), and each family of chains (`cape`,
  `skirt`), placed either left and right of the spine or round the pelvis at given angles. The Psychopomp: two down
  the cape, four round the skirt. The Seraph: five round the mantle (open at the front), five round the skirt (one over
  each shin), whose hem keeps 40% of Tripo's leg weights: on chains alone, the mannequin's long stride brought her boots
  out through the hem.
- **Hanging things** (the Acolyte's lantern on its links) ride two bones of their own straight down, `hang_<name>_01`
  for the links and `_02` for the thing (its largest piece), each piece whole; Unreal swings them under gravity alone,
  so the lantern hangs from the wrist whatever the arm does. (One bone has no direction for Unreal's springs: a
  chain's last bone points the way its parent does.) Tripo weights such a thing to the limb it hangs from, and with the arms down it swings into the body.

## 4. Chains, rips and weights
`blender -b --python scripts/art/cloth-bones.py -- <unit> <model.fbx> <out>` adds the chains, moves the
rigid pieces, rips the moving pieces free where Tripo fused them to the body (the cape's hem into the belt, strips into the thighs: without the
rips they tore into long sheets), ramps each chain's weight in from nothing at the piece's top, and writes
`<out>.glb` and `<out>.blend`. Then `blender -b <out>.blend --python scripts/art/cloth-check.py -- <out>`: it swings
the chains a little and counts edges stretched past twice their length (the Psychopomp: 14 of 53,544, all in one
skirt panel; 501 before the rips. The Seraph: none of 30,455, nothing ripped) and renders the swing. Tears near zero, and the pieces hang, or fix it first.

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
  (every `cape_*_01`, `skirt_*_01` in the skeleton), verlet particles pulled to where the chain would hang with its parent bone upright (the walk's lean taken out, or a
  strip on a leaning back points down and back with it), gravity, a 45° swing limit, capsules
  round the spine and legs that never push a joint past where it rests. Hanging chains (`hang_*_01`) swing under
  gravity alone: no pull, no capsules, light damping, at most 40° from straight down, and the upper arm they hang
  from held 20° out from the body.

## Gotchas met
- Unreal culled the figure as a few centimetres big: its bounds came from the physics asset the import made.
  `bComponentUseFixedSkelBounds`.
- A player controller without a pawn takes the view back from a camera unless `bAutoManageActiveCameraTarget` is off.
- glTF imports into subfolders by kind; the script renames the mesh to `/Game/Figures/<unit>/<unit>`. Renaming the
  skeleton too broke the mesh's reference to it.
- Figures face +Y at rest. The probe once walked her backwards (yaw off by 180°).
- Tripo's material comes single-sided: Blender hides back faces and a hood's inside reads as see-through
  (`two-sided` in the check). Unreal does the same unless its material is made two-sided.
- Tripo weights what it can't place to the nearest limb: the Seraph's wings followed the upper arms. Lower the arms in
  the check (the walk holds them about 55° down); wings that are their own mesh pieces move whole onto `spine_03`.
  (Her repaired GLB also tore its sleeves with the arms down; her FBX, with the same weights, didn't. Another reason
  for FBX.)
- A hanging thing needs its own physics, not the cloth's (the Acolyte's lantern, 2026-10-14): the pull to the
  animated pose turns it with the limb; the capsules' pushes become speed and fling it; the cloth's damping is a drag
  against the world that holds its fall below a walking hand's speed, so it trails like a flag.
- Image sequences from `figure.sh`: `LC_ALL=C seq` for the times, or the locale's decimal commas break `disc.After`.
- An asset that already exists can't be recreated headless (the editor can't ask): reuse it.
