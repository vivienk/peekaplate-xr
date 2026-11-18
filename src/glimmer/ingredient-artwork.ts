import { artworkLabel, watchIngredientArtwork, type ArtworkScope } from '../published/ingredient-artwork';
import { sha256 } from '../published/contracts';
const bundled=import.meta.glob<string>('./ingredient-assets/*.svg',{eager:true,query:'?url',import:'default'});
export function ingredientIcon(name:string):string|null{
 const key=artworkLabel(name).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 // PR165's house-sauce export is text-only; use an explicit decorative replacement.
 const assetKey=key==='house-sauce'?'house-sauce-illustration':key;
 return bundled[`./ingredient-assets/${assetKey}.svg`]??null;
}
/** Draw approved decoration or the exact bundled icon; unknown food remains text-only. */
export class IngredientArtwork {
 private key='';private stop?:()=>void;private generation=0;
 private live=new Map<string,ImageBitmap>();private fallback=new Map<string,HTMLImageElement>();
 constructor(private invalidate:()=>void){}
 sync(scope:ArtworkScope|null,identity:string){
  const key=JSON.stringify([identity,scope]);if(key===this.key)return;this.clear();this.key=key;
  if(!scope)return;const generation=this.generation;
  this.stop=watchIngredientArtwork(scope,async(icons,signal)=>{
   this.release();this.invalidate();const loaded=new Map<string,ImageBitmap>();
   try{for(const [label,art]of icons){
    const response=await fetch(art.url,{credentials:'omit',cache:'no-store',signal});if(!response.ok)continue;
    const bytes=new Uint8Array(await response.arrayBuffer());if(bytes.length>1000000||await sha256(bytes)!==art.sha256)continue;
    const bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'}));
    if(bitmap.width>4096||bitmap.height>4096){bitmap.close();continue;}loaded.set(label,bitmap);
   }}catch{for(const image of loaded.values())image.close();loaded.clear();/* Approval unavailable: clear all remote art. */}
   if(generation!==this.generation||signal.aborted){for(const image of loaded.values())image.close();return;}
   this.live=loaded;this.invalidate();
  });
 }
 private release(){for(const image of this.live.values())image.close();this.live.clear();}
 clear(){this.generation++;this.stop?.();this.stop=undefined;this.key='';this.release();}
 draw(c:CanvasRenderingContext2D,label:string,x:number,y:number,size:number){
  let image:ImageBitmap|HTMLImageElement|undefined=this.live.get(artworkLabel(label));
  if(!image){const url=ingredientIcon(label);if(!url)return false;let fallback=this.fallback.get(url);
   if(!fallback){fallback=new Image();fallback.onload=()=>this.invalidate();fallback.onerror=()=>this.invalidate();fallback.src=url;this.fallback.set(url,fallback);}
   if(!fallback.complete||!fallback.naturalWidth)return false;image=fallback;
  }
  const width=image instanceof HTMLImageElement?image.naturalWidth:image.width,height=image instanceof HTMLImageElement?image.naturalHeight:image.height,scale=Math.min(size/width,size/height);
  c.save();c.drawImage(image,x+(size-width*scale)/2,y+(size-height*scale)/2,width*scale,height*scale);c.restore();return true;
 }
 dispose(){this.clear();for(const image of this.fallback.values()){image.onload=null;image.onerror=null;}this.fallback.clear();}
}
