import { sampleDishDetails, demoPrice } from './dish-metadata';
import { dishes, restaurants } from './data';
import { liveRestaurants, type LiveRestaurant } from '../published/market';
import { PublicPortionSchema, type PublicPortion } from '../published/portion';
import prepared from './generated-portions.json';
import photos from './restaurant-photos.json';
import portions from './restaurant-portions.json';

export interface MarketDish {
  id:string; venueId:string; restaurant:string; name:string; category:string; description:string;
  price:string; ingredients:string[]; allergens:string[]|null; dietary:string[];
  photoCredit?:string; sourceUrl?:string; image:string; modelId?:string; sample:boolean; servingCount?:number; portion?:PublicPortion;
}
const originals:MarketDish[]=dishes.map(d=>{const photo=photos[d.id as keyof typeof photos],portion=portions[d.id as keyof typeof portions];return ({
  id:d.id, venueId:d.restaurantId, restaurant:restaurants.find(r=>r.id===d.restaurantId)!.name,
  name:d.name, category:sampleDishDetails[d.id].category,
  description:d.description,price:demoPrice(d.id), ingredients:d.ingredients,allergens:photo?null:d.allergens,
  dietary:photo?[]:[...(d.dietary.vegan?['Vegan']:[]),...(d.dietary.vegetarian?['Vegetarian']:[]),...(d.dietary.glutenFree?['Gluten-free']:[])],
  image:photo?`${import.meta.env.BASE_URL}${photo.photo}`:`${import.meta.env.BASE_URL}glimmer/${d.image}`,modelId:d.id,sample:true,
  photoCredit:photo?`${photo.sourceDish} · ${photo.note}`:undefined,sourceUrl:photo?.source,
  portion:PublicPortionSchema.parse(portion?.portion??prepared[d.id as keyof typeof prepared].portion),
});});

/** Always read the current publication; withdrawn/expired dishes never linger in search or comparison. */
export function marketCatalogue(live:Iterable<LiveRestaurant>=liveRestaurants.values(),now=Date.now()):MarketDish[]{
  const result=[...originals];
  for(const restaurant of live){
    if(!restaurant.enabled||!restaurant.available||!restaurant.content||restaurant.expiresAt<=now)continue;
    for(const category of restaurant.content.categories)for(const dish of category.dishes){
      if(!dish.complete)continue;
      const portion=PublicPortionSchema.safeParse(dish.portion);
      const validPortion=portion.success&&portion.data.dish_id===dish.dish_id&&portion.data.dish_revision_id===dish.dish_revision_id?portion.data:undefined;
      result.push({id:`${restaurant.id}/${dish.dish_id}`,venueId:restaurant.id,restaurant:restaurant.name,
        name:dish.name,category:category.name,description:dish.description,
        price:`${dish.price.currency} ${dish.price.amount}`,ingredients:dish.ingredients.map(i=>i.name),
        allergens:dish.allergens,dietary:dish.dietary,image:dish.images.detail.url,
        sample:!!restaurant.demo,servingCount:dish.serving_count,portion:validPortion});
    }
  }
  return result;
}
const words=(text:string)=>text.toLowerCase().normalize('NFKD').replace(/\p{M}/gu,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim().split(/\s+/);
export function searchDishes(list:MarketDish[],query:string,category='All'):MarketDish[]{
  const terms=words(query).filter(Boolean);
  return list.filter(d=>{if(category!=='All'&&words(d.category).join(' ')!==words(category).join(' '))return false;const haystack=words([d.name,d.restaurant,d.category,d.description,...d.ingredients].join(' ')).join(' ');return terms.every(t=>haystack.includes(t));});
}
export function similarDishes(list:MarketDish[],anchor:MarketDish):MarketDish[]{
  const tokens=new Set(words([anchor.name,...anchor.ingredients].join(' ')));
  const ingredients=new Set(anchor.ingredients.map(i=>words(i).join(' ')));
  const score=(d:MarketDish)=>Number(d.category.toLowerCase()===anchor.category.toLowerCase())*3+d.ingredients.filter(i=>ingredients.has(words(i).join(' '))).length*4+[...new Set(words([d.name,...d.ingredients].join(' ')))].filter(w=>w.length>2&&tokens.has(w)).length;
  return list.filter(d=>d.id!==anchor.id).map((dish,index)=>({dish,index,score:score(dish)})).sort((a,b)=>b.score-a.score||a.index-b.index).map(r=>r.dish);
}
export const allergenLabel=(d:MarketDish)=>d.allergens===null?'Allergen information unavailable':d.allergens.length?`Contains: ${d.allergens.join(', ')}`:'No allergens declared by restaurant';
