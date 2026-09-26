# Blender tree experiment: notes

A Grove tree ("life and death intertwined") built fully procedurally in Blender 5.2.2,
headless, across iterations. Each `iter-NN/tree.py` is self-contained:
`cd iter-NN && blender -b --python-exit-code 1 -P tree.py` rebuilds the mesh, renders
`hero.png`, `game.png` (+ `game_x3.png`, a nearest-neighbour 3x blow-up for inspection) and
`silhouette.png`, and exports `tree.glb`.

## Lessons (rewritten as I go; final after 8 iterations)

**Best: iteration 08** (copied to `final/`, 3,056 triangles). Read the Final section at the bottom.

*What made the tree read at map scale*
- **Judge at the player's pixel size, every iteration.** The hero render flattered every
  version; the 256 px game view (and its 3x nearest-neighbour blow-up) was where problems
  showed. Match the game camera numerically: from `src/view/map.ts`, camera offset (-3, 11, 11.2)
  from its target (three.js y-up = Blender (-3, -11.2, 11)), FOV 40, hex radius 1, forest tile
  top 0.24. At 720p that's about 62 px per unit, so a 256 px frame needs a vertical FOV of about
  14.7 deg at the same distance. Lights: warm key sun from (-6, -8, 12), blue rim from
  (8, 10, 5), hemisphere 0.9, which is roughly a Blender world strength of 0.9/pi.
- **Silhouette comes from contrast of gesture, not detail.** What worked: stilt roots (gaps
  under the trunk), a heavy drooping mass on one side against a pale arm reaching up/out on the
  other. A round canopy on a stick reads as a lollipop from every side, whatever its shading.
- **Value contrast beats hue.** Dark bark vs bone-pale dead wood is what makes the life/death
  split legible at 90 px; green vs brown didn't. Keep the accent to 2-3 deliberate places
  (charms, a vein, mushrooms): once violet is sprinkled everywhere it turns to noise.
- **Mind luminance when mixing colors into vertex colors.** A 24% share of a color 8x brighter
  than the base dominates the perceived color, and per-vertex interpolation on low-sided tubes
  smears it over whole faces. And compute colors from *vertex* normals, not face normals, or the
  mesh looks faceted even with smooth shading.
- **Warm key light shifts green to olive/yellow.** Pick greens cooler than the target
  (0x5a9046 lands on moss green under the 0xffd6a8 key with AgX).

*Techniques*
- **Build meshes with `from_pydata`**: tubes along parallel-transport frames, tips collapsed to
  a point, per-corner colors written at build time. Exact control of triangles and colors.
- **Organic canopy = union of spheres -> voxel Remesh -> Displace (Clouds) -> Decimate**, then
  color. It turns gem-like icospheres into one soft lumpy mass at about 1k triangles.
- **Separate RNG streams for structure and decoration.** With one stream, adding a random call
  for a strand reshuffled the whole tree (iteration 07 lost its composition this way).
- **Charms as elongated octahedra (8 tris)** read as pendants/crystals; icospheres at that size
  read as hex nuts.
- **Verify the export by re-importing it** into an empty scene and rendering the game view from
  the .glb alone (see `final/tree.py`).

*Blender 5.2 API gotchas*
- Headless rendering works: EEVEE (`BLENDER_EEVEE`), Workbench, and Cycles (OptiX on both 3090
  Tis). EEVEE at 256-1024 px takes about a second, so iteration is cheap.
- Compositor: `scene.use_nodes`/`scene.node_tree` are gone. Create a `CompositorNodeTree`
  group, add an output socket to its `interface`, end in `NodeGroupOutput`, assign it to
  `scene.compositing_node_group`. The Glare node's type is an input socket of type MENU:
  `inputs["Type"].default_value = 'Bloom'`.
- `Material.use_nodes` / `World.use_nodes` are deprecated (still work, warn).
- Emission above about 3 under AgX goes near-white; 2.5 plus bloom stays violet.
- glTF: a `BYTE_COLOR`/`CORNER` attribute feeding Base Color through `ShaderNodeVertexColor`
  exports as `COLOR_0`. The warning "The active Vertex Color will not be exported" refers to the
  *other* (emissive) material and is harmless, as is the ERROR "MeshOptimizer is not available".
  Emission exports as `emissiveFactor` + `KHR_materials_emissive_strength`; backface culling
  exports as `doubleSided: false`.
- Workbench silhouettes: `display.shading.light='FLAT'`, `color_type='SINGLE'`; the background
  is `world.color`. Stitch views with numpy through `bpy.data.images`.
- `bpy.ops.wm.read_factory_settings(use_empty=True)` gives a clean scene (without it the factory
  cube sits at the origin). Don't hold Python references to objects across a helper that deletes
  them (`ReferenceError: StructRNA ... has been removed`).

---

## Iteration 01: a forked tree, living half and dead half

**Built.** Trunk (7-sided tube) forks at 0.6: a living limb to -x carrying five pairs of
icosphere foliage blobs, a dead limb to +x with six kinked, pointed branches. Eight roots
sprawl along the ground. Violet emissive: three shelf fungi on the trunk, six charms hanging on
threads from the dead branches. Colors are vertex colors chosen by the vertex's x position
(living = -x, dead = +x). Two materials: `tree_vc` (vertex color) and `tree_glow` (emissive).

**Triangles: 1,252.**

**What the renders show.**
- Hero: reads as "a lollipop tree with a stick next to it". The canopy is five faceted
  icosahedra: crystalline, cheap-looking, and too yellow (moss green under a warm key and AgX
  turns olive-yellow). The trunk is one uniform tan: coloring by x position put the whole trunk
  on the seam (x ~ 0 -> 50/50 blend), so neither dark living bark nor pale dead wood shows.
  The dead limb is thin and short; it's a minor feature, not half the tree. The charms read
  as a violet string of beads, which is nice. Roots read well: the sprawl is the best part.
- Game view (~80 px tall at 720p scale): a yellow-green blob on the left and a tan scribble
  with violet dots. The life/death split is barely legible; the dead half is a few pixels wide.
  The violet dots do survive at this size. The shadow is big and dark blue.
- Silhouette: from front/back it is a lollipop with a twig. From the sides the dead half
  disappears behind the trunk entirely. Nothing about the outline says "dead" or "Grove".

**Problems hit.** None blocking. Spurious vertex-color warning (see Lessons).

**Plan for 02.**
1. Make the dead half an equal partner in the silhouette: a big antler/claw-like dead crown,
   branching two levels, pale bone color, reaching wider than the canopy.
2. Color by part, not by position: each branch carries a "life" value; the trunk gets a vertical
   gradient and a split (dark, mossy bark on the living side, bleached wood on the dead side).
3. Organic canopy: union the foliage spheres with a voxel remesh, then decimate, then color;
   drooping, heavier masses rather than gems. Cooler, darker green.
4. Hanging vines from the living canopy (the psychopomp's dripping vines).

---

## Iteration 02: color by part, remeshed canopy, antler crown

**Changed.** Colors now come from the part and the surface direction, not world x: the trunk
is split by the ring's outward vector (-x face dark bark with moss, +x face bleached wood),
living branches are dark/mossy, dead branches bone-pale with a gradient toward the tips.
Canopy: seven subdiv-2 icospheres unioned by a voxel Remesh (0.035) then Decimate (0.12), then
colored per corner by height and upward facing (dark underside, lighter top). The dead limb
ends in a recursive antler crown (3 limbs x 2 forks x 2-3 tines). Violet fungus shelves moved
to the camera-facing seam; charms hang from the tines. Vines drip from under the canopy.
Materials set to backface culling (glTF `doubleSided: false`).

**Triangles: 2,140** (canopy ~900 after decimation).

**What the renders show.**
- Hero: much better. The canopy is a soft, lumpy, organic mass (the remesh-then-decimate trick
  works). The dead crown reads as a pale *grasping hand* reaching up with violet charms hanging
  from its fingers: an accidental but strong image. Weak: the crown is compact, half the
  canopy's size, so the tree is still "a green tree with a hand on the side". The trunk reads
  mostly pale from this angle; the dark living bark is on the shadowed left and lost. Roots are
  all pale (their ring normals point up/down, so the x-split made them all "dead"). The four
  fungus shelves stack into a ladder of violet hexagons: artificial. The vines are invisible
  (dark green on shadow).
- Game view: legible for the first time: a green ball on the left, a pale hand with violet dots
  on the right, pale roots. Still generic ("a tree"), and the canopy is a ball.
- Silhouette: front and back show the split; both side views are a lollipop again, and the
  canopy's outline is a smooth circle with nothing to catch the eye.

**Problems hit.** `bpy.ops.object.modifier_apply` needs the object active; fine headless.

**Plan for 03.**
1. Stilt roots: lift the trunk on arching roots (gaps under the trunk read at any size and
   echo the psychopomp's root-legs). Living-side roots dark and mossy, dead-side roots pale.
2. A much bigger dead crown, reaching higher than the canopy: asymmetric outline.
3. Canopy with more, droopier lobes and thick hanging moss beards in a lighter green, so the
   underside breaks the round outline.
4. Trunk seam as a half-turn spiral: life and death literally twisting around each other, and
   both colors visible from the game camera.
5. Fungus in one organic cluster of mixed sizes rather than a ladder.

---

## Iteration 03: stilt roots, spiral seam, big antler crown, moss beards

**Changed.** The trunk now starts at z 0.18 and stands on seven arching stilt roots (living side:
dark, with creeping tendrils past the foot; dead side: pale and snapped short). The trunk's
living/dead seam twists half a turn (`theta = z * 3.2`). The dead crown got a longer limb, four
antlers and reaches above the canopy. The canopy is nine smaller, flatter lobes; 27 thick moss
beards hang from its rim. The fungus shelves are one cluster.

**Triangles: 2,736.**

**What the renders show.**
- Silhouette: the breakthrough. Gaps under the trunk (stilt roots), a round canopy against a
  spiky antler, and beards fringing the canopy's underside: interesting from all four sides for
  the first time; the two side views no longer read as lollipops.
- Hero: the antler crown is a big pale hand with violet charms: the strongest element.
  Problems: the living roots and lower trunk came out olive-green ("celery sticks"); the two
  snapped dead roots are straight pale planks that don't touch the ground and look like props
  leaning on the tree. The canopy is still yellowish broccoli.
- Game view: reads as green blob + pale claw + legs, with violet dots in the claw. The planks
  read as two pale lines sticking out: distracting.

## Iteration 04: violet seam vein, bloom, diamond charms, darker palette

**Changed.** Violet emissive veins follow both seams of the twisting trunk ("where life meets
death"). Charms are elongated octahedra (8 tris each), a quarter swapped for pale bone beads.
Emission strength 5 -> 2.5 and compositor bloom added to the hero/game views. Canopy
recolored: mostly deep green, chartreuse only on lit, high faces. Dead roots now reach the
ground with jitter; a third are snapped. Less moss on living bark (intended).

**Triangles: 2,663.**

**What the renders show.**
- Hero: the best so far. The diamond charms plus bloom look like actual charms/lanterns; the
  veins make the trunk glow from inside at the seam. But the fungus shelf cluster now sits on
  the vein and looks like a zipper or stitches: remove it. The living roots are *still* olive:
  the moss test has an `out.z` term and horizontal roots show their up-facing side to the
  camera, so nearly every visible root face is moss. The canopy is still faceted broccoli and
  the top still reads yellow-olive under the warm key.
- Game view: violet now reads in three places (claw charms, glowing trunk core), which gives
  the tree a clear accent. The claw and the green mass read. Roots read as green spokes.
- Silhouette: unchanged in character; good.

**Problems hit.** Blender 5 compositor: `scene.use_nodes` + `scene.node_tree` is gone; make a
`CompositorNodeTree` node group with an output socket on its interface, end it in a
`NodeGroupOutput`, and assign it to `scene.compositing_node_group`. The Glare node's type is
now an input socket of type MENU (`inputs["Type"].default_value = 'Bloom'`), not a property.
Emission at 5 under AgX desaturates to near-white; 2.5 plus bloom keeps it violet.

**Plan for 05.** Fix the root moss (drop the up-facing bias); replace the zipper fungus with
glowing mushroom caps in the dead roots' feet (fungus feeding on death, and violet at the base
to balance the charms up top); a lumpier, less faceted canopy with cooler highlights; a broken
stub on the dead limb.

---

## Iteration 05: mushrooms at the dead roots, lumpier canopy, snapped stub

**Changed.** Removed the zipper fungus; 2-3 glowing mushroom caps (hexagonal cone caps, 12
tris) grow at the feet of each dead root. Canopy: each lobe gets three satellite spheres, a
Clouds-texture Displace between Remesh and Decimate, and smooth shading. A snapped stub on the
dead limb. Moss threshold raised.

**Triangles: 2,758.**

**What the renders show.**
- Mushrooms work: at game scale they put violet at the base as well as in the crown, which
  balances the tree vertically, and "fungus feeding on the dead roots" is on-theme.
- The living roots were *still* olive. Measured the vertex colors on those faces: only ~24%
  moss, but the moss color is about 8x the luminance of the dark bark, and per-vertex
  interpolation across a 5-sided tube smears each moss vertex over whole faces. Brightness
  contrast, not frequency, was the problem.
- The canopy still looked faceted despite `use_smooth`: the color used `poly.normal.z` (a
  per-face value), so every triangle got its own flat color. Faceting came from the vertex
  colors, not the shading.
- The canopy is lumpier; still olive-yellow on top under the warm key.

## Iteration 06: weeping curtains, smooth canopy color, muted moss

**Changed.** Moss darkened to a muted 0x2f4220. Canopy color uses the *vertex* normal (smooth)
and a cooler green (0x5a9046 highlights) that lands on moss green under the warm key rather
than olive. The beards became 45 longer weeping strands (3-sided, dark at the root, chartreuse
at the tip). The living side hangs heavy; the dead side reaches up.

**Triangles: 2,887.**

**What the renders show.**
- Hero: the most coherent version. Dark umber living roots vs pale bone dead roots finally
  read as two different things. The canopy is a soft moss-green cloud with no faceting. The
  weeping strands give the canopy a drooping underside, but they look like spikes or icicles
  (3-sided cones, brightest at the tip), not soft moss. The pale dead limb emerges from the
  dark trunk like a sleeve: an abrupt color cut at the fork.
- Game view: the best read: a green weeping mass on the left, a pale bony hand with violet
  sparks on the right, dark legs, violet core and violet mushrooms at the pale roots. The
  canopy's color no longer fights the violet.
- Silhouette: the weeping fringe adds a strong texture under the canopy in all four views.

**Plan for 07.** Test the generator (three seeds side by side at game scale: a map needs
variety); a gradient where the dead limb leaves the trunk, with the vein continuing up it;
softer, swaying strands whose color peaks mid-length; a few violet buds among the strands so
the "pulse" touches the living half too.

---

## Iteration 07: seed variants, charred joint, soft strands, violet buds

**Changed.** `build_tree(materials, seed, name)`; the script also renders `game_seeds.png`:
seeds 11/23/37 on a row of forest tiles, rotated -18/0/+22 deg, at map pixel scale. The dead
limb burns out of dark bark into pale wood (`charred_color`) and carries a violet vein. Strands
have four segments, sway, and peak in color mid-length; 15% end in a small violet bud.

**Triangles: 3,180** (seed 23: 3,075; seed 37: 3,266).

**What the renders show.**
- Seed sheet: the three variants read as one species with individual shapes, and all three keep
  the left-green / right-bone split even when rotated +-20 deg. The generator is robust.
- But seed 11 itself got *worse*: every extra `rng` call for the strands shifted every later
  draw, so the dead limb and crown changed; the crown now tucks behind the canopy and the
  clean split of iteration 06 is gone. One RNG stream for structure and decoration couples them.
- The limb vein reads as a dashed line: the offset direction wasn't perpendicular to the limb's
  tangent, so the thin tube dips in and out of the surface.
- The violet buds in the strands plus the charms, veins and mushrooms make violet sparkle
  everywhere: at game scale it turns from "an accent" into "noise". Iteration 06's three
  places (crown, core, roots) was more disciplined.
- Strands: softer than 06's icicles, still a bit spiky at hero scale; fine at game scale.

**Problems hit.** `clear_scene_extras` had already deleted the variants; removing them again
raised `ReferenceError: StructRNA of type Object has been removed`. Don't hold Python
references to objects across a helper that deletes them.

**Plan for 08 (final).** Separate RNG streams for structure and decoration; push the dead limb
and antlers firmly to +x so the split never collapses; drop the strand buds; make the limb
vein continuous (offset perpendicular to the tangent); favor diamonds over beads. Then export
and verify the .glb by re-importing it into a clean scene and rendering the game view from the
imported file.

---

## Iteration 08: separate RNG streams, firm split, disciplined violet (best)

**Changed.** Two RNG streams per tree: `rng` for structure (trunk, limbs, roots, crown) and
`deco` for decoration (strands, charms, mushrooms), so decorative tweaks no longer reshuffle the
tree. The dead limb and antlers point firmly to +x. Strand buds removed; violet is back to
three places (crown charms, trunk-and-limb vein, mushrooms at the dead roots). The limb vein is
offset perpendicular to the limb's tangent and is now continuous. Charms 85% violet diamonds.

**Triangles: 3,056** (seed 23: 3,093; seed 37: 3,106).

**What the renders show.**
- Hero: the clearest statement of the idea: a soft moss-green weeping mass on the left; on the
  right a pale arm reaching out of a charred joint, its hand hung with violet diamonds; a violet
  vein climbing from the roots, along the twisting seam, up the arm; dark living roots vs pale
  dead roots with glowing mushrooms at their feet. Weak spots: the charred joint reads as a dark
  cuff (a sleeve and a wrist); the strands are still a bit spiky; the canopy has no internal
  depth (it's one smooth cloud with no dark gaps or branches showing through); the violet vein
  on the arm is slightly neon.
- Game view (~90 px tall at 720p): the best read of all iterations. Green mass, pale reaching
  hand, a violet line connecting roots to crown, violet sparks in the hand and at the feet.
  The life/death split is legible at a glance.
- Seed sheet: all three variants hold the split and read as one species.
- Silhouette: canopy + fringe vs an arm with hanging charms; stilt roots with gaps; mushrooms
  as little pips at the base. Interesting from all four sides.

**Problems hit.** None.

---

## Final (`final/`)

`final/tree.py` is iteration 08 plus a round-trip check: after exporting, it resets Blender,
imports `final/tree.glb` into an empty scene and renders the game view from the file alone
(`game_from_glb.png`). That render is indistinguishable from the source render, and the
importer reports 1 mesh, 3,056 triangles, materials `tree_vc` + `tree_glow`, and a `Color`
attribute: vertex colors, both materials and emission survive glTF.

- `tree.glb`: 101 KB, 3,056 triangles, one mesh, two primitives (vertex-colored rough
  material; violet emissive with `KHR_materials_emissive_strength` 2.5), `doubleSided: false`.
  Bounds (glTF y-up): 1.5 tall, about 1.46 wide, 1.1 deep, origin at the base. Sized as **one
  tree per hex** (the current placeholder trees are 0.5-0.85 tall, three per hex).
- Renders: `hero.png`, `game.png` / `game_x3.png`, `game_seeds.png` / `game_seeds_x2.png`,
  `silhouette.png`, `game_from_glb.png` / `game_from_glb_x3.png`.
- No separate hero-detail .glb was made.

**Using it in three.js:** `GLTFLoader` turns `COLOR_0` on automatically. The glow material
wants the map's bloom to read as in these renders. The split only reads if the tree's living
side faces screen-left: keep yaw within about +-25 deg of the export orientation (the seed sheet
shows +-20 deg is fine). The map camera doesn't orbit, so that holds.

**Candid assessment.** It reads at map scale, and it says "half alive, half dead, Grove magic"
at a glance, which the cones don't. It is not yet shippable art: the shading is clean vector
low-poly while the chosen 2D direction is ink brush with hard black; the canopy is a smooth
blob with no internal structure; the strands are spiky; the charred joint looks like a cuff.
It would pass as a strong placeholder or a style probe for the map.

**Next three iterations, if continued.**
1. Ink treatment: hard black accents painted into the vertex colors (crevices, the undersides
   of the roots, a dry-brush darkening at the canopy's lower edge), plus an inverted-hull
   outline on the big shapes only (canopy, trunk, arm) to test whether a brush-like contour
   helps figure/ground at map scale. It fits the budget (about 900 tris spare).
2. Canopy structure: carve two or three dark gaps (remesh the lobes with less overlap, or
   boolean-subtract spheres) so the limb shows through, and turn the strands into flat
   tapered ribbons that bend, softer than cones.
3. Variants and LOD: a smaller "sapling" and a "fully dead" variant from the same generator for
   forest tiles (three per hex, like the current layout), and a 1,000-triangle LOD, then drop
   the .glb into the actual map and judge it in the game's own renderer (ACES, fog, real bloom).
