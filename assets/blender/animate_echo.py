"""Upgrade the existing authored Echo; never rebuild its body geometry.

blender --background assets/blender/echo.blend --python assets/blender/animate_echo.py
Idempotent: replaces only this script's glasses, rig and actions.
"""
import bpy
import math
import json
from pathlib import Path
from mathutils import Vector

BASE = Path(__file__).resolve().parents[2]
scene = bpy.context.scene
body = bpy.data.objects['Echo_Body']
head = bpy.data.objects['Echo_HeadPivot']
root = bpy.data.objects['Echo_Root']
old_rig = bpy.data.objects.get('Echo_Rig')
if old_rig:
    for child in list(old_rig.children):
        child.parent = body
for obj in list(bpy.data.objects):
    if obj.name == 'Echo_Gaze' or obj.name == 'Echo_Rig' or obj.name.startswith('Echo_Glasses'):
        bpy.data.objects.remove(obj, do_unlink=True)
for action in list(bpy.data.actions):
    if action.name in ('Idle', 'Walk'):
        bpy.data.actions.remove(action)

def material(name, color, roughness):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = mat.node_tree.nodes['Principled BSDF']
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Metallic'].default_value = .25
    return mat

frame = material('M_Echo_GlassesFrame', (.025, .029, .035), .38)
lens = material('M_Echo_GlassesLens', (.008, .012, .018), .24)

def box(name, center, size, mat, bevel=.004):
    bpy.ops.mesh.primitive_cube_add(size=1)
    obj = bpy.context.object
    obj.name = name
    obj.parent = head
    obj.location = center
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    mod = obj.modifiers.new('Soft edges', 'BEVEL')
    mod.width = bevel
    mod.segments = 2
    bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.data.materials.append(mat)
    return obj

for sign, side in [(-1, 'Left'), (1, 'Right')]:
    box('Echo_GlassesFrame_' + side, (sign*.064, -.112, .039), (.115, .029, .073), frame)
    box('Echo_GlassesLens_' + side, (sign*.064, -.129, .039), (.096, .008, .052), lens)
    box('Echo_GlassesTemple_' + side, (sign*.137, -.024, .051), (.012, .18, .018), frame)
    box('Echo_GlassesAccent_' + side, (sign*.144, -.070, .052), (.003, .028, .004), bpy.data.materials['M_Echo_Core'], .001)
box('Echo_GlassesBridge', (0, -.119, .051), (.027, .019, .016), frame)

armature = bpy.data.armatures.new('Echo_Skeleton')
rig = bpy.data.objects.new('Echo_Rig', armature)
scene.collection.objects.link(rig)
rig.parent = body
bpy.context.view_layer.objects.active = rig
rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')

def bone(name, start, end, parent=None):
    b = armature.edit_bones.new(name)
    b.head, b.tail = start, end
    if parent:
        b.parent = armature.edit_bones[parent]
    return b

bone('Echo_Hips', (0, 0, -.20), (0, 0, -.06))
bone('Echo_SpineBone', (0, 0, -.06), (0, 0, .32), 'Echo_Hips')
for sign, side in [(-1, 'Left'), (1, 'Right')]:
    bone('Echo_UpperArm_'+side, (sign*.20, 0, .28), (sign*.245, 0, -.08), 'Echo_SpineBone')
    bone('Echo_Forearm_'+side, (sign*.245, 0, -.08), (sign*.24, -.015, -.40), 'Echo_UpperArm_'+side)
    bone('Echo_Thigh_'+side, (sign*.083, 0, -.20), (sign*.086, 0, -.54), 'Echo_Hips')
    bone('Echo_Shin_'+side, (sign*.086, 0, -.54), (sign*.083, 0, -.84), 'Echo_Thigh_'+side)
    bone('Echo_Foot_'+side, (sign*.083, 0, -.84), (sign*.083, -.12, -.87), 'Echo_Shin_'+side)
    bone('Echo_Tail_'+side, (sign*.10, .04, -.16), (sign*.13, .06, -.54), 'Echo_SpineBone')
bpy.ops.object.mode_set(mode='OBJECT')

def clamp(x):
    return max(0, min(1, x))

for obj in list(body.children):
    if obj.type != 'MESH':
        continue
    if obj.name == 'Echo_NeckGuard':
        continue
    for mod in list(obj.modifiers):
        if mod.type == 'ARMATURE':
            obj.modifiers.remove(mod)
    obj.vertex_groups.clear()
    groups = {b.name: obj.vertex_groups.new(name=b.name) for b in armature.bones}
    for v in obj.data.vertices:
        z = v.co.z
        side = 'Left' if 'Left' in obj.name else 'Right'
        weights = {'Echo_SpineBone': 1}
        if obj.name.startswith('Echo_Arm_'):
            lower = clamp((-.02-z)/.12)
            weights = {'Echo_UpperArm_'+side: 1-lower, 'Echo_Forearm_'+side: lower}
        elif obj.name.startswith('Echo_Cuff_'):
            weights = {'Echo_Forearm_'+side: 1}
        elif obj.name.startswith('Echo_Leg_'):
            shin = clamp((-.48-z)/.12)
            foot = clamp((-.77-z)/.07)
            weights = {'Echo_Thigh_'+side: 1-shin, 'Echo_Shin_'+side: shin*(1-foot), 'Echo_Foot_'+side: foot}
        elif obj.name.startswith('Echo_Coat_'):
            tail = clamp((-.12-z)/.25)
            weights = {'Echo_SpineBone': 1-tail, 'Echo_Tail_'+side: tail}
        for name, weight in weights.items():
            if weight > 0:
                groups[name].add([v.index], weight, 'REPLACE')
    mod = obj.modifiers.new('Echo deformation', 'ARMATURE')
    mod.object = rig
    obj.parent = rig

# Pose in bone-local axes, with no object/root tracks. Correct the foot height
# from evaluated vertices at each key to keep one support foot on the floor.
scene.render.fps = 30
rig.animation_data_create()
for name, duration in [('Idle', 90), ('Walk', 30)]:
    action = bpy.data.actions.new(name)
    rig.animation_data.action = action
    for f in range(duration+1):
        phase = 2*math.pi*f/duration
        for pb in rig.pose.bones:
            pb.rotation_mode = 'XYZ'
            pb.rotation_euler = (0, 0, 0)
            pb.location = (0, 0, 0)
        rig.pose.bones['Echo_SpineBone'].rotation_euler.x = .006*math.sin(phase)
        if name == 'Walk':
            for side, offset in [('Left', 0), ('Right', math.pi)]:
                wave = math.sin(phase+offset)
                rig.pose.bones['Echo_Thigh_'+side].rotation_euler.x = .32*wave
                rig.pose.bones['Echo_Shin_'+side].rotation_euler.x = -.40*max(0, -wave)
                rig.pose.bones['Echo_Foot_'+side].rotation_euler.x = -.32*wave+.40*max(0, -wave)
                rig.pose.bones['Echo_UpperArm_'+side].rotation_euler.x = -.20*wave
                rig.pose.bones['Echo_Forearm_'+side].rotation_euler.x = .08+.05*wave
                rig.pose.bones['Echo_Tail_'+side].rotation_euler.x = .045*wave
            rig.pose.bones['Echo_Hips'].rotation_euler.z = .012*math.sin(phase)
        bpy.context.view_layer.update()
        deps = bpy.context.evaluated_depsgraph_get()
        lowest = min((o.evaluated_get(deps).matrix_world @ v.co).z
                     for o in rig.children if o.name.startswith('Echo_Leg_')
                     for v in o.evaluated_get(deps).data.vertices)
        # Hips local Y follows authoring vertical Z.
        rig.pose.bones['Echo_Hips'].location.y = -.91-lowest
        for pb in rig.pose.bones:
            pb.keyframe_insert('rotation_euler', frame=f)
            if pb.name == 'Echo_Hips':
                pb.keyframe_insert('location', frame=f)
    action.use_fake_user = True
    track = rig.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, 0, action)
    track.mute = True
rig.animation_data.action = None
for pb in rig.pose.bones:
    pb.rotation_euler = (0, 0, 0)
    pb.location = (0, 0, 0)
scene.frame_set(0)
bpy.context.view_layer.update()
exec(compile((BASE/'assets/blender/fit_echo_neck.py').read_text(), 'fit_echo_neck.py', 'exec'))
meshes = [o for o in root.children_recursive if o.type == 'MESH']
for o in meshes:
    o.data.calc_loop_triangles()
metrics = {'triangles': sum(len(o.data.loop_triangles) for o in meshes),
           'meshCount': len(meshes), 'boneCount': len(armature.bones),
           'materialCount': len({m.name for o in meshes for m in o.data.materials}),
           'clips': {'Idle': 3, 'Walk': 1}, 'blenderVersion': bpy.app.version_string}
coords = [o.matrix_world @ v.co for o in meshes for v in o.data.vertices]
mins = [min(v[i] for v in coords) for i in range(3)]
maxs = [max(v[i] for v in coords) for i in range(3)]
metrics.update({'boundsBlender': {'min': mins, 'max': maxs},
                'dimensionsBlender': [maxs[i]-mins[i] for i in range(3)],
                'authorFront': '-Y', 'runtimeFront': '-Z',
                'source': 'Existing authored meshes, local rig and glasses upgrade'})
assert metrics['triangles'] <= 8000
(BASE/'assets/blender/echo-review/metrics.json').write_text(json.dumps(metrics, indent=2)+'\n')
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'assets/blender/echo.blend'))
print('ECHO_METRICS', json.dumps(metrics))
