"""
Physics bone chains for a Tripo character (the Psychopomp first, 2026-10-13): two chains down the cape, four round
the skirt, for spring physics in Unreal. Moving pieces are ripped free where Tripo fused them to the body (the
cape's hem into the belt, strips into the thighs); each vertex on a moving face takes its chain's share, growing
from nothing at the piece's top. Which parts move is the character's: the part numbers come from part-labels.py.
  blender -b --python scripts/art/cloth-bones.py -- <character.fbx> <labels.json> <out>   (writes <out>.glb, .blend)
"""
import bpy, bmesh, sys, json, math
from mathutils import Vector

fbx, labels_file, out = sys.argv[-3], sys.argv[-2], sys.argv[-1]
labels = json.load(open(labels_file))["labels"]

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=fbx)
arm = [o for o in bpy.data.objects if o.type == "ARMATURE"][0]
mesh = [o for o in bpy.data.objects if o.type == "MESH"][0]
bones = arm.data.bones
co = [v.co.copy() for v in mesh.data.vertices]

SKIRT_PARTS = {1, 5, 7, 13, 19, 20, 24, 27, 28, 30, 34}
CAPE_TOP = bones["spine_03"].head_local.z + 0.02
PELVIS = bones["pelvis"].head_local
RAMP = 0.25  # the chain's share grows from nothing at a piece's top to all of it this far down

cape = [i for i in range(len(co)) if labels[i] == 0 and co[i].y > 0.015 and co[i].z < CAPE_TOP]
skirt = [i for i in range(len(co)) if labels[i] in SKIRT_PARTS]


def angle(c):
    """Around the pelvis: 0 front, +90 the model's left (+x), ±180 back."""
    return math.degrees(math.atan2(c.x - PELVIS.x, -(c.y - PELVIS.y)))


def chain(name, family, members, parent, count):
    zs = [co[i].z for i in members]
    top, bottom = max(zs), min(zs)
    joints = []
    for k in range(count + 1):
        z = top - (top - bottom) * k / count
        near = [co[i] for i in members if abs(co[i].z - z) < (top - bottom) / count / 1.5] or [co[i] for i in members]
        joints.append(Vector((sum(c.x for c in near) / len(near), sum(c.y for c in near) / len(near), z)))
    return {"name": name, "family": family, "parent": parent, "joints": joints, "top": top, "bottom": bottom, "count": count}


SECTORS = {"skirt_front": 0, "skirt_l": 90, "skirt_back": 180, "skirt_r": -90}
sector_members = {n: [i for i in skirt if abs(((angle(co[i]) - a + 180) % 360) - 180) < 90] for n, a in SECTORS.items()}
chains = [
    chain("cape_l", "cape", [i for i in cape if co[i].x >= 0], "spine_03", 4),
    chain("cape_r", "cape", [i for i in cape if co[i].x < 0], "spine_03", 4),
    *[chain(n, "skirt", sector_members[n], "pelvis", 3) for n in SECTORS],
]
by_name = {c["name"]: c for c in chains}


def ramp(c, z):
    t = (c["top"] - z) / (c["top"] - c["bottom"])
    s = min(1.0, max(0.0, t / RAMP))
    return s * s * (3 - 2 * s)


# Each moving vertex: its share for the chains, and how that share splits among them.
blend = {}
for i in cape:
    left = by_name["cape_l"]
    w = min(1.0, max(0.0, 0.5 + co[i].x / 0.06))  # the two cape chains overlap across the spine
    blend[i] = {"cape_l": w, "cape_r": 1 - w}
for i in skirt:
    a = angle(co[i])
    weights = {n: max(0.0, 1 - abs(((a - s + 180) % 360) - 180) / 90) for n, s in SECTORS.items()}
    total = sum(weights.values())
    blend[i] = {n: w / total for n, w in weights.items() if w > 0}
def blend_for(fam, c):
    if fam == "cape":
        w = min(1.0, max(0.0, 0.5 + c.x / 0.06))
        return {"cape_l": w, "cape_r": 1 - w}
    a = angle(c)
    weights = {n: max(0.0, 1 - abs(((a - s + 180) % 360) - 180) / 90) for n, s in SECTORS.items()}
    total = sum(weights.values())
    return {n: w / total for n, w in weights.items() if w > 0}


share = {i: sum(ramp(by_name[n], co[i].z) * w for n, w in parts.items()) for i, parts in blend.items()}
family = {i: by_name[next(iter(parts))]["family"] for i, parts in blend.items()}

# Rip moving pieces free where Tripo fused them to what stays put (the cape's hem into the belt, strips into the
# thighs), and the cape from the skirt it overlaps.
bm = bmesh.new()
bm.from_mesh(mesh.data)
origin = bm.verts.layers.int.new("origin")
for v in bm.verts:
    v[origin] = v.index
def face_class(f):
    """The family a face moves with (cape, skirt) once its vertices are mostly past their attachment, else body."""
    ids = [v[origin] for v in f.verts]
    moving = [family[i] for i in ids if share.get(i, 0.0) > 0.3]
    return max(set(moving), key=moving.count) if len(moving) * 2 >= len(ids) else "body"


classes = {f.index: face_class(f) for f in bm.faces}
rip = [e for e in bm.edges if len({classes[f.index] for f in e.link_faces}) > 1]
bmesh.ops.split_edges(bm, edges=rip)
bm.faces.ensure_lookup_table()
moves = []
for v in bm.verts:
    kinds = [classes[f.index] for f in v.link_faces if f.index in classes] or [face_class(f) for f in v.link_faces]
    moving = [k for k in kinds if k != "body"]
    moves.append(max(set(moving), key=moving.count) if len(moving) * 2 > len(kinds) else None)
bm.to_mesh(mesh.data)
orig = [v[origin] for v in bm.verts]
bm.free()

bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode="EDIT")
eb = arm.data.edit_bones
for c in chains:
    parent = eb[c["parent"]]
    c["bones"] = []
    for k in range(c["count"]):
        b = eb.new(f"{c['name']}_{k + 1:02d}")
        b.head, b.tail = c["joints"][k], c["joints"][k + 1]
        b.parent = parent
        b.use_connect = k > 0
        parent = b
        c["bones"].append(b.name)
bpy.ops.object.mode_set(mode="OBJECT")

groups = {}
for c in chains:
    for n in c["bones"]:
        groups[n] = mesh.vertex_groups.new(name=n)
for v in mesh.data.vertices:
    fam = moves[v.index]
    if fam is None:
        continue
    i = orig[v.index]
    parts = blend[i] if i in blend and family[i] == fam else blend_for(fam, co[i])
    s = sum(ramp(by_name[n], co[i].z) * w for n, w in parts.items())
    if s <= 0:
        continue
    for g in v.groups:
        mesh.vertex_groups[g.group].add([v.index], g.weight * (1 - s), "REPLACE")
    for n, w in parts.items():
        c = by_name[n]
        part = ramp(c, co[i].z) * w
        seg = (c["top"] - c["bottom"]) / c["count"]
        pos = min(c["count"] - 1e-6, max(0.0, (c["top"] - co[i].z) / seg - 0.5))
        k, f = int(pos), pos - int(pos)
        groups[c["bones"][k]].add([v.index], part * (1 - f), "ADD")
        if k + 1 < c["count"]:
            groups[c["bones"][k + 1]].add([v.index], part * f, "ADD")

print("RIPPED", len(rip))
bpy.ops.wm.save_as_mainfile(filepath=out + ".blend")
# glTF, not FBX: Blender's FBX puts its metres-to-centimetres on the root bone (a scale of 100 in the reference pose),
# which a retargeted animation drops, shrinking the figure to a hundredth in Unreal. glTF has no units to convert.
bpy.ops.export_scene.gltf(
    filepath=out + ".glb", export_format="GLB", export_skins=True, export_animations=False, export_morph=False,
    export_image_format="AUTO", export_yup=True,
)
