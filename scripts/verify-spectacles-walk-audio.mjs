export default async function({frame}){
 await frame.page().bringToFront();await frame.waitForFunction(()=>!!window.glimmer);
 await frame.evaluate(()=>{window.glimmer.handPlacement=true;window.glimmer.setScreen('title');window.glimmer.invalidate();});
 await frame.getByRole('button',{name:'Start',exact:true}).click();
 await frame.waitForFunction(()=>window.glimmer.screen==='explore'&&!window.glimmer.market.isEntering);
 const target=await frame.evaluate(()=>{const m=window.glimmer.market,o=m.map.objects.find(o=>o.id==='r3-thai'),box=m.hitBox(o);return {x:(box[0]+8-m.cameraX)*1280/480,y:(box[1]+box[3]/2-m.cameraY)*720/270,start:{...m.player}};});
 const nav=frame.getByRole('navigation',{name:'PeekaPlate controls'}),box=await nav.boundingBox();
 await nav.click({position:{x:target.x*box.width/1280,y:target.y*box.height/720}});
 await frame.waitForFunction(()=>window.glimmer.screen==='menu',null,{timeout:20000});
 await frame.waitForFunction(()=>{const a=window.glimmer.audio;return a.loops.some(l=>l.id==='mus-market'&&l.bufferSource)&&a.loops.some(l=>l.id==='amb-rain'&&l.bufferSource)},null,{timeout:20000});
 const result=await frame.evaluate(async()=>{const a=window.glimmer.audio,m=window.glimmer.market,channels=a.loops.filter(l=>['mus-market','amb-rain'].includes(l.id));const analysers=channels.map(l=>{const node=a.context.createAnalyser();l.bufferGain.connect(node);return {id:l.id,node,gain:l.bufferGain.gain.value}});await new Promise(r=>setTimeout(r,150));const audio=analysers.map(({id,node,gain})=>{const data=new Float32Array(node.fftSize);node.getFloatTimeDomainData(data);const peak=Math.max(...data.map(Math.abs));channels.find(l=>l.id===id).bufferGain.disconnect(node);return {id,gain,peak}});return {screen:window.glimmer.screen,restaurant:window.glimmer.restaurant?.id,player:{...m.player},audio,context:a.context.state,uiSoundDecoded:a.buffers.has('sfx-ui-select')};});
 if(result.audio.some(a=>a.peak<=0)||!result.uiSoundDecoded)throw Error(JSON.stringify(result));return result;
}
