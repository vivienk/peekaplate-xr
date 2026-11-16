import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
export default async function({frame,workspaceRoot}){
 await frame.waitForFunction(()=>!!window.glimmer);
 const dir=workspaceRoot+'/artifacts/reference';await mkdir(dir,{recursive:true});
 const shot=async name=>{await frame.evaluate(()=>new Promise(r=>setTimeout(r,500)));const data=await frame.evaluate(()=>window.glimmer.canvas.toDataURL().split(',')[1]);await writeFile(dir+'/'+name+'.png',Buffer.from(data,'base64'));};
 await frame.evaluate(async()=>{await window.glimmer.market.ready;await document.fonts.ready;window.glimmer.start();});
 await frame.waitForFunction(()=>!window.glimmer.market.entering);
 await shot('hud');
 await frame.evaluate(()=>window.glimmer.gamepadPause());await shot('pause');await frame.evaluate(()=>window.glimmer.close());
 for(const [id,name] of [['npc-rin','rin'],['ad-1','holo'],['cat-1','cat']]){
  await frame.evaluate(id=>{const a=window.glimmer,o=a.market.objects.find(o=>o.id===id);a.market.player.x=o.pivot[0];a.market.player.y=o.pivot[1]+.6;a.market.interact();a.dialogueElapsed=100;a.invalidate();},id);
  await shot(name);await frame.evaluate(()=>window.glimmer.close());
 }
 await frame.evaluate(()=>window.glimmer.interact('kiosk'));await shot('wardrobe');
 await frame.evaluate(()=>window.glimmer.setScreen('passport'));await shot('passport-kiosk');
 await frame.evaluate(()=>window.glimmer.close());
 await frame.evaluate(()=>window.glimmer.openPanel('passport'));await shot('passport');
 await frame.evaluate(()=>window.glimmer.close());
 const dialogueCheck=await frame.evaluate(()=>{const a=window.glimmer;a.interact('npc-rin');a.dialogueIndex=0;a.dialogueElapsed=0;a.advanceDialogue();const revealed=!a.dialogueTyping&&a.dialogueIndex===0;a.advanceDialogue();const next=a.dialogueIndex===1&&a.dialogueTyping;a.close();return {revealed,next};});assert.ok(dialogueCheck.revealed&&dialogueCheck.next);
 const keyboardDialogue=await frame.evaluate(()=>{const a=window.glimmer,o=a.market.objects.find(o=>o.id==='npc-rin');a.market.player.x=o.pivot[0];a.market.player.y=o.pivot[1]+.6;const press=()=>{window.dispatchEvent(new KeyboardEvent('keydown',{key:'e',cancelable:true}));window.dispatchEvent(new KeyboardEvent('keyup',{key:'e'}));};press();const typing=a.screen==='dialogue'&&a.dialogueTyping;press();const revealed=!a.dialogueTyping;press();const closed=a.screen==='explore';return {typing,revealed,closed};});assert.ok(keyboardDialogue.typing&&keyboardDialogue.revealed&&keyboardDialogue.closed,JSON.stringify(keyboardDialogue));
 const pauseCheck=await frame.evaluate(()=>{const a=window.glimmer;a.gamepadPause();a.openPanel('passport');a.showCode();const clock=a.market.clock;a.update(.1);const frozen=a.market.clock===clock;a.close();a.close();const returned=a.screen==='pause';a.close();return frozen&&returned;});assert.ok(pauseCheck,'Pause remains frozen through Passport and Market code');
 const report=await frame.evaluate(async()=>{
  const {districts,finds,restaurants}=await import('/src/glimmer/data.ts');
  const {createState,encodeMarketCode,decodeMarketCode}=await import('/src/glimmer/state.ts');
  const a=window.glimmer;a.state=createState();a.sync();a.setScreen('explore');
  const results=[];
  for(const d of districts){
   a.market.setDistrict(d.district);a.state.district=d.district;a.setScreen('explore');
   const m=a.market,step=4,cols=d.width_tiles*4,rows=d.height_tiles*4;
   const visited=new Uint8Array(cols*rows),queue=[];
   const sx=Math.floor(m.player.x*4),sy=Math.floor(m.player.y*4);
   let seed=-1;
   for(let radius=0;radius<16&&seed<0;radius++)for(let y=Math.max(0,sy-radius);y<=Math.min(rows-1,sy+radius);y++)for(let x=Math.max(0,sx-radius);x<=Math.min(cols-1,sx+radius);x++)if(m.free(x*step+2,y*step+2)){seed=y*cols+x;break;}
   queue.push(seed);visited[seed]=1;
   for(let at=0;at<queue.length;at++){const index=queue[at],x=index%cols,y=Math.floor(index/cols);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,ni=ny*cols+nx;if(nx<0||ny<0||nx>=cols||ny>=rows||visited[ni]||!m.free(nx*step+2,ny*step+2))continue;visited[ni]=1;queue.push(ni);}}
   const objects=m.objects.filter(o=>o.kind==='restaurant'||o.kind.startsWith('find-'));
   for(const o of objects){
    a.setScreen('explore');let position=null;
    for(const index of queue){const x=(index%cols*step+2)/16,y=(Math.floor(index/cols)*step+2)/16;m.player.x=x;m.player.y=y;if(m.findFocus()?.id===o.id){position=[x,y];break;}}
    if(!position){results.push({id:o.id,error:'no reachable interaction position'});continue;}
    const previous=a.state.finds.length+a.state.stamps.length;
    if(o.kind==='find-puddle'){for(let i=0;i<10;i++)m.update(.05);}else m.interact();
    if(a.screen==='dialogue'){a.dialogueElapsed=100;while(a.screen==='dialogue'){a.advanceDialogue();a.dialogueElapsed=100;}}
    else if(a.screen!=='explore')a.close();
    const gained=a.state.finds.length+a.state.stamps.length-previous;
    a.setScreen('explore');a.interact(o.id);if(a.screen!=='explore')a.close();
    results.push({id:o.id,reachable:true,gained,repeatStable:a.state.finds.length+a.state.stamps.length===previous+1});
   }
  }
  a.toastTime=0;a.queue=[];a.update(.1);const grandFinale=a.screen==='finale'&&a.finaleDistrict===null;
  const saved=decodeMarketCode(encodeMarketCode(a.state));
  return {results,grandFinale,stamps:a.state.stamps.length,finds:a.state.finds.length,savedStamps:saved.stamps.length,savedFinds:saved.finds.length};
 });
 assert.equal(report.stamps,7,JSON.stringify(report));assert.equal(report.finds,28,JSON.stringify(report));
 assert.ok(report.results.every(r=>r.reachable&&r.gained===1&&r.repeatStable),JSON.stringify(report));
 assert.ok(report.grandFinale);assert.equal(report.savedStamps,7);assert.equal(report.savedFinds,28);
 Object.assign(report,{dialogueCheck,keyboardDialogue,pauseCheck});
 await writeFile(dir+'/results.json',JSON.stringify(report,null,2));return report;
}
