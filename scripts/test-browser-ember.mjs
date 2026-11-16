import assert from 'node:assert/strict';
export default async function({frame}){
 await frame.waitForFunction(()=>!!window.glimmer);
 const result=await frame.evaluate(async()=>{
  const {liveRestaurants,refreshRestaurants}=await import('/src/published/market.ts');await refreshRestaurants();
  const shop=liveRestaurants.get('diner-demo:ember-stone');if(!shop)throw new Error('Ember shop missing');
  const a=window.glimmer;a.start();await new Promise(r=>setTimeout(r,1500));a.market.setDistrict(shop.entry.district);a.openPublished(shop.id);
  await new Promise(r=>setTimeout(r,300));
  return {screen:a.screen,demo:shop.demo,name:shop.name,dishes:shop.content.categories.flatMap(c=>c.dishes).map(d=>d.name),placed:a.market.objects.some(o=>o.id===shop.id)};
 });
 assert.equal(result.screen,'publishedMenu');assert.equal(result.demo,true);assert.equal(result.placed,true);assert.equal(result.name,'Ember & Stone');assert.equal(result.dishes.length,5);return result;
}
