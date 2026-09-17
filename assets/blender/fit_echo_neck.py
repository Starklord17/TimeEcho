"""Fit an opaque inner collar to the existing Echo without changing its rig/clips.

blender --background assets/blender/echo.blend --python assets/blender/fit_echo_neck.py
"""
import bpy
import math
import json
import bmesh
from pathlib import Path

neck_base = Path(__file__).resolve().parents[2]
neck_old = bpy.data.objects.get('Echo_NeckGuard')
if neck_old:
    bpy.data.objects.remove(neck_old, do_unlink=True)
# A soft, closed turtleneck insert. Its lower section is buried inside the coat
# throughout Walk; its rounded upper cap is buried inside the spectral head.
# The visible raised collar and narrow inner cap follow the existing spine.
neck_rings = [(.275, .103, .086), (.31, .105, .088), (.36, .106, .095),
              (.405, .118, .102), (.425, .114, .099), (.445, .075, .068),
              (.485, .044, .042), (.513, .016, .015)]
neck_segments = 32
neck_verts = [(w*math.cos(2*math.pi*i/neck_segments),
               d*math.sin(2*math.pi*i/neck_segments), z)
              for z,w,d in neck_rings for i in range(neck_segments)]
neck_faces = []
for j in range(len(neck_rings)-1):
    for i in range(neck_segments):
        a = j*neck_segments+i
        b = j*neck_segments+(i+1)%neck_segments
        neck_faces.append((a,b,b+neck_segments,a+neck_segments))
neck_faces += [tuple(reversed(range(neck_segments))),
               tuple((len(neck_rings)-1)*neck_segments+i for i in range(neck_segments))]
neck_mesh = bpy.data.meshes.new('Echo_NeckGuard_Geometry')
neck_mesh.from_pydata(neck_verts, [], neck_faces)
neck_mesh.update()
neck_obj = bpy.data.objects.new('Echo_NeckGuard', neck_mesh)
bpy.context.scene.collection.objects.link(neck_obj)
neck_obj.parent = bpy.data.objects['Echo_Rig']
neck_mesh.materials.append(bpy.data.materials['M_Echo_Fabric'])
for face in neck_mesh.polygons:
    face.use_smooth = len(face.vertices) == 4
for bone in bpy.data.objects['Echo_Rig'].data.bones:
    group = neck_obj.vertex_groups.new(name=bone.name)
    if bone.name == 'Echo_SpineBone':
        group.add(list(range(len(neck_verts))), 1, 'REPLACE')
neck_modifier = neck_obj.modifiers.new('Follow coat spine', 'ARMATURE')
neck_modifier.object = bpy.data.objects['Echo_Rig']

# The collar alone still reads through the translucent chin. Seal only the
# bottom 12.5 cm of the existing head surface; upper face keeps the original alpha.
neck_head = bpy.data.objects['Echo_Head']
neck_bm = bmesh.new()
neck_bm.from_mesh(neck_head.data)
bmesh.ops.bisect_plane(neck_bm, geom=list(neck_bm.verts)+list(neck_bm.edges)+list(neck_bm.faces),
                      dist=1e-6, plane_co=(0,0,-.08), plane_no=(0,0,1),
                      clear_inner=False, clear_outer=False)
neck_bm.to_mesh(neck_head.data)
neck_bm.free()
neck_seal = bpy.data.materials.get('M_Echo_Chin')
if not neck_seal:
    neck_seal = bpy.data.materials['M_Echo_Shell'].copy()
    neck_seal.name = 'M_Echo_Chin'
neck_seal.diffuse_color = (*neck_seal.diffuse_color[:3], 1)
neck_seal.node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value = 1
neck_head.data.materials.clear()
neck_head.data.materials.append(bpy.data.materials['M_Echo_Shell'])
neck_head.data.materials.append(neck_seal)
for face in neck_head.data.polygons:
    face.material_index = int(max(neck_head.data.vertices[i].co.z for i in face.vertices) <= -.08 + 1e-6)

# Preserve every existing animation and vertex weight. Save the rest pose used
# by the asset contract, without changing clip data or the recorded head pivot.
neck_rig = bpy.data.objects['Echo_Rig']
neck_rig.animation_data.action = None
for pb in neck_rig.pose.bones:
    pb.rotation_euler = (0,0,0)
    pb.location = (0,0,0)
bpy.context.scene.frame_set(0)
bpy.context.view_layer.update()
neck_meshes = [o for o in bpy.data.objects['Echo_Root'].children_recursive if o.type == 'MESH']
for o in neck_meshes:
    o.data.calc_loop_triangles()
neck_metrics_path = neck_base/'assets/blender/echo-review/metrics.json'
neck_metrics = json.loads(neck_metrics_path.read_text())
neck_metrics.update({'triangles': sum(len(o.data.loop_triangles) for o in neck_meshes),
                     'meshCount': len(neck_meshes),
                     'materialCount': len({m.name for o in neck_meshes for m in o.data.materials})})
assert neck_metrics['triangles'] <= 8000
neck_metrics_path.write_text(json.dumps(neck_metrics, indent=2)+'\n')
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(neck_base/'assets/blender/echo.blend'))
print('NECK_METRICS', json.dumps(neck_metrics))
