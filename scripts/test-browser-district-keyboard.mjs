import assert from 'node:assert/strict';
export default async function({frame}){
 await frame.waitForFunction(()=>!!window.glimmer);await frame.evaluate(()=>window.glimmer.market.ready);
 await frame.page().bringToFront();await frame.locator('canvas').first().click({position:{x:2,y:2}});
 const results=[];
 for(const district of ['d2-lantern-steps','d3-fogline-pier']){
  const ids=await frame.evaluate(district=>{
   const a=window.glimmer;a.start();a.setScreen('explore');a.market.entering=false;a.market.travelRemaining=1.6;a.market.travelTarget={to:district,arrive:[10,10]};
   for(let i=0;i<60;i++)a.market.update(.03);
   if(a.market.travelRemaining!==0||a.state.district!==district)throw new Error('Travel failed');
   return a.market.objects.filter(o=>['restaurant','find-person','find-cat','find-holo','kiosk','vending','order-portal'].includes(o.kind)).map(o=>o.id);
  },district);
  for(const id of ids){
   await frame.evaluate(id=>{const a=window.glimmer;a.setScreen('explore');const o=a.market.objects.find(o=>o.id===id);let found=false;
    for(let dy=0;dy<4&&!found;dy+=.25)for(let dx=-4;dx<=4&&!found;dx+=.25){a.market.player.x=o.pivot[0]+dx;a.market.player.y=o.pivot[1]+dy;if(a.market.findFocus()?.id===id)found=true;}
    if(!found)throw new Error('No focus position '+id);
   },id);
   await frame.locator('body').press('e');await frame.waitForFunction(()=>window.glimmer.screen!=='explore',{timeout:10000});
   const screen=await frame.evaluate(()=>window.glimmer.screen);await frame.locator('body').press('Escape');
   await frame.waitForFunction(()=>window.glimmer.screen==='explore',{timeout:10000});results.push({district,id,screen});
  }
 }
 assert.ok(results.length>=8);return results;
}
