"""Create lightweight derivatives; leave the user-supplied originals untouched."""
import bpy,json,sys,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[1]
items=[('thai-chicken-bowl','/Users/vivienkong/Downloads/fried chicken bowl 3d model.glb'),('noka-steak-ramen','/Users/vivienkong/Downloads/Meshy_AI_handpainted_steak_ram_1118014748_image-to-3d-texture.glb')]
report=[]
for key,source in items:
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.ops.import_scene.gltf(filepath=source)
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
 before=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes)
 for o in meshes:
  bpy.context.view_layer.objects.active=o;o.select_set(True)
  mod=o.modifiers.new('Browser triangle budget','DECIMATE');mod.ratio=min(1,45000/before)
  bpy.ops.object.modifier_apply(modifier=mod.name);o.select_set(False)
 for image in bpy.data.images:
  if image.size[0]>2048 or image.size[1]>2048:
   scale=2048/max(image.size);image.scale(round(image.size[0]*scale),round(image.size[1]*scale));image.pack()
 target=root/'public/supplied-dishes'/f'{key}.glb'
 bpy.ops.export_scene.gltf(filepath=str(target),export_format='GLB',export_yup=True)
 after=sum(sum(len(p.vertices)-2 for p in o.data.polygons) for o in meshes)
 report.append({'id':key,'source':Path(source).name,'source_sha256':hashlib.sha256(Path(source).read_bytes()).hexdigest(),'source_triangles':before,'triangles':after,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'physical_size':'27 cm reference, estimated; not measured'})
(root/'artifacts/supplied-dishes/models.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
