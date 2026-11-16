import {readFileSync} from 'node:fs';
import {describe,it,expect,vi} from 'vitest';
import {discoverRestaurants,storefrontStyle} from '../src/published/directory';
import {sha256} from '../src/published/contracts';
import {refreshRestaurants,liveRestaurants} from '../src/published/market';
const id='11111111-1111-4111-8111-111111111111';
const content={schema_version:1 as const,venue_id:id,menu_id:id,menu_revision_id:id,restaurant:{name:'Thai Kitchen',logo:null},categories:[]};
describe('automatic published restaurant discovery',()=>{
 it('validates the public directory and omits credentials',async()=>{
  const fetcher=vi.fn().mockResolvedValue(Response.json({schemaVersion:1,restaurants:[{venueId:id,menuId:id}],nextCursor:null}));
  expect((await discoverRestaurants('https://example.test',fetcher)).restaurants).toHaveLength(1);
  expect(fetcher.mock.calls[0][1]).toMatchObject({credentials:'omit',cache:'no-store'});
 });
 it('rejects directory errors and private extra fields',async()=>{
  await expect(discoverRestaurants('https://example.test',vi.fn().mockResolvedValue(new Response('',{status:404})))).rejects.toThrow();
  await expect(discoverRestaurants('https://example.test',vi.fn().mockResolvedValue(Response.json({schemaVersion:1,restaurants:[],nextCursor:null,drafts:[]})))).rejects.toThrow();
 });
 it('adds a verified restaurant, refreshes its name, and removes access after withdrawal',async()=>{
  let name='Thai Kitchen',published=true;
  const fetcher=vi.fn(async(input:RequestInfo|URL)=>{
   const url=String(input);
   if(url.endsWith('market-restaurants.json'))return Response.json({apiOrigin:'https://example.test',discovery:true,restaurants:[]});
   if(url.endsWith('/public/restaurants'))return Response.json({schemaVersion:1,restaurants:published?[{venueId:id,menuId:id}]:[],nextCursor:null});
   const bytes=new TextEncoder().encode(JSON.stringify({...content,restaurant:{name,logo:null}}));
   if(url.endsWith('/bundle'))return new Response(bytes);
   return Response.json({schemaVersion:1,venueId:id,menuId:id,menuRevisionId:id,publicationId:id,publicationHash:'a'.repeat(64),availabilityVersion:1,tier:'T0',bundle:{url:'https://example.test/bundle',contentHash:await sha256(bytes),assetManifestHash:'b'.repeat(64)},menuToken:'test-only',tokenExpiresAt:new Date(Date.now()+1800000).toISOString()});
  });
  expect(await refreshRestaurants(fetcher)).toBe(true);
  const shop=liveRestaurants.get(`published:${id}`)!;
  expect(shop.name).toBe('Thai Kitchen');expect(shop.entry.style).toBe('thai');
  const location=shop.entry.district;
  name='Thai Kitchen Updated';expect(await refreshRestaurants(fetcher)).toBe(false);
  expect(shop.name).toBe(name);expect(shop.entry.district).toBe(location);
  published=false;await refreshRestaurants(fetcher);
  expect(shop.enabled).toBe(false);expect(shop.content).toBeNull();
 });
 it('selects existing art from verified menu text',()=>{expect(storefrontStyle(content)).toBe('thai');expect(storefrontStyle({...content,restaurant:{name:'Noodle Ramen',logo:null}})).toBe('ramen');});
});

it('includes the selected diner demo without presenting it as published',()=>{
 const menu=JSON.parse(readFileSync('public/diner-demo/menu.json','utf8'));
 expect(menu.restaurant.name).toBe('Ember & Stone');
 expect(menu.categories.flatMap((c:any)=>c.dishes.map((d:any)=>d.name))).toEqual(['Avocado Toast','Classic Eggs Benedict','Harvest Power Bowl','Salmon Poke Bowl','Garden Avocado Salad']);
});
