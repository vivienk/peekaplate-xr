import { Group, Mesh, PlaneGeometry, MeshBasicMaterial, Texture, SRGBColorSpace, DoubleSide } from '@iwsdk/core';
import type { MarketDish } from './catalogue';
import { readPortionLayer, portionScale } from './portion-preview';
function decode(url:string,signal:AbortSignal):Promise<HTMLImageElement>{
 return new Promise((resolve,reject)=>{const image=new Image();image.crossOrigin='anonymous';
  const cleanup=()=>{image.onload=null;image.onerror=null;signal.removeEventListener('abort',abort);};
  const abort=()=>{cleanup();image.src='';reject(signal.reason);};
  image.onload=()=>{cleanup();resolve(image);};image.onerror=()=>{cleanup();reject(new Error('Photo unavailable'));};
  if(signal.aborted){abort();return;}signal.addEventListener('abort',abort,{once:true});image.src=url;
 });
}
export async function flatPortion(dish:MarketDish,signal:AbortSignal){
 const group=new Group(),textures:Texture[]=[],geometry:PlaneGeometry[]=[],materials:MeshBasicMaterial[]=[];
 const dispose=()=>{textures.forEach(t=>t.dispose());geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());group.clear();};
 let measured=false,layered=false,label='Approximate 2.5D preview · not actual size';
 try{
  const images:{image:HTMLImageElement;depth:number}[]=[];
  if(dish.portion){
   try{
    for(const layer of [...dish.portion.layers].sort((a,b)=>a.depth-b.depth)){
     const bytes=await readPortionLayer(layer,signal,dish.venueId==='diner-demo:ember-stone');
     const url=URL.createObjectURL(new Blob([bytes],{type:layer.url.endsWith('.svg')?'image/svg+xml':''}));
     try{const image=await decode(url,signal);if(image.naturalWidth!==dish.portion.width||image.naturalHeight!==dish.portion.height)throw new Error('Layer dimensions mismatch');if(layer.depth>0)images.push({image,depth:layer.depth});}finally{URL.revokeObjectURL(url);}
    }
    layered=true;
   }catch{signal.throwIfAborted();images.length=0;}
  }
  if(!layered)images.push({image:await decode(dish.image,signal),depth:0});
  signal.throwIfAborted();
  const scale=portionScale(layered?dish:{...dish,portion:undefined});measured=scale.measured;
  if(measured)label=scale.label;else if(!layered)label='Approximate photo preview · not actual size';
  for(const {image,depth}of images){
   const texture=new Texture(image);texture.colorSpace=SRGBColorSpace;texture.needsUpdate=true;textures.push(texture);
   const w=scale.width,h=measured?scale.depth:w*image.naturalHeight/image.naturalWidth;
   const geom=new PlaneGeometry(w,h);geometry.push(geom);
   const material=new MeshBasicMaterial({map:texture,transparent:true,side:DoubleSide,depthWrite:false,toneMapped:false});materials.push(material);
   const plane=new Mesh(geom,material);plane.rotation.x=-Math.PI/2;plane.position.set(scale.offsetX,depth*.001,scale.offsetZ);group.add(plane);
  }
  return {group,dispose,measured,label};
 }catch(error){dispose();throw error;}
}
