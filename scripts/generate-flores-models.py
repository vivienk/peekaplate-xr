"""Deterministic illustrative Flores food geometry. Blender 2.93+, no external assets."""
import bpy,math,random,json,sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'public/models'; OUT.mkdir(exist_ok=True)
random.seed(42)
def mat(name,color,rough=.6):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough
 return m
def uv(name,loc,scale,m):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,location=loc);o=bpy.context.object;o.name=name;o.scale=scale;o.data.materials.append(m)
 for p in o.data.polygons:p.use_smooth=True
 return o
def cyl(name,loc,r,depth,m):
 bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=r,depth=depth,location=loc);o=bpy.context.object;o.name=name;o.data.materials.append(m)
 b=o.modifiers.new('Soft edge','BEVEL');b.width=.001;b.segments=2;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=b.name)
 return o
def tube(name,points,r,m):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=2;s=c.splines.new('POLY');s.points.add(len(points)-1)
 for v,p in zip(s.points,points):v.co=(*p,1)
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.data.materials.append(m);return o
def dish(did,width,kind):
 bpy.ops.wm.read_factory_settings(use_empty=True)
 plate=mat('Warm porcelain',(.86,.83,.75),.28);corn=mat('Golden corn',(.72,.39,.085));tuna=mat('Tuna',(.68,.15,.12),.36);avo=mat('Avocado',(.38,.57,.10));green=mat('Guacamole',(.28,.43,.055));onion=mat('Pickled onion',(.78,.17,.38));sauce=mat('Chipotle cream',(.86,.49,.24));herb=mat('Cilantro',(.08,.24,.025));red=mat('Tomato',(.65,.07,.025));bowl=mat('Dark stoneware',(.08,.095,.08),.65)
 cyl('Serving plate',(0,0,.003),width/2,.006,plate)
 if kind=='tostadas':
  for x in [-.052,.052]:
   cyl('Crisp tostada',(x,0,.009),.048,.006,corn)
   for i in range(30):
    a=random.random()*math.tau;r=.035*math.sqrt(random.random());uv('Tuna cube',(x+math.cos(a)*r,math.sin(a)*r,.017+random.random()*.006),(.006,.005,.004),tuna)
   for k in range(3):
    uv('Avocado slice',(x-.015+k*.014,.006,.028),(.006,.028,.004),avo).rotation_euler.z=-.35
   for k in range(3):
    tube('Onion curl',[(x+.021*math.cos(t),.008+(.012+k*.002)*math.sin(t),.035+k*.001) for t in [j*math.tau/28 for j in range(24)]],.0012,onion)
   tube('Aioli drizzle',[(x-.03+i*.003,.023*math.sin(i*.65),.036) for i in range(21)],.0015,sauce)
   for k in range(4):uv('Cilantro leaf',(x+random.uniform(-.03,.03),random.uniform(-.025,.025),.039),(.006,.003,.0008),herb)
 else:
  # Solid visible bowl silhouette, filled dip surface hides its interior.
  uv('Stoneware bowl',(0,0,.021),(.063,.063,.022),bowl)
  uv('Guacamole mound',(0,0,.034),(.058,.058,.012),green)
  for i in range(22):
   a=random.random()*math.tau;r=.049*math.sqrt(random.random());uv('Avocado texture',(math.cos(a)*r,math.sin(a)*r,.042),(.007,.006,.003),avo)
  for i in range(13):
   a=random.random()*math.tau;r=.043*math.sqrt(random.random());uv('Tomato garnish',(math.cos(a)*r,math.sin(a)*r,.047),(.003,.003,.002),red)
  for i in range(8):
   a=i*math.tau/8; x=.077*math.cos(a);y=.077*math.sin(a)
   verts=[(x+.02*math.cos(a+t),y+.02*math.sin(a+t),.012+(j%2)*.012) for j,t in enumerate([0,2.1,4.2])]
   me=bpy.data.meshes.new('Chip');me.from_pydata(verts,[],[(0,1,2)]);o=bpy.data.objects.new('Tortilla chip',me);bpy.context.collection.objects.link(o);o.data.materials.append(corn);s=o.modifiers.new('Thickness','SOLIDIFY');s.thickness=.0015
  for i in range(6):uv('Cilantro leaf',(random.uniform(-.03,.03),random.uniform(-.03,.03),.05),(.007,.004,.001),herb)
 # Convert curves, apply modifiers and transformations before export.
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.convert(target='MESH');bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
 objects=list(bpy.context.selected_objects);tris=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in objects)
 points=[o.matrix_world@Vector(v) for o in objects for v in o.bound_box];dims=[max(p[i] for p in points)-min(p[i] for p in points) for i in range(3)]
 path=OUT/(did+'.glb');bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_yup=True)
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.device='CPU'
 scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.55,.55,.55,1)
 for loc,power,size in [((.2,-.3,.4),3,.3),((-.3,.1,.25),2,.25)]:
  bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.size=size;o.rotation_euler=(Vector((0,0,0))-o.location).to_track_quat('-Z','Y').to_euler()
 bpy.ops.object.camera_add(location=(.24,-.34,.32));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,.02))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=.30;scene.camera=cam
 scene.render.resolution_x=640;scene.render.resolution_y=640;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True;scene.render.filepath=str(OUT/(did+'.png'));bpy.ops.render.render(write_still=True)
 return dict(id=did,triangles=tris,dimensionsMeters=[dims[0],dims[2],dims[1]],glbAxes='X width, Y height, Z depth',fileBytes=path.stat().st_size,includesVessel=True,scale=1,source='procedural illustrative demo',verifiedRestaurantPortion=False)
report=[dish('flores-tostadas-de-atun',.24,'tostadas'),dish('flores-guacamole',.20,'guacamole')]
(OUT/'validation.json').write_text(json.dumps(report,indent=2)+'\n');print('GENERATED',json.dumps(report))
