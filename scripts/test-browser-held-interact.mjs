import assert from 'node:assert/strict';
export default async function({frame}){
 const result=await frame.evaluate(()=>{
  const a=window.glimmer;a.setScreen('explore');a.market.setDistrict('d1-rain-alley');
  const o=a.market.objects.find(o=>o.id==='r1-ramen');let found=false;
  for(let dy=0;dy<4&&!found;dy+=.25)for(let dx=-4;dx<=4&&!found;dx+=.25){a.market.player.x=o.pivot[0]+dx;a.market.player.y=o.pivot[1]+dy;if(a.market.findFocus()?.id===o.id)found=true;}
  const press=repeat=>window.dispatchEvent(new KeyboardEvent('keydown',{key:'e',repeat,cancelable:true}));
  press(false);a.update(.04);const opened=a.screen;press(true);a.update(.04);const held=a.screen;
  window.dispatchEvent(new KeyboardEvent('keyup',{key:'e'}));
  press(false);a.update(.04);const selected=a.screen;
  window.dispatchEvent(new KeyboardEvent('keyup',{key:'e'}));a.close();a.close();
  return {found,opened,held,selected};
 });assert.equal(result.held,'menu',JSON.stringify(result));assert.equal(result.selected,'dish',JSON.stringify(result));return result;
}
