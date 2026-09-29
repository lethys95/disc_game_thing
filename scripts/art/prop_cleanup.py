"""Makes a generated mesh game-ready for the map: headless Blender, glTF in and out.

    blender -b -P scripts/art/prop_cleanup.py -- <in.glb> <out.glb> [max_triangles] [texture_size] [albedo_mean]

Joins the meshes, welds seams, drops loose specks, recalculates normals, decimates to the triangle budget, scales
textures down so the file stays small, makes materials matte and, given a target, lifts a base color texture that
came out too dark (shading the concept painted in) toward that mean brightness. The game fits the model's size and position itself (`src/view/models.ts`).
"""

import sys
from dataclasses import dataclass

import bpy
import numpy

LOOSE_SPECK_SHARE = 0.002
"""Loose parts with fewer than this share of all triangles are dropped (generator crumbs); bigger ones stay."""


@dataclass
class Options:
    source: str
    target: str
    max_triangles: int
    texture_size: int
    albedo_mean: float | None


def parse_options(argv: list[str]) -> Options:
    args = argv[argv.index("--") + 1 :] if "--" in argv else []
    if len(args) < 2:
        raise SystemExit(__doc__)
    return Options(
        source=args[0],
        target=args[1],
        max_triangles=int(args[2]) if len(args) > 2 else 12000,
        texture_size=int(args[3]) if len(args) > 3 else 1024,
        albedo_mean=float(args[4]) if len(args) > 4 else None,
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


DECIMATE_PASSES = 5
"""One collapse pass often stops short on generated meshes (seams, loose islands); repeat until within budget."""


def decimate(obj: bpy.types.Object, max_triangles: int) -> None:
    for _ in range(DECIMATE_PASSES):
        triangles = triangle_count(obj)
        if triangles <= max_triangles * 1.05:
            return
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


def lift_albedo(target: float) -> None:
    """
    A gamma curve on each base color texture darker than `target` (mean luminance, 0-1, in sRGB), so it reaches it.
    A curve, not a gain: the texture's own darks and lights keep their order and nothing clips.
    """
    for material in bpy.data.materials:
        shader = material.node_tree.nodes.get("Principled BSDF") if material.node_tree else None
        links = shader.inputs["Base Color"].links if shader else ()
        image = links[0].from_node.image if links else None
        if image is None:
            continue
        pixels = numpy.empty(len(image.pixels), dtype=numpy.float32)
        image.pixels.foreach_get(pixels)
        rgba = pixels.reshape(-1, 4)
        luminance = rgba[:, :3] @ numpy.array([0.2126, 0.7152, 0.0722], dtype=numpy.float32)
        mean = float(luminance.mean())
        if mean <= 0 or mean >= target:
            continue
        low, high = 0.2, 1.0
        for _ in range(30):
            gamma = (low + high) / 2
            if float((numpy.clip(luminance, 1e-6, 1) ** gamma).mean()) < target:
                high = gamma
            else:
                low = gamma
        rgba[:, :3] = numpy.clip(rgba[:, :3], 1e-6, 1) ** gamma
        image.pixels.foreach_set(rgba.ravel())
        image.update()
        print(f"prop_cleanup: lifted {image.name} from mean {mean:.2f} to {target:.2f} (gamma {gamma:.2f})")


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
    if options.albedo_mean is not None:
        lift_albedo(options.albedo_mean)
    matte(0.85)
    bpy.ops.export_scene.gltf(filepath=options.target, export_format="GLB", export_image_format="WEBP")
    print(f"prop_cleanup: {before} -> {triangle_count(obj)} triangles, textures <= {options.texture_size}px, {options.target}")


main()
