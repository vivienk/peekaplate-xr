import type { MarketDish } from './catalogue';
import { readPortionLayer } from './portion-preview';
export function decodePortionImage(url:string,signal:AbortSignal):Promise<HTMLImageElement>{
 return new Promise((resolve,reject)=>{const image=new Image();image.crossOrigin='anonymous';
  const cleanup=()=>{image.onload=null;image.onerror=null;signal.removeEventListener('abort',abort);};
  const abort=()=>{cleanup();image.src='';reject(signal.reason);};
  image.onload=()=>{cleanup();resolve(image);};image.onerror=()=>{cleanup();reject(new Error('Photo unavailable'));};
  if(signal.aborted){abort();return;}signal.addEventListener('abort',abort,{once:true});image.src=url;
 });
}
/** Decode only exact, bounded published/bundled layer bytes. Never trust a URL as proof of 2.5D. */
export async function loadPortionImages(dish:MarketDish,signal:AbortSignal){
 const images:{image:HTMLImageElement;depth:number}[]=[];
 if(dish.portion){
  try{
   for(const layer of [...dish.portion.layers].sort((a,b)=>a.depth-b.depth)){
    const bytes=await readPortionLayer(layer,signal,dish.venueId==='diner-demo:ember-stone');
    const url=URL.createObjectURL(new Blob([bytes],{type:layer.url.endsWith('.svg')?'image/svg+xml':''}));
    try{const image=await decodePortionImage(url,signal);if(image.naturalWidth!==dish.portion.width||image.naturalHeight!==dish.portion.height)throw new Error('Layer dimensions mismatch');if(layer.depth>0)images.push({image,depth:layer.depth});}finally{URL.revokeObjectURL(url);}
   }
   return {images,layered:true};
  }catch{signal.throwIfAborted();images.length=0;}
 }
 images.push({image:await decodePortionImage(dish.image,signal),depth:0});return {images,layered:false};
}
