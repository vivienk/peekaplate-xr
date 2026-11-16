import { GlimmerAudio } from './audio';
import { defaultFocus, directionalFocus } from './gamepad';
import { MarketWorld } from './market';
import { restaurants, dishes, districts, finds, colours, headwear, colourThresholds, headwearThresholds, type Dish, type DistrictId } from './data';
import { createState, awardStamp, collectFind, toggleSavedDish, chooseOutfit, changeQuantity, placeOrder, advanceTime, travel, nextFinale, encodeMarketCode, decodeMarketCode, normalizeCode, CODE_ALPHABET, type RuleResult } from './state';

type Screen = 'title'|'codeEntry'|'explore'|'menu'|'dish'|'ar'|'tray'|'order'|'confirm'|'ticket'|'passport'|'map'|'tasting'|'wardrobe'|'guide'|'dialogue'|'pause'|'restart'|'code'|'finale';
interface Button {x:number;y:number;w:number;h:number;label:string;action:()=>void;disabled:boolean}
const base = `${import.meta.env.BASE_URL}glimmer/`;
const ink='#321b15', cream='#f3e6c8', orange='#F89537';
export class GlimmerApp {
  canvas=document.createElement('canvas');
  context:CanvasRenderingContext2D;
  private overlay=document.createElement('canvas');
  private output:CanvasRenderingContext2D;
  private uiDirty=true;
  market:MarketWorld;
  state=createState();
  screen:Screen='title';
  buttons:Button[]=[];
  selectedDish: Dish=dishes[0];
  restaurant=restaurants[0];
  page=0;
  code='';
  dialogue:string[]=[];
  dialogueIndex=0;
  title='';
  toast=''; toastTime=0;
  reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  muted=false;
  portalYaw=Math.PI/6; portalPitch=Math.PI/6; portalZoom=1; portalIdle=0;
  private errorText='';
  get modelError(){return this.errorText;}
  set modelError(value:string){this.errorText=value;this.uiDirty=true;}
  private returnFromDish:Screen='menu';
  private codeReturn:Screen='passport';
  private wardrobeReturn:Screen='guide';
  private pendingFocusPause=false;
  private talked=new Set<string>();
  private pauseReturn:Screen='explore';
  private queue:string[]=[];
  private images=new Map<string,HTMLImageElement>();
  private audio=new GlimmerAudio();
  musicMuted=false;
  gamepadConnected=false;
  private keyHandler=(e:KeyboardEvent)=>this.key(e);
  private blurHandler=()=>{if(this.market.isTravelling){this.pendingFocusPause=true;return;}if(this.screen==='explore'){this.pauseReturn='explore';this.setScreen('pause');}};
  private accessible=document.createElement('nav');
  private accessibleKey='';
  onPortal:(id:string|null)=>void=()=>{};
  onOrderReady:()=>void=()=>{};
  onXR:()=>void=()=>{};
  constructor(){
    this.canvas.width=1280;this.canvas.height=720;
    this.overlay.width=1280;this.overlay.height=720;this.context=this.overlay.getContext('2d')!;this.output=this.canvas.getContext('2d')!;
    this.market=new MarketWorld({onInteract:id=>this.interact(id),onTravel:id=>{this.result(travel(this.state,id as DistrictId));this.musicForDistrict();this.onOrderReady();if(this.pendingFocusPause){this.pendingFocusPause=false;this.pauseReturn='explore';this.setScreen('pause');}},onSound:id=>this.sound(id)});
    window.addEventListener('keydown',this.keyHandler);window.addEventListener('blur',this.blurHandler);
    this.accessible.setAttribute('aria-label','Glimmer Plate controls');
    this.accessible.style.cssText='position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden';document.body.append(this.accessible);
    for(const [family,path] of [['Jersey','jersey-20/Jersey20-Regular.ttf'],['JerseyTitle','jersey-10/Jersey10-Regular.ttf']]){
      const font=new FontFace(family,`url(${base}assets/ui/fonts/${path})`);void font.load().then(f=>{document.fonts.add(f);this.uiDirty=true;}).catch(()=>{});
    }
  }
  setScreen(screen:Screen){
    this.uiDirty=true;const wasAR=this.screen==='ar';this.screen=screen;this.page=0;this.keyboardFocus=-1;this.buttons=[];
    this.market.setEnabled(screen==='explore');this.market.setPaused(screen==='pause'||screen==='restart');
    if(wasAR&&screen!=='ar')this.onPortal(null);
    if(screen==='ar'){this.resetPortal();this.modelError='';this.onPortal(this.selectedDish.id);this.sound('sfx-portal-open');}

    console.info(`[GLIMMER] screen=${screen} stamps=${this.state.stamps.length} finds=${this.state.finds.length}`);
  }
  start(restored=false){
    if(!restored)this.state=createState();this.onOrderReady();this.talked.clear();this.queue=[];this.toastTime=0;
    this.market.setDistrict('d1-rain-alley');this.sync();this.setScreen('explore');
    this.market.startEntry();this.musicForDistrict();this.notify(this.gamepadConnected?'Left stick: walk · A / Cross: interact · Menu / Options: controls':restored?'Welcome back!':'Walk with WASD / arrows. Point and click to walk. E to interact.');
  }
  sync(){this.uiDirty=true;this.market.setFound(new Set(this.state.finds));this.market.setOutfit(this.state.colour,this.state.headwear);}
  notify(message:string){this.uiDirty=true;if(!message)return;if(this.toastTime>0)this.queue.push(message);else{this.toast=message;this.toastTime=2.5;}}
  result(r:RuleResult){this.notify(r.message);for(const name of r.unlocks??[]){this.notify(`Unlocked: ${name} — try it at a kiosk`);this.sound('sfx-unlock');}this.sync();}
  sound(id:string){this.audio.play(id);}
  unlockAudio(){this.audio.unlock();}
  musicForDistrict(){this.audio.setDistrict(this.state.district);}
  interact(id:string){
    if(this.screen!=='explore')return;
    const restaurant=restaurants.find(r=>r.id===id);
    if(restaurant){this.restaurant=restaurant;const result=awardStamp(this.state,id);this.result(result);if(result.changed)this.sound('sfx-stamp');this.setScreen('menu');return;}
    const find=finds.find(f=>f.id===id&&f.district===this.state.district);
    if(find){this.result(collectFind(this.state,id));this.sound(find.kind==='find-cat'?'sfx-cat-purr':'sfx-find');if(find.kind==='find-puddle')return;this.title=find.label;this.dialogue=find.lines;this.dialogueIndex=this.talked.has(id)?find.lines.length-1:0;this.talked.add(id);this.setScreen('dialogue');return;}
    const obj=districts.find(d=>d.district===this.state.district)?.objects.find(o=>o.id===id);
    if(obj?.kind==='order-portal'){this.setScreen('order');return;}
    if(obj?.kind==='kiosk'){this.setScreen('guide');return;}
    if(obj?.kind==='bench'){this.market.setSeated(true);this.notify('A quiet moment in the rain. Move to stand.');return;}
    this.title=String(obj?.label??(obj?.kind==='vending'?'Vending machine':'Market sign'));
    this.dialogue=[obj?.kind==='vending'?'A cold can clinks into the tray. Stay dry out there!':this.title.includes('Lantern')?'This way to Lantern Steps: tea stalls and grills up the stone stairs.':this.title.includes('Fogline')?'This way to Fogline Pier: chowder and sushi by the bay.':'Back to Rain Alley, where the market began.'];this.dialogueIndex=0;this.setScreen('dialogue');
  }
  close(){
    if(this.screen==='title')return;
    if(this.screen==='wardrobe'){this.setScreen(this.wardrobeReturn);return;}
    if(this.screen==='ar'){this.setScreen('dish');return;}
    if(this.screen==='dish'){this.setScreen(this.returnFromDish);return;}
    if(this.screen==='code'){this.setScreen(this.codeReturn);return;}
    if(this.screen==='codeEntry'){this.setScreen('title');return;}
    if(this.screen==='confirm'){this.setScreen('order');return;}
    if(this.screen==='restart'){this.setScreen('pause');return;}
    if(this.screen==='pause'){this.setScreen(this.pauseReturn);return;}
    this.setScreen('explore');const finale=nextFinale(this.state);
    if(finale){this.market.triggerFinale(finale.kind==='grand');this.title=finale.kind==='grand'?'The whole market, in your passport!':`${districts.find(d=>d.district===finale.district)?.name} complete!`;this.setScreen('finale');this.sound(finale.kind==='grand'?'sfx-grand-finale':'sfx-finale');}
  }
  showDish(id:string,from:Screen='menu'){this.selectedDish=dishes.find(d=>d.id===id)!;this.returnFromDish=from;this.setScreen('dish');}
  showCode(){this.codeReturn=this.screen;this.setScreen('code');}
  resetPortal(){this.portalYaw=Math.PI/6;this.portalPitch=Math.PI/6;this.portalZoom=1;this.portalIdle=0;}
  rotate(dx:number,dy=0){this.portalYaw+=dx;this.portalPitch=Math.max(Math.PI/18,Math.min(Math.PI*7/18,this.portalPitch+dy));this.portalIdle=3;}
  zoom(delta:number){this.portalZoom=Math.max(.7,Math.min(1.6,this.portalZoom+delta));}
  nextDish(delta:number){const list=dishes.filter(d=>d.restaurantId===this.selectedDish.restaurantId);this.selectedDish=list[(list.findIndex(d=>d.id===this.selectedDish.id)+delta+list.length)%list.length];this.resetPortal();this.onPortal(this.selectedDish.id);}
  key(e:KeyboardEvent){this.uiDirty=true;
    if(e.metaKey||e.ctrlKey||e.altKey)return;
    if(this.screen==='codeEntry'){
      if(e.key==='Backspace'){e.preventDefault();this.code=this.code.slice(0,-1);return;}
      if(e.key==='Enter'){if(this.code.length===18)this.restore();return;}
      if(e.key.length===1&&CODE_ALPHABET.includes(normalizeCode(e.key))){e.preventDefault();if(this.code.length<18)this.code+=normalizeCode(e.key);return;}
    }
    if(e.key==='Escape'){e.preventDefault();if(this.screen==='explore'){this.pauseReturn='explore';this.setScreen('pause');}else this.close();return;}
    if(this.screen==='ar'){
      const actions:Record<string,()=>void>={ArrowLeft:()=>this.rotate(-Math.PI/4),ArrowRight:()=>this.rotate(Math.PI/4),ArrowUp:()=>this.rotate(0,Math.PI/18),ArrowDown:()=>this.rotate(0,-Math.PI/18),r:()=>this.resetPortal(),'+':()=>this.zoom(-.1),'=':()=>this.zoom(-.1),'-':()=>this.zoom(.1)};
      if(actions[e.key]){e.preventDefault();actions[e.key]();return;}
    }
    if(this.screen!=='explore'&&this.screen!=='ar'&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();this.keyboardFocus=(this.keyboardFocus+(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1)+this.buttons.length)%Math.max(1,this.buttons.length);return;}
    if(e.key==='Tab'&&this.screen==='explore'){e.preventDefault();this.setScreen('passport');return;}
    if(e.key==='Tab'){e.preventDefault();this.keyboardFocus=(this.keyboardFocus+(e.shiftKey?-1:1)+this.buttons.length)%Math.max(1,this.buttons.length);return;}
    if((e.key==='Enter'||e.key===' '||e.key.toLowerCase()==='e')&&this.screen!=='explore'&&this.screen!=='codeEntry'){const b=this.buttons[this.keyboardFocus<0?0:this.keyboardFocus];if(b&&!b.disabled){e.preventDefault();b.action();this.unlockAudio();}return;}
    if(e.key==='Enter'&&this.screen==='explore'){this.market.interact();return;}
    if(this.screen==='explore'){
      const shortcuts:Record<string,Screen>={o:'tray',m:'map',f:'tasting',p:'pause',b:'passport'};
      if(shortcuts[e.key.toLowerCase()]){this.pauseReturn='explore';this.setScreen(shortcuts[e.key.toLowerCase()]);}
    }
    if(this.screen==='dish'&&e.key.toLowerCase()==='v')this.setScreen('ar');
  }
  setGamepadConnected(connected:boolean){this.gamepadConnected=connected;this.uiDirty=true;}
  gamepadPause(){if(this.screen==='title')return;if(this.screen==='pause'){this.close();return;}this.pauseReturn=this.screen;this.setScreen('pause');}
  gamepadFocus(dx:number,dy:number){this.keyboardFocus=directionalFocus(this.buttons,this.keyboardFocus,dx,dy);}
  gamepadSelect(){const index=this.keyboardFocus<0?defaultFocus(this.buttons):this.keyboardFocus;const button=this.buttons[index];if(button&&!button.disabled){this.sound('sfx-ui-select');button.action();}}
  gamepadDelete(){this.code=this.code.slice(0,-1);this.uiDirty=true;}
  private focusIndex=-1;
  get keyboardFocus(){return this.focusIndex;}
  set keyboardFocus(value:number){if(value!==this.focusIndex){this.focusIndex=value;this.uiDirty=true;}}
  restore(){try{this.state=decodeMarketCode(this.code);this.sound('sfx-code-ok');this.start(true);}catch{this.notify("That code doesn't match. Check each character and try again.");this.sound('sfx-code-bad');}}
  pointer(x:number,y:number){this.unlockAudio();for(let i=this.buttons.length-1;i>=0;i--){const b=this.buttons[i];if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h){if(!b.disabled){this.sound('sfx-ui-select');b.action();}return;}}if(this.screen==='explore')this.market.pointer(x/2,y/2);}
  update(dt:number){
    const paused=this.screen==='pause'||this.screen==='restart';this.market.update(dt);this.audio.update(dt,this.market.player,paused,this.screen==='ar',this.market.isSeated);
    const ready=advanceTime(this.state,dt,paused);if(ready.changed){this.result(ready);this.sound('sfx-order-ready');this.onOrderReady();}
    if(!paused){const hadToast=this.toastTime>0;this.toastTime=Math.max(0,this.toastTime-dt);if(hadToast&&!this.toastTime)this.uiDirty=true;if(!this.toastTime&&this.queue.length)this.notify(this.queue.shift()!);}
    if(this.screen==='ar'){this.portalIdle=Math.max(0,this.portalIdle-dt);if(!this.reducedMotion&&!this.portalIdle)this.portalYaw+=dt*Math.PI/9;}
    this.render();
  }
  private text(s:string,x:number,y:number,size=28,color=ink){const c=this.context;c.fillStyle=color;c.font=`${size}px Jersey, monospace`;c.fillText(s,x,y);}
  private wrap(s:string,x:number,y:number,width:number,size=26){const c=this.context;c.font=`${size}px Jersey, monospace`;let line='';for(const word of s.split(' ')){if(c.measureText(line+word).width>width){this.text(line,x,y,size);y+=size+5;line='';}line+=word+' ';}this.text(line,x,y,size);return y+size+5;}
  private patch(path:string,x:number,y:number,w:number,h:number,border:[number,number,number,number]):boolean {
    let img=this.images.get(path);if(!img){img=new Image();img.onload=()=>{this.uiDirty=true;};img.src=base+path;this.images.set(path,img);}if(!img.complete||!img.naturalWidth)return false;
    const [l,t,r,b]=border, sx=[0,l,img.width-r,img.width],sy=[0,t,img.height-b,img.height],dx=[x,x+l/2,x+w-r/2,x+w],dy=[y,y+t/2,y+h-b/2,y+h];
    for(let row=0;row<3;row++)for(let col=0;col<3;col++)this.context.drawImage(img,sx[col],sy[row],sx[col+1]-sx[col],sy[row+1]-sy[row],dx[col],dy[row],dx[col+1]-dx[col],dy[row+1]-dy[row]);return true;
  }
  private rect(x:number,y:number,w:number,h:number,fill=cream){
    if(fill===cream&&this.patch('assets/ui/panels/panel_cloth.png',x,y,w,h,[24,24,24,32]))return;
    if(fill==='#0f1533'&&this.patch('assets/ui/panels/panel_holo.png',x,y,w,h,[20,20,20,24]))return;
    const c=this.context;c.fillStyle=ink;c.fillRect(x+4,y+6,w,h);c.fillStyle=fill;c.fillRect(x,y,w,h);c.strokeStyle='#80502f';c.lineWidth=3;c.strokeRect(x,y,w,h);
  }
  private button(label:string,x:number,y:number,w:number,h:number,action:()=>void,disabled=false){const i=this.buttons.length;if(this.gamepadConnected&&this.keyboardFocus<0&&!disabled&&label!=='Back')this.focusIndex=i;if(!this.patch(`assets/ui/buttons/${disabled?'btn_disabled':this.keyboardFocus===i?'btn_primary_hover':'btn_primary'}.png`,x,y,w,h,[20,20,20,disabled?20:24]))this.rect(x,y,w,h,disabled?'#b9ad96':orange);if(this.gamepadConnected&&this.keyboardFocus===i){this.context.strokeStyle=cream;this.context.lineWidth=4;this.context.strokeRect(x+5,y+5,w-10,h-10);}this.text(label,x+12,y+h/2+9,Math.min(27,w/Math.max(1,label.length)*1.65));this.buttons.push({x,y,w,h,label,action:()=>{if(disabled)return;this.uiDirty=true;action();},disabled});}
  private image(path:string,x:number,y:number,w:number,h=w){let img=this.images.get(path);if(!img){img=new Image();img.onload=()=>{this.uiDirty=true;};img.src=base+path;this.images.set(path,img);}if(img.complete&&img.naturalWidth)this.context.drawImage(img,x,y,w,h);}
  private heading(title:string){this.context.fillStyle='#05071acc';this.context.fillRect(0,0,1280,720);this.rect(60,42,1160,625);this.rect(76,58,1128,76,'#206776');this.patch(`assets/ui/panels/flap_${this.screen==='title'?'red':'teal'}.png`,76,58,1128,76,[24,16,24,32]);this.text(title,100,109,43,cream);if(this.screen!=='title')this.button('Back',1080,72,100,45,()=>this.close());}
  private add(id:string,delta=1){const r=changeQuantity(this.state,id,delta);this.result(r);this.sound(r.changed?(delta>0?'sfx-order-add':'sfx-order-remove'):'sfx-code-bad');}
  render(){
    this.output.imageSmoothingEnabled=false;this.output.drawImage(this.market.canvas,0,0,1280,720);if(!this.uiDirty){this.output.drawImage(this.overlay,0,0);return;}this.uiDirty=false;const c=this.context;c.imageSmoothingEnabled=false;c.clearRect(0,0,1280,720);this.buttons=[];
    if(this.screen==='explore'){
      this.rect(20,15,400,52,'#101730');this.text(`${districts.find(d=>d.district===this.state.district)?.name}  •  ${this.state.stamps.length}/7 stamps`,35,49,28,cream);
      [['Passport','passport'],['Map','map'],['Tasting List','tasting'],['Order Tray','tray'],['Pause','pause']].forEach(([label,screen],i)=>this.button(label,20+i*175,654,165,45,()=>{this.pauseReturn='explore';this.setScreen(screen as Screen);}));
      this.button('Enter VR',1090,16,165,45,()=>this.onXR());
      this.button('Interact [E]',1060,654,200,45,()=>this.market.interact());
    }else if(this.screen==='title'){
      this.heading('Glimmer Plate');this.text('NEON RAIN MARKET',330,235,65);this.text('Wander. Discover. Taste the night.',350,292,36);
      if(this.gamepadConnected)this.text('Controller ready · A / Cross selects · B / Circle goes back',235,325,24);
      this.button('Start',350,345,580,65,()=>this.start());this.button('Continue with code',350,435,580,65,()=>{this.code='';this.setScreen('codeEntry');});
      this.button('Enter Meta Quest VR',350,530,580,60,()=>this.onXR());this.text('3 districts · 7 restaurants · 28 little discoveries',342,635,28);
    }else if(this.screen==='codeEntry'){
      this.heading('Continue with Market code');this.text((this.code.padEnd(18,'_').match(/.{6}/g)??[]).join(' - '),300,211,43);
      [...CODE_ALPHABET].forEach((ch,i)=>this.button(ch,220+(i%8)*105,252+Math.floor(i/8)*69,90,55,()=>{if(this.code.length<18)this.code+=ch;}));
      this.button('Delete',220,558,260,60,()=>{this.code=this.code.slice(0,-1);});this.button('Continue',520,558,535,60,()=>this.restore(),this.code.length!==18);
    }else if(this.screen==='menu'){
      this.heading(this.restaurant.name);this.text(this.restaurant.cuisine,98,174,28);
      this.restaurant.dishes.forEach((dish,i)=>{const x=100+i%2*555,y=195+Math.floor(i/2)*138;this.rect(x,y,530,120);this.image(dish.image,x+8,y+10,100);this.button(dish.name,x+120,y+10,393,58,()=>this.showDish(dish.id));this.text('SAMPLE  ·  Price TBA',x+125,y+101,25);});
    }else if(this.screen==='dish'||this.screen==='ar'){
      const d=this.selectedDish;this.heading(this.screen==='ar'?`AR Portal · ${d.name}`:d.name);
      if(this.screen==='dish'){this.image(d.image,125,192,320);this.text('SAMPLE · Price TBA',160,554,30);}else{
        this.rect(100,158,480,380,'#0f1533');this.text(this.modelError||'3D hologram',122,196,26,cream);
        if(this.modelError)this.image(d.image,230,238,200);
        this.button('←',100,559,70,50,()=>this.rotate(-Math.PI/4));this.button('→',185,559,70,50,()=>this.rotate(Math.PI/4));this.button('+',270,559,70,50,()=>this.zoom(-.1));this.button('−',355,559,70,50,()=>this.zoom(.1));this.button('Reset',440,559,140,50,()=>this.resetPortal());
      }
      let y=this.wrap(d.description,615,188,535,28);y=this.wrap(`Ingredients: ${d.ingredients.join(', ')}`,615,y+12,535,25);this.wrap(`Contains: ${d.allergens.join(', ')||'None listed'}`,615,y+12,535,25);
      this.button(this.state.tastingList.includes(d.id)?'Saved ♥':'Save dish',615,400,535,50,()=>{this.result(toggleSavedDish(this.state,d.id));this.sound('sfx-fav-on');});
      const qty=this.state.tray.find(l=>l.dish===d.id)?.qty??0;
      this.button(qty?`In order ×${qty}  [+]`:'Add to order',615,468,435,50,()=>this.add(d.id),qty===3);this.button('−',1070,468,80,50,()=>this.add(d.id,-1),qty===0);
      if(this.screen==='dish')this.button('View in AR Portal',615,546,535,60,()=>this.setScreen('ar'));else{this.button('Prev dish',615,546,250,60,()=>this.nextDish(-1));this.button('Next dish',885,546,265,60,()=>this.nextDish(1));}
    }else if(this.screen==='tray'||this.screen==='order'){
      this.heading(this.screen==='order'?'Order Portal':'Your Order Tray');
      if(!this.state.tray.length){this.text('Your tray is waiting for something delicious.',150,275,36);this.text('Open a restaurant menu and add a SAMPLE dish.',150,330,29);}
      this.state.tray.forEach((line,i)=>{const d=dishes.find(d=>d.id===line.dish)!;const y=155+i*62;this.image(d.image,100,y,50);this.text(`${d.name}  ×${line.qty}`,165,y+34,29);this.button('−',850,y,70,48,()=>this.add(d.id,-1));this.button('+',935,y,70,48,()=>this.add(d.id),line.qty===3);this.button('Remove',1020,y,140,48,()=>this.add(d.id,-3));});
      if(this.screen==='order'){this.button('Wardrobe',100,570,280,56,()=>{this.wardrobeReturn=this.screen;this.setScreen('wardrobe');});this.button('Place demo order',550,570,610,56,()=>this.setScreen('confirm'),!this.state.tray.length);}else this.text('Place your order at any Order Portal.',140,613,30);
    }else if(this.screen==='confirm'||this.screen==='restart'){
      this.heading(this.screen==='confirm'?'Place this demo order?':'Restart market?');this.wrap(this.screen==='confirm'?'Nothing is paid or sent. Your dishes will appear as holograms at the portal table.':'This clears this visit. Write down your Market code first if you want to return.',170,260,900,36);
      this.button(this.screen==='confirm'?'Place order':'Restart market',250,450,780,65,()=>{if(this.screen==='confirm'){const ticket=placeOrder(this.state);if(ticket){this.onOrderReady();this.sound('sfx-order-place');this.setScreen('ticket');}}else{this.state=createState();this.onOrderReady();this.market.setDistrict('d1-rain-alley');this.sync();this.setScreen('title');}});
    }else if(this.screen==='ticket'){
      const t=this.state.ticket!;this.heading(`Order ticket · ${t.number}`);this.text(t.code,300,235,65);this.text(`${t.lines.length} dishes · Holograms ready in 8 seconds`,225,303,32);this.wrap('Use this code to open your order in the Glimmer Plate XR table.',200,370,850,32);this.text('Demo order: nothing is charged or sent.',240,470,33);this.button('Done',350,550,580,60,()=>this.close());
    }else if(this.screen==='passport'||this.screen==='map'){
      this.heading(this.screen==='passport'?'Market Passport':'Market Map');const district=districts[this.page%3];
      districts.forEach((d,i)=>this.button(d.name,100+i*355,151,335,52,()=>{this.page=i;}));
      if(this.screen==='passport'){
        restaurants.filter(r=>r.district===district.district).forEach((r,i)=>{const x=130+i*350;this.image(this.state.stamps.includes(r.id)?r.stamp:r.stampEmpty,x,235,200);this.text(r.name,x,472,27);});
        this.text(`Stamps ${this.state.stamps.length}/7  ·  Hidden finds ${this.state.finds.length}/28  ·  Orders ${this.state.ordersPlaced>9?'9+':this.state.ordersPlaced}`,130,536,29);this.button('Market code',130,570,1020,58,()=>this.showCode());
      }else{
        const s=11,ox=115,oy=230;c.fillStyle='#0e1935';c.fillRect(ox,oy,district.width_tiles*s,district.height_tiles*s);
        district.rows.forEach((row,y)=>[...row].forEach((cell,x)=>{c.fillStyle=cell==='#'?'#442944':cell==='~'?'#126e89':'#99808f';c.fillRect(ox+x*s,oy+y*s,s-1,s-1);}));
        restaurants.filter(r=>r.district===district.district).forEach((r,i)=>{const o=district.objects.find(o=>o.id===r.id)!;c.fillStyle=orange;c.fillRect(ox+o.pivot[0]*s-4,oy+o.pivot[1]*s-4,9,9);this.text(r.name,660,268+i*51,29);});
        if(district.district===this.state.district){c.fillStyle='#fff';c.fillRect(ox+this.market.player.x*s-4,oy+this.market.player.y*s-4,8,8);}this.wrap('White: you. Orange: restaurants. Follow the street exits to discover the next district.',650,450,470,28);
      }
    }else if(this.screen==='wardrobe'){
      this.heading('Wardrobe');this.text(`${this.state.finds.length}/28 finds · ${colours[this.state.colour]} + ${headwear[this.state.headwear]}`,120,181,30);
      colours.forEach((name,i)=>this.button(`${name}${this.state.finds.length<colourThresholds[i]?` · ${colourThresholds[i]} finds`:''}`,100+i%4*278,225+Math.floor(i/4)*88,258,65,()=>{const r=chooseOutfit(this.state,'colour',i);this.result(r);this.sound(r.changed?'sfx-ui-select':'sfx-code-bad');}));
      headwear.forEach((name,i)=>this.button(`${name}${this.state.finds.length<headwearThresholds[i]?` · ${headwearThresholds[i]} finds`:''}`,100+i%2*555,440+Math.floor(i/2)*80,530,60,()=>{this.result(chooseOutfit(this.state,'headwear',i));}));
    }else if(this.screen==='tasting'){
      this.heading(`Tasting List · ${this.state.tastingList.length} dishes`);if(!this.state.tastingList.length)this.text('Save a dish from a restaurant menu to keep it here.',130,290,34);
      this.state.tastingList.slice(this.page*6,this.page*6+6).forEach((id,i)=>{const d=dishes.find(d=>d.id===id)!;this.image(d.image,105,160+i*65,55);this.button(d.name,180,160+i*65,955,50,()=>this.showDish(id,'tasting'));});
      this.button('Previous',100,577,250,50,()=>{this.page--;},this.page===0);this.button('Next',900,577,250,50,()=>{this.page++;},(this.page+1)*6>=this.state.tastingList.length);
    }else if(this.screen==='code'){
      this.heading('Your Market code');this.text(encodeMarketCode(this.state),215,300,58);this.wrap('Write this down. Enter it at the title screen next time to continue. Nothing saves automatically.',200,395,880,34);this.button('Done',350,560,580,60,()=>this.close());
    }else if(this.screen==='dialogue'){
      this.heading(this.title);this.wrap(this.dialogue[this.dialogueIndex]??'',160,280,940,38);this.button(this.dialogueIndex<this.dialogue.length-1?'Next':'Done',350,545,580,60,()=>{if(this.dialogueIndex<this.dialogue.length-1)this.dialogueIndex++;else this.close();});
    }else if(this.screen==='finale'){
      this.heading(this.title);restaurants.forEach((r,i)=>this.image(this.state.stamps.includes(r.id)?r.stamp:r.stampEmpty,120+i*148,225,130));this.text(`Tasting List: ${this.state.tastingList.length} dishes · Hidden finds: ${this.state.finds.length}/28 · Orders placed: ${this.state.ordersPlaced}`,135,420,32);this.button('Keep wandering',120,520,320,60,()=>this.close());this.button('Tasting List',480,520,320,60,()=>this.setScreen('tasting'));this.button('Show market code',840,520,320,60,()=>this.showCode());
    }else if(this.screen==='pause'||this.screen==='guide'){
      this.heading(this.screen==='pause'?'A moment out of the rain':'Market Guide');
      this.wrap(this.gamepadConnected?'Controller: left stick / D-pad moves or selects. A / Cross: interact / confirm. B / Circle: back. Menu / Options: pause. X / Square: tray. Y / Triangle: passport. View / Share: map. Dish view: right stick rotates, triggers zoom, bumpers change dish, Y / Triangle resets.':'Walk: WASD / arrows, click or Quest left thumbstick. Interact: E or point and select. Xbox / PlayStation: connect and press a button. Left stick moves; A / Cross selects; Menu / Options pauses.',120,185,1010,26);
      this.button('Wardrobe',120,330,480,55,()=>{this.wardrobeReturn=this.screen;this.setScreen('wardrobe');});this.button('Market code',650,330,500,55,()=>this.showCode());
      this.button(this.muted?'Sound: off':'Sound: on',120,410,480,55,()=>{this.muted=!this.muted;this.audio.setSoundMuted(this.muted);});
      this.button(`Reduced motion: ${this.reducedMotion?'on':'off'}`,650,410,500,55,()=>{this.reducedMotion=!this.reducedMotion;this.market.reducedMotion=this.reducedMotion;});
      this.button(this.musicMuted?'Music: off':'Music: on',120,575,480,40,()=>{this.musicMuted=!this.musicMuted;this.audio.setMusicMuted(this.musicMuted);});
      this.button('Restart market',120,500,480,55,()=>this.setScreen('restart'));this.button('Return to market',650,500,500,55,()=>this.close());
      this.text('Demo menus only. No payment or real order submission.',155,645,26);
    }
    if(this.toastTime>0){this.rect(155,8,970,46);this.text(this.toast,175,40,27);}
    this.output.drawImage(this.overlay,0,0);
    const key=this.buttons.map(b=>b.label+String(b.disabled)).join('|');if(key!==this.accessibleKey){this.accessibleKey=key;this.accessible.replaceChildren(...this.buttons.map(b=>{const el=document.createElement('button');el.textContent=b.label;el.disabled=b.disabled;el.onclick=()=>{this.unlockAudio();b.action();};return el;}));}
  }
  dispose(){window.removeEventListener('keydown',this.keyHandler);window.removeEventListener('blur',this.blurHandler);this.market.dispose();this.audio.dispose();this.accessible.remove();}
}
