import type { MarketDish } from './catalogue';
import { STANDARD_PLATE_METRES } from './standard-plate';
import type { PublicPortion } from '../published/portion';
import prepared from './generated-portions.json';
import restaurantPortions from './restaurant-portions.json';
import illustrations from './illustrative-portions.json';
const bundledLayers=new Map([...Object.values(prepared),...Object.values(restaurantPortions),...Object.values(illustrations)].flatMap(d=>d.portion.layers.map(layer=>[layer.url,layer] as const)));
export interface PortionScale { measured:boolean; width:number; depth:number; offsetX:number; offsetZ:number; label:string }
export function portionScale(dish:MarketDish):PortionScale {
 const p=dish.portion,size=p?.physical_size;
 const valid=size&&Number.isInteger(dish.servingCount)&&dish.servingCount===size.serving_count;
 if(!valid)return {measured:false,width:STANDARD_PLATE_METRES,depth:STANDARD_PLATE_METRES,offsetX:0,offsetZ:0,label:'27 cm dinner-plate reference · estimated dish size'};
 const plate=size.plate,b=plate.boundary,w=plate.width_mm/1000/b.width,h=plate.depth_mm/1000/b.height;
 return {measured:true,width:w,depth:h,offsetX:(.5-b.x-b.width/2)*w,offsetZ:(.5-b.y-b.height/2)*h,
  label:`Owner plate: ${plate.width_mm/10} × ${plate.depth_mm/10} cm · serves ${dish.servingCount} · device validation pending`};
}
export async function readPortionLayer(layer:PublicPortion['layers'][number],signal:AbortSignal,demo=false,fetcher=fetch){
 let url=layer.url,bundled=false;
 const local=bundledLayers.get(url);
 if(local&&local.sha256===layer.sha256&&local.size_bytes===layer.size_bytes){url=`${import.meta.env.BASE_URL}${url.startsWith('https://illustrative-portions.invalid/')?'illustrative-portions/':url.startsWith('https://restaurant-portions.invalid/')?'restaurant-portions/':'game-portions/'}${url.replace(/^https:\/\/[^/]+\//,'')}`;bundled=true;}
 if(demo&&url.startsWith('https://portion-fixtures.invalid/')){
  const file=url.slice('https://portion-fixtures.invalid/'.length);
  if(!/^[a-z-]+\.(webp|svg)$/.test(file))throw new Error('Invalid demo layer');
  url=`${import.meta.env.BASE_URL}diner-demo/${file}`;bundled=true;
 }
 const response=await fetcher(url,{signal,credentials:bundled?'same-origin':'omit',redirect:'error',cache:'no-cache'});
 if(!response.ok||!response.body)throw new Error('Layer unavailable');
 const reader=response.body.getReader(),bytes=new Uint8Array(layer.size_bytes);let length=0;
 try{while(true){const chunk=await reader.read();if(chunk.done)break;length+=chunk.value.length;if(length>bytes.length)throw new Error('Layer exceeds budget');bytes.set(chunk.value,length-chunk.value.length);}}finally{await reader.cancel();}
 if(length!==bytes.length)throw new Error('Layer size mismatch');
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
 if(digest!==layer.sha256)throw new Error('Layer hash mismatch');signal.throwIfAborted();return bytes;
}
