import assert from 'node:assert/strict';
export default async function({page,frame}) {
  const measurements=await frame.evaluate(async()=>{
    const {blendRainLoop}=await import('/src/glimmer/rain-loop.ts');
    const result=[];
    for(const id of ['amb-rain','amb-rain-awning']){
      const decoder=new OfflineAudioContext(2,44100,44100);
      const original=await decoder.decodeAudioData(await(await fetch('/glimmer/assets/audio/'+id+'.ogg')).arrayBuffer());
      const samples=blendRainLoop(original.getChannelData(0),original.sampleRate);
      const context=new OfflineAudioContext(1,samples.length*3,original.sampleRate);
      const buffer=context.createBuffer(1,samples.length,original.sampleRate);buffer.copyToChannel(samples,0);
      const source=context.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(context.destination);source.start();
      const rendered=(await context.startRendering()).getChannelData(0);
      const rms=(a,start,end)=>{let sum=0;for(let i=start;i<end;i++)sum+=a[i]*a[i];return Math.sqrt(sum/(end-start));};
      const average=rms(rendered,0,rendered.length), window=Math.floor(original.sampleRate*.05);
      const boundaries=[1,2].map(n=>rms(rendered,n*samples.length-window,n*samples.length+window)/average);
      result.push({id,originalSeconds:original.duration,loopSeconds:buffer.duration,boundaryEnergyRatios:boundaries});
    }
    return result;
  });
  for(const m of measurements) for(const ratio of m.boundaryEnergyRatios) assert.ok(ratio>.5&&ratio<1.8,JSON.stringify(m));
  await page.bringToFront(); await frame.locator('canvas').first().click({position:{x:10,y:10}}); await page.keyboard.press('Enter');
  await frame.waitForFunction(()=>window.glimmer?.audio?.loops.filter(l=>l.id.startsWith('amb-rain')).every(l=>!!l.bufferSource));
  const lifecycle=await frame.evaluate(async()=>{
    const audio=window.glimmer.audio,rain=audio.loops.filter(l=>l.id.startsWith('amb-rain'));
    const sources=rain.map(l=>l.bufferSource);
    audio.setDistrict('d2-lantern-steps');audio.unlock();
    const stable=rain.every((l,i)=>l.bufferSource===sources[i]&&l.bufferSource.loop&&l.audio.paused);
    audio.setSoundMuted(true);await new Promise(r=>setTimeout(r,250));
    const muted=rain.every(l=>l.bufferGain.gain.value<.001);
    audio.setSoundMuted(false);
    return {stable,muted};
  });
  assert.ok(lifecycle.stable);assert.ok(lifecycle.muted);
  return {measurements,lifecycle};
}
