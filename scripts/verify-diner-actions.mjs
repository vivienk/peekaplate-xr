export default async function({frame}){
 await frame.page().bringToFront();
 const result=await frame.evaluate(()=>{
  const a=window.glimmer;a.handPlacement=true;a.reducedMotion=true;
  function render(){a.screenAge=1;a.invalidate();a.render();}
  function click(label){render();const b=a.buttons.find(b=>b.label===label&&!b.disabled);if(!b)throw Error(`Missing ${label} on ${a.screen}`);a.pointer(b.x+b.w/2,b.y+b.h/2);render();}
  a.setScreen('explore');a.interact('r1-ramen');render();
  click('Sides');if(a.buttons.some(b=>b.label==='Miso-style Ramen'))throw Error('category');
  click('Pan-fried Gyoza');if(a.screen!=='dish')throw Error('dish');
  const saved=a.state.tastingList.includes(a.dining.id);click(saved?'Saved':'Save');if(a.state.tastingList.includes(a.dining.id)===saved)throw Error('save');
  const before=a.state.tray.find(l=>l.dish===a.dining.id)?.qty??0;if(before<3){click('+ Tray');if(a.state.tray.find(l=>l.dish===a.dining.id)?.qty!==before+1)throw Error('tray');}
  click('More info');click('Ingredients');click('Compare');a.dining.query='Miso';render();click('Miso-style Ramen');if(a.screen!=='comparison')throw Error('compare');
  click('Back');click('View Portion');if(a.screen!=='ar')throw Error('portion');click(a.buttons.some(b=>b.label==='Back')?'Back':'Back to dish');click('Back');if(a.screen!=='menu')throw Error('back');
  return {passed:true,checks:['filter','dish','save','tray','info','compare','portion','back']};
 });
 await frame.waitForTimeout(500);return result;
}
