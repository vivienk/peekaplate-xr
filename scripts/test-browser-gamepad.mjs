import assert from 'node:assert/strict';
export default async function ({ page, frame, workspaceRoot }) {
  await page.bringToFront();
  await frame.waitForFunction(() => !!window.glimmer);
  await frame.evaluate(()=>window.glimmer.setScreen('title'));
  await frame.locator('canvas').first().click({position:{x:10,y:10}});
  await frame.evaluate(() => {
    window.testPad = {index:0,id:'DualSense Wireless Controller (standard test)',connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0,touched:false}))};
    Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[window.testPad]});
  });
  const tick = () => frame.evaluate(() => new Promise(resolve => setTimeout(resolve,160)));
  const press = async i => {
    await frame.evaluate(i=>Object.assign(window.testPad.buttons[i],{pressed:true,value:1}),i); await tick();
    await frame.evaluate(i=>Object.assign(window.testPad.buttons[i],{pressed:false,value:0}),i); await tick();
  };
  const screen = () => frame.evaluate(()=>window.glimmer.screen);
  await tick();
  assert.equal(await frame.evaluate(()=>window.glimmer.gamepadConnected),true);
  await press(0); assert.equal(await screen(),'explore');
  await frame.waitForFunction(()=>!window.glimmer.market.entering);
  const before = await frame.evaluate(()=>window.glimmer.market.player.x);
  await frame.evaluate(()=>window.testPad.axes[0]=1); await tick(); await tick();
  await frame.evaluate(()=>window.testPad.axes[0]=0); await tick();
  assert.ok(await frame.evaluate(()=>window.glimmer.market.player.x)>before,'left stick moves character');
  await press(9); assert.equal(await screen(),'pause');
  await frame.locator('canvas').first().screenshot({path:workspaceRoot+'/artifacts/controller-guide.png'});
  await press(1); assert.equal(await screen(),'explore');
  await press(2); assert.equal(await screen(),'tray'); await press(1);
  await press(3); assert.equal(await screen(),'passport'); await press(1);
  await press(8); assert.equal(await screen(),'map'); await press(1);
  // Enter a restaurant through the same proximity interaction used by controller A.
  await frame.evaluate(()=>{window.glimmer.market.player.x=10.5;window.glimmer.market.player.y=10;});
  await tick(); await press(0);
  const restaurantOpened = await screen();
  assert.equal(await screen(),'menu');
  await press(0); assert.equal(await screen(),'dish');
  await press(13); await press(13); await press(0); assert.equal(await screen(),'ar');
  const yaw = await frame.evaluate(()=>window.glimmer.portalYaw);
  await frame.evaluate(()=>window.testPad.axes[2]=1); await tick();
  await frame.evaluate(()=>window.testPad.axes[2]=0);
  assert.ok(await frame.evaluate(()=>window.glimmer.portalYaw)>yaw);
  await press(1); assert.equal(await screen(),'dish');
  await frame.evaluate(()=>window.testPad.connected=false); await tick();
  assert.equal(await frame.evaluate(()=>window.glimmer.gamepadConnected),false);
  return {passed:true,restaurantOpened,checks:['start','walk','pause','back','tray','passport','map','dish','portal','rotate','disconnect'],screenshot:'artifacts/controller-guide.png'};
}
