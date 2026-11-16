import { z } from 'zod';
import { loadPublishedMenu } from './client';
import { districts, type District, type MapObject } from '../glimmer/data';
import type { PublicMenuContentBundle } from './contracts';
const styles=['ramen','cafe','thai','pearl','ember','tide','kaigan'] as const;
export const Registry=z.object({apiOrigin:z.union([z.literal(''),z.url()]),restaurants:z.array(z.object({venueId:z.uuid(),menuId:z.uuid(),district:z.enum(['d1-rain-alley','d2-lantern-steps','d3-fogline-pier']),style:z.enum(styles)})).max(64)}).superRefine((r,c)=>{const ids=r.restaurants.map(x=>x.venueId);if(new Set(ids).size!==ids.length)c.addIssue({code:'custom',message:'Duplicate restaurant'});});
export type Entry=z.infer<typeof Registry>['restaurants'][number];
export interface LiveRestaurant { id:string; entry:Entry; name:string; content:PublicMenuContentBundle|null; expiresAt:number; available:boolean; enabled:boolean }
export const liveRestaurants=new Map<string,LiveRestaurant>();
export let connectionStatus='Published menus are not connected';
let origin='';let refreshing=false;const requests=new Map<string,number>();
const liveId=(e:Entry)=>`published:${e.venueId}`;
/** Fill an unused facade beside an existing shop; otherwise append a connected east block. */
export function placeRestaurant(d:District,id:string,style:typeof styles[number]):MapObject {
 const existing=d.objects.find(o=>o.id===id);if(existing)return existing;
 const shops=d.objects.filter(o=>o.kind==='restaurant'||o.kind==='published-restaurant');
 let pivot:number[]|undefined;
 for(const shop of shops)for(const dx of [12,-12]){
  const x=Math.floor(shop.pivot[0]+dx),y=Math.floor(shop.pivot[1]);
  if(x<6||x+6>=d.width_tiles||y<9||y+2>=d.height_tiles)continue;
  const clear=d.objects.every(o=>Math.abs(o.pivot[0]-x)>7||o.pivot[1]<y-9||o.pivot[1]>y+2);
  const facade=Array.from({length:8},(_,i)=>d.rows[y-8+i].slice(x-5,x+5)).every(r=>/^#+$/.test(r));
  if(clear&&facade&&d.rows[y+1].slice(x-4,x+5).split('').every(t=>t!=='#'&&t!=='~')){pivot=[x,y];break;}
 }
 if(!pivot){
  const oldWidth=d.width_tiles;
  let y=10,best=-1;
  for(let row=10;row<d.height_tiles-3;row++){const n=[...d.rows[row+1]].filter(t=>t!=='#'&&t!=='~').length;if(n>best){best=n;y=row;}}
  if(best<=0)throw new Error('No street connection available');
  d.width_tiles+=12;
  d.rows=d.rows.map((r,row)=>r+(row<y?'#'.repeat(12):'.'.repeat(12)));
  const road=y+1;let edge=oldWidth-1;while(edge>0&&['#','~'].includes(d.rows[road][edge]))edge--;
  d.rows[road]=d.rows[road].slice(0,edge+1)+'.'.repeat(d.width_tiles-edge-1);
  pivot=[oldWidth+6,y];
 }
 const object={id,kind:'published-restaurant',asset:`bld-${style}`,pivot};d.objects.push(object);return object;
}
export async function refreshRestaurants(fetcher=fetch):Promise<boolean>{
 if(refreshing)return false;refreshing=true;let layoutChanged=false;
 try{
  const response=await fetcher(`${import.meta.env.BASE_URL}market-restaurants.json`,{cache:'no-store',signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error('Registry unavailable');
  const registry=Registry.parse(await response.json());origin=registry.apiOrigin;
  for(const live of liveRestaurants.values()){live.available=false;live.content=null;live.enabled=false;}
  if(!origin||!registry.restaurants.length){connectionStatus='Published menus are not connected';return false;}
  for(const entry of registry.restaurants){
   const id=liveId(entry);let live=liveRestaurants.get(id);
   if(!live){live={id,entry,name:'Restaurant',content:null,expiresAt:0,available:false,enabled:true};liveRestaurants.set(id,live);layoutChanged=true;placeRestaurant(districts.find(d=>d.district===entry.district)!,id,entry.style);}
   live.entry=entry;live.enabled=true;try{await readRestaurant(id,fetcher);}catch{/* Closed storefront stays in place; no stale menu is shown. */}
  }
  connectionStatus=`${[...liveRestaurants.values()].filter(r=>r.available).length} published restaurants connected`;return layoutChanged;
 }catch{connectionStatus='Published menu connection unavailable';for(const live of liveRestaurants.values()){live.available=false;live.content=null;live.enabled=false;}return false;}
 finally{refreshing=false;}
}
export async function readRestaurant(id:string,fetcher=fetch){
 const live=liveRestaurants.get(id);if(!live||!live.enabled)throw new Error('Restaurant unavailable');const request=(requests.get(id)??0)+1;requests.set(id,request);
 live.content=null;live.available=false;
 const result=await loadPublishedMenu(origin,`/venues/${live.entry.venueId}/menus/${live.entry.menuId}`,fetcher);
 if(requests.get(id)!==request||!live.enabled)throw new Error('Menu refresh superseded');
 live.content=result.content;live.name=result.content.restaurant.name;live.expiresAt=result.expiresAt;live.available=true;return result.content;
}
