"""Makes a generated mesh game-ready for the map: headless Blender, glTF in and out.

    blender -b -P scripts/art/prop_cleanup.py -- <in.glb> <out.glb> [max_triangles] [texture_size]

Joins the meshes, welds seams, drops loose specks, recalculates normals, decimates to the triangle budget, scales
textures down so the file stays small, and makes materials matte. The game fits the model's size and position itself (`src/view/models.ts`).
"""

import sys
from dataclasses import dataclass

import bpy

LOOSE_SPECK_SHARE = 0.002
"""Loose parts with fewer than this share of all triangles are dropped (generator crumbs); bigger ones stay."""


@dataclass
class Options:
    source: str
    target: str
    max_triangles: int
    texture_size: int


def parse_options(argv: list[str]) -> Options:
    args = argv[argv.index("--") + 1 :] if "--" in argv else []
    if len(args) < 2:
        raise SystemExit(__doc__)
    return Options(
        source=args[0],
        target=args[1],
        max_triangles=int(args[2]) if len(args) > 2 else 12000,
        texture_size=int(args[3]) if len(args) > 3 else 1024,
    )


def triangle_count(obj: bpy.types.Object) -> int:
    return sum(len(polygon.vertices) - 2 for polygon in obj.data.polygons)


def joined_mesh() -> bpy.types.Object:
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    if not meshes:
        raise SystemExit("no mesh in the file")
    bpy.ops.object.select_all(action="DESELECT")
    for obj in meshes:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()
    return bpy.context.view_layer.objects.active


def drop_specks(obj: bpy.types.Object) -> None:
    total = triangle_count(obj)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.mesh.separate(type="LOOSE")
    bpy.ops.object.mode_set(mode="OBJECT")
    parts = [part for part in bpy.context.selected_objects if part.type == "MESH"]
    for part in parts:
        if triangle_count(part) < total * LOOSE_SPECK_SHARE:
            bpy.data.objects.remove(part, do_unlink=True)
    kept = [part for part in bpy.context.scene.objects if part.type == "MESH"]
    bpy.ops.object.select_all(action="DESELECT")
    for part in kept:
        part.select_set(True)
    bpy.context.view_layer.objects.active = kept[0]
    if len(kept) > 1:
        bpy.ops.object.join()


def weld(obj: bpy.types.Object) -> None:
    """glTF import splits vertices along every seam; weld them first, or every face reads as a loose part."""
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.remove_doubles(threshold=0.0001)
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode="OBJECT")


def decimate(obj: bpy.types.Object, max_triangles: int) -> None:
    triangles = triangle_count(obj)
    if triangles > max_triangles:
        modifier = obj.modifiers.new("decimate", "DECIMATE")
        modifier.ratio = max_triangles / triangles
        bpy.ops.object.modifier_apply(modifier=modifier.name)


def shrink_textures(size: int) -> None:
    for image in bpy.data.images:
        width, height = image.size
        if max(width, height) > size:
            scale = size / max(width, height)
            image.scale(max(1, round(width * scale)), max(1, round(height * scale)))


def matte(roughness: float) -> None:
    """Generators export fully metallic materials, which render near-black without reflections to show: stone isn't metal."""
    for material in bpy.data.materials:
        shader = material.node_tree.nodes.get("Principled BSDF") if material.node_tree else None
        if shader:
            shader.inputs["Metallic"].default_value = 0.0
            shader.inputs["Roughness"].default_value = roughness


def main() -> None:
    options = parse_options(sys.argv)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=options.source)
    obj = joined_mesh()
    before = triangle_count(obj)
    weld(obj)
    drop_specks(obj)
    obj = bpy.context.view_layer.objects.active
    decimate(obj, options.max_triangles)
    shrink_textures(options.texture_size)
    matte(0.85)
    bpy.ops.export_scene.gltf(filepath=options.target, export_format="GLB", export_image_format="WEBP")
    print(f"prop_cleanup: {before} -> {triangle_count(obj)} triangles, textures <= {options.texture_size}px, {options.target}")


main()
