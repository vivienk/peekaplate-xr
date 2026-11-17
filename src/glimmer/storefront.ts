/** Architecture is composed per venue; original art supplies only kitchen details and neon emblems. */
export function storefrontSeed(id:string){let n=2166136261;for(const ch of id)n=Math.imul(n^ch.charCodeAt(0),16777619);return n>>>0;}
const sourceLayout:Record<string,number[]>={ramen:[8,-38,.18],cafe:[24,-48,.2],thai:[-2,-38,.12],pearl:[4,-38,.18],ember:[8,-40,.14],tide:[-8,-20,.2],kaigan:[2,-24,.16]};
export function storefrontPlan(id:string,style:string,w:number,h:number){
 const n=storefrontSeed(id),side=(n&1)?1:-1;
 const bay=46+((n>>>3)%4)*4,center=Math.round(w/2)+side*(10+(n>>>6)%7);
 const concept=id==='diner-demo:ember-stone'?0:storefrontSeed(id+':concept')%5;
 const plan={concept,form:storefrontSeed(id+':form')%3,canopy:storefrontSeed(id+':canopy')%3,signMount:storefrontSeed(id+':sign')%3,fixture:storefrontSeed(id+':fixture')%3,seed:n,side,bay,center,roof:18+(n>>>10)%13,windowY:h-65-(n>>>14)%9,doorX:side>0?8:w-25,doorRise:(n>>>23)%9,signX:side>0?10:w-58,signY:style==='tide'?26:7,variant:(n>>>18)%3};
 if(concept===0){plan.bay=w-42;plan.center=w/2+8;plan.windowY=h-62;plan.signX=Math.round(w/2-24);plan.signY=8;plan.signMount=2;plan.canopy=0;}
 if(concept===1){plan.windowY=h-60;plan.signX=2;plan.signY=9;plan.signMount=1;plan.bay=48;plan.center=w/2+8;}
 if(concept===2){plan.windowY=h-58;plan.bay=46;plan.center=w-33;plan.signX=Math.round(w/2-24);plan.signY=8;plan.signMount=2;}
 return plan;
}
type Art={glow:HTMLCanvasElement;rear:HTMLCanvasElement;front:HTMLCanvasElement;plan:ReturnType<typeof storefrontPlan>};
const cache=new Map<string,Art>();
function build(id:string,name:string,style:string,w:number,h:number,source:HTMLImageElement):Art{
 const p=storefrontPlan(id,style,w,h),spec=sourceLayout[style]??sourceLayout.cafe;
 const rear=document.createElement('canvas'),front=document.createElement('canvas');rear.width=front.width=w;rear.height=front.height=h;
 const g=rear.getContext('2d')!,f=front.getContext('2d')!;g.imageSmoothingEnabled=f.imageSmoothingEnabled=false;
 const warm=style==='ember'||style==='ramen',accent=warm?'#eea065':style==='cafe'?'#db9dd6':style==='pearl'?'#c8a6ed':'#79c9bd';
 const dark='#242238',edge='#141928',stone='#55536b',light='#9990a0';
 const r=(color:string,x:number,y:number,a:number,b:number,c=g)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(a),Math.round(b));};
 const poly=(points:number[][],color:string)=>{g.fillStyle=color;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();};
 const noise=(x:number,y:number)=>{let q=Math.imul(x+13,374761393)^Math.imul(y+7,668265263)^p.seed;q=Math.imul(q^(q>>>13),1274126177);return(q^(q>>>16))>>>0;};
 const material:Record<string,string[]>={ramen:['#c8ac81','#a78760','#ead5a8','#704334'],cafe:['#d2b5bb','#c49ca9','#f3d9d0','#9a728e'],thai:['#a0a46c','#7c874d','#d9d39a','#50684e'],pearl:['#6a9e93','#54867c','#bce1c3','#365f64'],ember:['#96634f','#7c4d40','#c28c65','#453039'],tide:['#648f9c','#487382','#afcacc','#2c4f64'],kaigan:['#baa37b','#9c855e','#e4d5ac','#65543f']};
 const mat=material[style]??material.cafe;
 const masonry=(x:number,y:number,a:number,b:number)=>{
  if(style==='cafe'){
   r(mat[0],x,y,a,b);
   for(let j=1;j<b-1;j+=3)for(let i=1;i<a-1;i+=3){const v=noise(x+i,y+j);if(v%3===0)r(v%2?mat[1]:mat[2],x+i,y+j,1,1);}
   r(mat[2],x,y,a,2);r(mat[3],x,y+b-3,a,3);return;
  }
  if(style==='pearl'){
   r(mat[3],x,y,a,b);
   for(let j=1;j<b-5;j+=6)for(let i=1;i<a-5;i+=6){r(mat[0],x+i,y+j,5,5);r(mat[2],x+i,y+j,4,1);r(mat[1],x+i+1,y+j+4,4,1);if((i+j)%12===2)r('#f5d99d',x+i+2,y+j+2,1,1);}return;
  }
  if(style==='ramen'){
   r(mat[0],x,y,a,b);for(let j=3;j<b-2;j+=5)for(let i=2;i<a-2;i+=4)if(noise(x+i,y+j)%3===0)r(mat[1],x+i,y+j,2,1);
   for(let i=0;i<a;i+=18){r(mat[3],x+i,y,3,b);r('#b16f4c',x+i,y,1,b);}r(mat[3],x,y+b-3,a,3);return;
  }
  r('#24283c',x,y,a,b);
  for(let j=0;j<b;j+=6)for(let i=-4;i<a;i+=9){const xx=x+i+(j%12?4:0);if(xx<x||xx+8>x+a||j+5>b)continue;
   const v=noise(xx,y+j)%4;
   r([mat[0],mat[1],mat[0],mat[3]][v],xx,y+j,8,5);
   r(mat[2],xx+1,y+j,6,1);
   r('#242b42',xx+7,y+j+1,1,4);r('#303149',xx+1,y+j+4,6,1);
   r('#b6a0a555',xx+2+v,y+j+1,1,1);r('#202b3d55',xx+3,y+j+2,2,1);
  }
 };
 const timber=(x:number,y:number,a:number,b:number)=>{
  r('#241f2e',x,y,a,b);
  for(let i=1;i<a-3;i+=5){const v=noise(x+i,y)%3;r([mat[0],mat[1],mat[0]][v],x+i,y+1,4,b-2);r(mat[2],x+i,y+1,1,b-3);
   for(let j=4;j<b-3;j+=7){r('#362d32',x+i+2,y+j,1,4);r('#a9784e',x+i+1,y+j+1,1,2);}
   if(style==='thai')for(let j=5;j<b-2;j+=10){r('#4d6943',x+i,y+j,4,2);r('#e0d8a0',x+i,y+j,4,1);}
   if(style==='tide')for(let j=6;j<b-2;j+=11)r('#c4d8cd',x+i+1,y+j,2,1);
   r('#e2b575',x+i+1,y+2,1,1);r('#1c2532',x+i+2,y+b-3,1,1);
  }
 };
 const roof=(x:number,y:number,a:number,rows:number)=>{for(let j=0;j<rows;j++){r(edge,x-j*2,y+j*4,a+j*4,5);for(let i=0;i<a+j*4-3;i+=5){r('#53536c',x-j*2+i,y+j*4,4,2);r('#797084',x-j*2+i,y+j*4,3,1);} }r(accent,x-rows*2,y+rows*4,a+rows*4,2);};
 const roofFace=(points:number[][],base:string)=>{
  poly(points,base);g.save();g.beginPath();points.forEach(([xx,yy],i)=>i?g.lineTo(xx,yy):g.moveTo(xx,yy));g.closePath();g.clip();
  for(let yy=8;yy<55;yy+=4)for(let xx=0;xx<w;xx+=6){const off=yy%8?3:0,v=noise(xx,yy)%3;
   r(['#ffffff28','#ffffff16','#00000024'][v],xx+off,yy,5,2);r('#0f243560',xx+off,yy+2,5,1);r('#dbd0c12a',xx+off+1,yy,3,1);
  }g.restore();
 };
 // Venue massing is independent of cuisine: courtyard, stepped annex or cuisine silhouette.
 if(p.concept===0){
  // Lantern Counter: low open bar, broad scarlet awning, side vending cabinet.
  timber(8,42,w-16,h-54);r('#492a30',12,44,w-24,h-60);
  r('#652b36',4,32,w-8,14);for(let xx=5;xx<w-7;xx+=12){r('#c34d46',xx,32,6,14);r('#f08a59',xx,32,6,2);r('#8c3136',xx,46,6,5);}
  for(let i=0;i<4;i++){r('#9a7151',27+i*16,50,13,2);r('#e0bf80',30+i*16,45,4,5);}
  r('#543454',5,h-48,17,35);r('#d17ccb',6,h-47,15,1);r('#233e57',7,h-44,13,19);
  for(let i=0;i<3;i++)for(let j=0;j<3;j++){r(['#8eddd9','#f3c5ba','#aaa4e4'][i],9+i*4,h-42+j*6,2,4);}
  r('#c67fb9',9,h-20,9,2);r('#192d3c',9,h-17,9,3);
 }else if(p.concept===1){
  // Moon Gate: two-storey timber house, giant circular window and balcony.
  timber(13,20,w-22,h-31);roof(17,5,w-34,3);roof(13,46,w-28,2);
  const cx=w-34,cy=31,rad=18;
  for(let yy=-rad;yy<=rad;yy++){const span=Math.floor(Math.sqrt(rad*rad-yy*yy));r('#514050',cx-span-2,cy+yy,span*2+5,1);r('#f5c479',cx-span,cy+yy,span*2+1,1);}
  for(let k=-1;k<=1;k++)r('#7c5242',cx+k*8,cy-16,1,33);r('#7c5242',cx-17,cy,35,1);
  r('#322c3b',22,42,w-38,3);for(let xx=22;xx<w-17;xx+=7)r('#aa8057',xx,43,2,10);r('#d4a669',21,53,w-36,2);
  for(let i=0;i<6;i++){r('#4d7b5c',w-20+(i%2)*4,48+i*4,5,5);r('#d19aca',w-18+(i%2)*4,49+i*4,2,2);}
 }else if(p.concept===2){
  // After Hours: stepped rounded carriage shell, portholes and raised hatch.
  for(let j=0;j<6;j++){const inset=10-j*2;r(j%2?'#427b7d':'#376569',8+inset,30+j*3,w-16-inset*2,4);}
  r('#899698',7,48,w-14,h-61);r('#d0cbc1',8,49,w-16,1);r('#4b676e',7,h-20,w-14,7);
  for(let yy=54;yy<h-22;yy+=7){r('#637b83',8,yy,w-16,1);for(let xx=11;xx<w-10;xx+=13)r('#d9c2a0',xx,yy+2,1,1);}
  for(let i=0;i<2;i++){const xx=13+i*20;r('#263a4d',xx,53,14,18);r('#dda764',xx+2,54,10,15);r('#ffe3a0',xx+3,55,3,13);}
  r('#6b727b',w-23,17,7,16);r('#b3aaa5',w-24,16,9,2);
 }else if(p.form===1){
  masonry(8,42,w-16,h-54);masonry(8,18,24,30);masonry(w-32,29,24,20);
  roof(9,10,22,2);roof(w-31,21,22,2);
  timber(33,49,w-66,5);for(let i=0;i<3;i++){r(mat[2],35+i*12,40,2,12);}
 }else if(p.form===2){
  const tx=p.side>0?7:w-40;masonry(tx,14,33,h-25);
  timber(p.side>0?40:8,52,w-48,h-63);
  roof(tx+1,6,31,2);roof(p.side>0?43:11,44,w-55,2);
  r('#172b3b',tx+7,28,19,14);r(mat[2],tx+8,29,17,1);r(mat[2],tx+16,29,1,12);
 }else if(style==='ramen'){
  masonry(18,12,w-36,h-25);masonry(p.side>0?7:w-29,33,22,h-45);
  roof(23,5,w-46,4);roof(9,53,w-18,2);
  for(let i=0;i<3;i++){r('#151e31',31+i*16,29,11,16);r('#bb8b63',32+i*16,30,9,1);r('#cca17a',35+i*16,31,1,12);}
 }else if(style==='cafe'){
  masonry(7,44,w-14,h-57);
  const split=45+(p.seed%18);roofFace([[7,45],[split/2+7,9],[split+7,45]],dark);roofFace([[split-2,45],[split+(w-split)/2,22],[w-7,45]],dark);
  for(let j=0;j<6;j++){const inset=6-j;r('#74708c',7+inset*3,12+j*5,split-inset*6,2);}
  masonry(11,46,25,h-61);r('#b786b7',15,55,17,h-74);r('#f3d8a9',23,57,1,h-80);
  for(let i=0;i<5;i++){r('#46725b',10+i*22,44,14,2);r('#b6a6d8',12+i*22,43,2,3);}
 }else if(style==='thai'){
  timber(9,48,w-18,h-62);roofFace([[3,47],[p.center,16],[w-3,47]],'#284b50');
  for(let i=0;i<7;i++)r(i%2?'#91afa1':'#476d6b',8+i*14,43-i%2*3,11,8);
  r('#d6bd8c',4,51,w-8,3);r('#776044',6,53,4,h-61);r('#776044',w-10,53,4,h-61);
 }else if(style==='pearl'){
  masonry(8,42,w-16,h-53);masonry(p.side>0?8:w-44,9,36,42);
  for(let i=0;i<3;i++)r('#a585ac',11+i*4,8-i*3,30-i*8,4);
  r('#463852',12,40,w-24,8);for(let i=0;i<8;i++)r(accent,15+i*11,42,7,2);
 }else if(style==='ember'){
  masonry(6,33,w-12,h-43);
  for(let i=0;i<3;i++){const x=6+i*32;roofFace([[x,34],[x+25,15+(p.variant*2)],[x+25,34]],'#4a4658');r('#c39b70',x,34,30,2);}
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
 if(p.concept>2&&style==='pearl'){
  const xx=p.side>0?13:w-39;for(let j=0;j<3;j++){r('#40364f',xx,19+j*7,26,5);r('#dbb383',xx+3,20+j*7,20,1);}
 }
 // Asymmetric entry with a transom, hinges, threshold and side menu board.
 const dy=Math.max(50,h-48-p.doorRise);if(p.concept!==0)timber(p.doorX,dy,17,h-dy-9);r('#192b3a',p.doorX+3,dy+3,11,15);r('#93b9b2',p.doorX+4,dy+4,1,13);r('#e8c182',p.doorX+13,h-23,2,2);r(light,p.doorX-2,h-10,21,2);
 const bx=Math.max(28,Math.min(w-p.bay-6,p.center-p.bay/2)),by=p.windowY;
 r(edge,bx-3,by-3,p.bay+6,39);r('#b18b67',bx-2,by-2,p.bay+4,1);
 // Crop only kitchen detail, never the original roof, facade, entrance or counter layout.
 const cropW=Math.min(p.bay,source.naturalWidth-8),sx=Math.max(0,Math.min(source.naturalWidth-cropW,Math.round(source.naturalWidth/2+spec[0]-cropW/2))),sy=Math.max(0,Math.min(source.naturalHeight-30,source.naturalHeight+spec[1]-25));
 g.drawImage(source,sx,sy,cropW,30,bx,by,cropW,30);
 // Warm practical kitchen lights illuminate the display without washing out its pixels.
 g.save();g.globalCompositeOperation='screen';
 const interior=g.createLinearGradient(0,by,0,by+30);interior.addColorStop(0,'#ffb34c55');interior.addColorStop(.6,'#ffd68735');interior.addColorStop(1,'#ed8a2530');g.fillStyle=interior;g.fillRect(bx,by,cropW,30);g.restore();
 r('#fff0b2',bx+2,by+1,cropW-4,1);r('#e8ab5c',bx+3,by+2,cropW-6,1);
 for(let i=0;i<3;i++){r('#ead8ae',bx+4+i*10,by+28,7,2);r('#9c886f',bx+5+i*10,by+30,6,1);}
 // Cuisine awnings: offset slats, fabric scallops, hanging noren or metal flanges.
 if(p.canopy===0){
  for(let i=0;i<p.bay+6;i+=7){r(i%14?accent:mat[3],bx-3+i,by-9,6,6);r('#d7c89a',bx-3+i,by-9,5,1);r(accent,bx-2+i,by-3,4,2);}
 }else if(p.canopy===1){
  r(mat[3],bx-5,by-12,p.bay+10,4);r(mat[2],bx-5,by-12,p.bay+10,1);
  for(let i=0;i<p.bay;i+=12){r(mat[1],bx+i,by-8,8,10);r(accent,bx+i+3,by-6,2,5);}
 }else{
  for(let i=0;i<3;i++){r(mat[3],bx-6+i*2,by-14+i*3,p.bay+12-i*4,3);r(mat[2],bx-6+i*2,by-14+i*3,p.bay+12-i*4,1);}
 }
 // A separate foreground counter keeps the chef properly behind the facade.
 const cy=by+29;timber(bx-3,cy,p.bay+6,20);
 f.drawImage(rear,bx-3,cy,p.bay+6,20,bx-3,cy,p.bay+6,20);
 r('#e5c299',bx-5,cy,p.bay+10,2,f);r('#422e30',bx-4,cy+2,p.bay+8,2,f);
 r(mat[3],bx,cy+5,p.bay,10,f);r(accent,bx,cy+5,p.bay,1,f);f.font='bold 6px monospace';f.textAlign='center';f.fillStyle='#f4dfb2';f.fillText(name,bx+p.bay/2,cy+12,p.bay-4);
 // Street-level variety: alternating stools, planters and individual tile inlays.
 for(let i=0;i<2+p.variant;i++){const xx=bx+3+i*13;if(xx>w-12)break;r('#212238',xx+3,h-8,2,8,f);r('#a77d5c',xx,h-10,10,3,f);r('#dec291',xx+1,h-10,8,1,f);}
 for(let i=0;i<12;i++)if((p.seed>>>i)&1)r('#a3bdb0',bx+i*4,cy+17,2,1,f);
 for(const xx of [4,w-12]){r('#664337',xx,h-14,9,12,f);for(let i=0;i<4;i++){r(i%2?'#55806b':'#345a50',xx+(i*3)%8,h-18-i%3*3,3,7,f);r('#a5a77c',xx+(i*3)%8,h-18-i%3*3,1,1,f);}}
 // Recesses, contact shadows and reflected warm light define the depth of the opening.
 g.save();g.globalCompositeOperation='source-atop';
 const shade=g.createLinearGradient(0,0,w,h);shade.addColorStop(0,'#172b4020');shade.addColorStop(.55,'#00000000');shade.addColorStop(1,'#08132728');g.fillStyle=shade;g.fillRect(0,0,w,h);
 const bounce=g.createRadialGradient(bx+p.bay/2,by+20,4,bx+p.bay/2,by+20,p.bay*.85);bounce.addColorStop(0,'#ffd18470');bounce.addColorStop(1,'#ff944000');g.fillStyle=bounce;g.fillRect(0,0,w,h);g.restore();
 r('#10172d99',bx-4,by-6,p.bay+9,5);r('#10172d88',bx-5,by,3,30);r('#f0b67e88',bx+p.bay,by,2,30);
 // Pipes, copper straps, enamel noticeboard, strings of lights and kitchen bottles.
 const pipe=p.side>0?w-5:3;
 r('#20273a',pipe,46,3,h-60);r('#71828b',pipe,46,1,h-60);
 for(let yy=51;yy<h-15;yy+=17)r('#a6a3a0',pipe-1,yy,4,1);
 const board=p.doorX+2;r('#202b39',board,dy+21,12,10);r('#b69b70',board,dy+21,12,1);
 for(let k=0;k<3;k++)r('#adbbac',board+2,dy+24+k*2,6+k%2*2,1);
 for(let k=0;k<4;k++){const xx=bx+4+k*9;r(['#46766c','#ae6056','#b1935d','#6b7891'][k],xx,by+23,3,5);r('#e9d2a2',xx+1,by+21,1,2);}
 for(let k=0;k<6;k++){const xx=bx-3+k*10;r('#211e31',xx,by-13,8,1);r(k%2?accent:'#edb27a',xx+2,by-12,3,3);r('#fff3c3',xx+3,by-12,1,2);}
 // Flowers, bunting and glowing side windows give each facade a lived-in evening mood.
 const flowers=style==='cafe'||style==='pearl';
 for(let k=0;k<5;k++){
  const xx=bx+2+k*10,yy=by-18+(k%2);
  r('#bd986b',xx,yy,10,1);r(k%2?accent:'#ef9c6d',xx+2,yy+1,5,3);r(k%2?'#f2d4b3':'#ffe09b',xx+3,yy+4,3,2);
 }
 for(const xx of [4,w-12])for(let k=0;k<4;k++){
  const px=xx+(k*3)%8,py=h-22-k%2*4;
  r(flowers?'#d78db8':'#cbad69',px,py,3,3,f);r(flowers?'#ffe1d6':'#ffdc99',px+1,py+1,1,1,f);
 }
 // Copper pendant lanterns: rounded pixel silhouettes, ribs, hot cores and tassels.
 for(const xx of [8,w-15]){
  const yy=by-2;
  r('#403039',xx+3,yy-5,1,6);r('#ab7851',xx+1,yy,7,2);
  r('#ce754a',xx,yy+3,9,12);r('#f5ab60',xx+1,yy+2,7,14);
  r('#ffdc8c',xx+3,yy+3,3,12);r('#fff2b9',xx+4,yy+4,1,10);
  for(let j=0;j<3;j++)r('#ad644a88',xx+1,yy+5+j*4,7,1);
  r('#8d583c',xx+1,yy+16,7,2);r('#e7ab5e',xx+4,yy+18,1,4);
 }
 // A lit transom and brass frame brighten the entrance side of the composition.
 r('#9b5f51',p.doorX+3,dy+3,11,15);r('#e7a65e',p.doorX+4,dy+4,9,13);r('#ffe0a0',p.doorX+5,dy+4,3,13);r('#6f4a46',p.doorX+8,dy+3,1,15);r('#6f4a46',p.doorX+3,dy+10,11,1);
 // Cuisine fixtures use different forms and materials, not palette-swapped decorations.
 const px=p.side>0?9:w-25,py=h-24;
 if(p.fixture===1){
  // A separate wheeled display with cuisine-specific goods and storage below.
  r(mat[3],px-2,py-6,20,16,f);r(mat[2],px-3,py-7,22,2,f);
  r('#182536',px,py+10,4,3,f);r('#182536',px+12,py+10,4,3,f);
  for(let i=0;i<3;i++){r(style==='tide'?'#a8d8d7':style==='cafe'?'#d69b59':'#e4cca0',px+i*5,py-10,4,3,f);r(accent,px+i*5,py-11,4,1,f);}
  r(mat[0],px,py,16,1,f);r(mat[0],px,py+4,16,1,f);
 }else if(p.fixture===2){
  // A tall open-shelf display changes the street silhouette and object arrangement.
  r(mat[3],px-1,py-20,2,31,f);r(mat[3],px+15,py-20,2,31,f);
  for(let j=0;j<3;j++){r(mat[2],px-2,py-10+j*10,20,2,f);for(let i=0;i<2;i++){r(j%2?accent:mat[1],px+2+i*7,py-17+j*10,5,7,f);r('#f5dba3',px+3+i*7,py-18+j*10,3,1,f);}}
 }else if(style==='ramen'){
  // Lacquer bowl stack and a red fabric shop banner.
  for(let i=0;i<3;i++){r('#c8d7ce',px,py+i*3,13,2,f);r('#a3483c',px+2,py+2+i*3,9,1,f);}
  r('#a03d3b',p.doorX,dy-18,17,14);r('#edc797',p.doorX+2,dy-17,13,1);
  for(let i=0;i<3;i++)r('#f7dfb2',p.doorX+3+i*5,dy-13,2,5);
 }else if(style==='cafe'){
  // Glass pastry case, croissants, and flowering window boxes.
  r('#47676c',px-2,py-5,19,14,f);r('#b9e1d4',px-1,py-4,17,1,f);
  for(let i=0;i<3;i++){r('#a76538',px+i*5,py+2,4,3,f);r('#f6c277',px+1+i*5,py+1,3,1,f);}
  r('#d6eee0',px+1,py-3,1,8,f);
  for(let i=0;i<5;i++){const xx=12+i*20;r('#65856a',xx,46,10,3);r('#f2a0c2',xx+2,44,3,3);r('#ffe5cd',xx+3,45,1,1);}
 }else if(style==='thai'){
  // Woven herb basket and a brass wok suspended from a bracket.
  r('#b68b51',px,py,15,11,f);for(let i=0;i<4;i++)r('#e0bd7a',px+1+i*4,py,1,10,f);
  for(let i=0;i<4;i++){r('#638c4b',px+2+i*3,py-5-i%2*3,2,8,f);r('#b6c870',px+2+i*3,py-5-i%2*3,1,3,f);}
  r('#40383e',p.doorX,dy-18,16,2);r('#d3b475',p.doorX+5,dy-16,9,5);r('#7c6850',p.doorX+7,dy-11,5,2);
 }else if(style==='pearl'){
  // Stacked bamboo steamers and a jade tea urn.
  for(let i=0;i<3;i++){r('#b38d54',px,py-3+i*4,17,4,f);r('#f0cf8c',px+1,py-3+i*4,15,1,f);for(let k=0;k<4;k++)r('#73583b',px+3+k*4,py-1+i*4,1,1,f);}
  r('#7bb6a0',bx+p.bay-10,by+19,7,8);r('#c5e7ce',bx+p.bay-9,by+18,5,2);
 }else if(style==='ember'){
  // Riveted iron charcoal bin, logs and copper exhaust flue.
  r('#343640',px,py-4,16,15,f);r('#8e9291',px,py-4,16,1,f);
  for(let i=0;i<3;i++){r('#70513c',px+2,py+i*3,12,2,f);r('#c29165',px+3,py+i*3,2,2,f);}
  for(let i=0;i<3;i++)r('#b4a9a0',px+1+i*6,py+9,1,1,f);
 }else if(style==='tide'){
  // Ice crate, silver fish and coiled dock rope.
  r('#648e9a',px-2,py,19,11,f);r('#d2e5df',px-1,py,17,2,f);
  for(let i=0;i<3;i++){r('#c3dedf',px+i*5,py+4,4,2,f);r('#5b9fae',px+i*5,py+4,2,1,f);}
  for(let i=0;i<3;i++){r('#b4a172',p.doorX+i*2,dy-12+i*2,14-i*4,1);r('#e7d5a7',p.doorX+i*2,dy-8-i*2,14-i*4,1);}
 }else{
  // Indigo split noren, pale hinoki serving board and soy bottles.
  for(let i=0;i<3;i++){r('#344769',p.doorX+i*6,dy-17,5,12);r('#b4c9cf',p.doorX+2+i*6,dy-14,1,5);}
  r('#e1c898',px-1,py+4,18,3,f);for(let i=0;i<3;i++){r('#f1e1bd',px+i*5,py+1,4,3,f);r('#dd8d79',px+i*5,py,4,2,f);}
 }
 // Enrich the foreground plants and stools with leaf clusters, highlights and feet.
 for(const xx of [4,w-12])for(let k=0;k<9;k++){const px=xx+(noise(xx,k)%9),py=h-16-(noise(k,xx)%12);r('#1f413e',px,py,3,3,f);r('#59886a',px,py,2,1,f);r('#9aa276',px+1,py,1,1,f);}
 for(let k=0;k<2+p.variant;k++){const xx=bx+3+k*13;if(xx>w-12)break;r('#9c6a48',xx+1,h-9,8,2,f);r('#181f30',xx+2,h-7,1,6,f);r('#88837a',xx+3,h-7,1,4,f);r('#151e2c',xx,h-2,8,2,f);}
 if(p.concept===2)for(const xx of [20,w-29]){r('#192634',xx,h-13,11,11,f);r('#71818a',xx+2,h-11,7,7,f);r('#273c4d',xx+4,h-9,3,3,f);}
 // Deterministic one-pixel patina; keep contours and source transparency intact.
 for(const ctx of [g,f]){const pixels=ctx.getImageData(0,0,w,h),d=pixels.data;
  for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){const at=(yy*w+xx)*4;if(!d[at+3])continue;const v=noise(xx,yy);if(v%4!==0)continue;const delta=(v%13)-6;for(let ch=0;ch<3;ch++)d[at+ch]=Math.max(0,Math.min(255,d[at+ch]+delta));}
  ctx.putImageData(pixels,0,0);
 }
 const glow=document.createElement('canvas');glow.width=w+32;glow.height=h+32;const glowCtx=glow.getContext('2d')!;
 const halo=(xx:number,yy:number,radius:number,color:string)=>{const q=glowCtx.createRadialGradient(xx+16,yy+16,1,xx+16,yy+16,radius);q.addColorStop(0,color);q.addColorStop(1,'#00000000');glowCtx.fillStyle=q;glowCtx.fillRect(0,0,w+32,h+32);};
 halo(p.signX+24,p.signY+16,40,warm?'#ff855760':style==='cafe'||style==='pearl'?'#ff89df60':'#68fff160');
 halo(12,by+8,24,'#ffd18c70');halo(w-11,by+8,24,'#ffd18c65');halo(bx+p.bay/2,by+18,34,'#ffb95a25');
 p.center=bx+p.bay/2;p.windowY=by;
 return {rear,front,glow,plan:p};
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
 // Different sign structures: suspended board, offset cantilever, or tiled totem.
 c.fillStyle='#3b3045';
 if(p.signMount===0){c.fillRect(p.signX+6,p.signY-4,2,7);c.fillRect(p.signX+40,p.signY-4,2,7);}
 else if(p.signMount===1){c.fillRect(p.signX-4,p.signY+4,3,40);c.fillRect(p.signX-4,p.signY+4,54,3);c.fillStyle='#c2a074';c.fillRect(p.signX-3,p.signY+5,52,1);}
 else{c.fillRect(p.signX+4,p.signY-3,40,41);c.fillStyle='#aa9482';c.fillRect(p.signX+5,p.signY+33,38,2);for(let i=0;i<8;i++)if((p.seed>>>i)&1)c.fillRect(p.signX+7+i*4,p.signY+36,2,2);}
 const signFrame=time%3.7>3.55?48:0;
 if(p.signMount===0)c.drawImage(sign,signFrame,0,48,32,p.signX,p.signY,48,32);
 else if(p.signMount===1){
  const sx=p.signX+12,sy=p.signY-2;
  c.fillStyle='#262239';c.fillRect(sx,sy,25,46);c.fillStyle='#f0bb7f';c.fillRect(sx,sy,25,1);c.fillRect(sx,sy+45,25,1);
  c.drawImage(sign,signFrame,0,48,32,sx+1,sy+3,24,16);
  c.fillStyle='#9ef1e3';c.font='bold 8px monospace';c.textAlign='center';
  const initials=name.split(/[^a-z0-9]+/i).filter(Boolean).slice(0,2).map(word=>word[0]).join('');
  c.fillText(initials,sx+12,sy+31,21);
  for(let i=0;i<6;i++)if((p.seed>>>i)&1)c.fillRect(sx+3+i*3,sy+37,2,2);
 }else{
  const sx=Math.min(w-61,Math.max(1,p.signX-5)),sy=p.signY+6;
  c.fillStyle='#283c43';c.fillRect(sx,sy,60,24);c.fillStyle='#93e0ce';c.fillRect(sx+2,sy+1,56,1);c.fillRect(sx+2,sy+22,56,1);
  c.drawImage(sign,signFrame,0,48,32,sx+2,sy+4,24,16);
  c.fillStyle='#ffe6a7';c.font='bold 6px monospace';c.textAlign='center';
  c.fillText(name.split(' ')[0],sx+43,sy+11,30);c.fillText(name.split(' ').slice(1).join(' ')||'KITCHEN',sx+43,sy+18,30);
 }
 c.save();c.globalCompositeOperation='screen';c.drawImage(art.glow,-16,-16);c.restore();
 c.restore();
}
