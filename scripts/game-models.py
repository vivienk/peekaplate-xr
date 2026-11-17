"""Private Tripo jobs, then deliberate installation of reviewed models into the game preview."""
import argparse,json,os,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts/processing'))
from peekaplate_processing.generate_model import run,read,validate_glb,atomic,MAX_GLB_BYTES,MAX_JSON_BYTES
from peekaplate_processing.tripo import TripoClient
from peekaplate_processing.errors import ExtractionError

def install(root,item):
 index=json.loads((root/'public/game-portions/index.json').read_text());prepared=index[item['id']]
 directory=root/'.model-pipeline/jobs'/item['key'];job=json.loads(read(directory/'job.json',MAX_JSON_BYTES))
 if job['status']!='ready' or job['provider']!='tripo' or job['source']['sha256']!=prepared['cutout_sha256']:
  raise ExtractionError('Only a completed job matching this dish cutout can be installed.')
 if job['dish']['dish_id']!=prepared['portion']['dish_id'] or job['dish']['revision_id']!=prepared['portion']['dish_revision_id']:
  raise ExtractionError('Dish revision mismatch.')
 model=read(directory/'model.glb',MAX_GLB_BYTES);result=validate_glb(model)
 if result!=job['output']:raise ExtractionError('Generated model hash mismatch.')
 public=root/'public/generated-models';public.mkdir(exist_ok=True,parents=True)
 filename=item['key']+'-'+result['sha256'][:16]+'.glb';atomic(public/filename,model)
 manifest=json.loads((public/'index.json').read_text()) if (public/'index.json').exists() else {'schema_version':1,'models':[]}
 manifest['models']=[m for m in manifest['models'] if m['dish_id']!=item['id']]
 manifest['models'].append({'dish_id':item['id'],'key':item['key'],'file':filename,'source_sha256':prepared['source_sha256'],'cutout_sha256':prepared['cutout_sha256'],'sha256':result['sha256'],'size_bytes':result['bytes'],'provider':'tripo','reviewed_for_preview':True,'calibrated':False})
 data=(json.dumps(manifest,indent=2)+'\n').encode();atomic(public/'index.json',data)
 generated=root/'src/glimmer/generated-model-index.json';generated.parent.mkdir(parents=True,exist_ok=True);atomic(generated,data);return filename

def main():
 parser=argparse.ArgumentParser(description=__doc__);sub=parser.add_subparsers(dest='action',required=True)
 sub.add_parser('status');generate=sub.add_parser('generate');generate.add_argument('--dish',required=True);generate.add_argument('--timeout',type=int,default=45)
 publish=sub.add_parser('install');publish.add_argument('--dish',required=True);publish.add_argument('--reviewed',action='store_true',required=True,help='Confirm visual review against the source cutout for this game preview')
 args=parser.parse_args();items=json.loads((ROOT/'.model-pipeline/catalogue.json').read_text())
 if args.action=='status':
  print(json.dumps([{'dish':i['id'],'name':i['name'],'status':json.loads((ROOT/'.model-pipeline/jobs'/i['key']/'job.json').read_text())['status']} for i in items],indent=2));return 0
 item=next((i for i in items if i['id']==args.dish),None)
 if not item:raise ExtractionError('Unknown dish. Run prepare-game-portions.py first.')
 if args.action=='install':print(json.dumps({'dish':item['id'],'installed':install(ROOT,item),'size':'approximate'}));return 0
 if not os.environ.get('TRIPO_API_KEY'):print(json.dumps({'status':'blocked','reason':'Configure TRIPO_API_KEY in the local process environment; never put it in browser code.'}));return 2
 job=run(ROOT/'.model-pipeline/jobs'/item['key'],TripoClient(os.environ['TRIPO_API_KEY']),timeout=args.timeout)
 print(json.dumps({'dish':item['id'],'status':job['status'],'review_required':True}));return 0 if job['status']=='ready' else 3
if __name__=='__main__':
 try:sys.exit(main())
 except (ExtractionError,OSError,ValueError,KeyError):
  print(json.dumps({'status':'error','reason':'Inspect private job state. Do not resubmit an unknown provider outcome.'}));sys.exit(2)
