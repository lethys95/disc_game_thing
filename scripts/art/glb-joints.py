"""
Rebuilds a GLB's joint transforms from its inverse bind matrices. Tripo's GLB export of the Seraph (2026-10-14) wrote
every joint node without a transform, so the skin collapsed onto the origin at rest; the bind matrices were sound.
  blender -b --python scripts/art/glb-joints.py -- <in.glb> <out.glb>
"""
import json
import pathlib
import struct
import sys

from mathutils import Matrix

args = sys.argv[sys.argv.index("--") + 1:]
source, target = args[0], args[1]

data = pathlib.Path(source).read_bytes()
length = struct.unpack("<I", data[12:16])[0]
gltf = json.loads(data[20:20 + length])
binary = data[20 + length:]
skin = gltf["skins"][0]
accessor = gltf["accessors"][skin["inverseBindMatrices"]]
view = gltf["bufferViews"][accessor["bufferView"]]
start = 8 + view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
values = struct.unpack_from(f"<{16 * accessor['count']}f", binary, start)
nodes = gltf["nodes"]
parent = {child: index for index, node in enumerate(nodes) for child in node.get("children", [])}

bind = {}
for k, joint in enumerate(skin["joints"]):
    columns = values[16 * k:16 * k + 16]
    bind[joint] = Matrix([columns[row::4] for row in range(4)]).inverted()
for joint, world in bind.items():
    up = parent.get(joint)
    local = bind[up].inverted() @ world if up in bind else world
    translation, rotation, scale = local.decompose()
    node = nodes[joint]
    node.pop("matrix", None)
    node["translation"] = list(translation)
    node["rotation"] = [rotation.x, rotation.y, rotation.z, rotation.w]
    if max(abs(s - 1) for s in scale) > 1e-3:
        node["scale"] = list(scale)
    else:
        node.pop("scale", None)

text = json.dumps(gltf, separators=(",", ":")).encode()
text += b" " * (-len(text) % 4)
header = b"glTF" + struct.pack("<II", 2, 12 + 8 + len(text) + len(binary))
pathlib.Path(target).write_bytes(header + struct.pack("<I", len(text)) + b"JSON" + text + binary)
print("JOINTS rebuilt", len(bind), "->", target)
