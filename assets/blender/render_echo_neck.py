"""Close-up inspection; -- before/after selects output prefix. Never saves source."""
import bpy
import sys
import math
from pathlib import Path
from mathutils import Vector

out = Path(__file__).resolve().parent/'echo-review'
tag = sys.argv[-1] if '--' in sys.argv else 'after'
scene = bpy.context.scene
cam = scene.camera
cam.data.ortho_scale = .83
scene.render.resolution_x = 720
scene.render.resolution_y = 720
scene.cycles.samples = 32
rig = bpy.data.objects['Echo_Rig']
head = bpy.data.objects['Echo_HeadPivot']
for clip, frame in [('Idle',0), ('Walk',7)]:
    rig.animation_data.action = bpy.data.actions[clip]
    rig.animation_data.action_slot = bpy.data.actions[clip].slots[0]
    scene.frame_set(frame)
    bpy.context.view_layer.update()
    print('NECK_REVIEW_POSE', tag, clip, frame, rig.pose.bones['Echo_Hips'].location[:])
    for view, loc in {'front':(0,-4,.62),'profile':(4,0,.62),'back':(0,4,.62)}.items():
        cam.location = loc
        cam.rotation_euler = (Vector((0,0,.41))-cam.location).to_track_quat('-Z','Y').to_euler()
        scene.render.filepath = str(out/f'neck-{tag}-{clip.lower()}-{view}.png')
        bpy.ops.render.render(write_still=True)
    for pitch in [-1.56, .65, 1.56]:
        # Pitch author X; keep full recorded look independent of the rig.
        head.rotation_euler = (pitch,0,.7)
        cam.location = (3,-4,.62)
        cam.rotation_euler = (Vector((0,0,.41))-cam.location).to_track_quat('-Z','Y').to_euler()
        scene.render.filepath = str(out/f'neck-{tag}-{clip.lower()}-look-{pitch}.png')
        bpy.ops.render.render(write_still=True)
    head.rotation_euler = (0,0,0)
