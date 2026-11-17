/** Stable pixel-art architecture for added venues; no generated art changes on reload. */
const cache = new Map<string, HTMLCanvasElement>();
export function storefrontSeed(id:string) { let n=2166136261; for(const ch of id)n=Math.imul(n^ch.charCodeAt(0),16777619); return n>>>0; }
export function drawStorefront(c:CanvasRenderingContext2D,id:string,name:string,x:number,y:number,w:number,h:number,time=0,style='cafe') {
 const cacheKey=`${id}:${name}:${style}:${w}:${h}`;
 let art=cache.get(cacheKey);
 if(!art){
  art=document.createElement('canvas');art.width=w;art.height=h;
  const g=art.getContext('2d')!, seed=storefrontSeed(id), ember=style==='ember'||/ember.*stone/i.test(name);
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
  {
   // Hand-detailed stonework, copper flashing, kitchen shelves and street furniture.
   for(let row=18;row<h-26;row+=7)for(let col=7+(row%2)*4;col<w-8;col+=11){
    rect('#b4a0a22a',col,row,7,1);rect('#1f223b88',col+7,row+1,1,4);
   }
   rect('#3a2736',10,51,w-20,3);rect('#d19363',10,54,w-20,2);
   for(let a=12;a<w-12;a+=8){rect('#efbc7c',a,55,2,2);rect('#623c43',a+2,59,5,4);}
   rect('#251d2d',20,72,w-40,3);rect('#d6a56d',20,75,w-40,1);
   for(let a=23;a<w-23;a+=10){rect(a%3?'#628e85':'#a45154',a,65,4,7);rect('#e4d5a5',a+1,63,2,2);}
   // Arched brick oven, offset from the chef rather than hidden behind them.
   if(ember){
   rect('#2b2431',22,h-59,29,28);rect('#95634e',24,h-60,25,4);
   rect('#ad7960',22,h-55,4,23);rect('#754c47',47,h-55,4,23);
   rect('#e4b481',27,h-57,17,2);rect('#151b2a',27,h-53,19,18);
   rect('#a14934',28,h-40,17,5);rect('#e67e3e',29,h-39,14,2);
   }else{
    // Cuisine-specific equipment silhouettes, drawn at the original sprite scale.
    const a=23,b=h-49;
    if(style==='ramen'||style==='thai'){
     rect('#192332',a,b+7,28,9);rect('#d0b6a1',a-2,b+5,32,2);
     rect(style==='thai'?'#bce080':'#f6d99a',a+3,b+3,20,3);
     rect('#9e7751',a+24,b-5,2,13);
    }else if(style==='kaigan'||style==='tide'){
     rect('#458c96',a,b,32,17);rect('#a7e0d7',a+1,b+1,30,2);
     for(let k=0;k<3;k++){rect('#edc6a3',a+4+k*9,b+10,6,4);rect(style==='kaigan'?'#dd806d':'#93bdd0',a+4+k*9,b+8,6,3);}
    }else if(style==='pearl'){
     for(let k=0;k<3;k++){rect('#deaccc',a+k*10,b+4,7,13);rect('#eee0b7',a+k*10,b+3,7,2);rect('#4fe2d2',a+3+k*10,b-2,1,9);rect('#493451',a+2+k*10,b+13,2,2);}
    }else{
     rect('#608888',a,b,28,16);rect('#aed4c4',a+2,b+2,24,3);rect('#273b46',a+4,b+7,20,7);
     for(let k=0;k<2;k++){rect('#f6d9bb',a+6+k*11,b+11,6,6);rect('#9f6953',a+7+k*11,b+11,4,2);}
    }
   }
   // Plates, hanging utensils, copper counter panels and rivets.
   for(let a=70;a<w-24;a+=7){rect('#c9cdc0',a,80,1,10);rect('#8dada8',a-1,88,3,3);}
   rect('#ead6a7',w-38,h-29,14,2);rect('#9e9e95',w-36,h-27,12,2);
   for(let a=17;a<w-16;a+=16){rect('#8a573f',a,h-19,12,13);rect('#c18758',a+1,h-18,10,1);rect('#e6ba78',a+2,h-16,1,1);}
   for(const a of [27,w-35]){rect('#1d2032',a+3,h-8,2,8);rect('#b85e4b',a,h-10,12,3);rect('#f2a575',a+1,h-10,10,1);}
   rect('#25434b',w-16,88,7,19);rect('#5af4dc',w-15,89,1,16);
   for(let a=7;a<w-6;a+=9)rect('#f9c474',a,61,2,2);
  }
  cache.set(cacheKey,art);
 }
 c.drawImage(art,Math.round(x-w/2),Math.round(y-h));
 {
  c.save();c.translate(Math.round(x-w/2),Math.round(y-h));
  const frame=Math.floor(time*8)%4;
  // Crisp neon cores; the world light pass supplies the soft pavement reflections.
  c.fillStyle='#f77a56';c.fillRect(10,24,w-20,1);c.fillRect(10,47,w-20,1);
  c.fillStyle='#ffe8b0';c.fillRect(12,25,w-24,1);
  c.fillStyle='#5ce4d5';c.fillRect(8,27,1,18);c.fillRect(w-9,27,1,18);
  if(style==='ember'||/ember.*stone/i.test(name))for(let i=0;i<4;i++){
   const height=5+(frame+i*3)%7;
   c.fillStyle='#f36b37';c.fillRect(29+i*4,h-36-height,3,height);
   c.fillStyle='#ffdb80';c.fillRect(30+i*4,h-36-Math.floor(height/2),1,Math.floor(height/2));
  }
  // An individual illuminated tile motif makes otherwise similar venues distinguishable.
  const mark=storefrontSeed(id);
  c.fillStyle='#86f7dc';
  for(let i=0;i<24;i++)if((mark>>>i)&1)c.fillRect(12+(i%6)*2,29+Math.floor(i/6)*2,1,1);
  c.restore();
 }
}
