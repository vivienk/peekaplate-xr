import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
export default async function({frame}){
 await frame.waitForFunction(()=>!!window.glimmer);await frame.evaluate(()=>window.glimmer.market.ready);
 await frame.page().bringToFront();await frame.locator('canvas').first().click({position:{x:2,y:2}});
 const press=async label=>{await writeFile('artifacts/browser-stage.txt',label);await frame.waitForFunction(label=>window.glimmer.buttons.some(b=>b.label===label&&!b.disabled),label);await frame.evaluate(label=>{const a=window.glimmer,b=a.buttons.find(b=>b.label===label&&!b.disabled);a.pointer(b.x+b.w/2,b.y+b.h/2);},label);};
 const capture=async name=>{await mkdir('artifacts',{recursive:true});await frame.evaluate(()=>{window.glimmer.screenAge=1;window.glimmer.invalidate();window.glimmer.render();});const data=await frame.evaluate(()=>window.glimmer.canvas.toDataURL());await writeFile(`artifacts/${name}.png`,Buffer.from(data.split(',')[1],'base64'));};
 await frame.evaluate(()=>{const a=window.glimmer;a.start();a.market.entering=false;a.toastTime=0;a.queue=[];});
 await frame.waitForFunction(()=>window.glimmer.buttons.some(b=>b.label==='Search dishes'));
 const hud=await frame.evaluate(()=>{const a=window.glimmer;return a.buttons.filter(b=>['Search dishes','Sound on','Sound off'].includes(b.label)).map(({label,x,y,w,h})=>({label,x,y,w,h}));});
 assert.equal(hud.find(b=>b.label==='Search dishes').y,406);assert.equal(hud.find(b=>b.label.startsWith('Sound')).x,1196);await capture('upgraded-hud');
 const timings={note:"Movement timing covered by unit tests; no device frame-rate claim."};
 await press('Search dishes');const input=frame.getByRole('searchbox',{name:'Search dishes by category, ingredient or keyword'});await input.fill('poached egg');await frame.waitForFunction(()=>window.glimmer.dining.query==='poached egg');await press('Avocado Toast');
 await frame.waitForFunction(()=>window.glimmer.dining.previews.size>0);await capture('upgraded-detail');
 await press('Compare');await input.fill('ramen');await press('Noodles');await press('Shoyu-style Ramen');await capture('upgraded-comparison');
 await frame.evaluate(()=>{const a=window.glimmer,b=a.buttons.filter(b=>b.label==='Replace')[1];a.pointer(b.x+10,b.y+10);});await input.fill('ramen');await press('Noodles');
 await frame.waitForFunction(()=>window.glimmer.screenAge>.3);await frame.page().screenshot({path:'artifacts/upgraded-native-search.png'});
 await frame.evaluate(()=>window.glimmer.dining.show('r1-1','search'));await frame.waitForFunction(()=>window.glimmer.dining.previews.size>=2);await capture('upgraded-original-detail');
 await press('View Portion');await frame.waitForFunction(()=>window.glimmer.portalStatus.includes('3D preview'));await press('2.5D view');await frame.waitForFunction(()=>window.glimmer.portalStatus.includes('2.5D'));assert.equal(await frame.evaluate(()=>window.glimmer.modelError),'');await capture('upgraded-original-portion');await press('3D model');await frame.waitForFunction(()=>window.glimmer.portalStatus.includes('3D preview'));
 const travelled=[];
 for(let district=0;district<3;district++){
  await frame.evaluate(d=>{const a=window.glimmer;a.setScreen('map');a.marketMap.district=d;a.marketMap.page=0;a.invalidate();a.render();},district);
  if(district===0)await capture('upgraded-market-map');
  // Exercise each actual map Travel there action, including published additions.
  const count=await frame.evaluate(()=>window.glimmer.buttons.filter(b=>b.label==='Travel there').length);
  for(let i=0;i<count;i++){
   await frame.evaluate(({district,i})=>{const a=window.glimmer;a.setScreen('map');a.marketMap.district=district;a.invalidate();a.render();const b=a.buttons.filter(b=>b.label==='Travel there')[i];a.pointer(b.x+10,b.y+10);}, {district,i});
   await frame.waitForFunction(()=>window.glimmer.screen==='explore');const focus=await frame.evaluate(()=>window.glimmer.market.findFocus()?.id);assert.ok(focus,'Travel must land at an interaction');await frame.locator('body').press('e');
   await frame.waitForFunction(()=>['menu','publishedMenu'].includes(window.glimmer.screen));travelled.push(focus);await frame.locator('body').press('Escape');
  }
 }
 assert.ok(travelled.length>=7);return {passed:true,hud,timings,travelled};
}
