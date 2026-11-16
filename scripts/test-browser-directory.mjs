import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export default async function({page,frame}){
 const venueId='11111111-1111-4111-8111-111111111111';
 let published=true,name='Synthetic Thai Kitchen';
 const bundle=()=>JSON.stringify({schema_version:1,venue_id:venueId,menu_id:venueId,menu_revision_id:venueId,restaurant:{name,logo:null},categories:[]});
 await page.route('**/market-restaurants.json',route=>route.fulfill({json:{apiOrigin:'https://directory.example.test',discovery:true,restaurants:[]}}));
 await page.route('https://directory.example.test/**',route=>{
  const url=route.request().url();
  if(url.endsWith('/public/restaurants'))return route.fulfill({json:{schemaVersion:1,restaurants:published?[{venueId,menuId:venueId}]:[],nextCursor:null}});
  if(url.endsWith('/bundle'))return route.fulfill({contentType:'application/json',body:bundle()});
  return route.fulfill({json:{schemaVersion:1,venueId,menuId:venueId,menuRevisionId:venueId,publicationId:venueId,publicationHash:'a'.repeat(64),availabilityVersion:1,tier:'T0',bundle:{url:'https://directory.example.test/bundle',contentHash:createHash('sha256').update(bundle()).digest('hex'),assetManifestHash:'b'.repeat(64)},menuToken:'synthetic-test',tokenExpiresAt:new Date(Date.now()+1800000).toISOString()}});
 });
 await frame.waitForFunction(()=>!!window.glimmer);
 const refresh=()=>frame.evaluate(async()=>{
  const m=await import('/src/published/market.ts');await m.refreshRestaurants();
  return [...m.liveRestaurants.values()].filter(r=>!r.demo).map(r=>({name:r.name,available:r.available,enabled:r.enabled,style:r.entry.style}));
 });
 const added=await refresh();assert.equal(added[0].name,name);assert.equal(added[0].style,'thai');
 name='Synthetic Thai Updated';const updated=await refresh();assert.equal(updated[0].name,name);
 published=false;const withdrawn=await refresh();assert.equal(withdrawn[0].enabled,false);assert.equal(withdrawn[0].available,false);
 return {added:true,updated:true,withdrawn:true,source:'intercepted synthetic API'};
}
