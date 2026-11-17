"""PR162 alpha-only segmentation of matched source photos, with hashed T1 layers."""
import sys,json,hashlib,io,os
from pathlib import Path
from uuid import uuid5,NAMESPACE_URL
from PIL import Image,ImageOps
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'scripts/processing'))
os.environ['U2NET_HOME']=str(ROOT/'.model-pipeline/models')
from peekaplate_processing.cutout import automatic_mask
sha=lambda b:hashlib.sha256(b).hexdigest()
index=json.loads((ROOT/'src/glimmer/restaurant-photos.json').read_text());out={}
for id,entry in index.items():
 source=ImageOps.exif_transpose(Image.open(ROOT/'public'/entry['photo'])).convert('RGB');source.thumbnail((640,640),Image.Resampling.LANCZOS)
 mask,metadata=automatic_mask(source);source=source.convert('RGBA');source.putalpha(Image.open(io.BytesIO(mask)).convert('L'))
 folder=ROOT/'public/restaurant-portions'/id;folder.mkdir(parents=True,exist_ok=True)
 data=io.BytesIO();source.save(data,'WEBP',quality=88,method=6);foreground=data.getvalue()
 background=f'<svg xmlns="http://www.w3.org/2000/svg" width="{source.width}" height="{source.height}"></svg>'.encode()
 assert len(foreground)+len(background)<180000
 (folder/'foreground.webp').write_bytes(foreground);(folder/'background.svg').write_bytes(background)
 portion={'schema_version':1,'dish_id':str(uuid5(NAMESPACE_URL,id)),'dish_revision_id':str(uuid5(NAMESPACE_URL,entry['sha256'])),'width':source.width,'height':source.height,'motion':{'max_yaw_degrees':3,'max_pitch_degrees':3},'layers':[{'url':f'https://restaurant-portions.invalid/{id}/'+name,'sha256':sha(data),'size_bytes':len(data),'depth':depth} for name,data,depth in [('background.svg',background,0),('foreground.webp',foreground,1)]]}
 out[id]={'portion':portion,'segmentation':metadata};print(id,'prepared',flush=True)
(ROOT/'src/glimmer/restaurant-portions.json').write_text(json.dumps(out,indent=2)+'\n')
