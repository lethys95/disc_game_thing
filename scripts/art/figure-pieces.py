"""
The loose parts of an unsegmented Tripo figure: the pieces of its one mesh that don't touch, largest first (numbered as
cloth-bones.py numbers them), with each one's size and bounds, and a sheet with each highlighted front and back to tell
which number is what.
  blender -b --python scripts/art/figure-pieces.py -- <model.fbx> <out prefix> [count, default 16]
Writes <out>-sheet.png.
"""
import colorsys
import math
import subprocess
import sys
from collections import defaultdict

import bpy
from mathutils.kdtree import KDTree

args = sys.argv[sys.argv.index("--") + 1:]
source, out = args[0], args[1]
count = int(args[2]) if len(args) > 2 else 16

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=source)
mesh = [o for o in bpy.data.objects if o.type == "MESH"][0]
co = [v.co.copy() for v in mesh.data.vertices]

# The same grouping as cloth-bones.py's pieces(): edges, and vertices the FBX split at UV seams.
tree = KDTree(len(co))
for i, c in enumerate(co):
    tree.insert(c, i)
tree.balance()
root = list(range(len(co)))


def find(i):
    while root[i] != i:
        root[i] = root[root[i]]
        i = root[i]
    return i


for e in mesh.data.edges:
    root[find(e.vertices[0])] = find(e.vertices[1])
for i, c in enumerate(co):
    for _, k, _ in tree.find_range(c, 1e-5):
        root[find(i)] = find(k)
groups = defaultdict(list)
for i in range(len(co)):
    groups[find(i)].append(i)
pieces = sorted(groups.values(), key=len, reverse=True)
label = [0] * len(co)
lines = []
for n, members in enumerate(pieces):
    for i in members:
        label[i] = n
    if n < count:
        lo = [min(co[i][a] for i in members) for a in range(3)]
        hi = [max(co[i][a] for i in members) for a in range(3)]
        lines.append(f"PIECE {n}: {len(members)} vertices, " + ", ".join(
            f"{axis} {a:.2f}..{b:.2f}" for axis, a, b in zip("xyz", lo, hi)))
print("\n".join(lines + [f"PIECES {len(pieces)}"]))

colors = mesh.data.color_attributes.new("piece", "FLOAT_COLOR", "POINT")
scene = bpy.context.scene
scene.render.engine = "BLENDER_WORKBENCH"
scene.display.shading.color_type = "VERTEX"
scene.display.shading.light = "STUDIO"
scene.render.resolution_x, scene.render.resolution_y = 300, 400
camera = bpy.data.objects.new("camera", bpy.data.cameras.new("camera"))
scene.collection.objects.link(camera)
scene.camera = camera
camera.data.type = "ORTHO"
camera.data.ortho_scale = 1.15


def shot(path, angle):
    camera.location = (4 * math.sin(angle), -4 * math.cos(angle), 0.5)
    camera.rotation_euler = (math.pi / 2, 0, angle)
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


def paint(highlight):
    for i, d in enumerate(colors.data):
        if highlight is None:
            rgb = colorsys.hsv_to_rgb((label[i] * 0.618) % 1, 0.8, 0.9) if label[i] < count else (0.5, 0.5, 0.5)
        else:
            rgb = (1, 0.15, 0.1) if label[i] == highlight else (0.6, 0.6, 0.6)
        d.color = (*rgb, 1)
    mesh.data.update()


tiles = []
for n in range(min(count, len(pieces))):
    paint(n)
    shot(f"{out}-{n}-front.png", 0)
    shot(f"{out}-{n}-back.png", math.pi)
    subprocess.run(["magick", f"{out}-{n}-front.png", f"{out}-{n}-back.png", "+append", "-gravity", "north",
                    "-pointsize", "28", "-annotate", "+0+5", str(n), f"{out}-{n}.png"], check=True)
    tiles.append(f"{out}-{n}.png")
subprocess.run(["magick", "montage", *tiles, "-tile", "4x", "-geometry", "+4+4", f"{out}-sheet.png"], check=True)
print("PIECES sheet", f"{out}-sheet.png")
