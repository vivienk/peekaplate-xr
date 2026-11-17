import importlib.util,json,shutil,unittest
from pathlib import Path
import test_generate_model as fixtures
from peekaplate_processing.generate_model import prepare,run
from peekaplate_processing.errors import ExtractionError
spec=importlib.util.spec_from_file_location('game_models',Path(__file__).resolve().parents[2]/'game-models.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class GameInstallTests(unittest.TestCase):
 setUp=fixtures.ModelPipelineTests.setUp
 def completed(self):
  prepare(self.review,self.jobdir);job=run(self.jobdir,fixtures.FakeClient(),sleep=lambda _:None)
  item={'id':'test-dish','key':'a'*20,'name':'Synthetic test only'}
  destination=self.root/'.model-pipeline/jobs'/item['key'];destination.parent.mkdir(parents=True);shutil.copytree(self.jobdir,destination)
  public=self.root/'public/game-portions';public.mkdir(parents=True)
  (public/'index.json').write_text(json.dumps({item['id']:{'source_sha256':'b'*64,'cutout_sha256':job['source']['sha256'],'portion':{'dish_id':job['dish']['dish_id'],'dish_revision_id':job['dish']['revision_id']}}}))
  return item,destination
 def test_install_binds_reviewed_output_and_can_be_repeated(self):
  item,_=self.completed();file=module.install(self.root,item);module.install(self.root,item)
  index=json.loads((self.root/'public/generated-models/index.json').read_text());self.assertEqual(len(index['models']),1)
  self.assertEqual(index['models'][0]['file'],file);self.assertFalse(index['models'][0]['calibrated']);self.assertTrue((self.root/'public/generated-models'/file).exists())
 def test_install_rejects_wrong_source_and_changed_model(self):
  item,path=self.completed();job=json.loads((path/'job.json').read_text());job['source']['sha256']='c'*64;(path/'job.json').write_text(json.dumps(job))
  with self.assertRaises(ExtractionError):module.install(self.root,item)
