export default async function({frame}){
 await frame.page().bringToFront();await frame.waitForFunction(()=>!!window.glimmer);
 await frame.evaluate(()=>{window.glimmer.handPlacement=true;window.glimmer.invalidate();});
 await frame.getByRole('button',{name:'Browse dishes for Spectacles',exact:true}).click();
 await frame.getByRole('searchbox').fill('Pan-fried Gyoza');
 await frame.getByRole('button',{name:'Pan-fried Gyoza',exact:true}).click();
 await frame.waitForTimeout(1800);
 const before=await frame.evaluate(()=>{const a=window.glimmer;window.marketCalls=0;const update=a.market.update.bind(a.market);a.market.update=(...args)=>{window.marketCalls++;return update(...args)};return a.canvasRevision;});
 await frame.waitForTimeout(1200);
 const idle=await frame.evaluate(()=>({revision:window.glimmer.canvasRevision,marketCalls:window.marketCalls,screen:window.glimmer.screen}));
 if(idle.screen!=='dish'||idle.marketCalls!==0||idle.revision!==before)throw Error(JSON.stringify({before,idle}));
 await frame.getByRole('button',{name:'Save',exact:true}).click();
 await frame.getByRole('button',{name:'Saved',exact:true}).waitFor({state:'attached',timeout:3000});
 await frame.getByRole('button',{name:'Back',exact:true}).click();
 await frame.getByRole('searchbox').waitFor({state:'visible'});
 return {passed:true,nativeClicks:4,idleMarketUpdates:idle.marketCalls,idleCanvasRedraws:idle.revision-before};
}
