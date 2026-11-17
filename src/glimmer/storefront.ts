/** Architecture is composed per venue; original art supplies only kitchen details and neon emblems. */
export function storefrontSeed(id:string){let n=2166136261;for(const ch of id)n=Math.imul(n^ch.charCodeAt(0),16777619);return n>>>0;}
const sourceLayout:Record<string,number[]>={ramen:[8,-38,.18],cafe:[24,-48,.2],thai:[-2,-38,.12],pearl:[4,-38,.18],ember:[8,-40,.14],tide:[-8,-20,.2],kaigan:[2,-24,.16]};
export function storefrontPlan(id:string,style:string,w:number,h:number){
 const n=storefrontSeed(id),side=(n&1)?1:-1;
 const bay=46+((n>>>3)%4)*4,center=Math.round(w/2)+side*(10+(n>>>6)%7);
 return {seed:n,side,bay,center,roof:18+(n>>>10)%13,windowY:h-65-(n>>>14)%9,doorX:side>0?8:w-25,doorRise:(n>>>23)%9,signX:side>0?10:w-58,signY:style==='tide'?26:7,variant:(n>>>18)%3};
}
type Art={rear:HTMLCanvasElement;front:HTMLCanvasElement;plan:ReturnType<typeof storefrontPlan>};
const cache=new Map<string,Art>();
function build(id:string,name:string,style:string,w:number,h:number,source:HTMLImageElement):Art{
 const p=storefrontPlan(id,style,w,h),spec=sourceLayout[style]??sourceLayout.cafe;
 const rear=document.createElement('canvas'),front=document.createElement('canvas');rear.width=front.width=w;rear.height=front.height=h;
 const g=rear.getContext('2d')!,f=front.getContext('2d')!;g.imageSmoothingEnabled=f.imageSmoothingEnabled=false;
 const warm=style==='ember'||style==='ramen',accent=warm?'#eea065':style==='cafe'?'#db9dd6':style==='pearl'?'#c8a6ed':'#79c9bd';
 const dark='#242238',edge='#141928',stone='#55536b',light='#9990a0';
 const r=(color:string,x:number,y:number,a:number,b:number,c=g)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(a),Math.round(b));};
 const poly=(points:number[][],color:string)=>{g.fillStyle=color;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();};
 const masonry=(x:number,y:number,a:number,b:number)=>{r(stone,x,y,a,b);for(let j=0;j<b;j+=6)for(let i=0;i<a;i+=9){const xx=x+i+(j%12?4:0);if(xx+7>x+a)continue;r('#393b55',xx,y+j,8,5);r('#777088',xx,y+j,7,1);r('#47445c',xx+1,y+j+2,5,2);}};
 const timber=(x:number,y:number,a:number,b:number)=>{r('#382936',x,y,a,b);for(let i=1;i<a-2;i+=5){r('#77503d',x+i,y+1,4,b-2);r('#ab7954',x+i,y+1,1,b-3);for(let j=4;j<b-3;j+=9)r('#523a36',x+i+2,y+j,1,4);}};
 const roof=(x:number,y:number,a:number,rows:number)=>{for(let j=0;j<rows;j++){r(edge,x-j*2,y+j*4,a+j*4,5);for(let i=0;i<a+j*4-3;i+=5){r('#53536c',x-j*2+i,y+j*4,4,2);r('#797084',x-j*2+i,y+j*4,3,1);} }r(accent,x-rows*2,y+rows*4,a+rows*4,2);};
 // Seven genuinely different silhouettes, with dimensions and handedness seeded per venue.
 if(style==='ramen'){
  masonry(18,12,w-36,h-25);masonry(p.side>0?7:w-29,33,22,h-45);
  roof(23,5,w-46,4);roof(9,53,w-18,2);
  for(let i=0;i<3;i++){r('#151e31',31+i*16,29,11,16);r('#bb8b63',32+i*16,30,9,1);r('#cca17a',35+i*16,31,1,12);}
 }else if(style==='cafe'){
  masonry(7,44,w-14,h-57);
  const split=45+(p.seed%18);poly([[7,45],[split/2+7,9],[split+7,45]],dark);poly([[split-2,45],[split+(w-split)/2,22],[w-7,45]],dark);
  for(let j=0;j<6;j++){const inset=6-j;r('#74708c',7+inset*3,12+j*5,split-inset*6,2);}
  masonry(11,46,25,h-61);r('#b786b7',15,55,17,h-74);r('#f3d8a9',23,57,1,h-80);
  for(let i=0;i<5;i++){r('#46725b',10+i*22,44,14,2);r('#b6a6d8',12+i*22,43,2,3);}
 }else if(style==='thai'){
  timber(9,48,w-18,h-62);poly([[3,47],[p.center,16],[w-3,47]],'#284b50');
  for(let i=0;i<7;i++)r(i%2?'#91afa1':'#476d6b',8+i*14,43-i%2*3,11,8);
  r('#d6bd8c',4,51,w-8,3);r('#776044',6,53,4,h-61);r('#776044',w-10,53,4,h-61);
 }else if(style==='pearl'){
  masonry(8,42,w-16,h-53);masonry(p.side>0?8:w-44,9,36,42);
  for(let i=0;i<3;i++)r('#a585ac',11+i*4,8-i*3,30-i*8,4);
  r('#463852',12,40,w-24,8);for(let i=0;i<8;i++)r(accent,15+i*11,42,7,2);
 }else if(style==='ember'){
  masonry(6,33,w-12,h-43);
  for(let i=0;i<3;i++){const x=6+i*32;poly([[x,34],[x+25,15+(p.variant*2)],[x+25,34]],'#4a4658');r('#c39b70',x,34,30,2);}
  masonry(p.side>0?8:w-22,3,13,43);r('#afa0a3',p.side>0?6:w-24,2,17,4);
  for(let i=0;i<4;i++){r('#252d3d',32+i*15,36,10,8);r('#a6a29b',32+i*15,36,10,1);}
 }else if(style==='tide'){
  timber(12,48,w-24,h-63);poly([[4,h-32],[w-4,h-32],[w-19,h-10],[20,h-10]],'#315764');
  for(let i=0;i<4;i++)r(i%2?'#709592':'#284550',12+i*3,h-29+i*4,w-24-i*6,2);
  roof(16,38,w-32,2);r('#a2b9ac',w-20,12,2,30);r('#d9c9a1',w-20,12,14,2);r('#3c6270',w-8,14,2,14);
 }else{
  timber(9,48,w-18,h-58);masonry(p.side>0?8:w-34,24,26,28);
  roof(14,38,w-28,3);roof(p.side>0?12:w-38,16,26,3);
  for(let i=0;i<7;i++){r('#688583',14+i*12,58,8,9);r('#ccb988',14+i*12,59,8,1);}
 }
 // Roof seams, transom details and small fixtures prevent broad flat-color slabs.
 if(style==='cafe')for(let j=0;j<5;j++){r('#615a75',w/2+3+j*3,31+j*3,w/2-15-j*6,1);}
 if(style==='thai')for(let j=0;j<5;j++){const a=15+j*6;r('#557e79',p.center-a,22+j*5,a*2,1);}
 if(style==='pearl'){
  const xx=p.side>0?13:w-39;for(let j=0;j<3;j++){r('#40364f',xx,19+j*7,26,5);r('#dbb383',xx+3,20+j*7,20,1);}
 }
 if(style==='ember')for(let i=0;i<3;i++)for(let j=0;j<3;j++)r('#716273',13+i*32+j*6,31-j*4,9,1);
 // Asymmetric entry with a transom, hinges, threshold and side menu board.
 const dy=Math.max(50,h-48-p.doorRise);timber(p.doorX,dy,17,h-dy-9);r('#192b3a',p.doorX+3,dy+3,11,15);r('#93b9b2',p.doorX+4,dy+4,1,13);r('#e8c182',p.doorX+13,h-23,2,2);r(light,p.doorX-2,h-10,21,2);
 const bx=Math.max(28,Math.min(w-p.bay-6,p.center-p.bay/2)),by=p.windowY;
 r(edge,bx-3,by-3,p.bay+6,39);r('#b18b67',bx-2,by-2,p.bay+4,1);
 // Crop only kitchen detail, never the original roof, facade, entrance or counter layout.
 const cropW=Math.min(p.bay,source.naturalWidth-8),sx=Math.max(0,Math.min(source.naturalWidth-cropW,Math.round(source.naturalWidth/2+spec[0]-cropW/2))),sy=Math.max(0,Math.min(source.naturalHeight-30,source.naturalHeight+spec[1]-25));
 g.drawImage(source,sx,sy,cropW,30,bx,by,cropW,30);
 for(let i=0;i<3;i++){r('#ead8ae',bx+4+i*10,by+28,7,2);r('#9c886f',bx+5+i*10,by+30,6,1);}
 // Cuisine awnings: offset slats, fabric scallops, hanging noren or metal flanges.
 for(let i=0;i<p.bay+6;i+=7){r(i%14?accent:'#444155',bx-3+i,by-9,6,6);r('#d7c89a',bx-3+i,by-9,5,1);if(style==='ramen'||style==='kaigan')r('#596486',bx-2+i,by-3,5,7);}
 // A separate foreground counter keeps the chef properly behind the facade.
 const cy=by+29;timber(bx-3,cy,p.bay+6,20);
 f.drawImage(rear,bx-3,cy,p.bay+6,20,bx-3,cy,p.bay+6,20);
 r('#e5c299',bx-5,cy,p.bay+10,2,f);r('#422e30',bx-4,cy+2,p.bay+8,2,f);
 r('#242232',bx,cy+5,p.bay,10,f);r(accent,bx,cy+5,p.bay,1,f);f.font='bold 6px monospace';f.textAlign='center';f.fillStyle='#f4dfb2';f.fillText(name,bx+p.bay/2,cy+12,p.bay-4);
 // Street-level variety: alternating stools, planters and individual tile inlays.
 for(let i=0;i<2+p.variant;i++){const xx=bx+3+i*13;if(xx>w-12)break;r('#212238',xx+3,h-8,2,8,f);r('#a77d5c',xx,h-10,10,3,f);r('#dec291',xx+1,h-10,8,1,f);}
 for(let i=0;i<12;i++)if((p.seed>>>i)&1)r('#a3bdb0',bx+i*4,cy+17,2,1,f);
 for(const xx of [4,w-12]){r('#664337',xx,h-14,9,12,f);for(let i=0;i<4;i++){r(i%2?'#55806b':'#345a50',xx+(i*3)%8,h-18-i%3*3,3,7,f);r('#a5a77c',xx+(i*3)%8,h-18-i%3*3,1,1,f);}}
 p.center=bx+p.bay/2;p.windowY=by;
 return {rear,front,plan:p};
}
export function drawStorefront(c:CanvasRenderingContext2D,id:string,name:string,x:number,y:number,w:number,h:number,time:number,style:string,back?:HTMLImageElement,front?:HTMLImageElement,sign?:HTMLImageElement,chef?:HTMLImageElement){
 if(!back||!front||!sign||!chef)return;
 const key=`${id}:${name}:${style}:${w}:${h}`;let art=cache.get(key);if(!art){art=build(id,name,style,w,h,back);cache.set(key,art);}
 const p=art.plan,spec=sourceLayout[style]??sourceLayout.cafe;
 c.save();c.imageSmoothingEnabled=false;c.translate(Math.round(x-w/2),Math.round(y-h));
 c.drawImage(art.rear,0,0);
 c.drawImage(chef,Math.floor(time/spec[2])%4*24,0,24,24,Math.round(p.center-12),p.windowY+7,24,24);
 if(style==='ember')for(let i=0;i<3;i++){
  const size=3+(Math.floor(time*8)+i*2)%5;c.fillStyle='#ef7946';c.fillRect(p.center-24+i*3,p.windowY+28-size,2,size);c.fillStyle='#ffe4a1';c.fillRect(p.center-24+i*3,p.windowY+26,1,2);
 }
 c.drawImage(art.front,0,0);
 c.drawImage(sign,time%3.7>3.55?48:0,0,48,32,p.signX,p.signY,48,32);
 // Native-resolution animated lanterns; world rendering adds their glow and reflections.
 for(let i=0;i<2;i++){const xx=i?w-9:5,yy=p.windowY-4;c.fillStyle='#503944';c.fillRect(xx,yy,5,11);c.fillStyle=style==='ember'?'#ff9a58':'#95e8db';c.fillRect(xx+1,yy+1,3,8);c.fillStyle='#fff0ba';c.fillRect(xx+2,yy+2,1,6);}
 c.restore();
}
