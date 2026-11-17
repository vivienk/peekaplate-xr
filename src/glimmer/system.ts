import { ARPortionPortal } from './ar-portal';
import { generatedModelId } from './generated-models';
import { marketCatalogue } from './catalogue';
import { flatPortion } from './portion-scene';
import { STANDARD_PLATE_METRES } from './standard-plate';
import { createSystem, SessionMode, CanvasTexture, Mesh, PlaneGeometry, MeshBasicMaterial, SRGBColorSpace, NearestFilter, RayInteractable, AssetManager, Group, Box3, Vector3, InputComponent, VisibilityState, AmbientLight, DirectionalLight, type Object3D } from '@iwsdk/core';
import { GlimmerApp } from './app';
import { BrowserGamepad } from './gamepad';
import { glimmerModelId } from './model-assets';

const noGamepads: readonly (Gamepad|null)[] = [];

/** Original pixel world stays stationary in viewing space; dishes are native 3D. */
export class GlimmerSystem extends createSystem({}) {
  app!:GlimmerApp;
  private arPortal!:ARPortionPortal;
  private browserGamepad!:BrowserGamepad;
  private texture!:CanvasTexture;
  private preview=new Group();
  private holograms=new Group();
  private previewGeneration=0;
  private orderGeneration=0;
  private portalAbort:AbortController|null=null;
  private disposePortion:(()=>void)|null=null;
  private stopped=false;
  private pointerStart:{x:number;y:number}|null=null;
  private dragging=false;
  private touchStick:number|null=null;
  private touchStartX=0;private touchStartY=0;
  private touches=new Map<number,{x:number;y:number}>();
  private pinchDistance=0;
  private dragX=0;private dragY=0;
  init(){
    this.app=new GlimmerApp();this.app.refreshPublished();
    if(this.app.handPlacement)this.world.renderer.setPixelRatio(1);
    // Make the game surface an explicit keyboard target in embedded browsers.
    const surface=this.world.renderer.domElement, previousTabIndex=surface.getAttribute('tabindex');
    surface.tabIndex=0;
    const focusGame=()=>surface.focus({preventScroll:true});
    surface.addEventListener('pointerdown',focusGame);
    this.cleanupFuncs.push(()=>{surface.removeEventListener('pointerdown',focusGame);if(previousTabIndex===null)surface.removeAttribute('tabindex');else surface.setAttribute('tabindex',previousTabIndex);});
    this.browserGamepad=new BrowserGamepad(this.app);
    const fit=()=>{if(this.world.visibilityState.peek()!==VisibilityState.NonImmersive)return;const camera=this.world.camera;const aspect=window.innerWidth/window.innerHeight;const distance=Math.max(2.025/2,3.6/(2*aspect))/Math.tan(camera.fov*Math.PI/360)*1.04;camera.position.set(0,1.65,distance-2.8);camera.lookAt(0,1.65,-2.8);camera.updateProjectionMatrix();};
    window.addEventListener('resize',fit);fit();this.cleanupFuncs.push(()=>window.removeEventListener('resize',fit),this.world.visibilityState.subscribe(()=>fit()));

    this.texture=new CanvasTexture(this.app.canvas);this.texture.colorSpace=SRGBColorSpace;this.texture.magFilter=NearestFilter;this.texture.minFilter=NearestFilter;this.texture.generateMipmaps=false;
    const board=new Mesh(new PlaneGeometry(3.6,2.025),new MeshBasicMaterial({map:this.texture,toneMapped:false,transparent:true}));
    board.name='PeekaPlate Market Screen';board.position.set(0,1.65,-2.8);
    const boardEntity=this.world.createTransformEntity(board);boardEntity.addComponent(RayInteractable);
    type Hit={uv?:{x:number;y:number};pointerId?:number;nativeEvent?:{pointerType?:string}};
    const down=(event:Hit)=>{if(!event.uv)return;const x=event.uv.x*1280,y=(1-event.uv.y)*720;if(event.nativeEvent?.pointerType==='touch'){this.touches.set(event.pointerId??0,{x,y});if(this.app.screen==='explore'&&x<512&&y>80&&y<640&&!this.app.buttons.some(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h)){this.touchStick=event.pointerId??0;this.touchStartX=x;this.touchStartY=y;this.app.unlockAudio();return;}if(this.touches.size===2){const points=[...this.touches.values()];this.pinchDistance=Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);}}this.app.pointerDown(x,y);this.pointerStart={x:event.uv.x*1280,y:(1-event.uv.y)*720};this.dragX=this.pointerStart.x;this.dragY=this.pointerStart.y;this.dragging=false;this.app.unlockAudio();};
    const move=(event:Hit)=>{if(!event.uv)return;const x=event.uv.x*1280,y=(1-event.uv.y)*720;if(this.touchStick!==null&&event.pointerId===this.touchStick){this.app.market.setInput(Math.max(-1,Math.min(1,(x-this.touchStartX)/80)),Math.max(-1,Math.min(1,(y-this.touchStartY)/80)));return;}if(this.touches.has(event.pointerId??-1)){const point=this.touches.get(event.pointerId!)!;point.x=x;point.y=y;if(this.touches.size===2&&this.app.screen==='ar'){const points=[...this.touches.values()],distance=Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);this.app.zoom((this.pinchDistance-distance)/250);this.pinchDistance=distance;this.dragging=true;return;}}if(!this.pointerStart){this.app.dining.pointer(x,y);this.app.keyboardFocus=this.app.buttons.findIndex(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);return;}if(this.app.screen!=='ar')return;if(this.pointerStart.x<46||this.pointerStart.x>1234||this.pointerStart.y<145||this.pointerStart.y>574)return;if(Math.hypot(x-this.pointerStart.x,y-this.pointerStart.y)>6)this.dragging=true;if(this.dragging)this.app.rotate((x-this.dragX)*Math.PI/450,(y-this.dragY)*Math.PI/450);this.dragX=x;this.dragY=y;};
    const up=(event:Hit)=>{this.app.pointerUp();this.touches.delete(event.pointerId??-1);if(this.touchStick!==null&&event.pointerId===this.touchStick){this.touchStick=null;this.app.market.setInput(0,0);return;}if(!this.pointerStart)return;const start=this.pointerStart;this.pointerStart=null;if(!this.dragging&&event.uv&&Math.hypot(event.uv.x*1280-start.x,(1-event.uv.y)*720-start.y)<12)this.app.pointer(start.x,start.y);};
    const cancel=()=>{this.app.pointerUp();this.pointerStart=null;this.dragging=false;this.touchStick=null;this.touches.clear();this.app.market.setInput(0,0);};
    board.addEventListener('pointerdown',down);board.addEventListener('pointermove',move);board.addEventListener('pointerup',up);board.addEventListener('pointercancel',cancel);
    this.preview.name='AR Portal dish';this.preview.position.set(-.68,1.48,-2.05);this.world.createTransformEntity(this.preview);
    this.holograms.name='Order Portal holograms';this.holograms.position.set(0,.68,-2);this.world.createTransformEntity(this.holograms);
    const light=new Group();light.add(new AmbientLight(0xffffff,1.8));const key=new DirectionalLight(0xffe0bd,3);key.position.set(-1,3,1);light.add(key);const rim=new DirectionalLight(0x65e9ff,2);rim.position.set(2,1,-2);light.add(rim);this.world.createTransformEntity(light);
    this.app.onPortal=id=>void this.loadPreview(id);this.app.onOrderReady=()=>void this.loadOrder();
    this.arPortal=new ARPortionPortal(this.world,this.app,board,this.preview);
    this.app.onSpectacles=()=>{this.app.handPlacement=true;this.arPortal.enter();};
    this.app.onEnterPortal=()=>{if(this.app.arSupported||this.app.immersive)this.arPortal.enter();};
    this.app.onXR=()=>{this.app.unlockAudio();if(this.app.portalAR){this.world.exitXR();return;}if(this.app.screen==='ar'){this.arPortal.enter();return;}if(!this.world.xrEnabled)this.app.notify('VR requires a compatible headset browser and a secure connection.');else this.world.launchXR({sessionMode:SessionMode.ImmersiveVR});};
    const wheel=(event:WheelEvent)=>{if(this.app.screen==='ar'){event.preventDefault();this.app.zoom(event.deltaY>0?.1:-.1);}};
    window.addEventListener('wheel',wheel,{passive:false});
    this.cleanupFuncs.push(()=>{this.stopped=true;this.arPortal.dispose();this.portalAbort?.abort();this.disposePortion?.();this.previewGeneration++;this.orderGeneration++;this.app.dispose();window.removeEventListener('wheel',wheel);this.texture.dispose();board.geometry.dispose();board.material.dispose();board.removeEventListener('pointerdown',down);board.removeEventListener('pointermove',move);board.removeEventListener('pointerup',up);board.removeEventListener('pointercancel',cancel);});
    this.cleanupFuncs.push(this.world.visibilityState.subscribe(state=>{if(state===VisibilityState.VisibleBlurred&&this.app.screen==='explore')this.app.setScreen('pause');}));
    // Dev-only inspection lets acceptance tests drive the same public actions, never shipped state bypasses.
    if(import.meta.env.DEV){(window as unknown as {glimmer:GlimmerApp}).glimmer=this.app;(window as unknown as {glimmerARPortal:ARPortionPortal}).glimmerARPortal=this.arPortal;(window as unknown as {glimmerLoadModel:(id:string)=>Promise<boolean>}).glimmerLoadModel=async(id)=>{const model=await AssetManager.loadGLTFById(glimmerModelId(id));return model.scene.children.length>0;};}
    console.info('[GLIMMER] runtime ready');
  }
  private async model(id:string,width:number,assetId=glimmerModelId(id)):Promise<Object3D>{
    await AssetManager.loadGLTFById(assetId);const model=AssetManager.getGLTF(assetId)!.scene.clone(true);
    model.updateMatrixWorld(true);const box=new Box3().setFromObject(model),size=box.getSize(new Vector3()),center=box.getCenter(new Vector3());const scale=width/Math.max(size.x,size.z,.001);model.scale.setScalar(scale);model.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);return model;
  }
  private async loadPreview(id:string|null){
    const generation=++this.previewGeneration;this.portalAbort?.abort();this.disposePortion?.();this.disposePortion=null;this.preview.clear();this.preview.visible=!!id;if(!id)return;
    const dish=marketCatalogue().find(d=>d.id===id);if(!dish){this.preview.visible=false;return;}
    const generated=dish.photoCredit||dish.illustrative?undefined:generatedModelId(dish.id),use3d=this.app.portalView==='3d'&&(generated||dish.modelId);
    this.app.portalFlat=!use3d;this.app.modelError='';this.app.portalStatus='Loading portion…';this.app.invalidate();
    const abort=new AbortController();this.portalAbort=abort;
    if(use3d){
      const candidates=[generated,dish.modelId?glimmerModelId(dish.modelId):undefined].filter((id):id is string=>!!id);
      for(const asset of candidates){try{
        const model=await this.model(dish.modelId??dish.id,STANDARD_PLATE_METRES,asset);if(this.stopped||generation!==this.previewGeneration)return;
        this.preview.add(model);this.app.portalStatus=asset===generated?'Tripo 3D · 27 cm reference · estimated size':dish.sample?'Game 3D illustration · 27 cm reference · estimated size':'3D · 27 cm reference · estimated size';this.app.invalidate();return;
      }catch{if(this.stopped||generation!==this.previewGeneration)return;}}
    }
    this.app.portalFlat=true;this.app.resetPortal();
    try{const flat=await flatPortion(dish,AbortSignal.any([abort.signal,AbortSignal.timeout(15000)]));
      if(this.stopped||generation!==this.previewGeneration){flat.dispose();return;}
      this.disposePortion=flat.dispose;this.preview.add(flat.group);this.app.portalStatus=flat.label;this.app.invalidate();
    }catch{if(generation===this.previewGeneration){this.app.modelError='Portion unavailable. Showing the menu photo.';this.app.portalStatus='Approximate photo · not actual size';}}
  }
  private async loadOrder(){const generation=++this.orderGeneration;this.holograms.clear();for(const [index,line]of this.app.state.holograms.entries()){try{const model=await this.model(line.dish,.28);if(this.stopped||generation!==this.orderGeneration)return;const pivot=new Group();pivot.position.x=(index-(this.app.state.holograms.length-1)/2)*.4;pivot.add(model);this.holograms.add(pivot);}catch(error){console.error('[GLIMMER] order model failed',line.dish,error);this.app.notify('One order hologram is unavailable. Your ticket is still valid.');}}}
  update(delta:number){
    const dt=Math.min(delta,.1);const pad=this.input.xr.gamepads.left;
    const immersive=this.world.visibilityState.peek()!==VisibilityState.NonImmersive;
    let pads: readonly (Gamepad|null)[]=noGamepads;
    if(!immersive&&document.hasFocus()&&!document.hidden){try{pads=navigator.getGamepads?.()??noGamepads;}catch{/* Browser policy may disable gamepads. */}}
    this.browserGamepad.update(dt,pads,!immersive&&document.hasFocus()&&!document.hidden);
    if(immersive){const axes=pad?.getAxesValues(InputComponent.Thumbstick);this.app.market.setInput(axes?.x??0,axes?.y??0);}
    const revision=this.app.canvasRevision;this.app.update(dt);if(revision!==this.app.canvasRevision)this.texture.needsUpdate=true;
    if(this.app.immersive!==immersive){this.app.immersive=immersive;this.app.resetPortal();this.app.invalidate();}
    const placedAR=this.arPortal.update();this.holograms.visible=!this.app.portalAR;
    if(this.app.screen==='ar'&&!placedAR){
      this.preview.visible=this.preview.children.length>0;
      this.preview.position.set(0,immersive?1.05:1.65,immersive?-1.05:-2.25);
      this.preview.rotation.y=this.app.portalYaw;
      this.preview.rotation.x=this.app.portalPitch+(immersive?0:Math.PI/2-.25);
      this.preview.scale.setScalar(immersive?1:2.5/this.app.portalZoom);
    }
    if(this.app.screen!=='pause'&&!this.app.reducedMotion)for(const model of this.holograms.children)model.rotation.y+=dt*Math.PI/6;
  }
}
