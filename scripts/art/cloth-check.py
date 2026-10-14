"""
Checks the physics bone chains cloth-bones.py added: swings every chain a little (as a spring would on a walk) and
counts the edges stretched past twice their length (tearing: a piece still fused to what stays put, or two chains
pulling one piece apart), then renders the swing from the side and back, mild and doubled.
  blender -b <out>.blend --python scripts/art/cloth-check.py -- <out prefix>
The Psychopomp's passed with 14 of 53,544 edges stretched, all inside one skirt panel; before the pieces were ripped
free there were 501.
"""
import math
import subprocess
import sys
from collections import Counter

import bpy

out = sys.argv[sys.argv.index("--") + 1]
arm = [o for o in bpy.data.objects if o.type == "ARMATURE"][0]
mesh = [o for o in bpy.data.objects if o.type == "MESH" and o.name != "Icosphere"][0]
chains = sorted({b.name.rsplit("_", 1)[0] for b in arm.pose.bones if b.name.startswith(("cape_", "skirt_"))})


def lengths():
    me = mesh.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh()
    return [(me.vertices[e.vertices[0]].co - me.vertices[e.vertices[1]].co).length for e in me.edges]


def swing(scale):
    """Capes and front and back flaps swing about their bones' X, side flaps about Z; each bone a few degrees."""
    for b in arm.pose.bones:
        chain = b.name.rsplit("_", 1)[0]
        if chain not in chains:
            continue
        b.rotation_mode = "XYZ"
        side = chain.endswith(("_l", "_r")) and chain.startswith("skirt")
        sign = -1 if chain in ("skirt_front", "skirt_r") else 1
        euler = [0.0, 0.0, 0.0]
        euler[2 if side else 0] = math.radians(8 * scale * sign)
        b.rotation_euler = euler
    bpy.context.view_layer.update()


rest = lengths()
swing(1)
posed = lengths()
torn = [e for e, a, b in zip(mesh.data.edges, rest, posed) if a > 1e-6 and b / a > 2.0]
groups = {g.index: g.name for g in mesh.vertex_groups}


def top(i):
    weights = sorted(mesh.data.vertices[i].groups, key=lambda g: -g.weight)
    return groups[weights[0].group] if weights else "-"


print("CLOTH chains", chains)
print("CLOTH stretched past twice", len(torn), "of", len(mesh.data.edges))
print("CLOTH by bone pair", Counter((top(e.vertices[0]), top(e.vertices[1])) for e in torn).most_common(8))

scene = bpy.context.scene
engines = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items]
scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in engines else "BLENDER_EEVEE"
scene.render.resolution_x, scene.render.resolution_y = 600, 800
sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
sun.rotation_euler = (math.radians(50), 0, math.radians(-35))
sun.data.energy = 3.5
scene.collection.objects.link(sun)
scene.world = bpy.data.worlds.new("world")
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0.35, 0.35, 0.36, 1)
camera = bpy.data.objects.new("camera", bpy.data.cameras.new("camera"))
scene.collection.objects.link(camera)
scene.camera = camera
camera.data.type = "ORTHO"
camera.data.ortho_scale = 1.15
shots = []
for scale in (0, 1, 2):
    swing(scale)
    for name, angle in (("side", math.pi / 2), ("back", math.pi)):
        camera.location = (4 * math.sin(angle), -4 * math.cos(angle), 0.5)
        camera.rotation_euler = (math.pi / 2, 0, angle)
        scene.render.filepath = f"{out}-swing{scale}-{name}.png"
        bpy.ops.render.render(write_still=True)
        shots.append(scene.render.filepath)
rows = [["(", *[s for s in shots if f"-{v}.png" in s], "+append", ")"] for v in ("side", "back")]
subprocess.run(["magick", *[a for r in rows for a in r], "-append", f"{out}-swing.png"], check=True)
print("CLOTH swing (rest, mild, doubled)", f"{out}-swing.png")
