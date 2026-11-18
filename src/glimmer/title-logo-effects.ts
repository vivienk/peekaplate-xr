/** Decorative light only: title lettering and controls never move.
 * Coordinates follow the 1944 × 809 title artwork. The existing title
 * clock drives these effects; no extra timer or animation loop is needed.
 */
export function titleLogoEffects(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,time:number,reducedMotion:boolean){
 const scale=Math.min(w/1944,h/809);
 c.save();c.translate(x+(w-1944*scale)/2,y+(h-809*scale)/2);c.scale(scale,scale);
 const phase=reducedMotion?0:time;
 for(const [lx,ly,offset] of [[187,468,0],[1758,468,1.3]]){
  const glow=reducedMotion?.5:.25+.375*(1+Math.sin(phase*Math.PI/1.8+offset));
  // Three stepped halos keep the warm glow on the same pixel grid as the art.
  c.fillStyle='#ffad32';
  for(const [size,alpha] of [[240,.10],[180,.18],[120,.28]]){
   c.globalAlpha=glow*alpha;c.fillRect(lx-size/2,ly-size/2,size,size);
  }
  c.globalCompositeOperation='screen';c.globalAlpha=glow*.85;c.fillStyle='#fff4b0';
  c.fillRect(lx-24,ly-39,48,78);c.fillRect(lx-39,ly-24,78,48);
  c.globalCompositeOperation='source-over';
 }
 for(const [sx,sy,offset] of [[397,139,0],[1846,223,1.8],[91,507,3.4],[1851,522,5.1]]){
  const shimmer=reducedMotion?.25:Math.pow((1+Math.sin(phase*2.2+offset))/2,3);
  c.globalCompositeOperation='screen';c.globalAlpha=.12+shimmer*.85;c.fillStyle='#fffde3';
  c.fillRect(sx-12,sy-36,24,72);c.fillRect(sx-36,sy-12,72,24);
  c.globalCompositeOperation='source-over';c.globalAlpha=shimmer*.95;
  c.fillRect(sx-7,sy-66,14,14);c.fillRect(sx-7,sy+52,14,14);
 }
 c.restore();
}
