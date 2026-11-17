/** Stable pixel-art architecture for added venues; no generated art changes on reload. */
const cache = new Map<string, HTMLCanvasElement>();
export function storefrontSeed(id:string) { let n=2166136261; for(const ch of id)n=Math.imul(n^ch.charCodeAt(0),16777619); return n>>>0; }
export function drawStorefront(c:CanvasRenderingContext2D,id:string,name:string,x:number,y:number,w:number,h:number) {
 const cacheKey=`${id}:${name}:${w}:${h}`;
 let art=cache.get(cacheKey);
 if(!art){
  art=document.createElement('canvas');art.width=w;art.height=h;
  const g=art.getContext('2d')!, seed=storefrontSeed(id), ember=/ember.*stone/i.test(name);
  const hue=seed%360, accent=ember?'#f6a259':`hsl(${hue} 70% 65%)`, wall=ember?'#48414a':`hsl(${(hue+35)%360} 22% 29%)`;
  const rect=(color:string,a:number,b:number,d:number,e:number)=>{g.fillStyle=color;g.fillRect(a,b,d,e);};
  rect('#201c30',2,12,w-4,h-12);rect(wall,6,18,w-12,h-22);
  // Staggered masonry and independently varied roof silhouettes.
  for(let row=22;row<h-8;row+=10)for(let col=6+(row%20?0:9);col<w-8;col+=18){rect('#ffffff16',col,row,14,1);rect('#00000030',col+14,row,1,8);}
  const roof=seed%3;
  for(let i=0;i<4;i++)rect('#292536',4+i*5,12-i*(roof===0?3:1),w-8-i*10,4);
  if(ember){rect('#302e3a',w-24,0,14,24);rect('#79707b',w-26,0,18,4);}
  rect('#211b2b',10,24,w-20,24);rect(accent,10,24,w-20,2);
  g.fillStyle='#fff0ca';g.textAlign='center';g.font='bold 8px monospace';
  const words=name.split(' '), split=Math.ceil(words.length/2);
  if(name.length>15){g.fillText(words.slice(0,split).join(' '),w/2,34,w-24);g.fillText(words.slice(split).join(' '),w/2,44,w-24);}else g.fillText(name,w/2,40,w-24);
  // Three architectural families: striped canopy, copper pergola, stepped lintel.
  const canopy=ember?1:(seed>>>4)%3;
  rect('#312334',8,53,w-16,12);
  if(canopy===0)for(let a=8;a<w-8;a+=12)rect(accent,a,53,6,12);
  if(canopy===1){rect(accent,8,53,w-16,3);for(let a=12;a<w-8;a+=16)rect('#ad704c',a,53,3,14);}
  if(canopy===2){rect(accent,12,53,w-24,5);rect(accent,18,58,w-36,4);}
  rect('#141b28',16,68,w-32,h-86);
  const bays=2+(seed>>>8)%3;
  for(let i=0;i<bays;i++){const a=18+Math.floor(i*(w-36)/bays);rect(ember?'#8b4438':'#375d69',a,70,Math.floor((w-36)/bays)-3,h-92);rect('#ffe4a366',a+2,72,2,h-98);}
  if(ember){rect('#25232c',w/2-16,h-53,32,24);rect('#ff6b36',w/2-10,h-42,20,10);rect('#ffd78b',w/2-5,h-46,8,14);}
  rect('#231e2c',8,h-24,w-16,20);rect(accent,8,h-24,w-16,3);
  for(let a=14;a<w-12;a+=12)rect(wall,a,h-19,8,12);
  // Entrance lamps and planters frame the same collision footprint.
  for(const a of [4,w-12]){rect(accent,a,70,8,12);rect('#fff0b9',a+2,72,4,7);rect('#765043',a-1,h-14,10,14);rect('#3b6855',a,h-22,8,10);}
  cache.set(cacheKey,art);
 }
 c.drawImage(art,Math.round(x-w/2),Math.round(y-h));
}
