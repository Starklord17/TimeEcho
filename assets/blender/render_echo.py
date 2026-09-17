"""Render the saved authoring source without modifying it."""
import bpy
import math
from pathlib import Path
from mathutils import Vector

OUT = Path(__file__).resolve().parent/'echo-review'
scene = bpy.context.scene
cam = scene.camera
scene.cycles.samples = 32
rig = bpy.data.objects['Echo_Rig']
rig.animation_data.action = bpy.data.actions['Idle']
scene.frame_set(0)
floor = bpy.data.materials['Review_Grey'].node_tree.nodes['Principled BSDF']
for bg, color in [('dark', (.045, .05, .06, 1)), ('light', (.65, .67, .69, 1))]:
    floor.inputs['Base Color'].default_value = color
    for view, location in {'front': (0,-4,.3), 'three-quarter': (3,-4,.4),
                           'profile': (4,0,.3), 'back': (0,4,.3)}.items():
        cam.location = location
        cam.rotation_euler = (Vector((0,0,-.06))-cam.location).to_track_quat('-Z','Y').to_euler()
        scene.render.filepath = str(OUT/f'glasses-{bg}-{view}.png')
        bpy.ops.render.render(write_still=True)
rig.animation_data.action = bpy.data.actions['Walk']
scene.frame_set(7)
cam.location = (3,-4,.4)
cam.rotation_euler = (Vector((0,0,-.06))-cam.location).to_track_quat('-Z','Y').to_euler()
scene.render.filepath = str(OUT/'walk-three-quarter.png')
bpy.ops.render.render(write_still=True)
