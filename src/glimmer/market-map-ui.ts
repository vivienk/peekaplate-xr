import type { GlimmerApp } from './app';
import { districts,restaurants } from './data';
import { liveRestaurants } from '../published/market';
import { districtIconNames } from './district-icons';
import { foodIcon } from './food-icons';
const ink='#321b15',cream='#f3e6c8';
export interface MapRestaurant {id:string;name:string;district:string;cuisine:string;emblem?:string;x:number;y:number}
export function mapRestaurants():MapRestaurant[]{
 return districts.flatMap(d=>d.objects.filter(o=>o.kind==='restaurant'||o.kind==='published-restaurant').flatMap(o=>{
  const original=restaurants.find(r=>r.id===o.id),live=liveRestaurants.get(o.id);
  if(!original&&(!live?.enabled||!live.available))return [];
  return [{id:o.id,name:original?.name??live!.name,district:d.district,cuisine:original?.cuisine??live!.entry.style,emblem:original?.emblem,x:o.pivot[0],y:o.pivot[1]}];
 }));
}
export function restaurantLogo(a:GlimmerApp,r:Pick<MapRestaurant,'id'|'emblem'|'cuisine'>,x:number,y:number,size:number){
 if(r.emblem){a.image(r.emblem,x,y,size);return;}
 let hash=2166136261;for(const c of r.id)hash=Math.imul(hash^c.charCodeAt(0),16777619);
 const colors=['#e9aa4b','#54b8af','#dc7c93','#8d83b3'];const c=a.context;c.fillStyle='#291e37';c.fillRect(x,y,size,size);c.fillStyle=colors[(hash>>>0)%4];
 c.fillRect(x+size*.08,y+size*.08,size*.84,size*.84);c.fillStyle='#f5e5be';c.fillRect(x+size*.17,y+size*.17,size*.66,size*.66);
 const food=/ember|grill/.test(r.cuisine)?'beef':/thai/.test(r.cuisine)?'chili':/ramen|noodle/.test(r.cuisine)?'noodles':/kaigan|tide|seafood/.test(r.cuisine)?'fish':/cafe|breakfast/.test(r.cuisine)?'coffee':'rice';
 foodIcon(c,food,x+size*.2,y+size*.2,size*.6);
 for(let i=0;i<4;i++)if((hash>>>i)&1)c.fillRect(x+size*(.1+i*.2),y+size*.85,size*.09,size*.09);
}
export class MarketMapUI {
 district=0;page=0;selected='';
 constructor(private a:GlimmerApp){}
 render(){const a=this.a;if(a.screen!=='map')return false;const d=districts[this.district],all=mapRestaurants(),shops=all.filter(r=>r.district===d.district);
  if(!shops.some(r=>r.id===this.selected))this.selected=shops[0]?.id??'';
  a.heading('Market Map');districts.forEach((district,i)=>a.button(district.name,96+i*365,150,345,52,()=>{this.district=i;this.page=0;this.selected='';},false,i===this.district?'selected':'normal',districtIconNames[district.district]));
  // The map always fits inside a fixed viewport, including automatically expanded districts.
  const bx=96,by=221,bw=610,bh=372;a.rect(bx,by,bw,bh,'#0f1533');
  const scale=Math.min((bw-30)/d.width_tiles,(bh-30)/d.height_tiles),ox=bx+(bw-d.width_tiles*scale)/2,oy=by+(bh-d.height_tiles*scale)/2,c=a.context;
  c.save();c.beginPath();c.rect(bx+5,by+5,bw-10,bh-10);c.clip();
  d.rows.forEach((row,y)=>[...row].forEach((tile,x)=>{c.fillStyle=tile==='#'?'#27264b':tile==='~'?'#205267':'#525984';c.fillRect(ox+x*scale,oy+y*scale,scale-.3,scale-.3);}));
  shops.forEach(r=>{const x=ox+r.x*scale,y=oy+(r.y-2)*scale,s=Math.max(22,Math.min(40,scale*4));c.fillStyle=r.id===this.selected?'#ffb04e':cream;c.fillRect(x-s/2-3,y-s/2-3,s+6,s+6);restaurantLogo(a,r,x-s/2,y-s/2,s);a.hit(`Select ${r.name}`,x-s/2-3,y-s/2-3,s+6,s+6,()=>{this.selected=r.id;this.page=Math.floor(shops.indexOf(r)/4);});});
  if(d.district===a.state.district){c.fillStyle='#fff29a';c.fillRect(ox+a.market.player.x*scale-3,oy+a.market.player.y*scale-3,6,6);}c.restore();
  a.text('Select a restaurant logo or choose from the list.',100,624,24);a.text('The small yellow square is you.',100,650,23,'#82634e');
  shops.slice(this.page*4,this.page*4+4).forEach((r,i)=>{const y=222+i*89;restaurantLogo(a,r,735,y+6,50);a.button(r.name,800,y,372,40,()=>{this.selected=r.id;},false,r.id===this.selected?'selected':'normal');a.button('Travel there',800,y+44,180,34,()=>this.travel(r));a.text(r.cuisine.slice(0,22),991,y+67,19,'#82634e');});
  if(shops.length>4){a.button('Previous',735,610,150,42,()=>{this.page--;},this.page===0,'normal');a.button('Next',1020,610,150,42,()=>{this.page++;},(this.page+1)*4>=shops.length,'normal');}
  return true;
 }
 travel(r:MapRestaurant){const a=this.a;if(a.market.travelToRestaurant(r.district,r.id)){a.setScreen('explore');a.notify(`${r.name} · E to open menu`);}else a.notify('No clear arrival spot. Try the street entrance.');}
}
