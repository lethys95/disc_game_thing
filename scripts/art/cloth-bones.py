"""
Physics bone chains for a Tripo character, for spring physics in Unreal; which parts hang and which ride the body is
the character's (FIGURES). Moving pieces are ripped free where Tripo fused them to another part (the Psychopomp's
cape hem into the belt, her strips into the thighs); each vertex on a moving face takes its chain's share, growing
from nothing at the piece's top. Rigid pieces Tripo weighted to the wrong bones (the Seraph's wings, on the upper
arms) move whole onto one bone; a hanging thing (the Acolyte's lantern) rides two of its own, its links' and its own,
which Unreal swings under gravity alone.
Parts are either labels from a segmented generation (part-labels.py) or the mesh's own separate pieces, largest first;
a robe Tripo fused to the legs under it (the Zealot's) is told from them by how far it stands off the leg bones.
  blender -b --python scripts/art/cloth-bones.py -- <unit> <character.fbx> <out> [labels.json]   (writes <out>.glb, .blend)
"""
import bpy, bmesh, sys, json, math
from functools import cache
from collections import defaultdict
from mathutils import Vector
from mathutils.geometry import intersect_point_line
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


@cache
def neighbours():
    """Each vertex's neighbours along edges and across the FBX's UV seams."""
    tree = KDTree(len(co))
    for i, c in enumerate(co):
        tree.insert(c, i)
    tree.balance()
    near = [[] for _ in co]
    for e in mesh.data.edges:
        a, b = e.vertices
        near[a].append(b)
        near[b].append(a)
    for i, c in enumerate(co):
        near[i].extend(k for _, k, _ in tree.find_range(c, 1e-5) if k != i)
    return near


def pieces():
    """Each vertex's piece of the mesh (0 the largest)."""
    root = list(range(len(co)))

    def find(i):
        while root[i] != i:
            root[i] = root[root[i]]
            i = root[i]
        return i

    for i, near in enumerate(neighbours()):
        for k in near:
            root[find(i)] = find(k)
    groups = defaultdict(list)
    for i in range(len(co)):
        groups[find(i)].append(i)
    label = [0] * len(co)
    for n, members in enumerate(sorted(groups.values(), key=len, reverse=True)):
        for i in members:
            label[i] = n
    return label


@cache
def off_legs(clear, top, rounds=12):
    """The vertices below `top` standing more than `clear` metres off the leg bones: a robe Tripo fused to the legs
    it hangs over. The cut is smoothed over the mesh `rounds` times, or every flap pressed to a knee rips a hole."""
    legs = [(bones[n].head_local, bones[n].tail_local) for n in ("thigh_l", "calf_l", "foot_l", "thigh_r", "calf_r", "foot_r")]

    def off(v):
        """1 well off the legs, 0 on them; a vertex facing the leg is the robe's lining and goes with the robe."""
        away = min((v.co - a.lerp(b, min(1.0, max(0.0, intersect_point_line(v.co, a, b)[1]))) for a, b in legs),
                   key=lambda d: d.length)
        if v.normal.dot(away.normalized()) < -0.3:
            return 1.0
        return min(1.0, max(0.0, (away.length - clear) / 0.025 + 0.5))

    score = [off(v) if v.co.z < top else 0.0 for v in mesh.data.vertices]
    near = neighbours()
    for _ in range(rounds):
        score = [(score[i] + sum(score[k] for k in near[i])) / (1 + len(near[i])) for i in range(len(co))]
    return frozenset(i for i in range(len(co)) if score[i] > 0.5)


@cache
def centre(n):
    """The middle of piece `n`."""
    ids = [i for i in range(len(co)) if part[i] == n]
    return sum((co[i] for i in ids), Vector()) / len(ids)


def split(spread):
    """Two chains, `_l` and `_r`, overlapping `spread` metres across the spine."""
    return {"chains": {"l": None, "r": None}, "spread": spread}


def around(angles, reach, window, keep=0.0):
    """Chains round the pelvis at these angles (0 front, +90 the model's left, ±180 back): each placed through the
    vertices within `reach` degrees of it, and sharing a vertex with its neighbours within `window`. `keep` of Tripo's
    own weights stays at the hem (a long skirt that should go with the legs a little)."""
    return {"chains": angles, "reach": reach, "window": window, "keep": keep}


# family: parent bone, bones per chain, which vertices, how the chains share them. hanging: parent bone, which pieces.
FIGURES = {
    # Her labels come by nearest surface from another generation and miss where Tripo fused the cape to the belt and
    # the strips to the thighs: rip wherever moving cloth meets still.
    "psychopomp": {
        "parts": "labels",
        "rip": "moving",
        "rigid": {},
        "hanging": {},
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
        "hanging": {},
        "families": {
            "cape": ("spine_03", 4, lambda i, part: part[i] == 3 and co[i].z < CHEST,
                     around({"front_l": 35, "l": 100, "back": 180, "r": -100, "front_r": -35}, 35, 70)),
            # A chain over each shin, which pushes it forward when it steps; the hem goes with the legs a little, or
            # the mannequin's long stride brings the boots out through it.
            "skirt": ("pelvis", 3, lambda i, part: part[i] == 2,
                      around({"front_l": 25, "l": 90, "back": 180, "r": -90, "front_r": -25}, 30, 65, keep=0.4)),
        },
    },
    # Pieces: 0 the robe (body, sleeves and skirt in one), 2 and 3 the forearms, 4 and 8 the stole's front and back
    # strips; the lantern and the links it hangs by are small pieces under the right forearm, the links above them
    # wrap it. Tripo put the lantern on the forearm, so with the arms down it swung into the robe.
    "acolyte": {
        "parts": "pieces",
        "rip": "parts",
        "rigid": {},
        "hanging": {
            "lantern": ("lowerarm_r", lambda i, part: part[i] not in {0, 2} and centre(part[i]).x < -0.2
                        and centre(part[i]).z < 0.735),
        },
        "families": {
            "cape": ("spine_03", 3, lambda i, part: part[i] in {4, 8}, around({"front": 50, "back": 140}, 45, 45)),
            # Below the belt, where the robe narrows past the sleeves.
            "skirt": ("pelvis", 3, lambda i, part: part[i] == 0 and co[i].z < 0.6,
                      around({"front_l": 25, "l": 90, "back": 180, "r": -90, "front_r": -25}, 30, 65, keep=0.4)),
        },
    },
    # One piece: the robe below the belt is fused to the armoured legs it hangs over, so it is told from them by how
    # far it stands off the leg bones, and ripped free wherever it meets them. Open at the front over the legs. The hem
    # keeps most of Tripo's leg weights: at 40% the mannequin's back kick came out through the robe's back.
    "zealot": {
        "parts": "pieces",
        "rip": "moving",
        "rigid": {},
        "hanging": {},
        "families": {
            "skirt": ("pelvis", 3, lambda i, part: i in off_legs(0.057, 0.56),
                      around({"front_l": 25, "l": 90, "back": 180, "r": -90, "front_r": -25}, 30, 65, keep=0.7)),
        },
    },
    # Pieces: 0 the surcoat below the belt in one shell (the red tabard at the front, the white panels either side,
    # the red panel down the back), 7 the mail between them, 5 and 6 the tassets; the mail and tassets stay on the legs.
    # The tabard hangs between the legs on a chain of its own; the white panels' front edges ride over the thighs.
    "templar": {
        "parts": "pieces",
        "rip": "parts",
        "rigid": {},
        "hanging": {},
        "families": {
            "skirt": ("pelvis", 3, lambda i, part: part[i] == 0,
                      around({"front": 0, "front_l": 50, "l": 100, "back": 180, "r": -100, "front_r": -50}, 30, 60,
                             keep=0.5)),
        },
    },
    # Pieces: 6 the robe below the belt with the apron down its front, 0 the tunic and belt, 1 the hood and shoulder
    # cape (stiff: they stay). Everything hanging off the belt (the sash's tail, the front chain loop, the chain round
    # the right hip, the pendants, the apron's hem ornaments) rides the robe's chains; the shins and boots under it
    # stay on the legs.
    "punisher": {
        "parts": "pieces",
        "rip": "parts",
        "rigid": {},
        "hanging": {},
        "families": {
            "skirt": ("pelvis", 3, lambda i, part: part[i] not in {17, 18, 26, 27, 28, 31, 32, 41, 42, 59, 60}
                      and 0.115 < centre(part[i]).z < 0.5 and abs(centre(part[i]).x) < 0.2,
                      around({"front": 0, "front_l": 50, "l": 100, "back": 180, "r": -100, "front_r": -50}, 30, 60,
                             keep=0.5)),
        },
    },
    # Pieces: 0 and 1 the wings, 4 the torn skirt (open at the front over the legs), 12 the red tabard between them, 35
    # and 36 the strips down the back, 31, 37 and 61, 60 the front strips and their pendants, 54 and 55 the hem's. The
    # book (48) sits on her left hip with a chain looped under it, another chain on the right hip: both stay on the
    # pelvis whole, as Tripo split them over the thigh and the hand that rests on the book. The wings, as the Seraph's.
    "paragon": {
        "parts": "pieces",
        "rip": "parts",
        "rigid": {0: "spine_03", 1: "spine_03"} | {n: "pelvis" for n in (
            48, 25, 26, 40, 45, 62, 63, 64, 65, 68, 76, 77, 78, 79, 80, 82, 83, 84, 85, 86, 94,
            18, 24, 39, 66, 69, 70, 71, 72, 73, 74, 91)},
        "hanging": {},
        "families": {
            "skirt": ("pelvis", 3, lambda i, part: part[i] in {4, 12, 31, 35, 36, 37, 54, 55, 60, 61},
                      around({"front": 0, "front_l": 50, "l": 100, "back": 180, "r": -100, "front_r": -50}, 30, 60,
                             keep=0.5)),
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
# A hanging thing is its links and, on them, its largest piece: a bone each, straight down from the top, every piece
# riding whole the one it hangs on.
hangs = {}
for name, (parent, picks) in figure["hanging"].items():
    ids = [i for i in range(len(co)) if picks(i, part)]
    top = co[max(ids, key=lambda i: co[i].z)]
    body = max({part[i] for i in ids}, key=lambda n: sum(1 for i in ids if part[i] == n))
    joint = max(co[i].z for i in ids if part[i] == body)
    links, held = eb.new(f"hang_{name}_01"), eb.new(f"hang_{name}_02")
    links.head, links.tail = top, Vector((top.x, top.y, joint))
    held.head, held.tail = links.tail, Vector((top.x, top.y, min(co[i].z for i in ids)))
    links.parent, held.parent, held.use_connect = eb[parent], links, True
    hangs.update({i: links.name if centre(part[i]).z > joint else held.name for i in ids})
bpy.ops.object.mode_set(mode="OBJECT")
for name in set(hangs.values()):
    mesh.vertex_groups.new(name=name)

for v in mesh.data.vertices:
    bone = hangs.get(orig[v.index]) or figure["rigid"].get(part[orig[v.index]])
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
    keep = figure["families"][fam][3].get("keep", 0.0)
    s = sum(ramp(by_name[n], co[i].z) * w for n, w in parts.items()) * (1 - keep)
    if s <= 0:
        continue
    for g in v.groups:
        mesh.vertex_groups[g.group].add([v.index], g.weight * (1 - s), "REPLACE")
    for n, w in parts.items():
        c = by_name[n]
        part_share = ramp(c, co[i].z) * w * (1 - keep)
        seg = (c["top"] - c["bottom"]) / c["count"]
        pos = min(c["count"] - 1e-6, max(0.0, (c["top"] - co[i].z) / seg - 0.5))
        k, f = int(pos), pos - int(pos)
        groups[c["bones"][k]].add([v.index], part_share * (1 - f), "ADD")
        if k + 1 < c["count"]:
            groups[c["bones"][k + 1]].add([v.index], part_share * f, "ADD")

print("CHAINS", [c["name"] for c in chains], "HANGING", sorted(set(hangs.values())), "RIPPED", len(rip))
bpy.ops.wm.save_as_mainfile(filepath=out + ".blend")
# glTF, not FBX: Blender's FBX puts its metres-to-centimetres on the root bone (a scale of 100 in the reference pose),
# which a retargeted animation drops, shrinking the figure to a hundredth in Unreal. glTF has no units to convert.
bpy.ops.export_scene.gltf(
    filepath=out + ".glb", export_format="GLB", export_skins=True, export_animations=False, export_morph=False,
    export_image_format="AUTO", export_yup=True,
)
