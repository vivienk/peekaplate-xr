import assert from 'node:assert/strict';
export default async function({frame}){
 await frame.waitForFunction(()=>!!window.glimmer);await frame.evaluate(()=>window.glimmer.market.ready);await frame.page().bringToFront();
 await frame.evaluate(()=>{window.glimmer.start();window.glimmer.market.entering=false;});
 const ids=await frame.evaluate(async()=>{const {marketCatalogue}=await import('/src/glimmer/catalogue.ts');return marketCatalogue().map(d=>d.id);});
 const checked=[];
 for(const id of ids){await frame.evaluate(id=>window.glimmer.dining.show(id,'explore'),id);await frame.waitForFunction(()=>window.glimmer.dining.detailPreview.status==='2.5D preview',null,{timeout:20000});checked.push(id);}
 assert.equal(checked.length,37);
 await frame.evaluate(()=>window.glimmer.dining.show('r3-1','explore'));await frame.waitForFunction(()=>window.glimmer.dining.detailPreview.status==='2.5D preview');
 const stage=frame.getByRole('img',{name:/Dish preview/});await stage.hover({position:{x:270,y:40}});const transform=await stage.locator('div').evaluate(el=>el.style.transform);assert.match(transform,/perspective\(900px\)/);assert.ok(!transform.includes('rotateY(0deg)'));
 await stage.press('Home');assert.match(await stage.locator('div').evaluate(el=>el.style.transform),/rotateY\(0deg\)/);await stage.press('ArrowRight');assert.ok(!(await stage.locator('div').evaluate(el=>el.style.transform)).includes('rotateY(0deg)'));
 await frame.waitForFunction(()=>window.glimmer.screenAge>.3);await frame.page().screenshot({path:'artifacts/real-pad-thai-detail.png'});
 const press=async label=>{await frame.evaluate(label=>{const a=window.glimmer,b=a.buttons.find(b=>b.label===label);a.pointer(b.x+b.w/2,b.y+b.h/2);},label);};
 await press('Original photo');await frame.waitForFunction(()=>window.glimmer.dining.photoMode);await frame.waitForFunction(()=>document.querySelector('[aria-label^="Dish preview"] img')?.src.includes('/restaurant-photos/'));
 await press('2.5D preview');await press('View Portion');await frame.waitForFunction(()=>window.glimmer.portalStatus.includes('2.5D'));assert.equal(await frame.evaluate(()=>window.glimmer.modelError),'');
 await frame.evaluate(()=>window.glimmer.setScreen('explore'));await frame.waitForFunction(()=>window.glimmer.buttons.some(b=>b.label==='Search dishes'));const search=await frame.evaluate(()=>{const b=window.glimmer.buttons.find(b=>b.label==='Search dishes');return{x:b.x,y:b.y,w:b.w,h:b.h};});assert.deepEqual(search,{x:1150,y:406,w:102,h:64});
 return {passed:true,checked:checked.length,tilt:transform,search};
}
