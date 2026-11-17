export default async function({frame}){
 await frame.waitForFunction(()=>!!window.glimmer);
 await frame.evaluate(()=>{const a=window.glimmer;a.dining.portion('diner-demo:ember-stone/a1000000-0000-4000-8000-000000000001');});
 await frame.waitForFunction(()=>window.glimmer.portalStatus.includes('2.5D'));
 await frame.page().screenshot({path:'artifacts/dining-portion-runtime.png'});
 return {status:await frame.evaluate(()=>window.glimmer.portalStatus)};
}
