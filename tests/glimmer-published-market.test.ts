import {describe,it,expect} from 'vitest';
import {placeRestaurant,Registry} from '../src/published/market';
import {districts} from '../src/glimmer/data';
describe('published restaurant placement',()=>{
 it('adds shops without replacing original objects and is idempotent',()=>{
  const d=structuredClone(districts[0]);const originals=structuredClone(d.objects);const first=placeRestaurant(d,'published:test','thai');
  expect(placeRestaurant(d,'published:test','thai')).toBe(first);expect(d.objects.length).toBe(originals.length+1);expect(d.objects.slice(0,originals.length)).toEqual(originals);
 });
 it('expands safely for repeated additions and leaves a street at each entrance',()=>{
  const d=structuredClone(districts[0]);const width=d.width_tiles;
  for(let i=0;i<20;i++){const o=placeRestaurant(d,`published:${i}`,'ramen');const [x,y]=o.pivot;expect(x).toBeGreaterThan(5);expect(x).toBeLessThan(d.width_tiles-5);expect(d.rows[y+1][x]).not.toBe('#');expect(d.rows[y+1][x]).not.toBe('~');}
  expect(d.width_tiles).toBeGreaterThan(width);expect(d.rows.every(r=>r.length===d.width_tiles)).toBe(true);
 });
 it('rejects duplicate venues and unknown storefront types',()=>{
  const entry={venueId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',menuId:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',district:'d1-rain-alley',style:'ramen'};
  expect(Registry.safeParse({apiOrigin:'https://example.com',restaurants:[entry,entry]}).success).toBe(false);
  expect(Registry.safeParse({apiOrigin:'https://example.com',restaurants:[{...entry,style:'unknown'}]}).success).toBe(false);
 });
});
