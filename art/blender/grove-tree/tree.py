"""Grove tree, final: iteration 08, plus a round-trip check that renders the exported .glb.

Run: blender -b --python-exit-code 1 -P tree.py
Units: 1 = hex radius in the game (three.js y-up; Blender z-up, glTF export converts).
"""
import math
import os
import random

import bpy
import bmesh
import numpy as np
from mathutils import Vector, noise

HERE = os.path.dirname(os.path.abspath(__file__))
SEED = 11


def srgb(h):
    """Hex sRGB -> linear RGB tuple."""
    c = [((h >> s) & 255) / 255 for s in (16, 8, 0)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


def lerp(a, b, t):
    t = max(0.0, min(1.0, t))
    return tuple(x + (y - x) * t for x, y in zip(a, b))


BARK_DARK = srgb(0x120e0c)
BARK_LIVE = srgb(0x2a2419)
MOSS = srgb(0x2f4220)
DEAD_PALE = srgb(0xd6d2c4)
DEAD_MID = srgb(0x7d7466)
LEAF_DARK = srgb(0x0f170b)
LEAF_LIGHT = srgb(0x5a9046)
LEAF_MID = srgb(0x22401f)
VINE = srgb(0x1b2c14)
VINE_TIP = srgb(0x6f9a3c)
VIOLET = srgb(0xa050ff)


class Builder:
    """Accumulates vertices, faces, per-corner colors and material slots."""

    def __init__(self):
        self.verts = []
        self.faces = []
        self.colors = []
        self.mats = []
        self.smooth = []

    def add_vert(self, co):
        self.verts.append(tuple(co))
        return len(self.verts) - 1

    def add_face(self, idx, cols, mat=0, smooth=True):
        self.faces.append(tuple(idx))
        self.colors.append(cols)
        self.mats.append(mat)
        self.smooth.append(smooth)

    def to_object(self, name, materials):
        me = bpy.data.meshes.new(name)
        me.from_pydata(self.verts, [], self.faces)
        me.update()
        attr = me.color_attributes.new("Col", 'BYTE_COLOR', 'CORNER')
        flat = []
        for cols in self.colors:
            for c in cols:
                flat.extend((c[0], c[1], c[2], 1.0))
        attr.data.foreach_set("color", flat)
        me.polygons.foreach_set("material_index", self.mats)
        me.polygons.foreach_set("use_smooth", self.smooth)
        for m in materials:
            me.materials.append(m)
        ob = bpy.data.objects.new(name, me)
        bpy.context.scene.collection.objects.link(ob)
        return ob


def frames(points):
    """Parallel-transport frames along a polyline."""
    tangents = []
    for i in range(len(points)):
        a = points[max(i - 1, 0)]
        b = points[min(i + 1, len(points) - 1)]
        tangents.append((b - a).normalized())
    up = Vector((0, 0, 1)) if abs(tangents[0].z) < 0.9 else Vector((1, 0, 0))
    n = tangents[0].cross(up).normalized()
    out = []
    for t in tangents:
        n = (n - t * n.dot(t)).normalized()
        out.append((t, n, t.cross(n)))
    return out


def tube(b, points, radii, sides, color_fn, mat=0, tip=True):
    """color_fn(position, u along tube 0..1, outward unit vector)."""
    fr = frames(points)
    rings = []
    last = len(points) - 1
    for i, (p, r) in enumerate(zip(points, radii)):
        u = i / last
        t, n, bn = fr[i]
        if tip and i == last:
            rings.append([(b.add_vert(p), color_fn(p, u, t))])
            continue
        ring = []
        for k in range(sides):
            a = 2 * math.pi * k / sides
            out = n * math.cos(a) + bn * math.sin(a)
            co = p + out * r
            ring.append((b.add_vert(co), color_fn(co, u, out)))
        rings.append(ring)
    for i in range(len(rings) - 1):
        r0, r1 = rings[i], rings[i + 1]
        for k in range(sides):
            k1 = (k + 1) % sides
            corners = [r0[k], r0[k1], r1[0]] if len(r1) == 1 else [r0[k], r0[k1], r1[k1], r1[k]]
            b.add_face([c[0] for c in corners], [c[1] for c in corners], mat)


def polyline(start, direction, length, segs, rng, wobble, pull=None, kink=0.0):
    pts = [Vector(start)]
    d = Vector(direction).normalized()
    step = length / segs
    for _ in range(segs):
        d = (d + Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-1, 1))) * wobble).normalized()
        if pull is not None:
            d = (d + Vector(pull)).normalized()
        if kink and rng.random() < 0.5:
            d = (d + Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-0.2, 1))) * kink).normalized()
        pts.append(pts[-1] + d * step)
    return pts


def blob(b, center, radius, color, mat=0, squash=1.0, subdiv=1):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdiv, radius=1.0)
    base = len(b.verts)
    for v in bm.verts:
        n = v.co.normalized()
        b.add_vert(Vector((n.x * radius, n.y * radius, n.z * radius * squash)) + center)
    for f in bm.faces:
        idx = [base + v.index for v in f.verts]
        b.add_face(idx, [color] * len(idx), mat, smooth=False)
    bm.free()


def trunk_color(p, u, out):
    """The seam between living and dead bark twists half a turn up the trunk."""
    theta = p.z * 3.2
    axis = Vector((math.cos(theta), math.sin(theta), 0))
    n = noise.noise(p * 9.0)
    if out.dot(axis) + 0.12 * n > 0.0:
        return dead_color(p, 0.3 + p.z, out)
    return live_color(p, u, out)


def live_color(p, u, out):
    n = noise.noise(p * 12.0)
    base = lerp(BARK_DARK, BARK_LIVE, 0.4 + n)
    return lerp(base, MOSS, 0.8) if n + out.z * 0.15 > 0.3 else base


def dead_color(p, u, out):
    return lerp(DEAD_MID, DEAD_PALE, 0.35 + u * 0.8 + noise.noise(p * 10.0) * 0.3)


def charred_color(p, u, out):
    """Where the dead limb leaves the trunk: dark bark burning out into pale wood."""
    t = u * 1.8 + noise.noise(p * 11.0) * 0.4 - 0.15
    return lerp(BARK_DARK, dead_color(p, u, out), t)


def strand_color(p, u, out):
    return lerp(VINE, VINE_TIP, math.sin(min(u, 1.0) * math.pi * 0.8) * 1.1)


def dead_crown(b, start, direction, length, radius, depth, rng, charms):
    """Antler-like: kinked limbs that fork and end in points, curling upward."""
    segs = 3
    pts = polyline(start, direction, length, segs, rng, 0.12, pull=(0, 0, 0.1), kink=0.25)
    tube(b, pts, [radius * (1 - 0.75 * i / segs) for i in range(segs)] + [0.0], 5 if depth > 1 else 4, dead_color)
    if depth == 0:
        if rng.random() < 0.6:
            charms.append(pts[1].lerp(pts[2], 0.5))
        return
    forks = 2 if depth > 1 else rng.choice((2, 3))
    for k in range(forks):
        at = pts[1 + k % 2]
        side = Vector((rng.uniform(0.0, 1.0), rng.uniform(-1, 1), 0)).normalized() * 0.8
        d = (direction.normalized() + side + Vector((0, 0, 0.3))).normalized()
        dead_crown(b, at, d, length * rng.uniform(0.62, 0.8), radius * 0.62, depth - 1, rng, charms)


def canopy_object(centers, materials, seed):
    """Union of spheres -> voxel remesh -> decimate -> colored by height and facing."""
    bm = bmesh.new()
    rng = random.Random(seed + 1)
    lumps = list(centers)
    for c, r, sq in centers:
        for _ in range(3):
            a = rng.uniform(0, 2 * math.pi)
            off = Vector((math.cos(a), math.sin(a), rng.uniform(-0.4, 0.5))) * r * 0.85
            lumps.append((c + off, r * rng.uniform(0.38, 0.55), 0.85))
    for c, r, sq in lumps:
        m = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=r)
        for v in m["verts"]:
            v.co.z *= sq
            v.co += c
    me = bpy.data.meshes.new("canopy")
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new("canopy", me)
    bpy.context.scene.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    rem = ob.modifiers.new("remesh", 'REMESH')
    rem.mode = 'VOXEL'
    rem.voxel_size = 0.03
    tex = bpy.data.textures.new("lumps", 'CLOUDS')
    tex.noise_scale = 0.12
    disp = ob.modifiers.new("displace", 'DISPLACE')
    disp.texture = tex
    disp.strength = 0.05
    disp.mid_level = 0.5
    dec = ob.modifiers.new("decimate", 'DECIMATE')
    dec.ratio = 0.08
    for mod in list(ob.modifiers):
        bpy.ops.object.modifier_apply(modifier=mod.name)
    me = ob.data
    lo = min(v.co.z for v in me.vertices)
    hi = max(v.co.z for v in me.vertices)
    attr = me.color_attributes.new("Col", 'BYTE_COLOR', 'CORNER')
    cols = []
    for poly in me.polygons:
        for li in poly.loop_indices:
            vert = me.vertices[me.loops[li].vertex_index]
            co, up = vert.co, vert.normal.z
            h = (co.z - lo) / (hi - lo)
            t = h * 0.6 + up * 0.35 + noise.noise(co * 8.0) * 0.2
            c = lerp(LEAF_DARK, LEAF_MID, t * 1.6) if t < 0.62 else lerp(LEAF_MID, LEAF_LIGHT, (t - 0.62) * 3.0)
            cols.extend((*c, 1.0))
    attr.data.foreach_set("color", cols)
    for p in me.polygons:
        p.use_smooth = True
    me.materials.append(materials[0])
    me.materials.append(materials[1])
    return ob


def root(b, angle, rng, living, feet):
    """An arching stilt root: leaves the trunk high, bows outward, digs into the ground."""
    d = Vector((math.cos(angle), math.sin(angle), 0))
    reach = rng.uniform(0.45, 0.62)
    top = Vector((d.x * 0.07, d.y * 0.07, rng.uniform(0.3, 0.38)))
    foot = d * reach
    pts = []
    for i in range(7):
        t = i / 6
        p = top.lerp(foot, t)
        p.z = top.z * (1 - t) ** 1.6 + math.sin(t * math.pi) * 0.08 - 0.02 * t
        p += Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), 0)) * 0.015
        pts.append(p)
    radii = [0.055 * (1 - 0.75 * i / 6) for i in range(7)]
    if living:
        tube(b, pts, radii[:-1] + [0.0], 5, live_color)
        # A creeping tendril beyond the foot.
        tail = polyline(pts[-1], d + Vector((rng.uniform(-0.6, 0.6), rng.uniform(-0.6, 0.6), 0)), 0.18, 3, rng, 0.3,
                        pull=(0, 0, -0.1))
        for p in tail:
            p.z = max(p.z, 0.0)
        tube(b, tail, [0.014, 0.01, 0.006, 0.0], 3, live_color)
    else:
        # Snapped: stops short of the ground with a broken, blunt end.
        for p in pts[2:]:
            p += Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), 0)) * 0.03
        feet.append(pts[-1] * 0.92)
        if rng.random() < 0.35:
            cut = rng.randint(4, 5)
            tube(b, pts[:cut + 1], radii[:cut + 1], 5, lambda p, u, o: dead_color(p, u * 0.6, o), tip=False)
        else:
            tube(b, pts, radii[:-1] + [0.0], 5, lambda p, u, o: dead_color(p, u * 0.6, o))


def diamond(b, top, radius, length, color, mat=0):
    """An elongated octahedron hanging from `top`: a charm."""
    mid = top + Vector((0, 0, -length * 0.4))
    bot = top + Vector((0, 0, -length))
    ring = [b.add_vert(mid + Vector((math.cos(a), math.sin(a), 0)) * radius)
            for a in (0, math.pi / 2, math.pi, 3 * math.pi / 2)]
    t, bt = b.add_vert(top), b.add_vert(bot)
    for k in range(4):
        k1 = (k + 1) % 4
        b.add_face((t, ring[k], ring[k1]), [color] * 3, mat, smooth=False)
        b.add_face((bt, ring[k1], ring[k]), [color] * 3, mat, smooth=False)


def mushroom(b, base, radius, height):
    """A glowing cap on a pale stem."""
    top = base + Vector((0, 0, height))
    tube(b, [base, top], [radius * 0.3, radius * 0.25], 3, lambda q, u, o: DEAD_PALE, tip=False)
    ring = [b.add_vert(top + Vector((math.cos(a), math.sin(a), 0)) * radius)
            for a in (i * math.pi / 3 for i in range(6))]
    apex = b.add_vert(top + Vector((0, 0, radius * 0.7)))
    under = b.add_vert(top + Vector((0, 0, -radius * 0.2)))
    for k in range(6):
        k1 = (k + 1) % 6
        b.add_face((apex, ring[k], ring[k1]), [VIOLET] * 3, 1, smooth=False)
        b.add_face((under, ring[k1], ring[k]), [VIOLET] * 3, 1, smooth=False)


def seam_vein(b, trunk, radii):
    """Violet veins along both seams of the twisting trunk: where life meets death."""
    for sign in (1, -1):
        pts = []
        for p, r in zip(trunk, radii):
            theta = p.z * 3.2
            s = Vector((math.sin(theta), -math.cos(theta), 0)) * sign
            pts.append(p + s * (r + 0.004))
        tube(b, pts, [0.012] * (len(pts) - 1) + [0.0], 3, lambda q, u, o: VIOLET, mat=1)


def build_tree(materials, seed, name):
    rng = random.Random(seed)
    deco = random.Random(seed * 7919 + 3)
    b = Builder()

    trunk = polyline((0, 0, 0.18), (0.03, 0.02, 1.0), 0.5, 5, rng, 0.06)
    tube(b, trunk, [0.12, 0.105, 0.092, 0.083, 0.076, 0.07], 8, trunk_color, tip=False)
    fork = trunk[-1]

    feet = []
    for i in range(7):
        a = 2 * math.pi * i / 7 + rng.uniform(-0.2, 0.2) + 0.3
        living = math.cos(a) < 0.15
        root(b, a, rng, living, feet)

    seam_vein(b, trunk, [0.12, 0.105, 0.092, 0.083, 0.076, 0.07])

    # Living limb (-x) carries a drooping, lobed canopy.
    live_limb = polyline(fork, (-0.75, 0.05, 0.8), 0.48, 4, rng, 0.06, pull=(0, 0, 0.08))
    tube(b, live_limb, [0.07, 0.06, 0.05, 0.04, 0.0], 6, live_color)
    centers = []
    for i in range(7):
        at = live_limb[1 + i % 3]
        d = Vector((rng.uniform(-1.0, -0.05), rng.uniform(-0.9, 0.9), rng.uniform(-0.1, 0.7)))
        br = polyline(at, d, rng.uniform(0.2, 0.34), 3, rng, 0.15)
        tube(b, br, [0.028, 0.02, 0.012, 0.0], 4, live_color)
        centers.append((br[-1], rng.uniform(0.13, 0.19), 0.7))
    centers.append((live_limb[-1] + Vector((0.03, 0, 0.05)), 0.24, 0.75))
    centers.append((live_limb[2] + Vector((0.08, 0.04, 0.1)), 0.19, 0.75))

    # Weeping curtains: the living side hangs heavy while the dead side reaches up.
    for c, r, sq in centers:
        for _ in range(5):
            a = deco.uniform(0, 2 * math.pi)
            top = c + Vector((math.cos(a) * r * 0.8, math.sin(a) * r * 0.8, -r * sq * 0.3))
            length = min(deco.uniform(0.22, 0.45), top.z - 0.12)
            strand = polyline(top, (math.cos(a) * 0.2, math.sin(a) * 0.2, -1), length, 4, deco, 0.2)
            tube(b, strand, [0.018, 0.016, 0.012, 0.007, 0.0], 3, strand_color)

    # Dead crown (+x): a big antler that rises above the canopy.
    charms = []
    dead_limb = polyline(fork, (0.8, -0.05, 0.7), 0.4, 3, rng, 0.04, kink=0.15)
    tube(b, dead_limb, [0.072, 0.062, 0.054, 0.048], 6, charred_color, tip=False)
    limb_vein = []
    for (t, _, _), p, r in zip(frames(dead_limb), dead_limb, (0.072, 0.062, 0.054, 0.048)):
        facing = Vector((0.0, -1.0, -0.3))
        limb_vein.append(p + (facing - t * facing.dot(t)).normalized() * (r + 0.002))
    tube(b, limb_vein, [0.011, 0.009, 0.006, 0.0], 3, lambda q, u, o: VIOLET, mat=1)
    stub_dir = Vector((0.3, -0.9, -0.1)).normalized()
    stub = [dead_limb[1], dead_limb[1] + stub_dir * 0.1, dead_limb[1] + stub_dir * 0.112]
    tube(b, stub, [0.04, 0.032, 0.0], 5, dead_color)
    for d in ((0.8, -0.35, 0.8), (0.35, 0.1, 1.0), (1.0, 0.45, 0.35), (0.8, -0.1, 0.15)):
        dead_crown(b, dead_limb[-1], Vector(d), 0.36, 0.045, 2, rng, charms)

    # Violet: mushrooms at the dead roots' feet, charms on the dead crown.
    for foot in feet:
        for _ in range(deco.randint(2, 3)):
            at = foot + Vector((deco.uniform(-0.07, 0.07), deco.uniform(-0.07, 0.07), 0))
            mushroom(b, at, deco.uniform(0.018, 0.032), deco.uniform(0.03, 0.06))
    for p in charms:
        end = p + Vector((0, 0, -deco.uniform(0.08, 0.16)))
        tube(b, [p, end], [0.003, 0.003], 3, lambda q, u, o: DEAD_MID, tip=False)
        if deco.random() < 0.85:
            diamond(b, end, 0.022, 0.07, VIOLET, mat=1)
        else:
            blob(b, end + Vector((0, 0, -0.02)), 0.022, DEAD_PALE)

    wood = b.to_object(name, materials)
    leaves = canopy_object(centers, materials, seed)
    bpy.ops.object.select_all(action='DESELECT')
    leaves.select_set(True)
    wood.select_set(True)
    bpy.context.view_layer.objects.active = wood
    bpy.ops.object.join()
    return wood


def make_materials():
    bark = bpy.data.materials.new("tree_vc")
    bark.use_nodes = True
    nt = bark.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    ca = nt.nodes.new("ShaderNodeVertexColor")
    ca.layer_name = "Col"
    nt.links.new(ca.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.95
    bark.use_backface_culling = True

    glow = bpy.data.materials.new("tree_glow")
    glow.use_nodes = True
    g = glow.node_tree.nodes["Principled BSDF"]
    g.inputs["Base Color"].default_value = (*VIOLET, 1)
    g.inputs["Emission Color"].default_value = (*VIOLET, 1)
    g.inputs["Emission Strength"].default_value = 2.5
    glow.use_backface_culling = True
    return [bark, glow]


def tri_count(ob):
    dg = bpy.context.evaluated_depsgraph_get()
    me = ob.evaluated_get(dg).to_mesh()
    me.calc_loop_triangles()
    n = len(me.loop_triangles)
    ob.evaluated_get(dg).to_mesh_clear()
    return n


# ---------------------------------------------------------------- rendering

def look_at(ob, target):
    d = Vector(target) - ob.location
    ob.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()


def add_camera(loc, target, lens=None, fov=None, ortho=None):
    cam = bpy.data.cameras.new("cam")
    if ortho:
        cam.type = 'ORTHO'
        cam.ortho_scale = ortho
    elif fov:
        cam.sensor_fit = 'VERTICAL'
        cam.angle = math.radians(fov)
    elif lens:
        cam.lens = lens
    ob = bpy.data.objects.new("cam", cam)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = loc
    look_at(ob, target)
    bpy.context.scene.camera = ob
    return ob


def add_sun(direction_from, color, strength, angle=2.0):
    ld = bpy.data.lights.new("sun", 'SUN')
    ld.color = color
    ld.energy = strength
    ld.angle = math.radians(angle)
    ob = bpy.data.objects.new("sun", ld)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = Vector(direction_from)
    look_at(ob, (0, 0, 0))
    return ob


def set_world(sky, strength, background):
    w = bpy.data.worlds.new("world")
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputWorld")
    lp = nt.nodes.new("ShaderNodeLightPath")
    amb = nt.nodes.new("ShaderNodeBackground")
    amb.inputs["Color"].default_value = (*sky, 1)
    amb.inputs["Strength"].default_value = strength
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.inputs["Color"].default_value = (*background, 1)
    bg.inputs["Strength"].default_value = 1.0
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(lp.outputs["Is Camera Ray"], mix.inputs[0])
    nt.links.new(amb.outputs[0], mix.inputs[1])
    nt.links.new(bg.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs[0])


def clear_scene_extras(keep):
    for ob in list(bpy.context.scene.objects):
        if ob not in keep:
            bpy.data.objects.remove(ob, do_unlink=True)


def bloom(on):
    """Restrained bloom, like the game's; the Glare type is a menu socket in Blender 5."""
    sc = bpy.context.scene
    if not on:
        sc.compositing_node_group = None
        return
    ng = bpy.data.node_groups.new("bloom", "CompositorNodeTree")
    ng.interface.new_socket("Image", in_out='OUTPUT', socket_type='NodeSocketColor')
    rl = ng.nodes.new("CompositorNodeRLayers")
    g = ng.nodes.new("CompositorNodeGlare")
    g.inputs["Type"].default_value = 'Bloom'
    g.inputs["Threshold"].default_value = 0.9
    g.inputs["Strength"].default_value = 0.7
    g.inputs["Size"].default_value = 0.35
    out = ng.nodes.new("NodeGroupOutput")
    ng.links.new(rl.outputs["Image"], g.inputs["Image"])
    ng.links.new(g.outputs["Image"], out.inputs[0])
    sc.compositing_node_group = ng


def render(path, res, engine='BLENDER_EEVEE', samples=32):
    sc = bpy.context.scene
    sc.render.engine = engine
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    if engine == 'BLENDER_EEVEE':
        sc.eevee.taa_render_samples = samples
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


def hex_tile(name, center, radius, height, color):
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=radius, depth=height,
                                        location=(center[0], center[1], height / 2))
    ob = bpy.context.active_object
    ob.name = name
    ob.rotation_euler.z = math.radians(30)
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = (*color, 1)
    p.inputs["Roughness"].default_value = 0.95
    ob.data.materials.append(m)
    return ob


def game_lights():
    # The map's lights (src/view/map.ts), converted from three.js y-up.
    add_sun((-6, -8, 12), srgb(0xffd6a8), 3.0)
    add_sun((8, 10, 5), srgb(0x7f9cff), 1.2)
    set_world(srgb(0x8a90b0), 0.9 / math.pi, srgb(0x0b0a0c))


def stitch(paths, out):
    imgs = [bpy.data.images.load(p) for p in paths]
    arrs = []
    for im in imgs:
        a = np.array(im.pixels[:], dtype=np.float32).reshape(im.size[1], im.size[0], 4)
        arrs.append(a)
    full = np.concatenate(arrs, axis=1)
    h, w = full.shape[:2]
    im = bpy.data.images.new("sheet", w, h, alpha=True)
    im.pixels.foreach_set(full.ravel())
    im.filepath_raw = out
    im.file_format = 'PNG'
    im.save()
    for p in paths:
        os.remove(p)


def upscale(path, out, factor):
    im = bpy.data.images.load(path)
    a = np.array(im.pixels[:], dtype=np.float32).reshape(im.size[1], im.size[0], 4)
    a = a.repeat(factor, axis=0).repeat(factor, axis=1)
    big = bpy.data.images.new("big", a.shape[1], a.shape[0], alpha=True)
    big.pixels.foreach_set(a.ravel())
    big.filepath_raw = out
    big.file_format = 'PNG'
    big.save()




def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.view_settings.view_transform = 'AgX'

    mats = make_materials()
    tree = build_tree(mats, SEED, "grove_tree")
    tris = tri_count(tree)
    print(f"TRIANGLES {tris}")

    bpy.ops.object.select_all(action='DESELECT')
    tree.select_set(True)
    bpy.context.view_layer.objects.active = tree
    bpy.ops.export_scene.gltf(filepath=os.path.join(HERE, "tree.glb"), export_format='GLB',
                              use_selection=True, export_apply=True)

    # hero view
    bloom(True)
    game_lights()
    add_sun((6, 8, 3), srgb(0x9a7cff), 1.5)
    ground = hex_tile("ground", (0, 0), 1.6, 0.02, srgb(0x1a1814))
    ground.location.z = -0.02
    add_camera((-1.9, -3.9, 2.1), (0, 0, 0.62), lens=50)
    render(os.path.join(HERE, "hero.png"), (1024, 1024), samples=48)
    clear_scene_extras([tree])

    # game view: same angle and pixel scale as the map at 720p
    tree.location.z = 0.24
    game_lights()
    hex_tile("tile", (0, 0), 0.95, 0.24, srgb(0x27301f))
    for i in range(6):
        a = math.radians(60 * i + 30)
        c = (math.cos(a) * math.sqrt(3), math.sin(a) * math.sqrt(3))
        hex_tile(f"n{i}", c, 0.95, 0.12, srgb(0x3b3326 if i % 2 else 0x27301f))
    target = Vector((0, 0, 0.7))
    add_camera(target + Vector((-3, -11.2, 11)), target, fov=14.7)
    game = os.path.join(HERE, "game.png")
    render(game, (256, 256), samples=32)
    upscale(game, os.path.join(HERE, "game_x3.png"), 3)
    clear_scene_extras([tree])

    # seed variants in a row of forest tiles, same pixel scale as the map
    variants = [tree]
    for k, seed in enumerate((23, 37)):
        v = build_tree(mats, seed, f"variant_{seed}")
        print(f"TRIANGLES seed {seed}: {tri_count(v)}")
        variants.append(v)
    game_lights()
    for k, ob in enumerate(variants):
        x = (k - 1) * math.sqrt(3)
        ob.location = (x, 0, 0.24)
        ob.rotation_euler.z = math.radians((-18, 0, 22)[k])
        hex_tile(f"row{k}", (x, 0), 0.95, 0.24, srgb(0x27301f))
    for k in range(4):
        x = (k - 1.5) * math.sqrt(3)
        hex_tile(f"back{k}", (x, 1.5), 0.95, 0.12, srgb(0x3b3326))
        hex_tile(f"front{k}", (x, -1.5), 0.95, 0.12, srgb(0x3b3326))
    add_camera(target + Vector((-3, -11.2, 11)), target, fov=14.7)
    seeds = os.path.join(HERE, "game_seeds.png")
    render(seeds, (768, 256), samples=32)
    upscale(seeds, os.path.join(HERE, "game_seeds_x2.png"), 2)
    clear_scene_extras([tree])
    tree.location = (0, 0, 0)
    tree.rotation_euler.z = 0

    bloom(False)
    # silhouette turnaround (flat black on white); first view = the game camera's azimuth
    sc.render.engine = 'BLENDER_WORKBENCH'
    sh = sc.display.shading
    sh.light = 'FLAT'
    sh.color_type = 'SINGLE'
    sh.single_color = (0, 0, 0)
    w = bpy.data.worlds.new("white")
    w.color = (1, 1, 1)
    sc.world = w
    sc.view_settings.view_transform = 'Standard'
    parts = []
    base = math.atan2(-11.2, -3)
    for i, ang in enumerate((0, 90, 180, 270)):
        a = base + math.radians(ang)
        cam = add_camera((math.cos(a) * 6, math.sin(a) * 6, 1.2), (0, 0, 0.6), ortho=2.4)
        p = os.path.join(HERE, f"_sil{i}.png")
        render(p, (256, 256), engine='BLENDER_WORKBENCH')
        parts.append(p)
        bpy.data.objects.remove(cam, do_unlink=True)
    stitch(parts, os.path.join(HERE, "silhouette.png"))
    print(f"DONE triangles={tris}")
    verify_glb()


def verify_glb():
    """Re-import tree.glb into an empty scene and render the game view from the file alone."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.view_settings.view_transform = 'AgX'
    bpy.ops.import_scene.gltf(filepath=os.path.join(HERE, "tree.glb"))
    imported = [ob for ob in sc.objects if ob.type == 'MESH']
    tris = sum(tri_count(ob) for ob in imported)
    mats = sorted({m.name for ob in imported for m in ob.data.materials})
    print(f"GLB meshes={len(imported)} triangles={tris} materials={mats} "
          f"color_attributes={[a.name for ob in imported for a in ob.data.color_attributes]}")
    for ob in imported:
        ob.location.z += 0.24
    bloom(True)
    game_lights()
    hex_tile("tile", (0, 0), 0.95, 0.24, srgb(0x27301f))
    for i in range(6):
        a = math.radians(60 * i + 30)
        c = (math.cos(a) * math.sqrt(3), math.sin(a) * math.sqrt(3))
        hex_tile(f"n{i}", c, 0.95, 0.12, srgb(0x3b3326 if i % 2 else 0x27301f))
    target = Vector((0, 0, 0.7))
    add_camera(target + Vector((-3, -11.2, 11)), target, fov=14.7)
    path = os.path.join(HERE, "game_from_glb.png")
    render(path, (256, 256), samples=32)
    upscale(path, os.path.join(HERE, "game_from_glb_x3.png"), 3)


main()
