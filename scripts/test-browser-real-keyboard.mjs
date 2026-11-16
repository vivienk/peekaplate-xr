import assert from 'node:assert/strict';
export default async function({frame}){
 await frame.page().bringToFront();await frame.locator('canvas').first().click({position:{x:2,y:2}});
 assert.equal(await frame.evaluate(()=>document.activeElement?.tagName),'CANVAS');
 const results=[];
 for(const id of ['npc-rin','ad-1','cat-1','r1-ramen','diner-demo:ember-stone']){
  await frame.evaluate(id=>{
   const a=window.glimmer;a.setScreen('explore');a.market.setDistrict('d1-rain-alley');
   const o=a.market.objects.find(o=>o.id===id);let found=false;
   for(let dy=0;dy<4&&!found;dy+=.25)for(let dx=-4;dx<=4&&!found;dx+=.25){a.market.player.x=o.pivot[0]+dx;a.market.player.y=o.pivot[1]+dy;if(a.market.findFocus()?.id===id)found=true;}
   if(!found)throw new Error('No focus position '+id);
  },id);
  await frame.locator('body').press('e');await frame.waitForFunction(()=>window.glimmer.screen!=='explore'&&window.glimmer.buttons.length>0);
  const opened=await frame.evaluate(()=>({screen:window.glimmer.screen,buttons:window.glimmer.buttons.map(b=>b.label),age:window.glimmer.screenAge}));
  await frame.locator('body').press('Escape');await frame.waitForTimeout(100);
  const back=await frame.evaluate(()=>window.glimmer.screen);
  results.push({id,opened,back});
 }
 assert.ok(results.every(r=>r.opened.screen!=='explore'&&r.opened.buttons.length&&r.opened.age>0&&r.back==='explore'),JSON.stringify(results));return results;
}
