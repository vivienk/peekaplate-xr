import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
export default async function({frame,workspaceRoot}){
 await frame.waitForFunction(()=>!!window.glimmer);await frame.evaluate(()=>window.glimmer.market.ready);
 await frame.evaluate(()=>window.glimmer.setScreen('title'));await frame.waitForTimeout(500);
 await frame.locator('canvas').first().screenshot({path:workspaceRoot+'/artifacts/night-market-title.png'});
 const result=await frame.evaluate(async()=>{
  const a=window.glimmer;const {placeRestaurant}=await import('/src/published/market.ts');const {districts}=await import('/src/glimmer/data.ts');
  const d=districts[0];const original=d.width_tiles;for(let i=0;i<12;i++)placeRestaurant(d,`published:test-${i}`,['ramen','thai','cafe'][i%3]);
  a.start();await new Promise(r=>setTimeout(r,2000));const m=a.market;m.setDistrict(d.district);a.setScreen('explore');
  const cols=d.width_tiles*4,rows=d.height_tiles*4,queue=[],seen=new Set();
  const start=Math.floor(m.player.y*4)*cols+Math.floor(m.player.x*4);queue.push(start);seen.add(start);
  for(let i=0;i<queue.length;i++){const n=queue[i],x=n%cols,y=Math.floor(n/cols);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,k=yy*cols+xx;if(xx<0||xx>=cols||yy<0||yy>=rows||seen.has(k)||!m.free(xx*4+2,yy*4+2))continue;seen.add(k);queue.push(k);}}
  const reachable=m.objects.filter(o=>o.kind==='published-restaurant').map(o=>{const zone=m.zone(o);return queue.some(n=>{const x=n%cols*4+2,y=Math.floor(n/cols)*4+2;return x>=zone[0]&&x<=zone[0]+zone[2]&&y>=zone[1]&&y<=zone[1]+zone[3];});});
  return {expanded:d.width_tiles>original,shops:reachable.length,reachable:reachable.every(Boolean)};
 });assert.ok(result.expanded&&result.shops===12&&result.reachable,JSON.stringify(result));await writeFile(workspaceRoot+'/artifacts/published-placement.json',JSON.stringify(result));return result;
}
