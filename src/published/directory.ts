import { z } from 'zod';
import type { PublicMenuContentBundle } from './contracts';

const Page=z.strictObject({schemaVersion:z.literal(1),restaurants:z.array(z.strictObject({venueId:z.uuid(),menuId:z.uuid()})).max(64),nextCursor:z.uuid().nullable()});
export async function discoverRestaurants(origin:string,fetcher=fetch){
 const base=new URL(origin);
 if(base.protocol!=='https:'||base.username||base.password||base.pathname!=='/'||base.search||base.hash)throw new Error('Invalid API origin');
 const response=await fetcher(`${base.origin}/public/restaurants`,{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error('Restaurant directory unavailable');
 const page=Page.parse(await response.json());
 if(new Set(page.restaurants.map(r=>r.venueId)).size!==page.restaurants.length)throw new Error('Duplicate restaurant');
 return page;
}
/** Presentation only: never claim inferred cuisine as a restaurant-provided fact. */
export function storefrontStyle(content:PublicMenuContentBundle){
 const text=[content.restaurant.name,...content.categories.flatMap(c=>[c.name,...c.dishes.flatMap(d=>d.complete?[d.name]:[])])].join(' ').toLowerCase();
 if(/ramen|udon|soba/.test(text))return 'ramen';
 if(/thai|pad thai|tom yum/.test(text))return 'thai';
 if(/sushi|sashimi|japanese/.test(text))return 'kaigan';
 if(/seafood|oyster|fish/.test(text))return 'tide';
 if(/barbecue|bbq|grill|steak/.test(text))return 'ember';
 if(/boba|bubble tea|dumpling|dim sum/.test(text))return 'pearl';
 return 'cafe';
}
