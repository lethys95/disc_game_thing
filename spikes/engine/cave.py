"""Builds the bake-off's cave: a rough rock chamber with a hole in its roof, a floor, and a bonfire's logs and stones.

    blender -b -P spikes/engine/cave.py -- <out.glb>

Rock and floor use the game's ground textures (`assets/ground/`); the same file feeds both engines.
"""

import math
import sys

import bpy

ROCK = "assets/ground/mountain-1.webp"
FLOOR = "assets/ground/hills-2.webp"
HOLE_CENTER = (2.5, -1.5)
HOLE_RADIUS = 1.4


def textured(name: str, path: str, scale: float) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    shader = nodes["Principled BSDF"]
    shader.inputs["Roughness"].default_value = 0.95
    image = nodes.new("ShaderNodeTexImage")
    image.image = bpy.data.images.load(path)
    mapping = nodes.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (scale, scale, 1)
    coords = nodes.new("ShaderNodeTexCoord")
    links = material.node_tree.links
    links.new(coords.outputs["UV"], mapping.inputs["Vector"])
    links.new(mapping.outputs["Vector"], image.inputs["Vector"])
    links.new(image.outputs["Color"], shader.inputs["Base Color"])
    return material


def plain(name: str, color: tuple[float, float, float]) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    shader = material.node_tree.nodes["Principled BSDF"]
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Roughness"].default_value = 0.9
    return material


def displaced(obj: bpy.types.Object, strength: float, size: float) -> None:
    texture = bpy.data.textures.new(f"{obj.name}-noise", "CLOUDS")
    texture.noise_scale = size
    texture.noise_depth = 3
    modifier = obj.modifiers.new("displace", "DISPLACE")
    modifier.texture = texture
    modifier.strength = strength
    modifier.mid_level = 0.5
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier.name)


def chamber() -> None:
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=6, radius=9)
    dome = bpy.context.active_object
    dome.name = "cave"
    mesh = dome.data
    for v in mesh.vertices:
        v.co.z *= 0.62
    displaced(dome, 1.6, 2.2)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")
    for polygon in mesh.polygons:
        x, y, z = polygon.center
        roof_hole = math.hypot(x - HOLE_CENTER[0], y - HOLE_CENTER[1]) < HOLE_RADIUS and z > 2
        polygon.select = z < -0.3 or roof_hole
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.delete(type="FACE")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.flip_normals()
    bpy.ops.uv.cube_project(cube_size=4)
    bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.shade_smooth()
    dome.data.materials.append(textured("rock", ROCK, 1))


def floor() -> None:
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=80, y_subdivisions=80, size=22)
    ground = bpy.context.active_object
    ground.name = "floor"
    displaced(ground, 0.35, 1.2)
    # Level around the fire, where the soldiers stand, so both engines can put them at height 0.
    for v in ground.data.vertices:
        v.co.z *= min(max((math.hypot(v.co.x, v.co.y) - 3.2) / 2.0, 0.0), 1.0)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.cube_project(cube_size=3)
    bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.shade_smooth()
    ground.data.materials.append(textured("floor", FLOOR, 1))


def bonfire() -> None:
    wood = plain("wood", (0.16, 0.09, 0.05))
    char = plain("char", (0.03, 0.025, 0.02))
    for i in range(6):
        a = i / 6 * math.tau
        bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=0.07, depth=1.1)
        log = bpy.context.active_object
        log.location = (math.cos(a) * 0.28, math.sin(a) * 0.28, 0.42)
        log.rotation_euler = (0, math.radians(28), a + math.pi)
        log.data.materials.append(wood if i % 2 else char)
    stone = plain("stone", (0.28, 0.27, 0.25))
    for i in range(11):
        a = i / 11 * math.tau
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.16)
        s = bpy.context.active_object
        s.location = (math.cos(a) * 0.75, math.sin(a) * 0.75, 0.06)
        s.scale = (1.2, 0.9, 0.7)
        s.data.materials.append(stone)


def main() -> None:
    out = sys.argv[sys.argv.index("--") + 1]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.preferences.filepaths.use_relative_paths = False
    chamber()
    floor()
    bonfire()
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_image_format="WEBP", export_yup=True)
    print(f"cave: {out}")


main()
