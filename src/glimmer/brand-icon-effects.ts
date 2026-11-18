/** Background lights only; the PeekaPlate P and plate remain still. */
export function brandIconEffects(c:CanvasRenderingContext2D,x:number,y:number,size:number,time:number,reducedMotion:boolean){
 c.save();c.translate(x,y);c.scale(size/1254,size/1254);
 for(const [px,py,offset] of [[276,213,0],[156,324,1.2],[1018,349,2.4],[1144,405,3.6]]){
  const light=reducedMotion?.25:.25+.25*(1+Math.sin(time*1.7+offset));
  c.fillStyle='#ffd35c';c.globalAlpha=light*.28;c.fillRect(px-44,py-44,88,88);
  c.globalCompositeOperation='screen';c.fillStyle='#fff3af';c.globalAlpha=light;c.fillRect(px-11,py-21,22,42);c.globalCompositeOperation='source-over';
 }
 for(const [px,py,offset] of [[448,110,0],[1120,256,2],[108,601,4]]){
  c.globalAlpha=reducedMotion?.35:Math.pow((Math.sin(time*1.5+offset)+1)/2,2)*.8;c.fillStyle='#fff7cf';
  c.fillRect(px-6,py-18,12,36);c.fillRect(px-18,py-6,36,12);
 }
 c.restore();
}
