"""Package generated transparent food artwork into bounded, hashed 2.5D layers.
Input JSON maps dish IDs to {source, prompt}; original generated PNGs stay untouched.
"""
import json,hashlib,sys,io
from pathlib import Path
from uuid import uuid5,NAMESPACE_URL
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
inputs=json.loads(Path(sys.argv[1]).read_text());out={};provenance={}
sha=lambda b:hashlib.sha256(b).hexdigest()
old_index_path=ROOT/'src/glimmer/illustrative-portions.json';old_provenance_path=ROOT/'docs/illustrative-food-provenance.json'
old_index=json.loads(old_index_path.read_text()) if old_index_path.exists() else {}
old_provenance=json.loads(old_provenance_path.read_text()) if old_provenance_path.exists() else {}
for id,entry in inputs.items():
 raw=Path(entry['source']).read_bytes()
 if old_provenance.get(id,{}).get('original_sha256')==sha(raw) and id in old_index and (ROOT/'public'/old_index[id]['image']).exists():
  out[id]=old_index[id];provenance[id]=old_provenance[id];continue
 im=Image.open(io.BytesIO(raw)).convert('RGBA')
 assert im.getchannel('A').getextrema()[0]==0, f'{id}: transparency required'
 im.thumbnail((640,640),Image.Resampling.LANCZOS)
 folder=ROOT/'public/illustrative-portions'/id;folder.mkdir(parents=True,exist_ok=True)
 buf=io.BytesIO();im.save(buf,'WEBP',quality=88,method=6);fg=buf.getvalue()
 bg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{im.width}" height="{im.height}"></svg>'.encode()
 assert len(fg)+len(bg)<180000
 for name,data in [('foreground.webp',fg),('background.svg',bg)]: (folder/name).write_bytes(data)
 portion={'schema_version':1,'dish_id':str(uuid5(NAMESPACE_URL,id)),'dish_revision_id':str(uuid5(NAMESPACE_URL,sha(raw))),'width':im.width,'height':im.height,'motion':{'max_yaw_degrees':3,'max_pitch_degrees':3},'layers':[{'url':f'https://illustrative-portions.invalid/{id}/{name}','sha256':sha(data),'size_bytes':len(data),'depth':depth} for name,data,depth in [('background.svg',bg,0),('foreground.webp',fg,1)]]}
 out[id]={'image':f'illustrative-portions/{id}/foreground.webp','portion':portion}
 provenance[id]={'method':'built-in image generation','prompt':entry['prompt'],'original_sha256':sha(raw),'label':'Illustrative image; not a restaurant photograph','physical_measurements':None}
(ROOT/'src/glimmer/illustrative-portions.json').write_text(json.dumps(out,indent=2)+'\n')
(ROOT/'docs/illustrative-food-provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
print(f'Packaged {len(out)} illustrative dishes')
