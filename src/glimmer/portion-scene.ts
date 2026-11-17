import { Group, Mesh, PlaneGeometry, MeshBasicMaterial, Texture, SRGBColorSpace, DoubleSide } from '@iwsdk/core';
import type { MarketDish } from './catalogue';
import { portionScale } from './portion-preview';
import { loadPortionImages } from './portion-images';
export async function flatPortion(dish:MarketDish,signal:AbortSignal){
 const group=new Group(),textures:Texture[]=[],geometry:PlaneGeometry[]=[],materials:MeshBasicMaterial[]=[];
 const dispose=()=>{textures.forEach(t=>t.dispose());geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());group.clear();};
 let measured=false,layered=false,label='Approximate 2.5D preview · not actual size';
 try{
  const loaded=await loadPortionImages(dish,signal),images=loaded.images;layered=loaded.layered;
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
