import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {dishes} from '../src/glimmer/data';
import {ingredientIcon} from '../src/glimmer/ingredient-artwork';
import plan from '../scripts/ingredient-artwork-source.json';
const demo=JSON.parse(readFileSync(resolve('public/diner-demo/menu.json'),'utf8'));
describe('current dish ingredient artwork coverage',()=>{
 it('covers every ingredient on original, supplied and diner fixture dishes',()=>{
  const entries=[...dishes,...demo.categories.flatMap((c:any)=>c.dishes).map((d:any)=>({...d,ingredients:d.ingredients.map((i:any)=>i.name)}))];
  expect(entries.length).toBe(39);
  for(const d of entries)for(const ingredient of d.ingredients)expect(ingredientIcon(ingredient),`${d.name}: ${ingredient}`).toBeTruthy();
 });
 it('generates only exact ingredient identities with transparent native SVG assets',()=>{
  expect(plan.jobs).toHaveLength(101);
  for(const job of plan.jobs){
   if(job.ingredient==='house sauce'){expect(job.dishBindings).toEqual([]);expect(job.reason).toContain('Reference asset repair');}
   else expect(job.dishBindings.length).toBeGreaterThan(0);
   const key=job.assetKey??job.ingredient.replace(/[^a-z0-9]+/g,'-');
   const svg=readFileSync(resolve('src/glimmer/ingredient-assets',key+'.svg'),'utf8');
   expect(svg).toContain('viewBox="0 0 36 36"');
   expect(svg).not.toMatch(/<script|<image|<foreignObject|<text|<rect|<filter/);
   expect(ingredientIcon(job.ingredient)).toBeTruthy();
  }
  expect(ingredientIcon('eggplant')).toBeNull();
  expect(ingredientIcon('chicken broth with unknown herbs')).toBeNull();
 });
});
