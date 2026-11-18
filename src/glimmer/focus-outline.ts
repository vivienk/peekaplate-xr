/** Shared lightweight orange focus treatment for pointer, keyboard and XR. */
export function focusOutline(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r=12){
 c.save();c.strokeStyle='#ff963d';c.lineWidth=1.5;c.shadowColor='#ff7b19';c.shadowBlur=8;
 c.beginPath();c.roundRect(x-2,y-2,w+4,h+4,r);c.stroke();c.restore();
}
