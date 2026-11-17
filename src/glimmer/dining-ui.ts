import type { GlimmerApp, Screen } from './app';
import { marketCatalogue, searchDishes, similarDishes, allergenLabel, type MarketDish } from './catalogue';
import { foodIcon } from './food-icons';
import { toggleSavedDish, changeQuantity } from './state';
import { liveRestaurants } from '../published/market';
const ink='#321b15',cream='#f3e6c8',muted='#82634e';
export class DiningUI {
 id='r1-1';query='';compareId='';comparisonAnchor='';replaceSide:0|1=1;keyboard=false;ingredientPage=0;infoPage=0;info=false;
 artX=0;artY=0;
 pointer(x:number,y:number){if(this.a.screen!=='dish'||this.a.reducedMotion)return;const dx=Math.max(-1,Math.min(1,(x-295)/200))*5,dy=Math.max(-1,Math.min(1,(y-350)/200))*3;if(dx!==this.artX||dy!==this.artY){this.artX=dx;this.artY=dy;this.a.invalidate();}}
 compareOrigin:Screen='menu';returnTo:Screen='menu';searchReturn:Screen='explore';pickerReturn:Screen='dish';portalReturn:Screen='dish';
 constructor(private a:GlimmerApp){}
 get selected(){return marketCatalogue().find(d=>d.id===this.id);}
 show(id:string,from:Screen='menu'){if(!marketCatalogue().some(d=>d.id===id))return;this.id=id;this.returnTo=from;this.info=false;this.ingredientPage=0;this.infoPage=0;this.a.setScreen('dish');}
 search(){this.searchReturn=this.a.screen;this.query='';this.keyboard=false;this.a.setScreen('search');}
 compare(){this.compareOrigin=this.returnTo;this.comparisonAnchor=this.id;this.compareId='';this.replaceSide=1;this.query='';this.keyboard=false;this.pickerReturn='dish';this.a.setScreen('comparePicker');}
 replace(side:0|1){this.replaceSide=side;this.query='';this.keyboard=false;this.pickerReturn='comparison';this.a.setScreen('comparePicker');}
 choose(id:string){if(this.replaceSide===0)this.comparisonAnchor=id;else this.compareId=id;this.a.setScreen('comparison');}
 portion(id=this.id,from:Screen='dish'){this.id=id;this.portalReturn=from;this.a.portalDishId=id;this.a.setScreen('ar');}
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
 private picture(d:MarketDish,x:number,y:number,size:number){const a=this.a;a.rect(x,y,size,size,'#e5d1a6');a.picture(d.image,x+12+this.artX,y+12+this.artY,size-24,size-24);}
 private pages(total:number,size:number,y:number){const a=this.a;a.button('Previous',96,y,155,42,()=>{a.page--;},a.page===0,'normal');a.text(`${a.page+1} / ${Math.max(1,Math.ceil(total/size))}`,585,y+28,24,muted);a.button('Next',1020,y,155,42,()=>{a.page++;},(a.page+1)*size>=total,'normal');}
 private allergy(d:MarketDish,x:number,y:number,width:number){const a=this.a;
  a.text('ALLERGENS & DIETARY INFO',x,y,23,muted);
  if(d.allergens?.length){d.allergens.forEach((name,i)=>{const col=i%3,row=Math.floor(i/3);foodIcon(a.context,name,x+col*width/3,y+12+row*34,28);a.text(name,x+34+col*width/3,y+34+row*34,21);});y+=Math.ceil(d.allergens.length/3)*34+9;}
  else {a.text(allergenLabel(d),x,y+32,22);y+=42;}
  if(d.dietary.length){a.text(d.dietary.join(' · '),x,y+22,22,'#437349');y+=28;}
  return y;
 }
 render(){const a=this.a;
  if(!['dish','ar','search','comparison','comparePicker','publishedMenu'].includes(a.screen))return false;
  const list=marketCatalogue(),d=list.find(d=>d.id===(a.screen==='ar'?a.portalDishId:a.screen==='comparison'?this.comparisonAnchor:this.id));
  if(a.screen==='publishedMenu'){
   const live=liveRestaurants.get(a.publishedId),items=list.filter(d=>d.venueId===a.publishedId);
   this.heading(live?.name??'Restaurant');a.text(live?.demo?'DEMO MENU':'PUBLISHED MENU',100,166,24,muted);
   a.button('Search all dishes',880,146,290,42,()=>this.search(),false,'normal');
   if(!items.length)this.textBlock(a.publishedMessage||'Menu unavailable. Reopen this restaurant to refresh.',100,260,990,32);
   items.slice(a.page*4,a.page*4+4).forEach((dish,i)=>{const y=204+i*92;a.picture(dish.image,100,y,78,78);a.button(dish.name,200,y,680,48,()=>this.show(dish.id,'publishedMenu'),false,'normal');a.text(dish.category,212,y+76,23,muted);a.text(dish.price,925,y+34,28);});
   this.pages(items.length,4,605);return true;
  }
  if(a.screen==='search'||a.screen==='comparePicker'){
   const picking=a.screen==='comparePicker';this.heading(picking?'Compare · choose any second dish':'Search the night market');
   const anchor=list.find(item=>item.id===(this.replaceSide===0?this.compareId:this.comparisonAnchor));
   const candidates=picking&&anchor?similarDishes(list,anchor):list;
   const matches=searchDishes(candidates,this.query);a.rect(98,150,760,52,'#fff4db');a.text(this.query||'Search dish, restaurant or ingredient…',114,185,28,this.query?ink:muted);
   a.button(this.keyboard?'Hide keys':'Keyboard',880,150,170,52,()=>{this.keyboard=!this.keyboard;a.page=0;},false,'normal');a.button('Clear',1070,150,106,52,()=>{this.query='';a.page=0;},!this.query,'normal');
   a.text(`${matches.length} dishes${picking?' · Similar dishes first · All restaurants':''}`,102,234,23,muted);
   const count=this.keyboard?2:5;
   matches.slice(a.page*count,a.page*count+count).forEach((item,i)=>{const y=251+i*64;a.picture(item.image,104,y,54,54);a.button(item.name,176,y,637,51,()=>picking?this.choose(item.id):this.show(item.id,'search'),false,'normal');a.text(item.restaurant,838,y+21,23);a.text(item.price,838,y+48,22,muted);});
   if(!matches.length)a.text('No matches. Try another dish, ingredient or restaurant.',110,300,28);
   if(this.keyboard){
    ['1234567890','QWERTYUIOP','ASDFGHJKL','ZXCVBNM'].forEach((row,r)=>[...row].forEach((ch,i)=>a.button(ch,165+Math.max(0,r-1)*24+i*87,416+r*45,78,41,()=>this.type(ch.toLowerCase()),false,'normal')));
    a.button('Space',900,551,130,41,()=>this.type(' '),false,'normal');a.button('Delete',1040,551,130,41,()=>this.type('Backspace'),!this.query,'normal');
   }
   this.pages(matches.length,count,612);return true;
  }
  if(!d){this.heading('Dish unavailable');this.textBlock('This menu changed or expired. Return to the market and reopen the restaurant.',100,250,1000,32);return true;}
  if(a.screen==='ar'){
   a.context.fillStyle='#0b1428';a.context.fillRect(0,0,1280,720);
   a.rect(22,20,1236,105);a.titleText(d.name,46,65,40);a.text(a.portalStatus||'Loading portion…',48,99,23,muted);a.button('Back',1134,42,100,50,()=>a.close(),false,'normal');
   a.context.strokeStyle='#40b8bb';a.context.lineWidth=3;a.context.strokeRect(46,145,1188,429);
   if(a.modelError){a.picture(d.image,460,176,360,360);a.text(a.modelError,65,565,24,cream);}
   a.text(a.immersive?'Walk closer to inspect · Size is locked in the headset':a.portalFlat?'2.5D · Drag gently to tilt · Zoom for a closer look':'3D · Drag to rotate · Zoom for a closer look',65,605,24,cream);
   a.button('Reset',48,628,150,46,()=>a.resetPortal(),false,'normal');a.button('−',212,628,65,46,()=>a.zoom(.1),a.immersive,'normal');a.button('+',289,628,65,46,()=>a.zoom(-.1),a.immersive,'normal');
   a.button('Previous dish',374,628,210,46,()=>a.nextDish(-1),false,'normal');a.button('Next dish',600,628,200,46,()=>a.nextDish(1),false,'normal');
   if(!a.immersive)a.button('View on Quest',820,628,240,46,()=>a.onXR());return true;
  }
  if(a.screen==='comparison'){
   const other=list.find(item=>item.id===this.compareId);this.heading('Compare dishes');
   if(!other||other.id===d.id){a.text('Choose another available dish to compare.',100,235,30);a.button('Choose dish',100,300,500,54,()=>this.replace(1));return true;}
   [d,other].forEach((dish,i)=>{const x=94+i*560;a.rect(x,151,530,441);a.picture(dish.image,x+20,170,170,170);this.textBlock(dish.name,x+209,189,294,29,2);a.text(dish.price,x+209,262,30,'#a65326');this.textBlock(dish.restaurant,x+209,294,294,23,2);a.text(dish.sample?'Sample menu':'Published menu',x+209,329,21,muted);
    this.textBlock(allergenLabel(dish),x+20,371,480,24,2);this.textBlock(dish.dietary.join(' · ')||'Dietary information not supplied',x+20,433,480,23,2);
    this.textBlock(`Ingredients: ${dish.ingredients.join(', ')}`,x+20,490,480,22,3);
    a.button('Details',x,606,160,46,()=>this.show(dish.id,'comparison'),false,'normal');
    a.button('Replace',x+176,606,160,46,()=>this.replace(i as 0|1),false,'normal');
    a.button('Portion',x+352,606,160,46,()=>{this.portalReturn='comparison';a.portalDishId=dish.id;a.setScreen('ar');});
   });return true;
  }
  this.heading('Dish details');
  this.picture(d,114,155,360);this.textBlock(d.description,110,548,388,24,2);a.text(d.sample?'SAMPLE MENU':'PUBLISHED MENU',112,609,23,muted);
  a.text(d.servingCount?`Serves ${d.servingCount}`:'Serving count not supplied',112,644,23);
  const x=528;a.text(d.category.toUpperCase(),x,172,22,muted);this.textBlock(d.name,x,208,640,37,2);a.text(d.price,x,282,32,'#a65326');
  a.button(this.info?'Ingredients':'More info',1000,257,177,38,()=>{this.info=!this.info;this.infoPage=0;},false,'normal');
  if(this.info){
   const lines=this.textBlock(d.description,x,330,640,26,0);lines.slice(this.infoPage*7,this.infoPage*7+7).forEach((line,i)=>a.text(line,x,330+i*30,26));
   a.text('For allergy questions, ask the restaurant staff.',x,563,23,muted);
   a.button('Previous info',x,575,190,38,()=>{this.infoPage--;},this.infoPage===0,'normal');a.button('Next info',990,575,190,38,()=>{this.infoPage++;},(this.infoPage+1)*7>=lines.length,'normal');
  }else{
   let y=this.allergy(d,x,315,640);y=Math.max(y+36,421);
   a.text('INGREDIENTS',x,y,23,muted);
   const rows=Math.max(1,Math.min(2,Math.floor((594-y)/65))),count=rows*3;
   this.ingredientPage=Math.min(this.ingredientPage,Math.max(0,Math.ceil(d.ingredients.length/count)-1));
   d.ingredients.slice(this.ingredientPage*count,this.ingredientPage*count+count).forEach((name,i)=>{const xx=x+(i%3)*216,yy=y+14+Math.floor(i/3)*65;a.rect(xx,yy,202,57,'#e6d4ad');foodIcon(a.context,name,xx+8,yy+12,32);this.textBlock(name,xx+48,yy+23,145,21,2);});
   if(!d.ingredients.length)a.text('Ingredients not supplied',x,y+40,23);
   if(d.ingredients.length>count){a.button('‹',x+380,y-28,45,34,()=>{this.ingredientPage--;},this.ingredientPage===0,'normal');a.text(`${this.ingredientPage+1}/${Math.ceil(d.ingredients.length/count)}`,x+438,y-3,22);a.button('›',x+500,y-28,45,34,()=>{this.ingredientPage++;},(this.ingredientPage+1)*count>=d.ingredients.length,'normal');}
  }
  a.button('View Portion',528,622,218,46,()=>this.portion());a.button('Compare',762,622,190,46,()=>this.compare(),false,'normal');
  if(d.modelId){a.button(a.state.tastingList.includes(d.id)?'Saved':'Save',970,622,100,46,()=>a.result(toggleSavedDish(a.state,d.id)),false,'normal');a.button('+ Tray',1082,622,98,46,()=>a.result(changeQuantity(a.state,d.id,1)),(a.state.tray.find(l=>l.dish===d.id)?.qty??0)>=3,'normal');}
  else a.button('Search dishes',970,622,210,46,()=>this.search(),false,'normal');
  return true;
 }
}
