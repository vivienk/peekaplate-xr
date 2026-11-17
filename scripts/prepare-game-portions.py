"""Prepare existing game art as PR162-compatible T1 layers and private Tripo review inputs.
No food imagery is synthesized; original files are read-only. Pixel art uses nearest-neighbour sizing.
"""
import hashlib,json,io,sys
from pathlib import Path
from uuid import uuid5,NAMESPACE_URL
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts/processing'))
from peekaplate_processing.generate_model import prepare
sha=lambda b:hashlib.sha256(b).hexdigest()
def write_json(path,data):
 path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(data,indent=2)+'\n')
def items():
 for venue in json.loads((ROOT/'src/glimmer/fixtures/restaurants.json').read_text()):
  for dish in venue['dishes']:
   yield {'id':dish['id'],'name':dish['name'],'image':ROOT/'public/glimmer'/dish['image'],'pixel':True}
 demo=json.loads((ROOT/'public/diner-demo/menu.json').read_text())
 for category in demo['categories']:
  for dish in category['dishes']:
   if dish['complete']:yield {'id':'diner-demo:ember-stone/'+dish['dish_id'],'name':dish['name'],'image':ROOT/'public'/dish['images']['detail']['url'].lstrip('/'),'pixel':False,'dish_id':dish['dish_id'],'revision':dish['dish_revision_id']}
def main():
 index={};jobs=[]
 for item in items():
  source=item['image'].read_bytes();source_hash=sha(source);key=sha(item['id'].encode())[:20]
  image=Image.open(io.BytesIO(source)).convert('RGBA')
  if item['pixel']:image=image.resize((384,384),Image.Resampling.NEAREST)
  image.thumbnail((1024,1024),Image.Resampling.LANCZOS)
  width,height=image.size
  out=io.BytesIO();image.save(out,format='PNG');cutout=out.getvalue()
  foreground=source if item['image'].suffix=='.webp' else cutout
  ext='webp' if item['image'].suffix=='.webp' else 'png'
  background=f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}"></svg>'.encode()
  dish_id=item.get('dish_id',str(uuid5(NAMESPACE_URL,'peekaplate/game/'+item['id'])))
  revision=item.get('revision',str(uuid5(NAMESPACE_URL,source_hash)))
  public=ROOT/'public/game-portions'/key;public.mkdir(parents=True,exist_ok=True)
  (public/'background.svg').write_bytes(background);(public/('foreground.'+ext)).write_bytes(foreground)
  portion={'schema_version':1,'dish_id':dish_id,'dish_revision_id':revision,'width':width,'height':height,'motion':{'max_yaw_degrees':3,'max_pitch_degrees':3},'layers':[
    {'url':f'https://game-portions.invalid/{key}/background.svg','sha256':sha(background),'size_bytes':len(background),'depth':0},
    {'url':f'https://game-portions.invalid/{key}/foreground.{ext}','sha256':sha(foreground),'size_bytes':len(foreground),'depth':1}]}
  if sum(layer['size_bytes'] for layer in portion['layers'])>180000:raise ValueError('T1 budget exceeded')
  index[item['id']]={'key':key,'name':item['name'],'source_sha256':source_hash,'cutout_sha256':sha(cutout),'portion':portion,'image':f'/game-portions/{key}/foreground.{ext}'}
  private=ROOT/'.model-pipeline/reviews'/key;private.mkdir(parents=True,exist_ok=True)
  (private/'cutout.png').write_bytes(cutout)
  fallback=Image.new('RGB',image.size,'#f3e6c8');fallback.paste(image,mask=image.getchannel('A'));out=io.BytesIO();fallback.save(out,'JPEG',quality=90);photo=out.getvalue();(private/'fallback.jpg').write_bytes(photo)
  review={'asset_id':'review_'+key,'dish':{'dish_id':dish_id,'revision_id':revision},'provenance':{'recipe':'review-preview-v1','source_sha256':source_hash,'source_kind':'game-pixel-art' if item['pixel'] else 'diner-demo-photo'},'files':{'cutout.png':{'sha256':sha(cutout),'bytes':len(cutout)},'fallback.jpg':{'sha256':sha(photo),'bytes':len(photo)}},'review':{'status':'needs_review'},'publication':{'eligible':False}}
  write_json(private/'review-manifest.json',review)
  job=ROOT/'.model-pipeline/jobs'/key
  if not job.exists():prepare(private,job)
  else:
   saved=json.loads((job/'job.json').read_text())
   if saved['source']['sha256']!=sha(cutout):raise ValueError('Existing job has another source; inspect before regenerating')
  jobs.append({'id':item['id'],'key':key,'name':item['name']})
 write_json(ROOT/'public/game-portions/index.json',index);write_json(ROOT/'src/glimmer/generated-portions.json',index);write_json(ROOT/'.model-pipeline/catalogue.json',jobs)
 print(json.dumps({'prepared_dishes':len(index),'tripo_jobs_prepared':len(jobs),'provider_calls':0}))
if __name__=='__main__':main()
