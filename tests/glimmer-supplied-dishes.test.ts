import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {marketCatalogue} from '../src/glimmer/catalogue';
import {dishes} from '../src/glimmer/data';
import {createState,encodeMarketCode,decodeMarketCode,encodeOrderCode,decodeOrderCode} from '../src/glimmer/state';
import {portionScale} from '../src/glimmer/portion-preview';
const ids=['thai-chicken-bowl','noka-steak-ramen'];
it('adds the supplied dishes with the correct venues, photo layers, pixel icons and bounded models',()=>{
 for(const [i,id] of ids.entries()){
  const d=marketCatalogue([]).find(d=>d.id===id)!;
  expect(d.restaurant).toBe(i===0?'Farm House Thai':'Noka Ramen');expect(d.menuImage).toContain(`${id}-approved-pixel.png`);
  expect(d.modelId).toBe(id);expect(d.price).toBe('Price unavailable');expect(d.allergens).toBeNull();expect(portionScale(d).measured).toBe(false);
  for(const l of d.portion!.layers){const b=readFileSync('public/restaurant-portions/'+l.url.split('.invalid/')[1]);expect(b.length).toBe(l.size_bytes);expect(createHash('sha256').update(b).digest('hex')).toBe(l.sha256);}
  const b=readFileSync(`public/supplied-dishes/${id}.glb`);expect(b.readUInt32LE(0)).toBe(0x46546c67);expect(b.readUInt32LE(8)).toBe(b.length);expect(b.length).toBeLessThan(15_000_000);
  const g=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());expect(g.images.every((i:any)=>i.bufferView!==undefined)).toBe(true);
  expect(g.meshes.reduce((sum:number,m:any)=>sum+m.primitives.reduce((s:number,p:any)=>s+g.accessors[p.indices].count/3,0),0)).toBeLessThan(50000);
 }
});
it('round trips new saves and six-line orders without shifting legacy dish indices',()=>{
 expect(dishes[31].id).toBe('r7-5');expect(dishes.slice(32).map(d=>d.id)).toEqual(ids);
 const s=createState();s.tastingList=[ids[0],'r1-1',ids[1]];s.colour=7;s.headwear=3;s.ordersPlaced=15;
 const restored=decodeMarketCode(encodeMarketCode(s));expect(restored.tastingList).toEqual(['r1-1',...ids]);expect(restored.colour).toBe(7);expect(restored.headwear).toBe(3);expect(restored.ordersPlaced).toBe(15);
 const lines=[...ids,'r1-1','r1-2','r7-4','r7-5'].map(dish=>({dish,qty:3}));expect(decodeOrderCode(encodeOrderCode(lines))).toEqual(lines);
 expect(encodeMarketCode(createState())).toBe('800000-000000-000020');
});
