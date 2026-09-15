"""Run with Blender --background --python assets/blender/build_echo.py.
Local authored geometry only. No network, paid services, rigs or textures.
"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector, Matrix
BASE = Path(__file__).resolve().parents[2]
OUT = BASE / 'assets/blender/echo-review'
OUT.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1

def empty(name, parent=None, location=(0,0,0)):
    obj = bpy.data.objects.new(name, None)
    scene.collection.objects.link(obj)
    obj.parent = parent
    obj.location = location
    return obj

def material(name, color, alpha, emission):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    m.diffuse_color = (*color,alpha)
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color,1)
    p.inputs['Metallic'].default_value = 0.08
    p.inputs['Roughness'].default_value = 0.4
    p.inputs['Alpha'].default_value = alpha
    p.inputs['Emission Color'].default_value = (*color,1)
    p.inputs['Emission Strength'].default_value = emission
    return m
shell = material('M_Echo_Shell',(.31,.76,.84),.62,.18)
core = material('M_Echo_Core',(.015,.38,.50),1,.4)
gaze = material('M_Echo_Gaze',(.64,.94,1),.95,1.1)
coat = material('M_Echo_Coat',(.018,.022,.028),1,0)
coat.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.34
fabric = material('M_Echo_Fabric',(.009,.012,.017),1,0)
fabric.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.8
boots = material('M_Echo_Boots',(.012,.015,.019),1,0)
boots.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.48
root = empty('Echo_Root')
body = empty('Echo_Body',root)
head = empty('Echo_HeadPivot',root,(0,0,.58))

def loft(name, rings, parent, mat, segments=24):
    # rings: z, center x/y, half width/depth. All geometry baked, mesh transforms identity.
    verts=[]
    for z,x,y,rx,ry in rings:
        for i in range(segments):
            a=2*math.pi*i/segments
            verts.append((x+rx*math.cos(a), y+ry*math.sin(a),z))
    faces=[]
    for r in range(len(rings)-1):
        for i in range(segments):
            a=r*segments+i; b=r*segments+(i+1)%segments
            faces.append((a,b,b+segments,a+segments))
    faces.append(tuple(reversed(range(segments))))
    faces.append(tuple((len(rings)-1)*segments+i for i in range(segments)))
    mesh=bpy.data.meshes.new(name+'_Geometry');mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh);scene.collection.objects.link(obj);obj.parent=parent
    obj.data.materials.append(mat)
    for f in mesh.polygons: f.use_smooth=len(f.vertices)==4
    return obj

loft('Echo_Torso',[(z,0,0,w,d) for z,w,d in [(-.24,.115,.095),(-.21,.15,.105),(-.14,.155,.11),(-.08,.125,.095),(.02,.14,.1),(.16,.185,.115),(.27,.20,.115),(.33,.185,.105),(.37,.105,.08),(.40,.065,.065)]],body,shell)
for sign,side in [(-1,'Left'),(1,'Right')]:
    loft('Echo_Arm_'+side,[(z,sign*x,y,w,d) for z,x,y,w,d in [(-.40,.228,-.018,.038,.043),(-.37,.24,-.015,.045,.052),(-.24,.25,0,.044,.055),(-.08,.245,0,.04,.055),(.04,.237,0,.048,.062),(.19,.215,0,.059,.068),(.28,.20,0,.065,.067),(.31,.184,0,.046,.045)]],body,shell)
    loft('Echo_Leg_'+side,[(z,sign*x,y,w,d) for z,x,y,w,d in [(-.91,.083,-.035,.057,.115),(-.89,.083,-.035,.065,.12),(-.84,.083,-.015,.06,.095),(-.77,.083,0,.05,.065),(-.64,.085,0,.058,.065),(-.54,.086,0,.052,.06),(-.44,.088,0,.062,.075),(-.32,.085,0,.073,.087),(-.20,.073,0,.077,.09)]],body,shell)
loft('Echo_Head',[(z,0,0,w,d) for z,w,d in [(-.205,.061,.062),(-.18,.10,.09),(-.12,.13,.108),(-.02,.143,.12),(.08,.14,.115),(.16,.113,.098),(.205,.055,.05),(.21,.025,.025)]],head,shell)
loft('Echo_HeadCore',[(z,0,.006,w,d) for z,w,d in [(-.15,.045,.04),(-.10,.09,.075),(0,.105,.085),(.10,.09,.075),(.16,.045,.04)]],head,core)
# Broad attached gaze band and directional brow, no tiny floating details.
loft('Echo_Gaze',[(z,0,-.113,w,d) for z,w,d in [(.015,.10,.019),(.025,.125,.024),(.065,.125,.024),(.075,.10,.019)]],head,gaze)
loft('Echo_Core',[(z,0,-.008,w,d) for z,w,d in [(-.16,.025,.038),(-.10,.045,.048),(.03,.042,.049),(.19,.047,.05),(.29,.022,.036)]],body,core)
# Subtle broad internal spine: visible through shell from behind, attached within body.
loft('Echo_Spine',[(z,0,.075,w,d) for z,w,d in [(-.15,.016,.012),(-.10,.023,.017),(.08,.024,.018),(.25,.019,.014),(.29,.012,.008)]],body,core)
# Tailored clothing replaces covered body surfaces, avoiding nested/copanar shells.
bpy.data.objects['Echo_Torso'].data.materials[0]=fabric
for side in ['Left','Right']:
    arm=bpy.data.objects['Echo_Arm_'+side]
    arm.data.materials[0]=coat
    arm.data.materials.append(boots)
    for face in arm.data.polygons:
        if sum(arm.data.vertices[i].co.z for i in face.vertices)/len(face.vertices)<-.32:
            face.material_index=1
    leg=bpy.data.objects['Echo_Leg_'+side]
    leg.data.materials[0]=fabric
    leg.data.materials.append(boots)
    for face in leg.data.polygons:
        if sum(leg.data.vertices[i].co.z for i in face.vertices)/len(face.vertices)<-.64:
            face.material_index=1

# Each tailored half is a thick open arc. Front opening and back vent are real gaps.
def coat_half(name, sign):
    rows=[(-.54,.202,.15,.51),(-.42,.19,.146,.46),(-.24,.176,.136,.40),
          (-.10,.153,.119,.35),(.04,.164,.126,.34),(.20,.203,.139,.43),
          (.30,.204,.136,.54),(.35,.11,.093,.70)]
    n=14; verts=[]
    for z,w,d,gap in rows:
        for j in range(n+1):
            # -Y front -> +Y rear. Back vent confined below the waist.
            angle=-math.pi/2+gap+(math.pi-gap-(.055 if z<-.24 else .008))*j/n
            verts.append((sign*w*math.cos(angle),d*math.sin(angle),z))
    faces=[]
    for r in range(len(rows)-1):
        for j in range(n):
            a=r*(n+1)+j
            face=(a,a+1,a+n+2,a+n+1)
            faces.append(face if sign>0 else tuple(reversed(face)))
    mesh=bpy.data.meshes.new(name+'_Geometry');mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new(name,mesh);scene.collection.objects.link(obj);obj.parent=body
    mesh.materials.append(coat)
    for face in mesh.polygons: face.use_smooth=True
    bpy.context.view_layer.objects.active=obj
    solid=obj.modifiers.new('Tailored thickness','SOLIDIFY');solid.thickness=.006
    bpy.ops.object.modifier_apply(modifier=solid.name)
    return obj
for sign,side in [(-1,'Left'),(1,'Right')]:
    coat_half('Echo_Coat_'+side,sign)
    # Cyan wrist seam remains deliberately sparse.
    loft('Echo_Cuff_'+side,[(-.323,sign*.242,-.014,.046,.054),(-.31,sign*.243,-.014,.046,.054)],body,core,segments=16)
# Chest beacon is attached to the opaque underlayer, not hidden inside it.
loft('Echo_ChestLight',[(.14,0,-.123,.014,.006),(.21,0,-.123,.014,.006)],body,core,segments=8)
# Two collar wings, below the head's swept volume and open at the throat.
for sign,side in [(-1,'Left'),(1,'Right')]:
    loft('Echo_Collar_'+side,[(.30,sign*.085,.005,.024,.070),(.355,sign*.079,.014,.018,.055)],body,coat,segments=12)

meshes=[o for o in root.children_recursive if o.type=='MESH']
for obj in meshes:
    obj.data.calc_loop_triangles()
triangles=sum(len(o.data.loop_triangles) for o in meshes)
coords=[o.matrix_world @ v.co for o in meshes for v in o.data.vertices]
bpy.context.view_layer.update()
coords=[o.matrix_world @ v.co for o in meshes for v in o.data.vertices]
mins=[min(v[i] for v in coords) for i in range(3)];maxs=[max(v[i] for v in coords) for i in range(3)]
metrics={'triangles':triangles,'boundsBlender':{'min':mins,'max':maxs},'dimensionsBlender':[maxs[i]-mins[i] for i in range(3)],'meshCount':len(meshes),'materialCount':len({m.name for o in meshes for m in o.data.materials}),'authorFront':'-Y','runtimeFront':'-Z','exportConversion':'Bake Z rotation pi into mesh coordinates and local positions; no runtime correction','source':'Blender local authored loft meshes','blenderVersion':bpy.app.version_string}
assert triangles<=8000
(OUT/'metrics.json').write_text(json.dumps(metrics,indent=2))
# Review rig is excluded from GLB and kept editable in blend.
world=bpy.data.worlds.new('Echo_Review_World');scene.world=world;world.use_nodes=True
world.node_tree.nodes['Background'].inputs[0].default_value=(.19,.20,.22,1)
world.node_tree.nodes['Background'].inputs[1].default_value=.5
bpy.ops.mesh.primitive_plane_add(size=200, location=(0,0,-.914))
floor=bpy.context.object;floor.name='Review_Ground'
floor_mat=material('Review_Grey',(.22,.235,.25),1,0);floor.data.materials.append(floor_mat)
for name,loc,power,size in [('Review_Key',(3,-4,5),400,4),('Review_Fill',(-3,-1,2),180,3),('Review_Rim',(1,3,3),300,3)]:
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size
    obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=loc;obj.rotation_euler=(Vector((0,0,0))-obj.location).to_track_quat('-Z','Y').to_euler()
camdata=bpy.data.cameras.new('Review_Camera');cam=bpy.data.objects.new('Review_Camera',camdata);scene.collection.objects.link(cam);scene.camera=cam
camdata.type='ORTHO';camdata.ortho_scale=2.15
scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=640;scene.render.resolution_y=720;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
views={'front':(0,-4,.3),'three-quarter':(3,-4,.4),'profile':(4,0,.3),'back':(0,4,.3),'level-grey':(-3,-4,.3)}
for name,loc in views.items():
    cam.location=loc;cam.rotation_euler=(Vector((0,0,-.06))-cam.location).to_track_quat('-Z','Y').to_euler()
    if name=='level-grey': floor_mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.45,.47,.49,1)
    scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.render.render(write_still=True)
# Save author source with -Y front before runtime-only basis conversion.
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(BASE/'assets/blender/echo.blend'))
exec(compile((BASE/'assets/blender/export_echo.py').read_text(), 'export_echo.py', 'exec'))
print('ECHO_METRICS',json.dumps(metrics))
