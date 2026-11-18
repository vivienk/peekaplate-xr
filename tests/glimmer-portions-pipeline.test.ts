import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import portions from '../public/game-portions/index.json';
import models from '../public/generated-models/index.json';
import {PublicPortionSchema} from '../src/published/portion';
import {acceptedModels,type GeneratedModel} from '../src/glimmer/generated-models';
import {marketCatalogue,searchDishes} from '../src/glimmer/catalogue';
const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
describe('prepared game portions and generated models',()=>{
 it('delivers exact bounded T1 layers for all 37 current dishes',()=>{expect(Object.keys(portions)).toHaveLength(37);for(const d of Object.values(portions)){expect(PublicPortionSchema.safeParse(d.portion).success).toBe(true);for(const layer of d.portion.layers){const bytes=readFileSync(new URL('../public/game-portions/'+layer.url.slice('https://game-portions.invalid/'.length),import.meta.url));expect(bytes.length).toBe(layer.size_bytes);expect(hash(bytes)).toBe(layer.sha256);}}});
 it('rejects models for another source or unreviewed output',()=>{const p=portions['r1-1'];const m:GeneratedModel={dish_id:'r1-1',key:p.key,file:`${p.key}-${'a'.repeat(16)}.glb`,source_sha256:p.source_sha256,cutout_sha256:p.cutout_sha256,sha256:'a'.repeat(64),size_bytes:1024,provider:'tripo',reviewed_for_preview:true,calibrated:false};expect(acceptedModels([m])).toHaveLength(1);for(const patch of [{source_sha256:'b'.repeat(64)},{cutout_sha256:'b'.repeat(64)},{reviewed_for_preview:false},{file:'../model.glb'},{dish_id:'missing'},{calibrated:true}])expect(acceptedModels([{...m,...patch}])).toHaveLength(0);});
 it('verifies installed model bytes before deployment',()=>{expect(JSON.parse(readFileSync(new URL('../src/glimmer/generated-model-index.json',import.meta.url),'utf8'))).toEqual(models);expect(JSON.parse(readFileSync(new URL('../src/glimmer/generated-portions.json',import.meta.url),'utf8'))).toEqual(portions);expect(acceptedModels(models.models)).toHaveLength(models.models.length);for(const m of models.models as GeneratedModel[]){const bytes=readFileSync(new URL('../public/generated-models/'+m.file,import.meta.url));expect(bytes.length).toBe(m.size_bytes);expect(hash(bytes)).toBe(m.sha256);}});
 it('retains prices and searches categories, ingredients and keywords together',()=>{const all=marketCatalogue([]);expect(all).toHaveLength(42);for(const d of all.filter(d=>d.sample)){expect(d.price).toMatch(/^USD \d+\.\d{2}$/);if(d.orderable)expect(d.portion).toBeDefined();else expect(readFileSync('public'+d.image).readUInt32BE(0)).toBe(0x89504e47);expect(d.category).not.toBe('Dish');}const result=searchDishes(all,'noodles ramen','Noodles');expect(result.length).toBeGreaterThan(0);expect(result.every(d=>d.category==='Noodles')).toBe(true);expect(searchDishes(all,'ramen','Desserts')).toHaveLength(0);expect(searchDishes(all,'shōyu')).toEqual(searchDishes(all,'shoyu'));});
});
