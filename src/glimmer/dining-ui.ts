import type { GlimmerApp, Screen } from './app';
import { marketCatalogue, searchDishes, similarDishes, allergenLabel, type MarketDish } from './catalogue';
import { generatedModelId } from './generated-models';
import { DetailPreview } from './detail-preview';
import { loadPortionImages } from './portion-images';
import { foodIcon } from './food-icons';
import { toggleSavedDish, changeQuantity } from './state';
import { liveRestaurants } from '../published/market';
const ink='#321b15',cream='#f3e6c8',muted='#82634e';
export class DiningUI {
 id='r1-1';query='';category='All';categoryPage=0;compareId='';comparisonAnchor='';replaceSide:0|1=1;keyboard=false;ingredientPage=0;infoPage=0;info=false;
 artX=0;artY=0;photoMode=false;
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
  if(this.a.screen!=='dish')this.detailPreview.hide();
  const shown=['search','comparePicker'].includes(this.a.screen)&&!this.a.immersive&&!this.keyboard;
  this.input.style.display=shown?'block':'none';if(!shown){this.input.blur();return;}
  const scale=Math.min(innerWidth/1280,innerHeight/720)/1.04,left=(innerWidth-1280*scale)/2,top=(innerHeight-720*scale)/2;
  Object.assign(this.input.style,{left:`${left+112*scale}px`,top:`${top+160*scale}px`,width:`${732*scale}px`,height:`${31*scale}px`,fontSize:`${28*scale}px`});
  if(this.input.value!==this.query)this.input.value=this.query;
 }
 dispose(){this.detailPreview.dispose();this.previewAbort.abort();this.previews.clear();this.input.remove();window.removeEventListener('resize',this.resize);}

 get selected(){return marketCatalogue().find(d=>d.id===this.id);}
 show(id:string,from:Screen='menu'){if(!marketCatalogue().some(d=>d.id===id))return;this.id=id;this.returnTo=from;this.info=false;this.photoMode=false;this.artX=this.artY=0;this.detailPreview.reset();this.ingredientPage=0;this.infoPage=0;this.a.setScreen('dish');}
 search(){this.searchReturn=this.a.screen;this.query='';this.category='All';this.categoryPage=0;this.keyboard=false;this.a.setScreen('search');}
 compare(){this.compareOrigin=this.returnTo;this.comparisonAnchor=this.id;this.compareId='';this.replaceSide=1;this.query='';this.category='All';this.categoryPage=0;this.keyboard=false;this.pickerReturn='dish';this.a.setScreen('comparePicker');}
 replace(side:0|1){this.replaceSide=side;this.query='';this.category='All';this.categoryPage=0;this.keyboard=false;this.pickerReturn='comparison';this.a.setScreen('comparePicker');}
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
 private picture(d:MarketDish,x:number,y:number,size:number){
  const a=this.a,c=a.context,key=d.id+'|'+(d.portion?.layers.map(l=>l.sha256).join()??d.image);a.rect(x,y,size,size,'#e5d1a6');
  if(!this.pending.has(key)&&!this.previews.has(key)&&!this.failed.has(key)){this.pending.add(key);void loadPortionImages(d,AbortSignal.any([this.previewAbort.signal,AbortSignal.timeout(15000)])).then(result=>{if(!this.previewAbort.signal.aborted){if(this.previews.size>=40)this.previews.delete(this.previews.keys().next().value!);this.previews.set(key,result);a.invalidate();}}).catch(()=>{this.failed.add(key);a.invalidate();}).finally(()=>this.pending.delete(key));}
  const preview=this.previews.get(key);
  if(this.photoMode||!preview){a.picture(d.image,x+12,y+12,size-24,size-24);}else{
   c.save();c.beginPath();c.rect(x+4,y+4,size-8,size-8);c.clip();
   c.fillStyle='#967a4c40';c.beginPath();c.ellipse(x+size/2,y+size*.83,size*.3,size*.045,0,0,Math.PI*2);c.fill();
   const dx=a.reducedMotion?0:this.artX,dy=a.reducedMotion?0:this.artY;
   for(const layer of preview.images){const ratio=layer.image.naturalHeight/layer.image.naturalWidth,w=size-24,h=w*ratio;c.save();c.translate(x+size/2+dx*layer.depth,y+size/2+dy*layer.depth);c.transform(1,dy*.002,dx*.002,1,0,0);c.drawImage(layer.image,-w/2,-h/2,w,h);c.restore();}c.restore();
  }
  a.text(this.photoMode?(d.illustrative?'ILLUSTRATIVE IMAGE':'PHOTO'):preview?.layered?'2.5D PREVIEW':'PHOTO PREVIEW',x+14,y+27,20,muted);
  this.detailPreview.show(d,this.photoMode,a.reducedMotion,a.immersive);
  a.button(this.photoMode?'2.5D preview':d.illustrative?'Illustrative image':'Original photo',x+8,y+size-44,214,36,()=>{this.photoMode=!this.photoMode;},false,'normal');
  a.button(this.detailPreview.status.includes('Retry')?'Retry':'Reset view',x+230,y+size-44,122,36,()=>{this.artX=this.artY=0;this.detailPreview.reset();if(this.detailPreview.status.includes('Retry')){this.detailPreview.retry();this.failed.delete(key);this.previews.delete(key);}},false,'normal');
 }
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
   this.heading(live?.name??'Restaurant');a.text(live?.demo?'MENU':'PUBLISHED MENU',100,166,24,muted);
   a.button('Search all dishes',880,146,290,42,()=>this.search(),false,'normal');
   if(!items.length)this.textBlock(a.publishedMessage||'Menu unavailable. Reopen this restaurant to refresh.',100,260,990,32);
   items.slice(a.page*4,a.page*4+4).forEach((dish,i)=>{const y=204+i*92;dish.menuImage?a.picture(dish.menuImage,100,y,78,78):foodIcon(a.context,dish.category,110,y+10,58);a.button(dish.name,200,y,680,48,()=>this.show(dish.id,'publishedMenu'),false,'normal');a.text(dish.category,212,y+76,23,muted);a.text(dish.price,925,y+34,28);});
   this.pages(items.length,4,605);return true;
  }
  if(a.screen==='search'||a.screen==='comparePicker'){
   const picking=a.screen==='comparePicker';this.heading(picking?'Compare · choose any second dish':'Search the night market');
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
  if(a.screen==='ar'){
   const has3d=!!d.modelId||(!d.photoCredit&&!d.illustrative&&!!generatedModelId(d.id));
   a.context.fillStyle='#0b1428';a.context.fillRect(0,0,1280,720);
   a.rect(22,20,1236,105);a.titleText(d.name,46,65,40);a.text(a.portalStatus||'Loading portion…',48,99,23,muted);a.button('Back',1134,42,100,50,()=>a.close(),false,'normal');
   a.context.strokeStyle='#40b8bb';a.context.lineWidth=3;a.context.strokeRect(46,145,1188,429);
   if(a.modelError){a.picture(d.image,460,176,360,360);a.text(a.modelError,65,565,24,cream);}
   a.text(a.immersive?'Physical scale locked · Walk closer to inspect':a.portalFlat?'2.5D · Zoomed screen preview · Physical scale in Quest':'3D · Drag to rotate · Zoom for a closer look',65,605,24,cream);
   a.button(a.portalFlat?'3D model':'2.5D view',1078,583,154,38,()=>{a.portalView=a.portalFlat?'3d':'2.5d';a.resetPortal();a.onPortal(d.id);},a.portalFlat&&!has3d,'normal');
   a.button('Reset',48,628,150,46,()=>a.resetPortal(),false,'normal');a.button('−',212,628,65,46,()=>a.zoom(.1),a.immersive,'normal');a.button('+',289,628,65,46,()=>a.zoom(-.1),a.immersive,'normal');
   a.button('Previous dish',374,628,210,46,()=>a.nextDish(-1),false,'normal');a.button('Next dish',600,628,200,46,()=>a.nextDish(1),false,'normal');
   if(!a.immersive)a.button('View on Quest',820,628,240,46,()=>a.onXR());return true;
  }
  if(a.screen==='comparison'){
   const other=list.find(item=>item.id===this.compareId);this.heading('Compare dishes');
   if(!other||other.id===d.id){a.text('Choose another available dish to compare.',100,235,30);a.button('Choose dish',100,300,500,54,()=>this.replace(1));return true;}
   [d,other].forEach((dish,i)=>{const x=94+i*560;a.rect(x,151,530,441);a.picture(dish.image,x+20,170,170,170);this.textBlock(dish.name,x+209,189,294,29,2);a.text(dish.price,x+209,262,30,'#a65326');this.textBlock(dish.restaurant,x+209,294,294,23,2);a.text(dish.sample?'Menu':'Published menu',x+209,329,21,muted);
    this.textBlock(allergenLabel(dish),x+20,371,480,24,2);this.textBlock(dish.dietary.join(' · ')||'Dietary information not supplied',x+20,433,480,23,2);
    this.textBlock(`Ingredients: ${dish.ingredients.join(', ')}`,x+20,490,480,22,3);
    a.button('Details',x,606,160,46,()=>this.show(dish.id,'comparison'),false,'normal');
    a.button('Replace',x+176,606,160,46,()=>this.replace(i as 0|1),false,'normal');
    a.button('Portion',x+352,606,160,46,()=>{this.portalReturn='comparison';a.portalDishId=dish.id;a.setScreen('ar');});
   });return true;
  }
  this.heading('Dish details');
  this.picture(d,114,155,360);this.textBlock(d.photoCredit??d.description,110,540,388,22,2);a.text(d.illustrative?'ILLUSTRATIVE IMAGE':d.photoCredit?'RESTAURANT PHOTO · GAME RECIPE':d.sample?'MENU':'PUBLISHED MENU',112,609,21,muted);
  a.text(d.servingCount?`Serves ${d.servingCount}`:'Serving count not supplied',112,644,23);
  const x=528;a.text(`CATEGORY · ${d.category.toUpperCase()}`,x,172,22,muted);this.textBlock(d.name,x,208,640,37,2);a.text(d.price,x,282,32,'#a65326');
  a.button(this.info?'Ingredients':'More info',1000,257,177,38,()=>{this.info=!this.info;this.infoPage=0;},false,'normal');
  if(this.info){
   const lines=this.textBlock(d.description,x,330,640,26,0);lines.slice(this.infoPage*7,this.infoPage*7+7).forEach((line,i)=>a.text(line,x,330+i*30,26));
   a.text('For allergy questions, ask the restaurant staff.',x,563,23,muted);
   a.button('Previous info',x,575,190,38,()=>{this.infoPage--;},this.infoPage===0,'normal');a.button('Next info',990,575,190,38,()=>{this.infoPage++;},(this.infoPage+1)*7>=lines.length,'normal');
  }else{
   let y=this.allergy(d,x,315,640);y=Math.max(y+36,421);
   a.text(d.photoCredit?'GAME RECIPE INGREDIENTS':'INGREDIENTS',x,y,23,muted);
   const rows=Math.max(1,Math.min(2,Math.floor((594-y)/65))),count=rows*3;
   this.ingredientPage=Math.min(this.ingredientPage,Math.max(0,Math.ceil(d.ingredients.length/count)-1));
   d.ingredients.slice(this.ingredientPage*count,this.ingredientPage*count+count).forEach((name,i)=>{
    const xx=x+(i%3)*216,yy=y+14+Math.floor(i/3)*65;
    a.rect(xx,yy,202,57,'#ffffff');foodIcon(a.context,name,xx+8,yy+12.5,32);
    const lines=this.textBlock(name,0,0,145,21,0).slice(0,2),c=a.context;
    c.save();c.textAlign='center';c.textBaseline='middle';
    lines.forEach((line,j)=>a.text(line,xx+120.5,yy+28.5+(j-(lines.length-1)/2)*23,21));c.restore();
   });
   if(!d.ingredients.length)a.text('Ingredients not supplied',x,y+40,23);
   if(d.ingredients.length>count){a.button('‹',x+380,y-28,45,34,()=>{this.ingredientPage--;},this.ingredientPage===0,'normal');a.text(`${this.ingredientPage+1}/${Math.ceil(d.ingredients.length/count)}`,x+438,y-3,22);a.button('›',x+500,y-28,45,34,()=>{this.ingredientPage++;},(this.ingredientPage+1)*count>=d.ingredients.length,'normal');}
  }
  a.button('View Portion',528,622,218,46,()=>this.portion());a.button('Compare',762,622,190,46,()=>this.compare(),false,'normal');
  if(d.modelId){a.button(a.state.tastingList.includes(d.id)?'Saved':'Save',970,622,100,46,()=>a.result(toggleSavedDish(a.state,d.id)),false,'normal');a.button('+ Tray',1082,622,98,46,()=>a.result(changeQuantity(a.state,d.id,1)),(a.state.tray.find(l=>l.dish===d.id)?.qty??0)>=3,'normal');}
  else a.button('Search dishes',970,622,210,46,()=>this.search(),false,'normal');
  return true;
 }
}
