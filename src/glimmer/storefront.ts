/** Generated variants use the supplied layered cuisine art, never a generic facade. */
export function storefrontSeed(id:string) { let n=2166136261;for(const ch of id)n=Math.imul(n^ch.charCodeAt(0),16777619);return n>>>0; }
const variants=new Map<string,HTMLCanvasElement>();
const layout:Record<string,number[]>={ramen:[8,-38,0,-96,.18],cafe:[24,-48,0,-112,.2],thai:[-2,-38,26,-80,.12],pearl:[4,-38,0,-96,.18],ember:[8,-40,0,-80,.14],tide:[-8,-20,0,-60,.2],kaigan:[2,-24,0,-64,.16]};
/** Preserve source luminance/texture, replacing only saturated pink/red trim pixels. */
function variant(image:HTMLImageElement,id:string,part:string){
 const key=`${id}:${part}`;let result=variants.get(key);if(result)return result;
 result=document.createElement('canvas');result.width=image.naturalWidth;result.height=image.naturalHeight;
 const c=result.getContext('2d')!;c.drawImage(image,0,0);
 const pixels=c.getImageData(0,0,result.width,result.height),p=pixels.data,seed=storefrontSeed(id);
 const palettes=[[1,.66,.34],[.48,.85,1],[.83,.48,1],[.4,1,.76],[1,.5,.56],[.95,.83,.43]];
 const tint=palettes[seed%palettes.length];
 for(let i=0;i<p.length;i+=4){
  if(p[i+3]&&p[i]>p[i+1]*1.35&&p[i]>p[i+2]*1.1&&p[i]>65){
   const high=p[i],low=Math.min(p[i+1],p[i+2]);
   for(let j=0;j<3;j++)p[i+j]=Math.round(low+(high-low)*tint[j]);
  }
 }
 c.putImageData(pixels,0,0);variants.set(key,result);return result;
}
export function drawStorefront(c:CanvasRenderingContext2D,id:string,name:string,x:number,y:number,w:number,h:number,time:number,style:string,back?:HTMLImageElement,front?:HTMLImageElement,sign?:HTMLImageElement,chef?:HTMLImageElement){
 if(!back||!front||!sign||!chef)return;
 const spec=layout[style]??layout.cafe,seed=storefrontSeed(id);
 c.save();c.imageSmoothingEnabled=false;c.translate(Math.round(x),Math.round(y));
 const rear=variant(back,id,`${style}-back`),face=variant(front,id,`${style}-front`);
 c.drawImage(rear,-rear.width/2,-rear.height);
 c.drawImage(chef,Math.floor(time/spec[4])%4*24,0,24,24,spec[0]-12,spec[1]-24,24,24);
 c.drawImage(face,-face.width/2,-face.height);
 // Retain each cuisine's distinct animated neon emblem and its original position.
 c.drawImage(sign,time%3.7>3.55?48:0,0,48,32,spec[2]-24,spec[3]-32,48,32);
 const rect=(color:string,a:number,b:number,d:number,e:number)=>{c.fillStyle=color;c.fillRect(a,b,d,e);};
 // Individual nameplate and inlaid pixel pattern, integrated into the counter.
 const plaqueY=style==='cafe'?-47:style==='tide'?-20:-30;
 const plaqueX=style==='cafe'?-2:-31;
 rect('#211c30',plaqueX,plaqueY,63,12);rect('#bd9564',plaqueX,plaqueY,63,1);rect('#705040',plaqueX,plaqueY+11,63,1);
 c.fillStyle='#fff0ca';c.font='bold 6px monospace';c.textAlign='center';
 c.fillText(name,plaqueX+31,plaqueY+8,59);
 // Venue-specific tiled border retains the hand-drawn facade beneath it.
 for(let i=0;i<16;i++)if((seed>>>i)&1)rect('#aee4d0',plaqueX+i*4,plaqueY+10,2,1);
 // Cuisine-specific extra fittings, kept inside the original footprint.
 if(style==='ember'){
  rect('#322e3d',-w/2+5,-h+5,10,24);rect('#94808c',-w/2+3,-h+4,14,3);
  for(let row=0;row<4;row++)rect('#675766',-w/2+6,-h+10+row*5,8,1);
  rect('#211b29',-35,-50,18,15);rect('#a47153',-36,-51,20,2);
  for(let i=0;i<4;i++){const flame=3+(Math.floor(time*8)+i*3)%7;rect('#ed6938',-33+i*4,-36-flame,3,flame);rect('#ffe5a2',-32+i*4,-39,1,3);}
 }else if(style==='tide'){
  rect('#8baab6',-49,-20,12,8);rect('#d4e4d8',-48,-20,10,2);
  for(let i=0;i<3;i++)rect('#6ac5c2',-47+i*3,-16,2,1);
 }else if(style==='cafe'){
  for(let i=0;i<3;i++){rect('#ad704b',-8+i*8,-53,6,3);rect('#f0bd7a',-7+i*8,-55,4,2);}
 }else if(style==='ramen'||style==='thai'){
  rect('#c8d7cc',-30,-37,12,2);rect('#847c6e',-28,-35,8,3);
  rect('#e3bd7e',-23,-44,1,8);rect('#e3bd7e',-20,-44,1,8);
 }else if(style==='pearl'){
  for(let i=0;i<3;i++){rect('#d9ae91',-30+i*7,-35,5,7);rect('#98e4ce',-28+i*7,-38,1,6);}
 }else{
  rect('#355b62',-28,-30,23,5);for(let i=0;i<3;i++){rect('#f4e6ba',-26+i*7,-32,5,3);rect('#e5907d',-26+i*7,-33,5,1);}
 }
 c.restore();
}
