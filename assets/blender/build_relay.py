"""Build editable Relay art, inspect materials, then export grouped static meshes.
Run build-relay-art.mjs --spec-only before this Blender CLI script.
"""
import bpy
import json
from pathlib import Path
BASE = Path(__file__).resolve().parents[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.save_version = 0
root = bpy.data.objects.new('Environment_Static', None)
bpy.context.collection.objects.link(root)
materials = {}
parts = json.loads((BASE/'assets/blender/relay-art.json').read_text())
def linear_color(value):
    rgb = [int(value[i:i+2], 16)/255 for i in (1,3,5)]
    return tuple(c/12.92 if c <= .04045 else ((c+.055)/1.055)**2.4 for c in rgb)
for part in parts:
    x,y,z = part['position']
    sx,sy,sz = part['size']
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x,-z,y))
    obj = bpy.context.object
    obj.name = part['name']
    obj.dimensions = (sx,sz,sy)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.parent = root
    key = part['material']
    if key not in materials:
        mat = bpy.data.materials.new('Relay_'+key)
        mat.use_nodes = True
        color = (*linear_color(part['color']), 1)
        mat.diffuse_color = color
        shader = mat.node_tree.nodes.get('Principled BSDF')
        shader.inputs['Base Color'].default_value = color
        shader.inputs['Roughness'].default_value = part['roughness']
        shader.inputs['Metallic'].default_value = part['metalness']
        shader.inputs['Emission Color'].default_value = color
        shader.inputs['Emission Strength'].default_value = part.get('emission',0)
        materials[key] = mat
    obj.data.materials.append(materials[key])
triangles = sum(len(obj.data.polygons)*2 for obj in root.children)
assert 0 < triangles <= 14000, triangles
# Inspect the actual hierarchy/material graph before export; no lossy procedural nodes.
report = {'blender': bpy.app.version_string, 'scene':'Level_relay', 'triangles':triangles,
          'objects':[{'name':o.name,'vertices':len(o.data.vertices),'modifiers':len(o.modifiers)} for o in root.children],
          'materials':{key:[n.type for n in mat.node_tree.nodes] for key,mat in materials.items()}}
assert all(set(nodes)=={'OUTPUT_MATERIAL','BSDF_PRINCIPLED'} for nodes in report['materials'].values())
(BASE/'assets/blender/relay-inspection.json').write_text(json.dumps(report,indent=2)+'\n')
bpy.context.scene.name = 'Level_relay'
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'assets/blender/relay.blend'))
# Keep the saved source modular; join only the export copy in memory.
for key,mat in materials.items():
    bpy.ops.object.select_all(action='DESELECT')
    objects = [o for o in root.children if o.active_material==mat]
    for obj in objects: obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    bpy.context.object.name = 'Relay_'+key
bpy.ops.export_scene.gltf(filepath=str(BASE/'public/models/environment/relay.glb'),
    export_format='GLB', export_yup=True, export_apply=False, export_animations=False,
    export_lights=False, export_cameras=False, export_draco_mesh_compression_enable=False)
print(json.dumps({'triangles':triangles,'exportMeshes':len(root.children),'bytes':(BASE/'public/models/environment/relay.glb').stat().st_size}))
