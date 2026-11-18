/** Decorative light only: title lettering and controls never move.
 * Coordinates follow the 1944 × 809 orange title artwork. The existing title
 * clock drives these effects; no extra timer or animation loop is needed.
 */
export function titleLogoEffects(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,time:number,reducedMotion:boolean){
 const scale=Math.min(w/1944,h/809);
 c.save();c.translate(x+(w-1944*scale)/2,y+(h-809*scale)/2);c.scale(scale,scale);
 const phase=reducedMotion?0:time;
 for(const [lx,ly,offset] of [[187,468,0],[1758,468,1.3]]){
  const glow=reducedMotion?.35:.35+.3*(1+Math.sin(phase*Math.PI/2+offset));
  // Three stepped halos keep the warm glow on the same pixel grid as the art.
  c.fillStyle='#ffad32';
  for(const [size,alpha] of [[180,.035],[140,.07],[100,.12]]){
   c.globalAlpha=glow*alpha;c.fillRect(lx-size/2,ly-size/2,size,size);
  }
  c.globalCompositeOperation='screen';c.globalAlpha=glow*.48;c.fillStyle='#fff4b0';
  c.fillRect(lx-18,ly-33,36,66);c.fillRect(lx-33,ly-18,66,36);
  c.globalCompositeOperation='source-over';
 }
 for(const [sx,sy,offset] of [[397,139,0],[1846,223,1.8],[91,507,3.4],[1851,522,5.1]]){
  const shimmer=reducedMotion?.25:Math.pow((1+Math.sin(phase*1.9+offset))/2,3);
  c.globalCompositeOperation='screen';c.globalAlpha=.12+shimmer*.85;c.fillStyle='#fffde3';
  c.fillRect(sx-9,sy-27,18,54);c.fillRect(sx-27,sy-9,54,18);
  c.globalCompositeOperation='source-over';c.globalAlpha=shimmer*.65;
  c.fillRect(sx-5,sy-49,10,10);c.fillRect(sx-5,sy+39,10,10);
 }
 c.restore();
}
