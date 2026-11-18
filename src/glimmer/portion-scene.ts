import { Group, Mesh, PlaneGeometry, RingGeometry, MeshBasicMaterial, Texture, SRGBColorSpace, DoubleSide, type BufferGeometry } from '@iwsdk/core';
import { cutoutBounds,standardPlateScale,STANDARD_PLATE_METRES } from './standard-plate';
import type { MarketDish } from './catalogue';
import { portionScale } from './portion-preview';
import { loadPortionImages } from './portion-images';
export async function flatPortion(dish:MarketDish,signal:AbortSignal){
 const group=new Group(),textures:Texture[]=[],geometry:BufferGeometry[]=[],materials:MeshBasicMaterial[]=[];
 const dispose=()=>{textures.forEach(t=>t.dispose());geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());group.clear();};
 let measured=false,layered=false,label='27 cm dinner-plate reference · estimated dish size';
 try{
  const loaded=await loadPortionImages(dish,signal),images=loaded.images;layered=loaded.layered;
  signal.throwIfAborted();
  let scale=portionScale(layered?dish:{...dish,portion:undefined});measured=scale.measured;
  if(measured)label=scale.label;else if(!layered)label=dish.illustrative?'Flat illustration · estimated size':'Approximate photo preview · not actual size';
  if(!measured&&layered&&images.length){
   const image=images[0].image,canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
   const c=canvas.getContext('2d')!;
   for(const layer of images)c.drawImage(layer.image,0,0,canvas.width,canvas.height);
   const bounds=cutoutBounds(c.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height);
   scale={...scale,...standardPlateScale(canvas.width,canvas.height,bounds)};
   const ringGeometry=new RingGeometry(STANDARD_PLATE_METRES/2-.001,STANDARD_PLATE_METRES/2,64);geometry.push(ringGeometry);
   const ringMaterial=new MeshBasicMaterial({color:0x67d4d1,side:DoubleSide,transparent:true,opacity:.7,depthWrite:false,toneMapped:false});materials.push(ringMaterial);
   const ring=new Mesh(ringGeometry,ringMaterial);ring.name='27 cm standard plate reference';ring.rotation.x=-Math.PI/2;ring.position.y=-.002;group.add(ring);
  }
  for(const {image,depth}of images){
   const texture=new Texture(image);texture.colorSpace=SRGBColorSpace;texture.needsUpdate=true;textures.push(texture);
   const w=scale.width,h=measured||layered?scale.depth:w*image.naturalHeight/image.naturalWidth;
   const geom=new PlaneGeometry(w,h);geometry.push(geom);
   const material=new MeshBasicMaterial({map:texture,transparent:true,side:DoubleSide,depthWrite:false,toneMapped:false});materials.push(material);
   const plane=new Mesh(geom,material);plane.rotation.x=-Math.PI/2;plane.position.set(scale.offsetX,depth*.001,scale.offsetZ);group.add(plane);
  }
  return {group,dispose,measured,label};
 }catch(error){dispose();throw error;}
}
