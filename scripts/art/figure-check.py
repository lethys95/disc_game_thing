"""
Checks a Tripo figure before anything is built on it: its mesh, textures and rig in numbers, a GLB's inverse bind
matrices (Tripo's GLB export wrote them corrupt for a 48k, 4k rigged model), and lit renders front, side and back,
then a test pose (a leg raised, the head turned), beside the concept's views when given.
  blender -b --python scripts/art/figure-check.py -- <model.glb|.fbx> <out prefix> [concept folder: front.png, side.png, back.png]
Writes <out>-views.png (the concept above, when given; the model; the pose) and prints the numbers.
"""
import json
import math
import pathlib
import struct
import subprocess
import sys

import bpy
from mathutils import Vector

args = sys.argv[sys.argv.index("--") + 1:]
source, out = args[0], args[1]
concept = pathlib.Path(args[2]) if len(args) > 2 else None


def bind_matrices(path):
    """How many of a GLB's inverse bind matrix values are garbage (NaN or far outside a rig's range)."""
    data = pathlib.Path(path).read_bytes()
    length = struct.unpack("<I", data[12:16])[0]
    gltf = json.loads(data[20:20 + length])
    if not gltf.get("skins"):
        return None
    accessor = gltf["accessors"][gltf["skins"][0]["inverseBindMatrices"]]
    view = gltf["bufferViews"][accessor["bufferView"]]
    start = 20 + length + 8 + view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
    values = struct.unpack(f"<{16 * accessor['count']}f", data[start:start + 64 * accessor["count"]])
    return sum(1 for v in values if math.isnan(v) or abs(v) > 1e3), len(values)


bpy.ops.wm.read_factory_settings(use_empty=True)
if source.endswith(".fbx"):
    bpy.ops.import_scene.fbx(filepath=source)
else:
    bpy.ops.import_scene.gltf(filepath=source)
for o in list(bpy.data.objects):
    if o.type == "MESH" and o.name == "Icosphere":  # the importer's bone display shape
        bpy.data.objects.remove(o)
meshes = [o for o in bpy.data.objects if o.type == "MESH"]
armatures = [o for o in bpy.data.objects if o.type == "ARMATURE"]
triangles = 0
for m in meshes:
    m.data.calc_loop_triangles()
    triangles += len(m.data.loop_triangles)
report = {
    "meshes": len(meshes),
    "triangles": triangles,
    "materials": sorted({s.material.name for m in meshes for s in m.material_slots if s.material}),
    "images": sorted(f"{i.name} {i.size[0]}x{i.size[1]}" for i in bpy.data.images),
    "bones": len(armatures[0].data.bones) if armatures else 0,
    "skinned meshes": sum(1 for m in meshes if any(x.type == "ARMATURE" for x in m.modifiers)),
}
if source.endswith(".glb"):
    report["bad bind values"] = bind_matrices(source)
dg = bpy.context.evaluated_depsgraph_get()
points = [m.matrix_world @ v.co for m in meshes for v in m.evaluated_get(dg).to_mesh().vertices]
report["posed NaN vertices"] = sum(1 for p in points if any(math.isnan(c) for c in p))
report["height"] = round(max(p.z for p in points) - min(p.z for p in points), 3) if points else 0
print("FIGURE", json.dumps(report, indent=1))

scene = bpy.context.scene
engines = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items]
scene.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in engines else "BLENDER_EEVEE"
scene.render.resolution_x, scene.render.resolution_y = 600, 800
for name, rotation, energy in (("key", (50, 0, -35), 3.5), ("fill", (70, 0, 150), 1.0)):
    light = bpy.data.objects.new(name, bpy.data.lights.new(name, "SUN"))
    light.rotation_euler = tuple(math.radians(a) for a in rotation)
    light.data.energy = energy
    scene.collection.objects.link(light)
scene.world = bpy.data.worlds.new("world")
scene.world.use_nodes = True
scene.world.node_tree.nodes["Background"].inputs[0].default_value = (0.35, 0.35, 0.36, 1)
camera = bpy.data.objects.new("camera", bpy.data.cameras.new("camera"))
scene.collection.objects.link(camera)
scene.camera = camera
camera.data.type = "ORTHO"
camera.data.ortho_scale = report["height"] * 1.15 or 1.15
middle = report["height"] / 2


def shot(name, angle):
    camera.location = (4 * math.sin(angle), -4 * math.cos(angle), middle)
    camera.rotation_euler = (math.pi / 2, 0, angle)
    scene.render.filepath = f"{out}-{name}.png"
    bpy.ops.render.render(write_still=True)


# The concepts show the left side (the figure faces screen-left).
views = [("front", 0), ("side", math.pi / 2), ("back", math.pi)]
for name, angle in views:
    shot(name, angle)
if armatures:
    arm = armatures[0]
    bones = arm.pose.bones
    for bone, axis, degrees in (("thigh_l", 0, -60), ("calf_l", 0, 90), ("head", 2, 30), ("spine_02", 0, 15)):
        if bone in bones:
            bones[bone].rotation_mode = "XYZ"
            euler = [0.0, 0.0, 0.0]
            euler[axis] = math.radians(degrees)
            bones[bone].rotation_euler = euler
    bpy.context.view_layer.update()
    shot("posed", 0)

rows = []
if concept:
    rows.append(["(", *[str(concept / f"{n}.png") for n, _ in views], "-resize", "600x800^", "-gravity", "center", "-extent", "600x800", "+append", ")"])
rows.append(["(", *[f"{out}-{n}.png" for n, _ in views], "+append", ")"])
if armatures:
    rows.append(["(", f"{out}-posed.png", "-gravity", "west", "-background", "#59595c", "-extent", "1800x800", ")"])
subprocess.run(["magick", *[a for row in rows for a in row], "-append", f"{out}-views.png"], check=True)
print("FIGURE views", f"{out}-views.png")
