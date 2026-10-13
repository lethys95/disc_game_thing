"""
Labels every vertex of a Tripo character with the part it belongs to, taken from a segmented generation of the
same character by nearest surface (segmentation splits the skirt strips, legs and belt apart; a single-mesh
generation has the better mesh). Writes <out>.json and front/side/back renders coloured by part, to check.
  blender -b --python scripts/art/part-labels.py -- <segmented.glb> <character.fbx> <out>
"""
from mathutils.bvhtree import BVHTree
seg, fbx, out = sys.argv[-3], sys.argv[-2], sys.argv[-1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=seg)
dg=bpy.context.evaluated_depsgraph_get()
trees={}
for o in [o for o in bpy.data.objects if o.type=='MESH' and o.name!='Icosphere']:
    me=o.evaluated_get(dg).to_mesh()
    verts=[o.matrix_world@v.co for v in me.vertices]; polys=[list(p.vertices) for p in me.polygons]
    trees[int(o.name.split('_')[-1])]=BVHTree.FromPolygons(verts,polys)
for o in list(bpy.data.objects): bpy.data.objects.remove(o)
bpy.ops.import_scene.fbx(filepath=fbx)
m=[o for o in bpy.data.objects if o.type=='MESH'][0]
labels=[]; dists=[]
for v in m.data.vertices:
    p=m.matrix_world@v.co
    best=min(((t.find_nearest(p)[3] or 9),k) for k,t in trees.items())
    labels.append(best[1]); dists.append(best[0])
json.dump({"labels":labels,"dist":dists},open(out+".json","w"))
import statistics
print("DIST median",round(statistics.median(dists),4),"p95",round(sorted(dists)[int(len(dists)*.95)],4),"max",round(max(dists),4))
mats=[]
for i in range(35):
    mat=bpy.data.materials.new(f"c{i}"); mat.diffuse_color=(*colorsys.hsv_to_rgb((i*0.618)%1,0.8,0.9),1); mats.append(mat)
m.data.materials.clear()
for mat in mats: m.data.materials.append(mat)
for p in m.data.polygons:
    ls=[labels[i] for i in p.vertices]; p.material_index=max(set(ls),key=ls.count)
sc=bpy.context.scene; sc.render.engine='BLENDER_WORKBENCH'; sc.display.shading.light='STUDIO'; sc.display.shading.color_type='MATERIAL'
sc.render.resolution_x=700; sc.render.resolution_y=900
cam=bpy.data.objects.new('cam',bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera=cam; cam.data.type='ORTHO'; cam.data.ortho_scale=1.1
for name,a in (('front',0),('side',-math.pi/2),('back',math.pi)):
    cam.location=(4*math.sin(a),-4*math.cos(a),0.5); cam.rotation_euler=(math.pi/2,0,a)
    sc.render.filepath=f"{out}-{name}.png"; bpy.ops.render.render(write_still=True)
