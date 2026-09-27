"""Build the approved local environment design and Form review; never export GLBs.

blender --background --python assets/blender/build_environment.py
Sources: environment-kit.blend, door.blend. Review scenes and evidence: ignored docs/.
All input coordinates use Three.js Y-up, converted to Blender (x, -z, y).
"""
import bpy
import bmesh
import json
import math
import argparse
import sys
import runpy
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

BASE = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument('--level', choices=['empty-room', 'split-signal', 'convergence', 'reversal'])
args = parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
OUT = BASE / ('docs/phase-11-review/form' if args.level == 'reversal' else 'docs/phase-9-review/form')
OUT.mkdir(parents=True, exist_ok=True)
LAYOUT = json.loads((BASE / 'assets/blender/environment-layout.json').read_text())
bpy.ops.wm.read_factory_settings(use_empty=True)


def xyz(value):
    return Vector((value[0], -value[2], value[1]))


def material(name, color, metallic=0, emission=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    bs = mat.node_tree.nodes['Principled BSDF']
    bs.inputs['Base Color'].default_value = (*color, 1)
    bs.inputs['Metallic'].default_value = metallic
    bs.inputs['Roughness'].default_value = .65
    bs.inputs['Emission Color'].default_value = (*color, 1)
    bs.inputs['Emission Strength'].default_value = emission
    return mat


M = {
    'structure': material('M_Environment_Graphite', (.075, .105, .13), .2),
    'ceramic': material('M_Environment_Ceramic', (.32, .37, .4), .1),
    'recess': material('M_Environment_Recess', (.015, .023, .03)),
    'floor': material('M_Environment_Floor', (.16, .20, .23), .1),
    'cyan': material('M_Environment_Signal', (.12, .65, .7), 0, .6),
    'amber': material('M_Environment_Exit', (.8, .43, .12), 0, .5),
    'diffuser': material('M_Environment_Diffuser', (.7, .8, .82), 0, 1),
    'door': material('M_Door_Panel', (.21, .27, .31), .2),
    'frame': material('M_Door_Frame', (.075, .105, .13), .2),
    'door-light': material('M_Door_Light', (.12, .65, .7), 0, .6),
}


def scene(name):
    s = bpy.data.scenes.new(name)
    bpy.context.window.scene = s
    s.unit_settings.system = 'METRIC'
    s.render.engine = 'CYCLES'
    s.cycles.samples = 24
    s.cycles.use_denoising = True
    s.render.resolution_x = 960
    s.render.resolution_y = 540
    s.render.resolution_percentage = 100
    world = bpy.data.worlds.new(name)
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs[0].default_value = (.45, .55, .6, 1)
    world.node_tree.nodes['Background'].inputs[1].default_value = .12
    s.world = world
    return s


def empty(name, parent=None):
    o = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(o)
    o.parent = parent
    return o


def box(name, size, position, mat, bevel=.006):
    bpy.ops.mesh.primitive_cube_add(size=1, location=xyz(position))
    o = bpy.context.object
    o.name = name
    o.dimensions = (size[0], size[2], size[1])
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    if mat:
        o.data.materials.append(mat)
    if bevel:
        mod = o.modifiers.new('ManufacturedEdge', 'BEVEL')
        mod.width = bevel
        mod.segments = 1
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return o


def cut(obj, size, position, name):
    cutter = box(name, size, position, None, 0)
    bpy.context.view_layer.objects.active = obj
    mod = obj.modifiers.new(name, 'BOOLEAN')
    mod.operation = 'DIFFERENCE'
    mod.solver = 'EXACT'
    mod.object = cutter
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter, do_unlink=True)


def join(objects, name, parent=None):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    o = bpy.context.object
    o.name = name
    o.parent = parent
    return o


def ring(name, count, radius=.2, material=None):
    # A closed, shallow prism: readable geometry without textures or alpha.
    vertices = []
    for depth in [0, .008]:
        for r in [radius - .027, radius + .027]:
            for i in range(count):
                a = 2 * math.pi * i / count + math.pi / 2
                vertices.append(xyz((r * math.cos(a), r * math.sin(a), depth)))
    faces = []
    for i in range(count):
        j = (i + 1) % count
        faces += [(i, j, count+j, count+i),
                  (2*count+i, 3*count+i, 3*count+j, 2*count+j),
                  (i, 2*count+i, 2*count+j, j),
                  (count+i, count+j, 3*count+j, 3*count+i)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    o = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(material or M['cyan'])
    return o


def bounds(o):
    bpy.context.view_layer.update()
    points = [o.matrix_world @ Vector(v) for v in o.bound_box]
    return tuple(min(p[i] for p in points) for i in range(3)), tuple(max(p[i] for p in points) for i in range(3))


def triangles(o):
    o.data.calc_loop_triangles()
    return len(o.data.loop_triangles)


def manifold(o):
    bm = bmesh.new()
    bm.from_mesh(o.data)
    good = all(e.is_manifold for e in bm.edges)
    bm.free()
    return good


def bvh(o):
    bpy.context.view_layer.update()
    return BVHTree.FromPolygons([o.matrix_world @ v.co for v in o.data.vertices],
                               [tuple(p.vertices) for p in o.data.polygons])


def duplicate(root, position=(0, 0, 0)):
    copies = {}
    for old in [root, *root.children_recursive]:
        new = old.copy()
        bpy.context.scene.collection.objects.link(new)
        copies[old] = new
    for old, new in copies.items():
        new.parent = copies.get(old.parent)
    copies[root].location = xyz(position)
    return copies[root], copies


def camera(s, position, target, fov=70):
    if not s.camera:
        data = bpy.data.cameras.new(s.name + '_Camera')
        o = bpy.data.objects.new(data.name, data)
        s.collection.objects.link(o)
        s.camera = o
    o = s.camera
    o.location = xyz(position)
    o.rotation_euler = (xyz(target) - o.location).to_track_quat('-Z', 'Y').to_euler()
    o.data.type = 'PERSP'
    o.data.sensor_fit = 'VERTICAL'
    o.data.lens = o.data.sensor_height / (2 * math.tan(math.radians(fov)/2))


def render(s, filename, position, target, fov=70):
    camera(s, position, target, fov)
    s.render.filepath = str(OUT / filename)
    bpy.ops.render.render(write_still=True)


# Every reusable asset has its own scene and floor/support origin, never a display offset.
kit = {}
for asset in ['Floor', 'Wall', 'Door', 'Plate', 'Exit', 'Light', 'Triangle', 'Circle', 'Square']:
    s = scene('Asset_' + asset)
    root = empty(asset + '_Root')
    if asset == 'Floor':
        join([box('Base', (2, .018, 2), (0, -.033, 0), M['structure']),
              box('Face', (1.98, .024, 1.98), (0, -.012, 0), M['floor'])], 'Floor_Tile', root)
    elif asset == 'Wall':
        join([box('Backing', (2, 3.6, .02), (0, 1.8, -.03), M['structure']),
              box('Face', (1.86, 2.85, .035), (0, 1.87, 0), M['ceramic']),
              *[box('Edge', (.07, 3.6, .08), (x, 1.8, 0), M['structure']) for x in [-.965, .965]],
              box('Recess', (1.84, .17, .004), (0, .28, .02), M['recess'])], 'Wall_Module', root)
    elif asset == 'Door':
        panel = join([box('Core', (2.4, 3.6, .28), (0, 1.8, -.01), M['door']),
                      *[box('Inset', (1.1, 2.95, .02), (x, 1.8, .14), M['door']) for x in [-.59, .59]]], 'Door_Panel', root)
        frame = empty('Door_Frame', root)
        header = box('Header', (2.64, .12, .4), (0, 3.66, 0), M['frame'], 0)
        cut(header, (2.44, .3, .34), (0, 3.66, 0), 'PanelPassage')
        join([header, *[box('Jamb', (.12, 3.6, .4), (x, 1.8, 0), M['frame']) for x in [-1.27, 1.27]]], 'Door_FrameMesh', frame)
        lamp = box('Door_Light', (.9, .035, .02), (0, 3.66, .21), M['door-light'], .003)
        lamp.parent = frame
    elif asset == 'Plate':
        base = box('Plate_Base', (1.8, .03, 1.8), (0, .015, 0), M['structure'])
        base.parent = root
        face = box('Plate_Panel', (1.65, .035, 1.65), (0, .05, 0), M['ceramic'])
        face.parent = root
        for name, x in [('Player', -.7), ('Echo', .7)]:
            light = box('Plate_' + name, (.07, .012, 1.45), (x, .072, 0), M['cyan'], .003)
            light.parent = face
    elif asset == 'Exit':
        join([box('Base', (2, .04, 1.4), (0, .02, 0), M['structure']),
              *[box('Bar', (1.7, .008, .045), (0, .044, z), M['amber'], .002) for z in [-.5, 0, .5]]], 'Exit_Marker', root)
    elif asset == 'Light':
        # Origin on supporting ceiling underside; full fitting extends down 0.05m.
        join([box('Housing', (1.8, .03, .18), (0, -.015, 0), M['structure']),
              box('Diffuser', (1.65, .02, .12), (0, -.04, 0), M['diffuser'], .003)], 'Light_Fixture', root)
    else:
        symbol = ring('Signal_' + asset, {'Triangle':3, 'Circle':32, 'Square':4}[asset])
        symbol.parent = root
    kit[asset] = (s, root)

kit_metrics = {name: {'triangles': sum(triangles(o) for o in root.children_recursive if o.type=='MESH'),
                       'manifold': all(manifold(o) for o in root.children_recursive if o.type=='MESH')}
               for name, (_, root) in kit.items()}
assert all(v['manifold'] for v in kit_metrics.values()), kit_metrics
assert kit_metrics['Door']['triangles'] < 5000
bpy.context.window.scene = kit['Door'][0]
door_root = kit['Door'][1]
panel = next(o for o in door_root.children if o.name=='Door_Panel')
low, high = bounds(panel)
assert all(abs((high[i]-low[i])-v)<1e-5 for i,v in enumerate([2.4,.3,3.6]))
assert panel.location.length == 0 and abs(low[2]) < 1e-6
if args.level == 'reversal':
    runpy.run_path(str(BASE/'assets/blender/build_reversal.py'), init_globals=globals())
    raise SystemExit(0)

if args.level is None:
    bpy.data.libraries.write(str(BASE/'assets/blender/door.blend'), {kit['Door'][0]}, fake_user=True)
    bpy.data.libraries.write(str(BASE/'assets/blender/environment-kit.blend'), {v[0] for v in kit.values()}, fake_user=True)

report = {'schema':1, 'stage':'form-review', 'kit':kit_metrics, 'levels':[], 'runtimeExported':False}
for level in LAYOUT['levels']:
    if level['id'] == 'reversal' or (args.level and level['id'] != args.level):
        continue
    s = scene('Level_' + level['id'])
    width, height, depth = level['bounds']
    door_z = level['door']['z']
    static = []
    # The floor backing sits under the inset tiles; the combined top remains exactly y=0.
    static.append(box('FloorSubstrate', (width+.6,.258,depth+.6), (0,-.171,0), M['recess'], 0))
    for x in range(int(-width/2), int(width/2), 2):
        for z in range(int(-depth/2), int(depth/2), 2):
            tile, _ = duplicate(kit['Floor'][1], (x+1,0,z+1))
            static.extend(o for o in tile.children_recursive if o.type=='MESH')
    wall_boxes = level['boxes'][1:-2]
    for i, spec in enumerate(wall_boxes):
        wall = box('WallSubstrate_'+str(i), spec['size'], spec['position'], M['structure'], 0)
        static.append(wall)
        p=spec['position']; size=spec['size']
        axis = 2 if size[0]<size[2] else 0
        length=size[axis]; count=max(1,round(length/2))
        for side in [-1,1]:
            for n in range(count):
                center = list(p)
                center[axis] += -length/2 + (n+.5)*length/count
                normal = 0 if axis==2 else 2
                center[normal] += side*(size[normal]/2-.017)
                center[1]=1.87
                dims=[.035,2.85,.035];dims[axis]=length/count-.1
                static.append(box('WallFacing',dims,center,M['ceramic']))
    divider=box('Divider', (width,3.6,.3), (0,1.8,door_z), M['structure'], 0)
    # 10 mm side clearance prevents coplanar contact with the 2.4 m leaf.
    cut(divider,(2.42,3.8,.6),(0,1.8,door_z),'GateBoolean')
    static.append(divider)
    roof=box('Ceiling',(width+.6,.18,depth+.6),(0,3.69,0),M['ceramic'],0)
    cut(roof,(2.44,.5,.34),(0,3.75,door_z),'CeilingPanelSlot')
    static.append(roof)
    pocket=box('DoorServicePocket',(2.56,3.94,.5),(0,5.57,door_z),M['structure'],0)
    cut(pocket,(2.44,3.98,.38),(0,5.49,door_z),'OpenBottomPocket')
    static.append(pocket)
    door, mapping = duplicate(door_root,(0,0,door_z))
    live_panel=mapping[panel]
    fixtures=[]
    for fixture in level['fixtures']:
        # Manifest fixture center describes its volume; support origin is at y=3.6.
        x,_,z=fixture['position']
        lamp,_=duplicate(kit['Light'][1],(x,3.6,z))
        fixture_mesh = next(o for o in lamp.children_recursive if o.type=='MESH')
        lamp_low, lamp_high = bounds(fixture_mesh)
        assert abs(lamp_high[2]-3.6)<1e-5
        assert abs(lamp_low[2]-3.55)<1e-5
        # Verify every fitting against all opaque walls, including the divider.
        for wall_spec in level['boxes'][1:]:
            p, d = wall_spec['position'], wall_spec['size']
            overlap_x = min(x+.9,p[0]+d[0]/2)-max(x-.9,p[0]-d[0]/2)
            overlap_z = min(z+.09,p[2]+d[2]/2)-max(z-.09,p[2]-d[2]/2)
            assert overlap_x<=0 or overlap_z<=0, (fixture['id'],wall_spec)
        static.extend(o for o in lamp.children_recursive if o.type=='MESH')
        data=bpy.data.lights.new(fixture['id'],'AREA')
        data.energy=fixture['watts'];data.shape='RECTANGLE';data.size=1.65;data.size_y=.12
        light=bpy.data.objects.new(fixture['id'],data);s.collection.objects.link(light)
        light.location=xyz((x,3.545,z))
        fixtures.append(light)
    for i,p in enumerate(level['plates']):
        plate,_=duplicate(kit['Plate'][1],(p['x'],0,p['z']))
        symbol,_=duplicate(kit[['Triangle','Circle','Square'][i]][1],(p['x'],.0675,p['z']))
        symbol.rotation_euler.x=-math.pi/2
        # A vertical signal bank is supported by the divider beside the gate.
        # It never occupies the clear opening or follows the moving leaf.
        signal_y=2.65-i*.65
        signal,_=duplicate(kit[['Triangle','Circle','Square'][i]][1],(-1.7,signal_y,door_z+.165))
        backing=box('SignalBacking',(.54,.54,.015),(-1.7,signal_y,door_z+.1575),M['structure'],.005)
        static.append(backing)
    exit_p=level['exit']
    ex,_=duplicate(kit['Exit'][1],(exit_p['x'],0,exit_p['z']))
    static.extend(o for o in ex.children_recursive if o.type=='MESH')
    static.append(box('ExitWallStrip',(1.8,.12,.015),(0,2,-depth/2+.008),M['amber'],.003))
    static.append(box('SpawnMark',(.8,.004,.8),(level['spawn'][0],.002,level['spawn'][2]),M['ceramic'],0))
    bpy.context.view_layer.update()
    # Check the panel's swept volume against real evaluated geometry, not only AABBs.
    blockers=[roof,pocket,divider,mapping[next(o for o in door_root.children_recursive if o.name=='Door_FrameMesh')]]
    blocker_trees=[bvh(o) for o in blockers]
    hits=[]
    for tick in range(121):
        lift=3.8*tick/120
        live_panel.location.z=lift
        tree=bvh(live_panel)
        for other,tree_b in zip(blockers,blocker_trees):
            if tree.overlap(tree_b):hits.append({'lift':lift,'blocker':other.name})
    live_panel.location.z=0
    assert not hits, hits[:5]
    # Aperture and ceiling slot are actual holes; rays through their centers must miss.
    assert bvh(divider).ray_cast(xyz((0,1.8,door_z+1)),xyz((0,0,-1)),2)[0] is None
    assert bvh(roof).ray_cast(xyz((0,3.4,door_z)),xyz((0,1,0)),.5)[0] is None
    assert all(manifold(o) for o in blockers)
    # Merge static geometry for a bounded material/draw-call cost in the future GLB.
    combined=join(static,'Environment_Static')
    all_meshes=[o for o in s.objects if o.type=='MESH']
    tri=sum(triangles(o) for o in all_meshes)
    draws=sum(len({p.material_index for p in o.data.polygons}) for o in all_meshes)
    assert tri+2*8000<=150000
    assert draws+64<=180
    assert all(manifold(o) for o in all_meshes)
    metrics={'id':level['id'],'environmentTriangles':tri,'estimatedMaterialDraws':draws,
             'panelSweepSamples':121,'panelIntersections':hits,'gateBoolean':True,'ceilingSlotBoolean':True,
             'manifold':True,'ceilingFixtureCount':len(fixtures),'fixtureSupportAndWallClearance':True,'sourceColliderBoxes':level['boxes'],
             'runtimeMeasured':False,'renderFiles':[]}
    spawn=level['spawn']; view=[spawn[0],spawn[1]+.75,spawn[2]]
    views=[('arrival',view,[0,1.67,door_z],70),
           ('corner-sw',[-width/2+.6,1.67,depth/2-.6],[0,1.7,0],120),
           ('corner-se',[width/2-.6,1.67,depth/2-.6],[0,1.7,0],120),
           ('corner-nw',[-width/2+.6,1.67,-depth/2+.6],[0,1.7,0],120),
           ('corner-ne',[width/2-.6,1.67,-depth/2+.6],[0,1.7,0],120),
           ('ceiling-up',[0,1.67,1],[0,3.6,1],120),
           ('ceiling-south',[0,1.67,depth/2-1],[0,3.6,0],85),
           ('ceiling-north',[0,1.67,door_z+1],[0,3.6,2],85),
           ('door-closed',[0,1.67,door_z+3],[0,2,door_z],70)]
    for name,pos,target,fov in views:
        filename=level['id']+'-'+name+'.png'
        render(s,filename,pos,target,fov)
        metrics['renderFiles'].append(filename)
    live_panel.location.z=3.8
    render(s,level['id']+'-door-open.png',[0,1.67,door_z+3],[0,2,door_z],70)
    live_panel.location.z=0
    camera(s,view,[0,1.67,door_z],70)
    bpy.data.libraries.write(str(OUT/(level['id']+'.blend')),{s},fake_user=True)
    report['levels'].append(metrics)
    (OUT/'audit.json').write_text(json.dumps(report,indent=2))
    print('LEVEL_FORM_CHECK',json.dumps({k:v for k,v in metrics.items() if k not in ['sourceColliderBoxes','renderFiles']}))

metrics_path = BASE/'assets/blender/environment-metrics.json'
if metrics_path.exists():
    previous = json.loads(metrics_path.read_text())
    built_ids = {level['id'] for level in report['levels']}
    report['levels'] = [l for l in previous['levels'] if l['id'] not in built_ids] + report['levels']
metrics_path.write_text(json.dumps({'schema':1,'kit':kit_metrics,'levels':[{k:v for k,v in l.items() if k not in ['sourceColliderBoxes','renderFiles']} for l in report['levels']]},indent=2)+'\n')
print('FORM REVIEW READY. GLB export intentionally not run.')
