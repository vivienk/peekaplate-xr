import assert from 'node:assert/strict';
export default async function({frame}){
 await frame.waitForFunction(()=>!!window.glimmer);await frame.evaluate(()=>window.glimmer.market.ready);await frame.page().bringToFront();
 await frame.evaluate(()=>{const a=window.glimmer;a.start();a.market.entering=false;a.setScreen('menu');});
 await frame.waitForFunction(()=>window.glimmer.screenAge>.4);
 await frame.page().screenshot({path:'artifacts/pixel-menu-restored.png'});
 const ids=await frame.evaluate(async()=>{const {marketCatalogue}=await import('/src/glimmer/catalogue.ts');return marketCatalogue().map(d=>d.id);});
 for(const id of ids){await frame.evaluate(id=>window.glimmer.dining.show(id,'menu'),id);await frame.waitForFunction(id=>window.glimmer.dining.detailPreview.key.startsWith(id+'|')&&window.glimmer.dining.detailPreview.status==='2.5D preview',id,{timeout:20000});assert.ok(await frame.evaluate(()=>!window.glimmer.dining.selected.image.includes('/glimmer/')));}
 assert.equal(ids.length,37);
 await frame.evaluate(()=>window.glimmer.dining.show('r2-1','menu'));await frame.waitForFunction(()=>window.glimmer.dining.detailPreview.status==='2.5D preview');
 await frame.waitForFunction(()=>window.glimmer.screenAge>.4);
 const white=await frame.evaluate(()=>Array.from(window.glimmer.context.getImageData(535,450,1,1).data));assert.deepEqual(white,[255,255,255,255]);
 await frame.page().screenshot({path:'artifacts/illustrative-pancakes-detail.png'});
 const press=async label=>{await frame.waitForFunction(label=>window.glimmer.screenAge>.25&&window.glimmer.buttons.some(b=>b.label===label),label);await frame.evaluate(label=>{const a=window.glimmer,b=a.buttons.find(b=>b.label===label);if(!b)throw Error(label);b.action();},label);};
 await press('View Portion');await frame.waitForFunction(()=>window.glimmer.portalStatus.includes('2.5D'));assert.match(await frame.evaluate(()=>window.glimmer.portalStatus),/Approximate.*not actual size/);assert.equal(await frame.evaluate(()=>window.glimmer.modelError),'');
 await press('Back');await frame.waitForFunction(()=>window.glimmer.screen==='dish');await press('Back');await frame.waitForFunction(()=>window.glimmer.screen==='menu');assert.equal(await frame.evaluate(()=>window.glimmer.dining.detailPreview.element.style.display),'none');
 return {passed:true,previews:ids.length,ingredientCard:white,approximatePortion:true,pixelMenu:true};
}
