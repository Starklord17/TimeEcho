"""Blender --background assets/blender/echo.blend --python assets/blender/export_echo.py
Export without modifying the saved authoring source.
"""
import bpy, math
from mathutils import Matrix
from pathlib import Path
BASE=Path(__file__).resolve().parents[2]
root=bpy.data.objects["Echo_Root"]
rig=bpy.data.objects.get('Echo_Rig')
assert rig and rig.type == 'ARMATURE' and len(rig.data.bones) == 14
assert {a.name for a in bpy.data.actions} == {'Idle', 'Walk'}, 'Only Idle and Walk are allowed'
for name in ['Echo_Root', 'Echo_Body', 'Echo_HeadPivot']:
    assert not bpy.data.objects[name].animation_data, 'Replay transforms cannot be animated'
meshes=[o for o in root.children_recursive if o.type=="MESH"]
for obj in meshes: obj.data.calc_loop_triangles()
assert 0 < sum(len(o.data.loop_triangles) for o in meshes) <= 8000
rot=Matrix.Rotation(math.pi,4,'Z')
for obj in meshes: obj.data.transform(rot)
for obj in root.children_recursive:
    if obj.type == 'ARMATURE':
        # Rotate rest bones with the geometry. Bone-local animation channels stay
        # valid in this new basis, unlike rotating only mesh coordinates.
        obj.data.transform(rot)
for obj in root.children_recursive: obj.location=rot @ obj.location
bpy.ops.object.select_all(action='DESELECT')
root.select_set(True)
for obj in root.children_recursive: obj.select_set(True)
bpy.context.view_layer.objects.active=root
bpy.ops.export_scene.gltf(filepath=str(BASE/'public/models/characters/echo.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=False,export_animations=True,export_animation_mode='ACTIONS',export_force_sampling=True,export_frame_range=False,export_cameras=False,export_lights=False)
