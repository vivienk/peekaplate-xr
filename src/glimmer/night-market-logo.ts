// Integer-grid artwork: a neon night-market stall with a steaming bowl.
// Only the steam advances, at four frames per second; the sign never flashes.
export function nightMarketLogo(c:CanvasRenderingContext2D,x:number,y:number,frame:number){
  c.save();c.translate(Math.round(x),Math.round(y));c.scale(3,3);
  c.fillStyle='#321b35';c.fillRect(2,7,28,22);c.fillRect(5,3,22,5);
  c.fillStyle='#953879';c.fillRect(1,8,30,3);
  c.fillStyle='#fc7ade';c.fillRect(2,7,28,2);
  c.fillStyle='#ffe9b3';c.fillRect(5,12,22,12);
  c.fillStyle='#eeae60';c.fillRect(5,12,3,12);c.fillRect(24,12,3,12);
  c.fillStyle='#ba5c45';c.fillRect(3,11,2,16);c.fillRect(27,11,2,16);
  c.fillStyle='#ffad47';c.fillRect(3,24,26,3);
  c.fillStyle='#673b40';c.fillRect(5,27,22,3);
  c.fillStyle='#30bbcc';c.fillRect(7,4,18,2);
  c.fillStyle='#b0fbef';c.fillRect(8,4,16,1);
  c.fillStyle='#613946';c.fillRect(10,19,12,2);c.fillRect(11,21,10,2);c.fillRect(13,23,6,1);
  c.fillStyle='#ed685e';c.fillRect(11,20,10,1);c.fillRect(12,21,8,1);
  c.fillStyle='#fff5d9';c.fillRect(11,19,10,1);
  for(let i=0;i<3;i++){
    const step=(frame+i)%4;
    c.fillStyle=step===3?'#d7a875':'#bd8969';
    c.fillRect(12+i*3+(step===1?1:0),17-step,1,2);
  }
  c.fillStyle='#f88c35';c.fillRect(0,14,3,5);c.fillRect(29,14,3,5);
  c.fillStyle='#ffdf7e';c.fillRect(1,15,1,3);c.fillRect(30,15,1,3);
  c.restore();
}
