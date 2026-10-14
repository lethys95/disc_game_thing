"""
Physics bone chains for a Tripo character, for spring physics in Unreal; which parts hang and which ride the body is
the character's (FIGURES). Moving pieces are ripped free where Tripo fused them to another part (the Psychopomp's
cape hem into the belt, her strips into the thighs); each vertex on a moving face takes its chain's share, growing
from nothing at the piece's top. Rigid pieces Tripo weighted to the wrong bones (the Seraph's wings, on the upper
arms) move whole onto one bone.
Parts are either labels from a segmented generation (part-labels.py) or the mesh's own separate pieces, largest first.
  blender -b --python scripts/art/cloth-bones.py -- <unit> <character.fbx> <out> [labels.json]   (writes <out>.glb, .blend)
"""
import bpy, bmesh, sys, json, math
from collections import defaultdict
from mathutils import Vector
from mathutils.kdtree import KDTree

args = sys.argv[sys.argv.index("--") + 1:]
unit, fbx, out = args[:3]
labels_file = args[3] if len(args) > 3 else None

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=fbx)
arm = [o for o in bpy.data.objects if o.type == "ARMATURE"][0]
mesh = [o for o in bpy.data.objects if o.type == "MESH"][0]
bones = arm.data.bones
co = [v.co.copy() for v in mesh.data.vertices]
PELVIS = bones["pelvis"].head_local
CHEST = bones["spine_03"].head_local.z + 0.02
RAMP = 0.25  # the chain's share grows from nothing at a piece's top to all of it this far down


def pieces():
    """Each vertex's piece of the mesh (0 the largest), joining vertices the FBX split at UV seams."""
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
    label = [0] * len(co)
    for n, members in enumerate(sorted(groups.values(), key=len, reverse=True)):
        for i in members:
            label[i] = n
    return label


def split(spread):
    """Two chains, `_l` and `_r`, overlapping `spread` metres across the spine."""
    return {"chains": {"l": None, "r": None}, "spread": spread}


def around(angles, reach, window):
    """Chains round the pelvis at these angles (0 front, +90 the model's left, ±180 back): each placed through the
    vertices within `reach` degrees of it, and sharing a vertex with its neighbours within `window`."""
    return {"chains": angles, "reach": reach, "window": window}


# family: parent bone, bones per chain, which vertices, how the chains share them.
FIGURES = {
    # Her labels come by nearest surface from another generation and miss where Tripo fused the cape to the belt and
    # the strips to the thighs: rip wherever moving cloth meets still.
    "psychopomp": {
        "parts": "labels",
        "rip": "moving",
        "rigid": {},
        "families": {
            "cape": ("spine_03", 4, lambda i, part: part[i] == 0 and co[i].y > 0.015 and co[i].z < CHEST, split(0.06)),
            "skirt": ("pelvis", 3, lambda i, part: part[i] in {1, 5, 7, 13, 19, 20, 24, 27, 28, 30, 34},
                      around({"front": 0, "l": 90, "back": 180, "r": -90}, 90, 90)),
        },
    },
    # Pieces: 0 and 1 the wings, 2 the white skirt, 3 the black mantle, open at the front.
    "seraph": {
        "parts": "pieces",
        "rip": "parts",
        "rigid": {0: "spine_03", 1: "spine_03"},
        "families": {
            "cape": ("spine_03", 4, lambda i, part: part[i] == 3 and co[i].z < CHEST,
                     around({"front_l": 35, "l": 100, "back": 180, "r": -100, "front_r": -35}, 35, 70)),
            "skirt": ("pelvis", 3, lambda i, part: part[i] == 2,
                      around({"front": 0, "l": 90, "back": 180, "r": -90}, 90, 90)),
        },
    },
}
figure = FIGURES[unit]
part = json.load(open(labels_file))["labels"] if figure["parts"] == "labels" else pieces()


def angle(c):
    return math.degrees(math.atan2(c.x - PELVIS.x, -(c.y - PELVIS.y)))


def apart(a, b):
    return abs(((a - b + 180) % 360) - 180)


def chain(name, family, members, parent, count):
    zs = [co[i].z for i in members]
    top, bottom = max(zs), min(zs)
    joints = []
    for k in range(count + 1):
        z = top - (top - bottom) * k / count
        near = [co[i] for i in members if abs(co[i].z - z) < (top - bottom) / count / 1.5] or [co[i] for i in members]
        joints.append(Vector((sum(c.x for c in near) / len(near), sum(c.y for c in near) / len(near), z)))
    return {"name": name, "family": family, "parent": parent, "joints": joints, "top": top, "bottom": bottom, "count": count}


def shares(family, c):
    """How a vertex at `c` splits among its family's chains."""
    rule = figure["families"][family][3]
    if "spread" in rule:
        w = min(1.0, max(0.0, 0.5 + c.x / rule["spread"]))
        return {f"{family}_l": w, f"{family}_r": 1 - w}
    a = angle(c)
    weights = {f"{family}_{n}": max(0.0, 1 - apart(a, s) / rule["window"]) for n, s in rule["chains"].items()}
    total = sum(weights.values())
    return {n: w / total for n, w in weights.items() if w > 0}


members = {}
chains = []
for family, (parent, count, picks, rule) in figure["families"].items():
    members[family] = [i for i in range(len(co)) if picks(i, part)]
    for n, s in rule["chains"].items():
        if "spread" in rule:
            mine = [i for i in members[family] if (co[i].x >= 0) == (n == "l")]
        else:
            mine = [i for i in members[family] if apart(angle(co[i]), s) < rule["reach"]]
        chains.append(chain(f"{family}_{n}", family, mine, parent, count))
by_name = {c["name"]: c for c in chains}


def ramp(c, z):
    t = (c["top"] - z) / (c["top"] - c["bottom"])
    s = min(1.0, max(0.0, t / RAMP))
    return s * s * (3 - 2 * s)


blend = {i: shares(family, co[i]) for family, ids in members.items() for i in ids}
share = {i: sum(ramp(by_name[n], co[i].z) * w for n, w in parts.items()) for i, parts in blend.items()}
family = {i: by_name[next(iter(parts))]["family"] for i, parts in blend.items()}

# Rip moving pieces free where Tripo fused them to what stays put, and the cape from the skirt it overlaps: everywhere
# moving cloth meets still, or only where two parts meet (within one, the weights ramp in smoothly and stay joined).
bm = bmesh.new()
bm.from_mesh(mesh.data)
origin = bm.verts.layers.int.new("origin")
for v in bm.verts:
    v[origin] = v.index


def face_class(f):
    """The family a face moves with once its vertices are mostly past their attachment, else body."""
    ids = [v[origin] for v in f.verts]
    moving = [family[i] for i in ids if share.get(i, 0.0) > 0.3]
    return max(set(moving), key=moving.count) if len(moving) * 2 >= len(ids) else "body"


def face_part(f):
    ids = [part[v[origin]] for v in f.verts]
    return max(set(ids), key=ids.count)


classes = {f.index: face_class(f) for f in bm.faces}
face_parts = {f.index: face_part(f) for f in bm.faces}
rip = [e for e in bm.edges if len({classes[f.index] for f in e.link_faces}) > 1
       and (figure["rip"] == "moving" or len({face_parts[f.index] for f in e.link_faces}) > 1)]
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

for v in mesh.data.vertices:
    bone = figure["rigid"].get(part[orig[v.index]])
    if bone is None:
        continue
    for g in list(v.groups):
        mesh.vertex_groups[g.group].remove([v.index])
    mesh.vertex_groups[bone].add([v.index], 1.0, "REPLACE")

groups = {}
for c in chains:
    for n in c["bones"]:
        groups[n] = mesh.vertex_groups.new(name=n)
for v in mesh.data.vertices:
    fam = moves[v.index]
    if fam is None:
        continue
    i = orig[v.index]
    parts = blend[i] if i in blend and family[i] == fam else shares(fam, co[i])
    s = sum(ramp(by_name[n], co[i].z) * w for n, w in parts.items())
    if s <= 0:
        continue
    for g in v.groups:
        mesh.vertex_groups[g.group].add([v.index], g.weight * (1 - s), "REPLACE")
    for n, w in parts.items():
        c = by_name[n]
        part_share = ramp(c, co[i].z) * w
        seg = (c["top"] - c["bottom"]) / c["count"]
        pos = min(c["count"] - 1e-6, max(0.0, (c["top"] - co[i].z) / seg - 0.5))
        k, f = int(pos), pos - int(pos)
        groups[c["bones"][k]].add([v.index], part_share * (1 - f), "ADD")
        if k + 1 < c["count"]:
            groups[c["bones"][k + 1]].add([v.index], part_share * f, "ADD")

print("CHAINS", [c["name"] for c in chains], "RIPPED", len(rip))
bpy.ops.wm.save_as_mainfile(filepath=out + ".blend")
# glTF, not FBX: Blender's FBX puts its metres-to-centimetres on the root bone (a scale of 100 in the reference pose),
# which a retargeted animation drops, shrinking the figure to a hundredth in Unreal. glTF has no units to convert.
bpy.ops.export_scene.gltf(
    filepath=out + ".glb", export_format="GLB", export_skins=True, export_animations=False, export_morph=False,
    export_image_format="AUTO", export_yup=True,
)
