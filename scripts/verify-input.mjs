import fs from 'node:fs/promises';
export default async function({frame,page,workspaceRoot}){
  await frame.waitForFunction(()=>window.glimmer?.market);
  await frame.evaluate(()=>window.glimmer.market.ready);
  await frame.evaluate(()=>{window.glimmer.setScreen('title');window.glimmer.update(0);});
  const box=await frame.locator('canvas').first().boundingBox();
  // Desktop camera fits the complete 16:9 board with a 4% margin.
  const w=Math.min(box.width,box.height*16/9)/1.04,h=w*9/16;
  const sx=box.x+(box.width-w)/2,sy=box.y+(box.height-h)/2;
  await page.mouse.click(sx+w*.5,sy+h*(377/720));
  await frame.waitForFunction(()=>window.glimmer.screen==='explore');
  await frame.waitForFunction(()=>Math.abs(window.glimmer.market.player.y-27)<.01&&Math.abs(window.glimmer.market.player.x-22)<.01);
  await frame.waitForTimeout(150);
  const pointer=await frame.evaluate(()=>window.glimmer.screen==='explore');
  const before=await frame.evaluate(()=>({...window.glimmer.market.player}));
  await page.keyboard.down('ArrowLeft');await frame.waitForTimeout(600);await page.keyboard.up('ArrowLeft');
  const after=await frame.evaluate(()=>({...window.glimmer.market.player}));
  if(!pointer||after.x>before.x-.3)throw new Error('Real pointer/keyboard input failed');
  await page.keyboard.press('Tab');await frame.waitForFunction(()=>window.glimmer.screen==='passport');
  await page.keyboard.press('Escape');
  const exits=await frame.evaluate(()=>{
    const g=window.glimmer, checks=[];
    for(const [from,x,y,to]of [['d1-rain-alley',.5,12.5,'d2-lantern-steps'],['d2-lantern-steps',39.5,22.5,'d1-rain-alley'],['d1-rain-alley',43.5,24.5,'d3-fogline-pier'],['d3-fogline-pier',.5,11.5,'d1-rain-alley']]){
      g.market.setDistrict(from);g.state.district=from;g.setScreen('explore');const accepted=g.market.moveTo(x,y);for(let i=0;i<1500&&g.state.district!==to;i++)g.market.update(1/30);checks.push({from,to,accepted,arrived:g.state.district===to});
    }return checks;
  });
  if(exits.some(e=>!e.arrived))throw new Error('Exit traversal failed '+JSON.stringify(exits));
  const report={pointerStart:pointer,keyboardMovement:{before,after},passportShortcut:true,exits};
  await fs.writeFile(workspaceRoot+'/design/input-checks.json',JSON.stringify(report,null,2));return report;
}
