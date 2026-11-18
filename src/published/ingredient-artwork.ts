import { z } from 'zod';
// Public-only snapshot of PeekaPlate #165; artwork never changes published food facts.
export const artworkLabel=(value:string)=>value.normalize('NFKC').trim().toLowerCase().replace(/\s+/gu,' ');
const Label=z.string().min(1).max(120).regex(/^[\p{L} '-]+$/u).refine(v=>artworkLabel(v)===v);
export const PublicArtworkSchema=z.strictObject({schemaVersion:z.literal(1),icons:z.array(z.strictObject({label:Label,version:z.number().int().positive(),status:z.literal('approved'),sha256:z.string().regex(/^[a-f0-9]{64}$/)})).max(100)});
export interface ArtworkScope {apiBase:string;venueId:string;labels:string[]}
export async function approvedIngredientArtwork(scope:ArtworkScope,signal:AbortSignal,fetcher=fetch){
 const base=new URL(scope.apiBase);if(base.protocol!=='https:'||base.username||base.password||base.pathname!=='/'||base.search||base.hash)throw new Error('Invalid artwork origin');
 const venue=z.uuid().parse(scope.venueId),endpoint=`${base.origin}/public/venues/${venue}/ingredient-icons`;
 const labels=[...new Set(scope.labels.map(artworkLabel).filter(v=>Label.safeParse(v).success))];
 const icons=new Map<string,{url:string;sha256:string}>();
 for(let start=0;start<labels.length;start+=20){
  const batch=labels.slice(start,start+20),query=new URLSearchParams(batch.map(label=>['label',label]));
  const response=await fetcher(`${endpoint}?${query}`,{credentials:'omit',cache:'no-store',signal});
  if(!response.ok)throw new Error('Artwork unavailable');const text=await response.text();if(text.length>32768)throw new Error('Artwork response too large');
  for(const art of PublicArtworkSchema.parse(JSON.parse(text)).icons){
   if(!batch.includes(art.label)||icons.has(art.label))throw new Error('Artwork identity mismatch');
   icons.set(art.label,{url:`${endpoint}/image?${new URLSearchParams({label:art.label,sha256:art.sha256})}`,sha256:art.sha256});
  }
 }
 return icons;
}
/** Sequential polling; exiting a detail aborts in-flight work and suppresses late results. */
export function watchIngredientArtwork(scope:ArtworkScope,onResult:(icons:Awaited<ReturnType<typeof approvedIngredientArtwork>>,signal:AbortSignal)=>Promise<void>|void,fetcher=fetch){
 let stopped=false,timer:ReturnType<typeof setTimeout>|undefined,controller:AbortController|undefined;
 const refresh=async()=>{const current=new AbortController();controller=current;const timeout=setTimeout(()=>current.abort(),8000);
  try{const icons=await approvedIngredientArtwork(scope,current.signal,fetcher);if(!stopped&&!current.signal.aborted)await onResult(icons,current.signal);}
  catch{if(!stopped)await onResult(new Map(),current.signal);}
  finally{clearTimeout(timeout);if(!stopped)timer=setTimeout(refresh,30000);}
 };
 if(scope.labels.length)void refresh();return()=>{stopped=true;controller?.abort();clearTimeout(timer);};
}
