import assert from 'node:assert/strict';
export default async function({frame}){
 await frame.waitForFunction(()=>window.glimmer.muted);
 const result=await frame.evaluate(()=>{const a=window.glimmer;a.zoom(-.5);return {immersive:a.immersive,zoom:a.portalZoom,muted:a.muted,disabled:a.buttons.filter(b=>['+','−'].includes(b.label)).every(b=>b.disabled),status:a.portalStatus};});
 assert.equal(result.immersive,true);assert.equal(result.zoom,1);assert.equal(result.disabled,true);
 await frame.page().screenshot({path:'artifacts/dining-portion-ar-emulator.png'});return result;
}
