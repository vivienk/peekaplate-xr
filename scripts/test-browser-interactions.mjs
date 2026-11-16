import assert from 'node:assert/strict';
export default async function({frame}){
 await frame.waitForFunction(()=>!!window.glimmer);await frame.evaluate(()=>window.glimmer.market.ready);
 const results=await frame.evaluate(async()=>{
  const a=window.glimmer;await a.market.ready;a.start();await new Promise(r=>setTimeout(r,1600));
  const results=[];
  for(const id of ['npc-rin','ad-1','cat-1','r1-ramen','diner-demo:ember-stone']){
   a.setScreen('explore');a.market.setDistrict('d1-rain-alley');
   const o=a.market.objects.find(o=>o.id===id);if(!o){results.push({id,missing:true});continue;}
   let found=false;
   for(let dy=0;dy<4&&!found;dy+=.25)for(let dx=-4;dx<=4&&!found;dx+=.25){a.market.player.x=o.pivot[0]+dx;a.market.player.y=o.pivot[1]+dy;if(a.market.findFocus()?.id===id)found=true;}
   try{
    a.update(.04);window.dispatchEvent(new KeyboardEvent('keydown',{key:'e',cancelable:true}));window.dispatchEvent(new KeyboardEvent('keyup',{key:'e'}));
    a.update(.04);const screen=a.screen;
    await new Promise(r=>setTimeout(r,100));a.update(.04);
    window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',cancelable:true}));a.update(.04);
    results.push({id,found,screen,back:a.screen,buttons:a.buttons.length});
   }catch(e){results.push({id,error:String(e),stack:e.stack});}
  }return results;
 });
 assert.ok(results.every(r=>!r.error&&!r.missing&&r.found&&r.screen!=='explore'&&r.back==='explore'),JSON.stringify(results));return results;
}
