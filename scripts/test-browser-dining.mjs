import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
export default async function({frame}){
 await frame.waitForFunction(()=>!!window.glimmer);await frame.evaluate(()=>window.glimmer.market.ready);
 await frame.page().bringToFront();await frame.locator('canvas').first().click({position:{x:2,y:2}});
 const press=async label=>{await frame.waitForFunction(label=>window.glimmer.buttons.some(b=>b.label===label&&!b.disabled),label);await frame.evaluate(label=>{const a=window.glimmer,b=a.buttons.find(b=>b.label===label&&!b.disabled);a.pointer(b.x+b.w/2,b.y+b.h/2);},label);};
 const screen=async name=>frame.waitForFunction(name=>window.glimmer.screen===name&&window.glimmer.buttons.length>0,name);
 const capture=async name=>{await frame.evaluate(()=>{const a=window.glimmer;a.screenAge=1;a.invalidate();a.render();});const data=await frame.evaluate(()=>window.glimmer.canvas.toDataURL());await mkdir('artifacts',{recursive:true});await writeFile(`artifacts/${name}.png`,Buffer.from(data.split(',')[1],'base64'));};
 await frame.evaluate(()=>{const a=window.glimmer;a.start();if(a.muted)a.toggleSound();a.market.entering=false;a.toastTime=0;});await press('Search dishes');await screen('search');
 await frame.locator('body').pressSequentially('avocado');
 assert.equal(await frame.evaluate(()=>window.glimmer.dining.query),'avocado');await press('Avocado Toast');await screen('dish');
 await frame.waitForFunction(()=>window.glimmer.images.get('/diner-demo/avocado-toast.webp')?.complete);await capture('dining-detail');
 await press('Compare');await screen('comparePicker');
 await frame.locator('body').pressSequentially('ramen');await press('Shoyu-style Ramen');await screen('comparison');await capture('dining-comparison');
 const pair=await frame.evaluate(()=>[window.glimmer.dining.comparisonAnchor,window.glimmer.dining.compareId]);assert.notEqual(pair[0],pair[1]);
 // The second dish's Details and Portion must return to the original pair.
 await frame.evaluate(()=>{const a=window.glimmer,b=a.buttons.filter(b=>b.label==='Details')[1];a.pointer(b.x+10,b.y+10);});await screen('dish');await frame.locator('body').press('Escape');await screen('comparison');
 assert.deepEqual(await frame.evaluate(()=>[window.glimmer.dining.comparisonAnchor,window.glimmer.dining.compareId]),pair);
 await frame.evaluate(()=>{const a=window.glimmer,b=a.buttons.filter(b=>b.label==='Portion')[0];a.pointer(b.x+10,b.y+10);});await screen('ar');await frame.waitForFunction(()=>window.glimmer.portalStatus.includes('2.5D'),{timeout:20000});
 assert.equal(await frame.evaluate(()=>window.glimmer.modelError),'');await capture('dining-portion');await frame.locator('body').press('Escape');await screen('comparison');
 await frame.evaluate(()=>{const a=window.glimmer,b=a.buttons.filter(b=>b.label==='Replace')[1];a.pointer(b.x+10,b.y+10);});await screen('comparePicker');await press('Keyboard');
 await press('S');await press('A');assert.equal(await frame.evaluate(()=>window.glimmer.dining.query),'sa');await capture('dining-search');
 await press('Sound on');assert.equal(await frame.evaluate(()=>window.glimmer.muted),true);await press('Sound off');
 await frame.locator('body').press('Escape');await screen('comparison');await frame.locator('body').press('Escape');await screen('dish');await frame.locator('body').press('Escape');await screen('search');
 await frame.evaluate(()=>window.glimmer.openPublished('diner-demo:ember-stone'));await screen('publishedMenu');await press('Avocado Toast');await screen('dish');
 await press('View Portion');await frame.waitForFunction(()=>window.glimmer.portalStatus.includes('2.5D'),{timeout:20000});
 const portal=await frame.evaluate(()=>({status:window.glimmer.portalStatus,flat:window.glimmer.portalFlat}));
 return {passed:true,comparison:pair,portal,screenshots:['dining-detail','dining-comparison','dining-portion','dining-search']};
}
