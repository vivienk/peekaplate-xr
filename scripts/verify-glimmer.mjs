import fs from 'node:fs/promises';
export default async function({frame,workspaceRoot}){
  await frame.waitForFunction(()=>window.glimmer?.market);
  await frame.evaluate(()=>window.glimmer.market.ready);
  await frame.evaluate(()=>window.glimmer.setScreen('title'));
  const results=[];
  const check=async(name,fn)=>{const result=await frame.evaluate(fn);results.push({name,result});if(!result)throw new Error(name);};
  await check('Title Escape cannot bypass Start',()=>{const g=window.glimmer;g.close();return g.screen==='title';});
  await frame.evaluate(()=>window.glimmer.start());
  await check('Pause/resume opening walk remains playable',()=>{const g=window.glimmer;g.setScreen('pause');g.close();for(let i=0;i<120;i++)g.update(1/30);return Math.abs(g.market.player.y-27)<.3;});
  await frame.evaluate(()=>{const g=window.glimmer;g.setScreen('explore');g.interact('r1-ramen');});
  await check('Menu awards first stamp',()=>window.glimmer.state.stamps.includes('r1-ramen')&&window.glimmer.screen==='menu');
  await frame.evaluate(()=>window.glimmer.showDish('r1-1'));
  await frame.evaluate(()=>window.glimmer.setScreen('ar'));
  await frame.waitForTimeout(1200);
  await check('AR model loaded',()=>window.glimmer.screen==='ar'&&!window.glimmer.modelError);
  await frame.locator('canvas').first().screenshot({path:workspaceRoot+'/design/portal.png'});
  await check('Portal modal return chain',()=>{const g=window.glimmer;g.close();if(g.screen!=='dish')return false;g.close();return g.screen==='menu';});
  await frame.evaluate(()=>{const g=window.glimmer;g.close();g.interact('order-portal');});
  await check('Order wardrobe return',()=>{const g=window.glimmer;g.update(0);const b=g.buttons.find(b=>b.label==='Wardrobe');b.action();g.close();return g.screen==='order';});
  await frame.evaluate(()=>{const g=window.glimmer;g.showDish('r1-1');g.update(0);g.buttons.find(b=>b.label==='Add to order').action();g.setScreen('order');g.update(0);g.buttons.find(b=>b.label==='Place demo order').action();});
  await check('Order remains unplaced before confirmation',()=>window.glimmer.state.ordersPlaced===0);
  await frame.evaluate(()=>{const g=window.glimmer;g.update(0);g.buttons.find(b=>b.label==='Place order').action();});
  await check('One confirmed order empties tray',()=>window.glimmer.state.ordersPlaced===1&&window.glimmer.state.tray.length===0&&!!window.glimmer.state.ticket.code);
  await frame.evaluate(()=>{const g=window.glimmer;g.close();for(let i=0;i<241;i++)g.update(1/30);});
  await check('Order ready after eight world seconds',()=>window.glimmer.state.holograms.length===1);
  await check('Dialogue Escape closes',()=>{const g=window.glimmer;g.interact('npc-suzu');g.close();return g.screen==='explore';});
  const models=await frame.evaluate(async()=>{
    const g=window.glimmer;const {dishes}=await import('/src/glimmer/data.ts');
    const checks=[];for(const d of dishes){const loaded=await window.glimmerLoadModel(d.id);checks.push({id:d.id,loaded});}return checks;
  });
  results.push({name:'All 32 native 3D models loaded',result:models.every(m=>m.loaded),models});
  await frame.evaluate(()=>{const g=window.glimmer;g.start();for(let i=0;i<120;i++)g.update(1/30);});
  await frame.locator('canvas').first().screenshot({path:workspaceRoot+'/design/rain-alley.png'});
  for(const id of ['d2-lantern-steps','d3-fogline-pier']){
    await frame.evaluate(id=>{const g=window.glimmer;g.market.setDistrict(id);g.state.district=id;g.update(0);},id);
    await frame.locator('canvas').first().screenshot({path:workspaceRoot+'/design/'+id+'.png'});
  }
  await fs.writeFile(workspaceRoot+'/design/browser-checks.json',JSON.stringify(results,null,2));
  return results;
}
