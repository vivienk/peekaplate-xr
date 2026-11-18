import type { GlimmerApp, Screen } from './app';
import { DinerSurface, dinerColors as dc } from './diner-surface';
import { restaurantLogo } from './market-map-ui';
import { marketCatalogue, searchDishes, similarDishes, allergenLabel, type MarketDish } from './catalogue';
import { generatedModelId } from './generated-models';
import { portionScale } from './portion-preview';
import { DetailPreview } from './detail-preview';
import { loadPortionImages } from './portion-images';
import { foodIcon } from './food-icons';
import { toggleSavedDish, changeQuantity } from './state';
import { IngredientArtwork } from './ingredient-artwork';
import { artworkApiOrigin, liveRestaurants } from '../published/market';
const ink='#321b15',cream='#f3e6c8',muted='#82634e';
export class DiningUI {
 id='r1-1';query='';category='All';categoryPage=0;compareId='';comparisonAnchor='';replaceSide:0|1=1;keyboard=false;ingredientPage=0;infoPage=0;info=false;
 menuCategory='All';private menuCategoryPage=0;private menuVenue='';
 artX=0;artY=0;photoMode=false;
 private ingredientArtwork=new IngredientArtwork(()=>this.a.invalidate());
 private previews=new Map<string,{images:{image:HTMLImageElement;depth:number}[];layered:boolean}>();
 private pending=new Set<string>();private failed=new Set<string>();private previewAbort=new AbortController();
 pointer(x:number,y:number){if(this.a.screen!=='dish'||this.a.reducedMotion)return;const dx=Math.max(-1,Math.min(1,(x-295)/200))*5,dy=Math.max(-1,Math.min(1,(y-350)/200))*3;if(dx!==this.artX||dy!==this.artY){this.artX=dx;this.artY=dy;this.a.invalidate();}}
 compareOrigin:Screen='menu';returnTo:Screen='menu';searchReturn:Screen='explore';pickerReturn:Screen='dish';portalReturn:Screen='dish';
 private input=document.createElement('input');
 readonly detailPreview=new DetailPreview(()=>this.a.invalidate());
 private resize=()=>{this.syncInput();this.a.invalidate();};
 constructor(private a:GlimmerApp){
  this.input.type='search';this.input.maxLength=80;this.input.autocomplete='off';this.input.placeholder='Category, ingredient or keyword…';this.input.setAttribute('aria-label','Search dishes by category, ingredient or keyword');
  this.input.style.cssText='position:fixed;display:none;z-index:20;box-sizing:border-box;background:#fff4db;color:#321b15;border:0;outline:0;border-radius:0;font-family:Jersey,monospace;';
  this.input.addEventListener('input',()=>{this.query=this.input.value;this.a.page=0;this.a.invalidate();});
  this.input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopPropagation();this.input.blur();const b=this.a.buttons.findIndex(b=>!b.disabled&&b.y>=300&&b.y<610&&b.w>400);this.a.keyboardFocus=b;} });
  document.body.append(this.input);window.addEventListener('resize',this.resize);
 }
 syncInput(){
  if(this.a.screen!=='dish'){this.detailPreview.hide();this.ingredientArtwork.clear();}
  const shown=['search','comparePicker'].includes(this.a.screen)&&!this.a.immersive&&!this.keyboard;
  const modern=this.a.screen==='comparePicker';Object.assign(this.input.style,{background:modern?dc.deep:'#fff4db',color:modern?dc.text:ink,fontFamily:modern?'Arial, sans-serif':'Jersey, monospace',borderRadius:modern?'8px':'0'});
  this.input.style.display=shown?'block':'none';if(!shown){this.input.blur();return;}
  const scale=Math.min(innerWidth/1280,innerHeight/720)/1.04,left=(innerWidth-1280*scale)/2,top=(innerHeight-720*scale)/2;
  Object.assign(this.input.style,{left:`${left+112*scale}px`,top:`${top+160*scale}px`,width:`${732*scale}px`,height:`${31*scale}px`,fontSize:`${28*scale}px`});
  if(this.input.value!==this.query)this.input.value=this.query;
 }
 dispose(){this.ingredientArtwork.dispose();this.detailPreview.dispose();this.previewAbort.abort();this.previews.clear();this.input.remove();window.removeEventListener('resize',this.resize);}

 get selected(){return marketCatalogue().find(d=>d.id===this.id);}
 show(id:string,from:Screen='menu'){if(!marketCatalogue().some(d=>d.id===id))return;this.id=id;this.returnTo=from;this.info=false;this.photoMode=false;this.artX=this.artY=0;this.detailPreview.reset();this.ingredientPage=0;this.infoPage=0;this.a.setScreen('dish');}
 search(){this.searchReturn=this.a.screen;this.query='';this.category='All';this.categoryPage=0;this.keyboard=false;this.a.setScreen('search');}
 compare(){this.compareOrigin=this.returnTo;this.comparisonAnchor=this.id;this.compareId='';this.replaceSide=1;this.query='';this.category='All';this.categoryPage=0;this.keyboard=false;this.pickerReturn='dish';this.a.setScreen('comparePicker');}
 replace(side:0|1){this.replaceSide=side;this.query='';this.category='All';this.categoryPage=0;this.keyboard=false;this.pickerReturn='comparison';this.a.setScreen('comparePicker');}
 choose(id:string){if(this.replaceSide===0)this.comparisonAnchor=id;else this.compareId=id;this.a.setScreen('comparison');}
 portion(id=this.id,from:Screen='dish'){this.id=id;this.portalReturn=from;this.a.portalDishId=id;this.a.setScreen('ar');this.a.onEnterPortal();}
 close(){const a=this.a;if(a.screen==='ar'){if(this.portalReturn==='dish')this.id=a.portalDishId;a.setScreen(this.portalReturn);return true;}if(a.screen==='dish'){a.setScreen(this.returnTo);return true;}if(a.screen==='search'){a.setScreen(this.searchReturn);return true;}if(a.screen==='comparePicker'){a.setScreen(this.pickerReturn);return true;}if(a.screen==='comparison'){this.id=this.comparisonAnchor;this.returnTo=this.compareOrigin;a.setScreen('dish');return true;}return false;}
 type(key:string){if(!['search','comparePicker'].includes(this.a.screen))return false;
  if(key==='Backspace'){this.query=this.query.slice(0,-1);}else if(key.length===1){if(this.query.length<80)this.query+=key;}else return false;
  this.a.page=0;this.a.keyboardFocus=-1;this.a.invalidate();return true;
 }
 private textBlock(text:string,x:number,y:number,width:number,size=25,maxLines=3){
  const a=this.a,c=a.context;c.font=`${size}px Jersey, monospace`;const lines:string[]=[];let line='';
  for(const word of text.split(/\s+/)){if(c.measureText(line+' '+word).width>width&&line){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);
  lines.slice(0,maxLines).forEach((l,i)=>a.text(i===maxLines-1&&lines.length>maxLines?l.slice(0,-3)+'…':l,x,y+i*(size+4),size));
  return lines;
 }
 private heading(title:string){this.a.heading(title);}
 private picture(d:MarketDish,x:number,y:number,size:number){
  const a=this.a,c=a.context,key=d.id+'|'+(d.portion?.layers.map(l=>l.sha256).join()??d.image);new DinerSurface(a).box(x,y,size,size,dc.deep);
  if(!this.pending.has(key)&&!this.previews.has(key)&&!this.failed.has(key)){this.pending.add(key);void loadPortionImages(d,AbortSignal.any([this.previewAbort.signal,AbortSignal.timeout(15000)])).then(result=>{if(!this.previewAbort.signal.aborted){if(this.previews.size>=40)this.previews.delete(this.previews.keys().next().value!);this.previews.set(key,result);a.invalidate();}}).catch(()=>{this.failed.add(key);a.invalidate();}).finally(()=>this.pending.delete(key));}
  const preview=this.previews.get(key);
  if(this.photoMode||!preview){a.picture(d.image,x+12,y+40,size-24,size-100);}else{
   c.save();c.beginPath();c.rect(x+12,y+40,size-24,size-100);c.clip();
   c.fillStyle='#967a4c40';c.beginPath();c.ellipse(x+size/2,y+size*.83,size*.3,size*.045,0,0,Math.PI*2);c.fill();
   const dx=a.reducedMotion?0:this.artX,dy=a.reducedMotion?0:this.artY;
   for(const layer of preview.images){const ratio=layer.image.naturalHeight/layer.image.naturalWidth,w=Math.min(size-24,(size-100)/ratio),h=w*ratio;c.save();c.translate(x+size/2+dx*layer.depth,y+40+(size-100)/2+dy*layer.depth);c.transform(1,dy*.002,dx*.002,1,0,0);c.drawImage(layer.image,-w/2,-h/2,w,h);c.restore();}c.restore();
  }
  new DinerSurface(a).text(this.photoMode?(d.illustrative?'ILLUSTRATIVE IMAGE':'PHOTO'):preview?.layered?(d.cutoutEdited?'2.5D · AI-CLEANED CUTOUT':'2.5D PREVIEW'):'PHOTO PREVIEW',x+14,y+27,16,dc.muted);
  this.detailPreview.show(d,this.photoMode,a.reducedMotion,a.immersive,{x:x+12,y:y+40,w:size-24,h:size-100});
  new DinerSurface(a).button(this.photoMode?'2.5D preview':d.illustrative?'Illustrative image':'Original photo',x+8,y+size-44,190,36,()=>{this.photoMode=!this.photoMode;});
  new DinerSurface(a).button(this.detailPreview.status.includes('Retry')?'Retry':'Reset view',x+size-160,y+size-44,152,36,()=>{this.artX=this.artY=0;this.detailPreview.reset();if(this.detailPreview.status.includes('Retry')){this.detailPreview.retry();this.failed.delete(key);this.previews.delete(key);}});
 }
 private pages(total:number,size:number,y:number){const a=this.a;a.button('Previous',96,y,155,42,()=>{a.page--;},a.page===0,'normal');a.text(`${a.page+1} / ${Math.max(1,Math.ceil(total/size))}`,585,y+28,24,muted);a.button('Next',1020,y,155,42,()=>{a.page++;},(a.page+1)*size>=total,'normal');}
 private allergy(d:MarketDish,x:number,y:number,width:number){const a=this.a;
  a.text('ALLERGENS & DIETARY INFO',x,y,23,muted);
  if(d.allergens?.length){d.allergens.forEach((name,i)=>{const col=i%3,row=Math.floor(i/3);foodIcon(a.context,name,x+col*width/3,y+12+row*34,28);a.text(name,x+34+col*width/3,y+34+row*34,21);});y+=Math.ceil(d.allergens.length/3)*34+9;}
  else {a.text(allergenLabel(d),x,y+32,22);y+=42;}
  if(d.dietary.length){a.text(d.dietary.join(' · '),x,y+22,22,'#437349');y+=28;}
  return y;
 }

 private restaurantMenu(list:MarketDish[]){
  const a=this.a,u=new DinerSurface(a),published=a.screen==='publishedMenu',venue=published?a.publishedId:a.restaurant.id,live=liveRestaurants.get(venue),name=published?live?.name??'Restaurant':a.restaurant.name;
  if(this.menuVenue!==venue){this.menuVenue=venue;this.menuCategory='All';this.menuCategoryPage=0;a.page=0;}
  const featured=['thai-chicken-bowl','noka-steak-ramen'];
  const items=list.filter(d=>d.venueId===venue).sort((a,b)=>Number(featured.includes(b.id))-Number(featured.includes(a.id))),categories=['All',...new Set(items.map(d=>d.category))];
  if(!categories.includes(this.menuCategory))this.menuCategory='All';
  u.shell('');restaurantLogo(a,published?{id:venue,cuisine:live?.entry.style??'restaurant'}:a.restaurant,140,44,52);u.text(name,210,80,28,dc.text,850,600);
  u.button('Search dishes',1098,46,48,48,()=>this.search(),{icon:'search',iconOnly:true});
  let cx=80;categories.slice(this.menuCategoryPage*5,this.menuCategoryPage*5+5).forEach(category=>{const width=Math.min(170,Math.max(90,category.length*11+32));if(cx+width>1195)return;u.button(category,cx,134,width,44,()=>{this.menuCategory=category;a.page=0;},{selected:this.menuCategory===category});cx+=width+12;});
  if(categories.length>5){u.button('Previous categories',1080,134,48,44,()=>{this.menuCategoryPage--;},{disabled:this.menuCategoryPage===0,visible:'‹'});u.button('Next categories',1140,134,48,44,()=>{this.menuCategoryPage++;},{disabled:(this.menuCategoryPage+1)*5>=categories.length,visible:'›'});}
  const filtered=items.filter(d=>this.menuCategory==='All'||d.category===this.menuCategory);a.page=Math.min(a.page,Math.max(0,Math.ceil(filtered.length/4)-1));
  filtered.slice(a.page*4,a.page*4+4).forEach((dish,i)=>{
   const col=i%2,row=Math.floor(i/2),x=80+col*570,y=205+row*195,reverse=i%2===1,px=reverse?x+370:x,tx=reverse?x:x+164;
   if(dish.menuImage)a.picture(dish.menuImage,px,y,154,154);else foodIcon(a.context,dish.category,px+30,y+30,90);
   u.lines(dish.name,tx,y+34,345,25,2,dc.text);u.text(dish.category,tx,y+98,18,dc.muted,340);u.text(dish.price,tx,y+132,25,dc.orange);
   if(a.keyboardFocus===a.buttons.length){a.context.strokeStyle=dc.orange;a.context.lineWidth=3;a.context.strokeRect(x-4,y-4,544,162);}
   a.hit(dish.name,x,y,540,154,()=>this.show(dish.id,published?'publishedMenu':'menu'));
   if(dish.modelId)u.button(a.state.tastingList.includes(dish.id)?`Saved ${dish.name}`:`Save ${dish.name}`,tx+260,y+105,48,40,()=>a.result(toggleSavedDish(a.state,dish.id)),{icon:'heart',iconOnly:true,selected:a.state.tastingList.includes(dish.id)});
   a.context.fillStyle=dc.line;a.context.fillRect(x,y+172,530,1);
  });
  if(!items.length)u.lines(a.publishedMessage||'Menu unavailable. Reopen this restaurant to refresh.',90,260,1000,24,3);
  u.text(`${filtered.length} dishes`,84,662,18,dc.muted);
  if(filtered.length>4){u.button('Previous',440,634,150,44,()=>{a.page--;},{disabled:a.page===0});u.text(`${a.page+1} / ${Math.ceil(filtered.length/4)}`,616,663,18);u.button('Next',710,634,150,44,()=>{a.page++;},{disabled:(a.page+1)*4>=filtered.length});}
  u.sound();
 }
 private dishDetail(d:MarketDish){
  const a=this.a,u=new DinerSurface(a),x=608;
  const venue=liveRestaurants.get(d.venueId);
  this.ingredientArtwork.sync(venue&&!venue.demo&&venue.enabled&&venue.available&&venue.expiresAt>Date.now()&&artworkApiOrigin()?{apiBase:artworkApiOrigin(),venueId:venue.entry.venueId,labels:d.ingredients}:null,d.id);
  u.shell(d.restaurant);
  if(d.modelId)u.button(a.state.tastingList.includes(d.id)?'Saved':'Save',1098,46,48,48,()=>a.result(toggleSavedDish(a.state,d.id)),{icon:'heart',iconOnly:true,selected:a.state.tastingList.includes(d.id)});
  this.picture(d,80,144,484);a.context.fillStyle=dc.line;a.context.fillRect(585,144,1,484);
  u.lines(d.photoCredit??(d.illustrative?'Illustrative image · not a restaurant photograph':'Dish preview'),92,651,460,14,2);
  u.text(d.category.toUpperCase(),x,154,16,dc.muted,480);u.lines(d.name,x,192,d.modelId?505:575,30,2,dc.text);u.text(d.price,x,260,28,dc.orange);
  u.button(this.info?'Ingredients':'More info',1030,237,158,36,()=>{this.info=!this.info;this.infoPage=0;});
  u.lines(d.description,x,290,575,18,2);
  if(this.info){const lines=u.lines(`${d.description} ${allergenLabel(d)}. ${d.dietary.join(' · ')}. ${d.servingCount?'Serves '+d.servingCount:'Serving count not supplied'}. For allergy questions, ask restaurant staff.`,0,0,568,20,0);lines.slice(this.infoPage*8,this.infoPage*8+8).forEach((line,i)=>u.text(line,x,345+i*25,20,dc.text,568));u.button('Previous info',x,548,160,36,()=>{this.infoPage--;},{disabled:this.infoPage===0});u.button('Next info',1028,548,160,36,()=>{this.infoPage++;},{disabled:(this.infoPage+1)*8>=lines.length});}
  else {
   u.text(d.photoCredit?'GAME RECIPE INGREDIENTS':'INGREDIENTS',x,347,15,dc.muted);
   const count=4;this.ingredientPage=Math.min(this.ingredientPage,Math.max(0,Math.ceil(d.ingredients.length/count)-1));
   d.ingredients.slice(this.ingredientPage*count,this.ingredientPage*count+count).forEach((name,i)=>{const xx=x+i*147;u.box(xx,362,135,94,'#ffffff',10);this.ingredientArtwork.draw(a.context,name,xx+48,370,38);const lines=u.lines(name,0,0,115,16,0).slice(0,2);lines.forEach((line,j)=>{a.context.save();a.context.font='16px Arial, sans-serif';const width=a.context.measureText(line).width;a.context.restore();u.text(line,xx+(135-width)/2,429+j*18,16,dc.deep,123);});});
   if(!d.ingredients.length)u.text('Ingredients not supplied',x,400,19,dc.muted);
   if(d.ingredients.length>count){u.button('Previous ingredients',1055,324,58,30,()=>{this.ingredientPage--;},{disabled:this.ingredientPage===0,visible:'‹'});u.button('Next ingredients',1126,324,58,30,()=>{this.ingredientPage++;},{disabled:(this.ingredientPage+1)*count>=d.ingredients.length,visible:'›'});}
   u.text('ALLERGENS & DIETARY INFO',x,483,15,dc.muted);
   if(d.allergens?.length){d.allergens.forEach((name,i)=>{const xx=x+i%4*147,yy=496+Math.floor(i/4)*32;if(yy>530)return;foodIcon(a.context,name,xx,yy,24);u.text(name,xx+30,yy+18,15,dc.text,110);});}else u.text(allergenLabel(d),x,518,18,dc.muted,570);
   if(d.dietary.length)u.text(d.dietary.join(' · '),x,551,17,dc.muted,570);
  }
  u.button('View Portion',x,590,342,48,()=>this.portion(),{icon:'portion',primary:true,visible:'View portion in AR'});
  u.button('Compare',966,590,222,48,()=>this.compare(),{icon:'compare'});
  u.lines(portionScale(d).label,x,654,342,14,2,dc.muted);
  if(d.modelId)u.button('Add to order',1138,170,50,50,()=>a.result(changeQuantity(a.state,d.id,1)),{icon:'order',iconOnly:true,primary:true,disabled:(a.state.tray.find(l=>l.dish===d.id)?.qty??0)>=3});
  else u.button('Search dishes',966,648,170,34,()=>this.search());
  u.sound();
 }
 private comparePicker(list:MarketDish[]){
  const a=this.a,u=new DinerSurface(a);u.shell('Compare · choose a dish');
  const anchor=list.find(item=>item.id===(this.replaceSide===0?this.compareId:this.comparisonAnchor));
  const matches=searchDishes(anchor?similarDishes(list,anchor):list,this.query,this.category);
  u.box(98,150,760,52,dc.deep,12);if(a.immersive||this.keyboard)u.text(this.query||'Category, ingredient or keyword…',114,185,24,this.query?dc.text:dc.muted,728);
  this.syncInput();a.hit('Search input',98,150,760,52,()=>{if(a.immersive)this.keyboard=true;else{this.keyboard=false;this.syncInput();this.input.focus();}});
  u.button(this.keyboard?'Hide keys':'Keyboard',880,150,170,52,()=>{this.keyboard=!this.keyboard;a.page=0;});u.button('Clear',1070,150,106,52,()=>{this.query='';a.page=0;},{disabled:!this.query});
  const categories=['All',...new Set(list.map(item=>item.category))];
  categories.slice(this.categoryPage*6,this.categoryPage*6+6).forEach((category,i)=>u.button(category,98+i*164,214,154,38,()=>{this.category=category;a.page=0;},{selected:this.category===category}));
  u.button('‹',1090,214,38,38,()=>{this.categoryPage--;},{disabled:this.categoryPage===0});u.button('›',1138,214,38,38,()=>{this.categoryPage++;},{disabled:(this.categoryPage+1)*6>=categories.length});
  u.text(`${matches.length} dishes · ${this.category} · Similar dishes first`,102,281,18,dc.muted,1050);
  const count=this.keyboard?2:5;a.page=Math.min(a.page,Math.max(0,Math.ceil(matches.length/count)-1));
  matches.slice(a.page*count,a.page*count+count).forEach((item,i)=>{const y=300+i*61;item.menuImage?a.picture(item.menuImage,104,y,54,54):foodIcon(a.context,item.category,110,y+6,42);u.button(item.name,176,y,637,51,()=>this.choose(item.id));u.text(item.restaurant,838,y+21,18,dc.muted,340);u.text(item.price,838,y+48,20,dc.orange,340);});
  if(!matches.length)u.text('No matches. Try another dish, ingredient or restaurant.',110,340,22,dc.muted,1000);
  if(this.keyboard){['1234567890','QWERTYUIOP','ASDFGHJKL','ZXCVBNM'].forEach((row,r)=>[...row].forEach((ch,i)=>u.button(ch,165+Math.max(0,r-1)*24+i*87,430+r*44,78,41,()=>this.type(ch.toLowerCase()))));u.button('Space',900,562,130,41,()=>this.type(' '));u.button('Delete',1040,562,130,41,()=>this.type('Backspace'),{disabled:!this.query});}
  u.button('Previous',98,630,155,44,()=>{a.page--;},{disabled:a.page===0});u.text(`${a.page+1} / ${Math.max(1,Math.ceil(matches.length/count))}`,590,660,18,dc.muted);u.button('Next',960,630,155,44,()=>{a.page++;},{disabled:(a.page+1)*count>=matches.length});u.sound();
 }
 private comparison(d:MarketDish,other?:MarketDish){
  const a=this.a,u=new DinerSurface(a);u.shell('Compare dishes');
  if(!other||other.id===d.id){u.text('Choose another available dish to compare.',100,235,25);u.button('Choose dish',100,300,500,54,()=>this.replace(1),{primary:true});u.sound();return;}
  [d,other].forEach((dish,i)=>{const x=80+i*572;u.box(x,136,548,480,dc.deep);a.picture(dish.image,x+20,154,190,180);
   u.text(dish.category.toUpperCase(),x+228,170,15,dc.muted,298);u.lines(dish.name,x+228,203,298,24,2,dc.text);u.text(dish.price,x+228,273,27,dc.orange,298);u.lines(dish.restaurant,x+228,303,298,18,2);
   a.context.fillStyle=dc.line;a.context.fillRect(x+20,350,508,1);
   u.text('ALLERGENS',x+20,378,15,dc.muted);u.lines(allergenLabel(dish),x+20,404,508,18,2,dc.text);u.text(dish.dietary.join(' · ')||'Dietary information not supplied',x+20,451,17,dc.muted,508);
   u.text(dish.photoCredit?'GAME RECIPE INGREDIENTS':'INGREDIENTS',x+20,480,15,dc.muted);u.lines(dish.ingredients.join(', ')||'Ingredients not supplied',x+20,506,508,18,2,dc.text);
   u.button('Details',x+20,558,160,42,()=>this.show(dish.id,'comparison'));u.button('Replace',x+192,558,160,42,()=>this.replace(i as 0|1));u.button('Portion',x+364,558,164,42,()=>this.portion(dish.id,'comparison'),{primary:true,icon:'portion'});
  });u.text('Compare any two dishes across the night market.',82,659,18,dc.muted,1000);u.sound();
 }
 render(){const a=this.a;
  if(!['menu','dish','ar','search','comparison','comparePicker','publishedMenu'].includes(a.screen))return false;
  const list=marketCatalogue(),d=list.find(d=>d.id===(a.screen==='ar'?a.portalDishId:a.screen==='comparison'?this.comparisonAnchor:this.id));
  if(a.screen==='dish'&&!d)this.ingredientArtwork.clear();
  if(a.screen==='menu'||a.screen==='publishedMenu'){this.restaurantMenu(list);return true;}
  if(a.screen==='comparePicker'){this.comparePicker(list);return true;}
  if(a.screen==='search'){
   const picking=false;this.heading(picking?'Compare · choose any second dish':'Search the night market');
   const anchor=list.find(item=>item.id===(this.replaceSide===0?this.compareId:this.comparisonAnchor));
   const candidates=picking&&anchor?similarDishes(list,anchor):list;
   const matches=searchDishes(candidates,this.query,this.category);a.rect(98,150,760,52,'#fff4db');if(this.a.immersive||this.keyboard)a.text(this.query||'Category, ingredient or keyword…',114,185,28,this.query?ink:muted);this.syncInput();a.hit('Search input',98,150,760,52,()=>{if(this.a.immersive){this.keyboard=true;}else{this.keyboard=false;this.syncInput();this.input.focus();}});
   a.button(this.keyboard?'Hide keys':'Keyboard',880,150,170,52,()=>{this.keyboard=!this.keyboard;a.page=0;},false,'normal');a.button('Clear',1070,150,106,52,()=>{this.query='';a.page=0;},!this.query,'normal');
   const categories=['All',...new Set(list.map(item=>item.category))];
   categories.slice(this.categoryPage*6,this.categoryPage*6+6).forEach((category,i)=>a.button(category,98+i*164,214,154,38,()=>{this.category=category;a.page=0;},false,this.category===category?'selected':'normal'));
   a.button('‹',1090,214,38,38,()=>{this.categoryPage--;},this.categoryPage===0,'normal');a.button('›',1138,214,38,38,()=>{this.categoryPage++;},(this.categoryPage+1)*6>=categories.length,'normal');
   a.text(`${matches.length} dishes · ${this.category}${picking?' · Similar dishes first':''}`,102,281,23,muted);
   const count=this.keyboard?2:5;
   matches.slice(a.page*count,a.page*count+count).forEach((item,i)=>{const y=300+i*61;item.menuImage?a.picture(item.menuImage,104,y,54,54):foodIcon(a.context,item.category,110,y+6,42);a.button(item.name,176,y,637,51,()=>picking?this.choose(item.id):this.show(item.id,'search'),false,'normal');a.text(item.restaurant,838,y+21,23);a.text(item.price,838,y+48,22,muted);});
   if(!matches.length)a.text('No matches. Try another dish, ingredient or restaurant.',110,340,28);
   if(this.keyboard){
    ['1234567890','QWERTYUIOP','ASDFGHJKL','ZXCVBNM'].forEach((row,r)=>[...row].forEach((ch,i)=>a.button(ch,165+Math.max(0,r-1)*24+i*87,430+r*44,78,41,()=>this.type(ch.toLowerCase()),false,'normal')));
    a.button('Space',900,562,130,41,()=>this.type(' '),false,'normal');a.button('Delete',1040,562,130,41,()=>this.type('Backspace'),!this.query,'normal');
   }
   this.pages(matches.length,count,612);return true;
  }
  if(!d){this.heading('Dish unavailable');this.textBlock('This menu changed or expired. Return to the market and reopen the restaurant.',100,250,1000,32);return true;}
  if(a.screen==='ar'&&a.portalAR){
   a.rect(22,20,1236,230);a.titleText(d.name,46,65,40);a.text(a.portalStatus||'Loading portion…',48,103,23,muted);
   a.text(a.portalPlacement,48,143,24);
   a.button('Reposition',48,181,230,48,()=>a.onReposition(),false,'normal');a.button('Back to dish',302,181,270,48,()=>a.close(),false,'normal');
   a.button('Exit AR',600,181,190,48,()=>a.onXR(),false,'normal');return true;
  }
  if(a.screen==='ar'){
   const has3d=!!d.modelId||(!d.photoCredit&&!d.illustrative&&!!generatedModelId(d.id));
   a.context.fillStyle='#0b1428';a.context.fillRect(0,0,1280,720);
   a.rect(22,20,1236,105);a.titleText(d.name,46,65,40);a.text(a.portalStatus||'Loading portion…',48,99,23,muted);a.button('Back',1134,42,100,50,()=>a.close(),false,'normal');
   a.context.strokeStyle='#40b8bb';a.context.lineWidth=3;a.context.strokeRect(46,145,1188,429);
   if(a.modelError){a.picture(d.image,460,176,360,360);a.text(a.modelError,65,565,24,cream);}
   a.text(a.immersive?'VR preview · Open AR portal for passthrough':a.portalFlat?'2.5D · Zoomed screen preview · Physical scale in AR glasses':'3D · Drag to rotate · Zoom for a closer look',65,605,24,cream);
   a.button(a.portalFlat?'3D model':'2.5D view',1078,583,154,38,()=>{a.portalView=a.portalFlat?'3d':'2.5d';a.resetPortal();a.onPortal(d.id);},a.portalFlat&&!has3d,'normal');
   a.button('Reset',48,628,150,46,()=>a.resetPortal(),false,'normal');a.button('−',212,628,65,46,()=>a.zoom(.1),a.immersive,'normal');a.button('+',289,628,65,46,()=>a.zoom(-.1),a.immersive,'normal');
   a.button('Previous dish',374,628,210,46,()=>a.nextDish(-1),false,'normal');a.button('Next dish',600,628,200,46,()=>a.nextDish(1),false,'normal');
   a.button('Open AR portal',820,628,240,46,()=>a.onXR());
   a.button('Spectacles',1078,628,154,46,()=>a.onSpectacles(),false,'normal');
   if(a.portalPlacement)a.text(a.portalPlacement,65,565,22,cream);else if(!a.arSupported&&!a.immersive)a.text('AR placement requires a compatible headset or AR browser.',65,565,22,cream);return true;
  }
  if(a.screen==='comparison'){this.comparison(d,list.find(item=>item.id===this.compareId));return true;}
  this.dishDetail(d);return true;
 }
}
