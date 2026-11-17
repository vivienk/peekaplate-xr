export default async function({frame}){
 await frame.page().bringToFront();
 await frame.waitForFunction(()=>window.glimmer.screen==='ar'&&window.glimmer.buttons.some(b=>b.label==='View on Quest'));
 const button=await frame.evaluate(()=>{const b=window.glimmer.buttons.find(b=>b.label==='View on Quest');return {x:b.x+b.w/2,y:b.y+b.h/2};});
 const box=await frame.locator('canvas').first().boundingBox();const scale=Math.min(box.width/1280,box.height/720)/1.04;
 await frame.page().mouse.click(box.x+(box.width-1280*scale)/2+button.x*scale,box.y+(box.height-720*scale)/2+button.y*scale);
 await frame.waitForFunction(()=>window.glimmer.immersive);
 return {immersive:true,status:await frame.evaluate(()=>window.glimmer.portalStatus)};
}
