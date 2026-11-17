import { restaurantLogo } from './market-map-ui';
import { districtIconNames } from './district-icons';
import { liveRestaurants } from '../published/market';
import type { GlimmerApp } from './app';
import { districts, restaurants, finds, colours, headwear, colourThresholds, headwearThresholds } from './data';
import { chooseOutfit } from './state';
const cream='#f3e6c8', ink='#3a1f18';
const coatHex=['#f5c518','#e0414f','#1fb5a8','#a98be6','#94d8b5','#ef8868','#29345e','#f6c49f'];
const coatFiles=['yellow','cherry','teal','lavender','mint','coral','midnight','peach'];
const hatFiles=['hood','buckethat','catbeanie','souwester'];

/** Reference layouts, in the same canvas space used by mouse and Quest rays. */
export function renderReference(a:GlimmerApp):boolean {
 const c=a.context;
 const icon=(name:string,x:number,y:number,size=32,color=ink)=>a.icon(name,x,y,size,color);
 const button=(label:string,x:number,y:number,w:number,h:number,action:()=>void,ico='',selected=false,disabled=false)=>{
   a.button(label,x,y,w,h,action,disabled,selected?'selected':'normal',ico);
 };
 const frame=(title:string,ico:string,height=620)=>{
   c.fillStyle='#05071a8c';c.fillRect(0,0,1280,720);
   a.rect(140,32,1000,height);a.patch('assets/ui/panels/rail_wood.png',115,20,1050,18,[24,0,24,0]);
   a.patch('assets/ui/panels/flap_cream.png',148,40,700,106,[24,16,24,32]);
   a.patch('assets/ui/panels/flap_cream.png',852,40,132,106,[24,16,24,32]);
   a.patch('assets/ui/panels/flap_cream.png',988,40,144,106,[24,16,24,32]);
   icon(ico,180,73,46);a.titleText(title,242,110,48);
   button('Back',1030,61,76,76,()=>a.close(),'close');
 };
 const tabs=()=>{
   if(a.wardrobeInPortal&&a.screen==='wardrobe'){
     button('Order',170,154,200,72,()=>a.setScreen('order'),'tray');
     button('Wardrobe',386,154,236,72,()=>a.setScreen('wardrobe'),'hanger',true);return;
   }
   button('Wardrobe',170,154,200,72,()=>a.setScreen('wardrobe'),'hanger',a.screen==='wardrobe');
   button('Market Guide',386,154,236,72,()=>a.setScreen('guide'),'book',a.screen==='guide');
   button('Passport',638,154,200,72,()=>a.setScreen('passport'),'passport',a.screen==='passport');
 };
 if(a.screen==='explore'){
   button('Pause',24,24,76,76,()=>a.gamepadPause(),'pause');
   const d=districts.find(d=>d.district===a.state.district)!;
   const mx=1020,my=26,mw=232,mh=180;
   a.patch('assets/ui/minimap/minimap_frame.png',mx,my,mw,mh,[24,24,24,24]);
   c.fillStyle='#171d44';c.fillRect(mx+13,my+13,mw-26,mh-26);
   const sx=(mw-30)/d.width_tiles,sy=(mh-46)/d.height_tiles;
   d.rows.forEach((row,y)=>[...row].forEach((cell,x)=>{c.fillStyle=cell==='#'?'#242b60':cell==='~'?'#183c58':'#3d487a';c.fillRect(mx+15+x*sx,my+13+y*sy,sx-.3,sy-.3);}));
   restaurants.filter(r=>r.district===d.district).forEach(r=>{
     const o=d.objects.find(o=>o.id===r.id)!;const x=mx+15+o.pivot[0]*sx,y=my+13+(o.pivot[1]-3)*sy;
     c.fillStyle=cream;c.fillRect(x-20,y-20,40,40);c.fillStyle='#0f1533';c.fillRect(x-18,y-18,36,36);a.image(r.emblem,x-17,y-17,34);
     if(a.state.stamps.includes(r.id)){a.rect(x+8,y+8,20,22);icon('check',x+10,y+10,16,'#256b43');}
   });
   d.objects.filter(o=>o.kind==='published-restaurant').forEach(o=>{const x=mx+15+o.pivot[0]*sx,y=my+13+(o.pivot[1]-3)*sy;c.fillStyle=cream;c.fillRect(x-12,y-12,24,24);restaurantLogo(a,{id:o.id,cuisine:o.asset.slice(4)},x-11,y-11,22);});
   c.fillStyle='#f5c518';c.fillRect(mx+15+a.market.player.x*sx-4,my+13+a.market.player.y*sy-4,8,8);
   icon(districtIconNames[d.district],mx+20,my+mh-39,24,cream);a.text(d.name,mx+52,my+mh-18,26,cream);
   a.hit('Market Map',mx,my,mw,mh,()=>a.openPanel('map'));
   a.rect(1020,220,232,76);icon('passport',1045,242,28);a.text(`${a.state.stamps.length}/7`,1080,272,29);icon('charm',1140,242,28);a.text(`${a.state.finds.length}/28`,1178,272,29);
   a.hit('Passport',1020,220,232,76,()=>a.openPanel('passport'));
   a.rect(1150,314,102,76);icon('heart',1168,338,32,'#f89537');a.text(String(a.state.tastingList.length),1214,366,27);a.hit('Tasting List',1150,314,102,76,()=>a.openPanel('tasting'));
   a.iconButton('Search dishes','search',1176,406,76,64,()=>a.dining.search());
   // Small tray access belongs to the full game's HUD; the reference's corner layout stays clear.
   button('Order Tray',24,642,154,54,()=>a.openPanel('tray'),'tray');
   const o=a.market.focusDetails;
   if(o){
     const f=finds.find(f=>f.id===o.id),r=restaurants.find(r=>r.id===o.id);
     const label=liveRestaurants.get(o.id)?.name??r?.name??(o.kind==='find-holo'?'Vendor special':f?.label.replace(/^Chat with /,''))??({'order-portal':'Order Portal',kiosk:'PeekaPlate Kiosk',gate:'Market Gate',vending:'Vending machine'} as Record<string,string>)[o.kind]??o.label??'Look';
     const verb=({'published-restaurant':'Open menu',vending:'Use machine','restaurant':'Open menu','find-person':'Talk','find-cat':'Greet','find-holo':'Scan','order-portal':'Order',kiosk:'Use kiosk',bench:'Sit','find-puddle':'Look closer','find-wish':'Hang a wish','find-bottle':'Read the note'} as Record<string,string>)[o.kind]??'Look';
     c.font='32px Jersey';const w=Math.max(140,Math.min(380,c.measureText(label).width+40));
     const x=Math.max(110,Math.min(970-w,o.screenX-w/2)),y=Math.max(112,Math.min(460,o.screenY-(o.kind==='gate'?440:220)));
     a.rect(x,y,w,70);a.text(label,x+20,y+46,32);
     a.rect(x+Math.max(0,(w-180)/2),y+76,180,68);const bx=x+Math.max(0,(w-180)/2);
     a.patch('assets/ui/prompts/keycap.png',bx+12,y+87,42,44,[16,16,16,24]);a.text(a.gamepadConnected?'A':'E',bx+23,y+118,30);a.text(verb,bx+62,y+119,Math.min(28,145/verb.length*1.5));
     a.hit(verb,bx,y+76,180,68,()=>a.market.interact());
   }
   return true;
 }
 if(a.screen==='dialogue'){
   if(a.dialogueElapsed<0)return true;
   const holo=a.dialogueKind==='find-holo', x=210,y=492,w=860,h=188;
   a.rect(x,y,w,h,holo?'#0f1533':cream);
   a.patch(`assets/ui/panels/flap_${holo?'teal':a.dialogueKind==='find-cat'?'plum':'red'}.png`,x+26,y-40,Math.max(100,a.title.length*16+40),60,[24,16,24,32]);
   a.titleText(a.title,x+46,y+1,32,holo?cream:ink);
   c.fillStyle=holo?'#1f2453':'#e2cfa6';c.fillRect(x+28,y+24,114,140);
   if(holo)icon('holo',x+47,y+60,76,'#2ee6ff');
   else if(a.dialoguePortrait)a.spriteImage(a.dialoguePortrait,x+50,y+40,a.dialogueKind==='find-cat'?16:24,a.dialogueKind==='find-cat'?16:32,a.dialogueKind==='find-cat'?88:76,a.dialogueKind==='find-cat'?88:116,a.dialogueTyping?2:0);
   else icon(a.dialogueKind==='find-wish'?'lantern':a.dialogueKind==='find-puddle'?'ticket':'book',x+51,y+60,66);
   a.wrap(a.visibleDialogue,x+160,y+52,630,32,holo?'#e9fbff':ink);
   a.patch('assets/ui/prompts/keycap.png',x+w-170,y+h-60,42,44,[16,16,16,24]);a.text(a.gamepadConnected?'A':'E',x+w-159,y+h-27,30);
   a.text('Next',x+w-120,y+h-26,29,holo?'#9ff6ff':ink);icon('chev_right',x+w-56,y+h-52,32,holo?'#9ff6ff':ink);
   a.hit('Next',x,y,w,h,()=>a.advanceDialogue());return true;
 }
 if(a.screen==='pause'){
   frame('Paused','pause',430);
   const col=[180,496,812],row=[166,260,354],w=286,h=78;
   a.button('Resume',col[0],row[0],w,h,()=>a.close(),false,'primary');
   button(`Passport     ${a.state.stamps.length}/7`,col[0],row[1],w,h,()=>a.openPanel('passport'),'passport');
   button(`Tasting List     ${a.state.tastingList.length}`,col[0],row[2],w,h,()=>a.openPanel('tasting'),'heart');
   button('Controls',col[1],row[0],w,h,()=>a.openPanel('guide'),'book');
   button('Market code',col[1],row[1],w,h,()=>a.showCode(),'code');
   button('Restart market',col[1],row[2],w,h,()=>a.setScreen('restart'),'restart');
   button(`Sound       ${a.muted?'Off':'On'}`,col[2],row[0],w,h,()=>a.toggleSound(),'sound');
   button(`Music       ${a.musicMuted?'Off':'On'}`,col[2],row[1],w,h,()=>a.toggleMusic(),'music');
   button(`Reduced motion  ${a.reducedMotion?'On':'Off'}`,col[2],row[2],w,h,()=>a.toggleMotion(),'motion');return true;
 }
 if(a.screen==='wardrobe'){
   frame(a.kioskOpen?'PeekaPlate Kiosk':a.wardrobeInPortal?'Order Portal':'Wardrobe','lantern');tabs();
   c.fillStyle='#e2cfa6';c.fillRect(178,244,154,360);
   a.spriteImage(`assets/characters/player-${coatFiles[a.state.colour]}-${hatFiles[a.state.headwear]}.png`,218,346,16,24,80,120);a.text('Your look',196,514,30);
   a.text('Raincoat',360,272,30);
   colours.forEach((name,i)=>{const x=360+(i%4)*184,y=286+Math.floor(i/4)*94,locked=a.state.finds.length<colourThresholds[i];
     a.button(locked?`${name} · Find ${colourThresholds[i]}`:name,x,y,174,78,()=>a.result(chooseOutfit(a.state,'colour',i)),locked,a.state.colour===i?'selected':'normal','',42);
     if(locked)icon('padlock',x+12,y+24,24);else{c.fillStyle=coatHex[i];c.fillRect(x+12,y+26,22,26);c.strokeStyle=ink;c.lineWidth=2;c.strokeRect(x+12,y+26,22,26);}
     if(a.state.colour===i){c.fillStyle=ink;c.fillRect(x+148,y-12,32,32);icon('check',x+150,y-10,28,'#ffd56b');}
   });
   a.text('Headwear',360,498,30);
   headwear.forEach((name,i)=>{const x=360+i*184,locked=a.state.finds.length<headwearThresholds[i];button(locked?`${name} · Find ${headwearThresholds[i]}`:name,x,514,174,78,()=>a.result(chooseOutfit(a.state,'headwear',i)),locked?'padlock':hatFiles[i],a.state.headwear===i,locked);if(a.state.headwear===i){c.fillStyle=ink;c.fillRect(x+148,502,32,32);icon('check',x+150,504,28,'#ffd56b');}});return true;
 }
 if(a.screen==='guide'){
   frame(a.kioskOpen?'PeekaPlate Kiosk':'Controls','book');if(a.kioskOpen)tabs();
   let y=a.kioskOpen?274:198;
   y=a.wrap(a.gamepadConnected?'Left stick / D-pad: walk and select. A / Cross: interact and confirm. B / Circle: back. Menu / Options: pause. X / Square: tray. Y / Triangle: passport. View / Share: map.':'Walk with WASD / arrows or click a destination. E: interact. Escape: pause / back. Tab: passport. O: order tray. M: map. F: tasting list. Quest: left thumbstick to move; point and trigger to select.',185,y,900,30);
   y=a.wrap('Explore three districts. Open seven restaurant menus to collect stamps. Greet cats, talk to locals, scan holo ads and look into puddles for restaurant coupons and other finds.',185,y+22,900,30);
   a.wrap('Finds unlock raincoats and hats. Save favourite dishes to your Tasting List. Write down your Market code to continue another day.',185,y+22,900,30);
   if(!a.kioskOpen)button('Enter Meta Quest VR',185,542,360,54,()=>a.onXR(),'cube');
   a.text('Demo menus only. No payment or real order submission.',185,620,25);return true;
 }
 if(a.screen==='passport'){
   frame(a.kioskOpen?'PeekaPlate Kiosk':'Market Passport','passport');if(a.kioskOpen)tabs();
   const top=a.kioskOpen?236:158;
   districts.forEach((d,i)=>button(d.name,180+i*308,top,292,48,()=>{a.page=i;a.invalidate();},districtIconNames[d.district],a.page===i));
   const d=districts[a.page%3],rs=restaurants.filter(r=>r.district===d.district),fy=top+56;
   rs.forEach((r,i)=>{const x=240+i*290,on=a.state.stamps.includes(r.id);a.image(on?r.stamp:r.stampEmpty,x,fy,126);a.text(r.name,x-34,fy+150,28);a.text(on?'Stamped':'Not visited yet',x-20,fy+177,25);});
   const fs=finds.filter(f=>f.district===d.district),count=fs.filter(f=>a.state.finds.includes(f.id)).length;
   a.text(`Hidden finds ${count}/${fs.length}`,184,fy+214,30);
   const categories=[['Cats','find-cat','cat'],['Coupons','find-puddle','ticket'],['People','find-person','person'],['Specials','find-holo','holo'],['Wishes','find-wish','lantern'],['Notes','find-bottle','book']].filter(([,kind])=>fs.some(f=>f.kind===kind));
   categories.forEach(([label,kind,ico],i)=>{const x=184+(i%2)*460,y=fy+226+Math.floor(i/2)*43;a.text(label,x,y+30,26);fs.filter(f=>f.kind===kind).forEach((f,j)=>{a.rect(x+130+j*42,y,34,34);if(a.state.finds.includes(f.id)){icon(f.coupon?'ticket':ico,x+134+j*42,y+4,26);a.hit(f.label,x+130+j*42,y,34,34,()=>a.readFind(f.id));}else a.text('?',x+141+j*42,y+27,26);});});
   if(!a.kioskOpen)button('Market code',838,591,260,44,()=>a.showCode(),'code');return true;
 }
 if(a.screen==='finale'){
   const grand=a.finaleDistrict===null,rs=grand?restaurants:restaurants.filter(r=>r.district===a.finaleDistrict);
   frame(grand?'Market complete!':a.title,grand?'lantern':districtIconNames[a.finaleDistrict!],510);
   const size=grand?108:160,space=grand?128:250,start=640-(rs.length*space)/2;
   rs.forEach((r,i)=>a.image(r.stamp,start+i*space+(space-size)/2,185,size));
   a.text(grand?'All seven restaurants stamped. The whole market glows.':rs.length===3?'All three restaurants stamped.':'Both restaurants stamped.',210,grand?345:387,32);
   if(grand){a.text(`Tasting List: ${a.state.tastingList.length} dishes · Hidden finds: ${a.state.finds.length}/28 · Orders: ${a.state.ordersPlaced}`,210,398,28);button('Tasting List',505,450,280,62,()=>a.openPanel('tasting'),'heart');button('Market code',805,450,280,62,()=>a.showCode(),'code');}
   a.button('Keep wandering',190,450,grand?295:895,62,()=>a.close(),false,'primary');return true;
 }
 return false;
}
