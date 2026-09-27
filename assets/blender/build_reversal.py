"""Reversal Form composition; invoked by build_environment.py -- --level reversal.

Uses the shared authoring helpers and kit, but never rewrites approved sources or
exports. Dynamic devices are review proxies and excluded from Environment_Static.
"""
level = next(l for l in LAYOUT['levels'] if l['id'] == 'reversal')
s = scene('Level_reversal')
static = []
review_devices = []
static.append(box('FloorSubstrate', (12.6,.258,32.6), (0,-.171,-1), M['recess'], 0))
# Simple inset faces keep the longer room within the same web budget.
for x in range(-6,6,2):
    for z in range(-17,15,2):
        static.append(box('FloorTile', (1.985,.024,1.985), (x+1,-.012,z+1), M['floor'], 0))
for spec in level['boxes'][1:5]:
    static.append(box('Boundary', spec['size'], spec['position'], M['structure'], 0))
# Facing projects 3 mm from its substrate, avoiding coplanar faces.
for side in [-1,1]:
    for z in range(-16,15,2):
        static.append(box('WallFacing', (.035,2.85,1.88), (side*6.0145,1.87,z), M['ceramic']))
        static.append(box('WallFootRecess', (.01,.17,1.88), (side*6.003,.28,z), M['recess'],0))
for z in [-17,15]:
    for x in [-5,-3,-1,1,3,5]:
        static.append(box('EndFacing',(1.88,2.85,.035),(x,1.87,z+(.0145 if z>0 else -.0145)),M['ceramic']))
roof=box('Ceiling',(12.6,.18,32.6),(0,3.69,-1),M['ceramic'],0)
static.append(roof)
window_rays=[]
gates=[]
for gate in level['doors']:
    z=gate['z']
    wall=box('Divider_'+gate['id'],(12,3.6,.3),(0,1.8,z),M['structure'],0)
    cut(wall,(2.42,3.8,.6),(0,1.8,z),'Gate_'+gate['id'])
    windows=[w for w in level['windows'] if w['position'][2]==z]
    for window in windows:
        x,y,_=window['position']
        cut(wall,(2.4,1,.6),(x,y,z),'Window_'+window['id'])
        assert bvh(wall).ray_cast(xyz((x,y,z+1)),xyz((0,0,-1)),2)[0] is None
        window_rays.append(window['id'])
        # Physical mullions communicate a viewing aperture, not a traversable route.
        for dx in [-.8,0,.8]:
            static.append(box('WindowMullion',(.035,1,.08),(x+dx,y,z),M['structure'],0))
        for face in [-1,1]:
            for dy in [-.53,.53]:
                static.append(box('WindowReveal',(2.52,.06,.035),(x,y+dy,z+face*.16),M['ceramic']))
            for dx in [-1.23,1.23]:
                static.append(box('WindowReveal',(.06,1,.035),(x+dx,y,z+face*.16),M['ceramic']))
    static.append(wall)
    # Facing is cut with exactly the same apertures as the structural wall.
    for face in [-1,1]:
        facing=box('DividerFacing',(11.8,2.85,.025),(0,1.87,z+face*.139),M['ceramic'],0)
        cut(facing,(2.68,4,.6),(0,1.8,z),'FrameClearance')
        for w in windows:
            cut(facing,(2.52,1.12,.6),w['position'],'WindowFacing')
        static.append(facing)
    cut(roof,(2.44,.5,.34),(0,3.75,z),'CeilingSlot_'+gate['id'])
    pocket=box('ServicePocket_'+gate['id'],(2.56,3.94,.5),(0,5.57,z),M['structure'],0)
    cut(pocket,(2.44,3.98,.38),(0,5.49,z),'PocketOpening')
    static.append(pocket)
    door,mapping=duplicate(door_root,(0,0,z))
    review_devices.append(door)
    frame=mapping[next(o for o in door_root.children_recursive if o.name=='Door_FrameMesh')]
    gates.append((gate,mapping[panel],wall,pocket,frame))
    for index,offset in ([(2,0),(3,1)] if gate['id']=='exit' else [(0 if gate['id']=='entry' else 1,0)]):
        y=2.25-offset*.6
        static.append(box('SignalBacking',(.56,.56,.015),(-1.8,y,z+.1575),M['structure']))
        signal=ring('ReviewGateSignal',[3,32,4,6][index],.18)
        signal.location=xyz((-1.8,y,z+.18))
        review_devices.append(signal)
# Consoles preserve their collider envelope and existing signal positions.
for spec in level['boxes'][5:7]:
    static.append(box('Console',spec['size'],spec['position'],M['structure']))
    x,_,z=spec['position']
    static.append(box('ConsoleFace',(1.68,1.53,.012),(x,.85,z+.088),M['recess']))
    for index in [2,3]:
        signal=ring('ReviewConsoleSignal',[4,6][index-2],.18)
        signal.location=xyz((x+(index-2.5)*.75,1.3,z+.11))
        review_devices.append(signal)
    review_devices.append(box('ReviewCharge',(1.5,.12,.06),(x,.65,z+.12),M['recess'],0))
for i,p in enumerate(level['plates']):
    plate,_=duplicate(kit['Plate'][1],(p['x'],0,p['z']))
    review_devices.append(plate)
    symbol=ring('ReviewPlateSymbol',[3,32,4,6][i],.18)
    symbol.location=xyz((p['x'],.0675,p['z']))
    symbol.rotation_euler.x=-math.pi/2
    review_devices.append(symbol)
# Existing runtime conduits are represented faithfully, without embedding their states.
segments=[((-4,11),(-4,6.5)),((-4,6.5),(-1.4,6.5)),((-4,2),(-4,-1.5)),((-4,-1.5),(-1.4,-1.5)),((4,11),(5.5,11)),((4,-6),(5.5,-6)),((5.5,11),(5.5,-9.5)),((5.5,-9.5),(1.4,-9.5))]
for a,b in segments:
    review_devices.append(box('ReviewConduit',(abs(a[0]-b[0]) or .045,.018,abs(a[1]-b[1]) or .045),((a[0]+b[0])/2,.013,(a[1]+b[1])/2),M['cyan'],0))
review_devices.append(box('ReviewCharge',(1.5,.12,.06),(2.4,1.3,-9.8),M['recess'],0))
review_devices.append(box('ReviewExit',(2,.05,1.4),(0,.025,-14),M['amber'],0))
review_devices.append(box('ReviewExitStrip',(1.8,.2,.02),(0,2,-16.98),M['amber'],0))
static.append(box('SpawnMark',(.8,.004,.8),(0,.002,13),M['ceramic'],0))
for f in level['fixtures']:
    x,_,z=f['position']
    lamp,_=duplicate(kit['Light'][1],(x,3.6,z))
    meshes=[o for o in lamp.children_recursive if o.type=='MESH']
    for mesh in meshes:
        lo,hi=bounds(mesh)
        assert abs(hi[2]-3.6)<1e-5 and abs(lo[2]-3.55)<1e-5
    for spec in level['boxes'][1:]:
        p,d=spec['position'],spec['size']
        assert min(x+.9,p[0]+d[0]/2)-max(x-.9,p[0]-d[0]/2)<=0 or min(z+.09,p[2]+d[2]/2)-max(z-.09,p[2]-d[2]/2)<=0
    static.extend(meshes)
    data=bpy.data.lights.new(f['id'],'AREA');data.energy=f['watts'];data.shape='RECTANGLE';data.size=1.65;data.size_y=.12
    light=bpy.data.objects.new(f['id'],data);s.collection.objects.link(light);light.location=xyz((x,3.545,z))
hits=[]
for gate,leaf,wall,pocket,frame in gates:
    blockers=[roof,pocket,wall,frame]
    trees=[bvh(o) for o in blockers]
    for step in range(121):
        leaf.location.z=3.8*step/120
        tree=bvh(leaf)
        for obj,other in zip(blockers,trees):
            if tree.overlap(other):hits.append({'door':gate['id'],'step':step,'blocker':obj.name})
    leaf.location.z=0
    assert bvh(wall).ray_cast(xyz((0,1.8,gate['z']+1)),xyz((0,0,-1)),2)[0] is None
    assert bvh(roof).ray_cast(xyz((0,3.4,gate['z'])),xyz((0,1,0)),.5)[0] is None
assert not hits,hits[:10]
assert all(manifold(o) for o in static)
combined=join(static,'Environment_Static')
static_triangles=triangles(combined)
assert static_triangles<=14000,static_triangles
all_meshes=[o for o in s.objects if o.type=='MESH']
assert all(manifold(o) for o in all_meshes)
metrics={'id':'reversal','staticTriangles':static_triangles,'reviewTriangles':sum(triangles(o) for o in all_meshes),'staticMaterialDraws':len({p.material_index for p in combined.data.polygons}),'doorSweepSamples':121,'doorCount':3,'doorIntersections':hits,'windowBooleanRayTests':window_rays,'manifold':True,'fixtureSupportAndWallClearance':True,'fixtureCount':len(level['fixtures']),'boundsBlender':bounds(combined),'runtimeExported':False,'formApproval':'pending','renderFiles':[]}
views=[('arrival',[0,1.67,13],[0,1.67,6],70),('sector-middle',[0,1.67,4],[0,1.67,-2],70),('sector-core',[0,1.67,-4],[0,1.67,-10],70),('window',[-3.6,1.67,7.3],[-3.6,1.9,4],70),('console',[3,1.67,12],[4,1.1,9.5],70),('corner-sw',[-5.4,1.67,14.4],[0,1.7,7],120),('corner-se',[5.4,1.67,14.4],[0,1.7,7],120),('corner-nw',[-5.4,1.67,-16.4],[0,1.7,-11],120),('corner-ne',[5.4,1.67,-16.4],[0,1.7,-11],120),('ceiling-up',[0,1.67,10],[0,3.6,10],120),('ceiling-south',[0,1.67,14],[0,3.6,7],85),('ceiling-north',[0,1.67,-9],[0,3.6,-3],85)]
# Save a reproducible scene before rendering so an interrupted review loses no source.
camera(s,[0,1.67,13],[0,1.67,6],70)
bpy.data.libraries.write(str(OUT/'reversal.blend'),{s},fake_user=True)
for name,pos,target,fov in views:
    filename='reversal-'+name+'.png'
    render(s,filename,pos,target,fov)
    metrics['renderFiles'].append(filename)
for gate,leaf,*_ in gates:leaf.location.z=3.8
render(s,'reversal-gates-open.png',[0,1.67,13],[0,1.67,-14],70)
for gate,leaf,*_ in gates:leaf.location.z=0
metrics['renderFiles'].append('reversal-gates-open.png')
(OUT/'audit.json').write_text(json.dumps(metrics,indent=2)+'\n')
print('REVERSAL_FORM_CHECK',json.dumps(metrics))
