"""Blender --background assets/blender/echo.blend --python assets/blender/export_echo.py
Export without modifying the saved authoring source.
"""
import bpy, math
from mathutils import Matrix
from pathlib import Path
BASE=Path(__file__).resolve().parents[2]
root=bpy.data.objects["Echo_Root"]
meshes=[o for o in root.children_recursive if o.type=="MESH"]
rot=Matrix.Rotation(math.pi,4,'Z')
for obj in meshes: obj.data.transform(rot)
for obj in root.children_recursive: obj.location=rot @ obj.location
bpy.ops.object.select_all(action='DESELECT')
root.select_set(True)
for obj in root.children_recursive: obj.select_set(True)
bpy.context.view_layer.objects.active=root
bpy.ops.export_scene.gltf(filepath=str(BASE/'public/models/characters/echo.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_animations=False,export_cameras=False,export_lights=False)
