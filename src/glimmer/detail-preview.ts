import type { MarketDish } from './catalogue';
import { loadPortionImages,decodePortionImage } from './portion-images';
/** PR162 presentation: perspective(900px), bounded ±3° tilt, 5px/3px foreground travel. */
export class DetailPreview {
 readonly element=document.createElement('div');private card=document.createElement('div');
 private abort:AbortController|null=null;private key='';private original=false;private reduced=false;private layers:HTMLImageElement[]=[];private photo:HTMLImageElement|null=null;private x=0;private y=0;
 status='';
 visualRevision=0;
 private lastTiltX=NaN;private lastTiltY=NaN;
 constructor(private changed:()=>void){
  this.element.tabIndex=0;this.element.setAttribute('role','img');this.element.setAttribute('aria-label','Dish preview. Move pointer or drag to tilt; arrow keys adjust; Home resets.');
  this.element.style.cssText='display:none;position:fixed;z-index:10;outline-offset:2px;touch-action:pan-y;overflow:hidden;background:#1f222a;';
  this.card.style.cssText='position:absolute;inset:10px;transform-style:preserve-3d;';this.element.append(this.card);document.body.append(this.element);
  this.element.addEventListener('pointermove',e=>{const b=this.element.getBoundingClientRect();this.move((e.clientX-b.left)/b.width*2-1,(e.clientY-b.top)/b.height*2-1);});
  this.element.addEventListener('pointerleave',()=>this.reset());
  this.element.addEventListener('pointerdown',e=>{this.element.focus({preventScroll:true});if(e.pointerType==='touch')this.element.setPointerCapture(e.pointerId);});
  this.element.addEventListener('keydown',e=>{let x=this.x,y=this.y;if(e.key==='Home')x=y=0;else if(e.key==='ArrowLeft')x-=1/6;else if(e.key==='ArrowRight')x+=1/6;else if(e.key==='ArrowUp')y-=1/6;else if(e.key==='ArrowDown')y+=1/6;else return;e.preventDefault();e.stopPropagation();this.move(x,y);});
 }
 private move(x:number,y:number){this.x=Math.max(-1,Math.min(1,x));this.y=Math.max(-1,Math.min(1,y));const nx=this.original||this.reduced?0:this.x,ny=this.original||this.reduced?0:this.y;
  if((nx!==this.lastTiltX||ny!==this.lastTiltY)&&this.element.style.display!=='none')this.visualRevision++;
  this.lastTiltX=nx;this.lastTiltY=ny;
  this.card.style.transform=`perspective(900px) rotateX(${-ny*3}deg) rotateY(${nx*3}deg)`;for(const img of this.layers)img.style.transform=`translate(${nx*5}px,${ny*3}px)`;
 }
 reset(){this.move(0,0);}
 hide(){this.element.style.display='none';}
 retry(){this.key='';this.abort?.abort();}
 show(d:MarketDish,original:boolean,reduced:boolean,immersive:boolean,rect={x:126,y:190,w:336,h:272}){
  if(immersive){this.hide();return;}this.original=original;this.reduced=reduced;
  const scale=Math.min(innerWidth/1280,innerHeight/720)/1.04;
  Object.assign(this.element.style,{display:'block',left:`${(innerWidth-1280*scale)/2+rect.x*scale}px`,top:`${(innerHeight-720*scale)/2+rect.y*scale}px`,width:`${rect.w*scale}px`,height:`${rect.h*scale}px`});
  const key=d.id+'|'+d.image+'|'+(d.portion?.layers.map(l=>l.sha256).join()??'');
  if(key!==this.key){this.abort?.abort();this.key=key;this.layers=[];this.photo=null;this.card.replaceChildren();this.reset();this.status='Loading preview…';const abort=new AbortController();this.abort=abort;
   void Promise.allSettled([loadPortionImages(d,AbortSignal.any([abort.signal,AbortSignal.timeout(15000)])),decodePortionImage(d.image,AbortSignal.any([abort.signal,AbortSignal.timeout(15000)]))]).then(([preview,photo])=>{
    if(abort.signal.aborted)return;this.photo=photo.status==='fulfilled'?photo.value:null;this.layers=preview.status==='fulfilled'?preview.value.images.map(l=>l.image):(this.photo?[this.photo]:[]);this.status=preview.status==='fulfilled'&&preview.value.layered?'2.5D preview':this.layers.length?'Original photo fallback':'Preview unavailable · Retry';this.paint();this.changed();
   }).catch(()=>{if(!abort.signal.aborted){this.status='Preview unavailable · Retry';this.changed();}});
  }
  this.paint();
 }
 private paint(){const images=this.original?(this.photo?[this.photo]:this.layers):this.layers;
  if(this.card.firstChild!==images[0]||this.card.childNodes.length!==images.length){this.card.replaceChildren(...images);for(const img of images){img.draggable=false;img.style.cssText='position:absolute;width:100%;height:100%;object-fit:contain;inset:0;filter:drop-shadow(0 10px 5px #54391c33);';}}
  this.move(this.x,this.y);
 }
 dispose(){this.abort?.abort();this.element.remove();}
}
