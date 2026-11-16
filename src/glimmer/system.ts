import { createSystem, CanvasTexture, Mesh, PlaneGeometry, MeshBasicMaterial, SRGBColorSpace, NearestFilter, RayInteractable, AssetManager, Group, Box3, Vector3, InputComponent, VisibilityState, AmbientLight, DirectionalLight, type Object3D } from '@iwsdk/core';
import { GlimmerApp } from './app';
import { BrowserGamepad } from './gamepad';
import { glimmerModelId } from './model-assets';

const noGamepads: readonly (Gamepad|null)[] = [];

/** Original pixel world stays stationary in viewing space; dishes are native 3D. */
export class GlimmerSystem extends createSystem({}) {
  app!:GlimmerApp;
  private browserGamepad!:BrowserGamepad;
  private texture!:CanvasTexture;
  private preview=new Group();
  private holograms=new Group();
  private previewGeneration=0;
  private orderGeneration=0;
  private stopped=false;
  private accumulator=0;
  private pointerStart:{x:number;y:number}|null=null;
  private dragging=false;
  private touchStick:number|null=null;
  private touchStartX=0;private touchStartY=0;
  private touches=new Map<number,{x:number;y:number}>();
  private pinchDistance=0;
  private dragX=0;private dragY=0;
  init(){
    this.app=new GlimmerApp();this.app.refreshPublished();
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
    const board=new Mesh(new PlaneGeometry(3.6,2.025),new MeshBasicMaterial({map:this.texture,toneMapped:false}));
    board.name='PeekaPlate Market Screen';board.position.set(0,1.65,-2.8);
    const boardEntity=this.world.createTransformEntity(board);boardEntity.addComponent(RayInteractable);
    type Hit={uv?:{x:number;y:number};pointerId?:number;nativeEvent?:{pointerType?:string}};
    const down=(event:Hit)=>{if(!event.uv)return;const x=event.uv.x*1280,y=(1-event.uv.y)*720;if(event.nativeEvent?.pointerType==='touch'){this.touches.set(event.pointerId??0,{x,y});if(this.app.screen==='explore'&&x<512&&y>80&&y<640&&!this.app.buttons.some(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h)){this.touchStick=event.pointerId??0;this.touchStartX=x;this.touchStartY=y;this.app.unlockAudio();return;}if(this.touches.size===2){const points=[...this.touches.values()];this.pinchDistance=Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);}}this.app.pointerDown(x,y);this.pointerStart={x:event.uv.x*1280,y:(1-event.uv.y)*720};this.dragX=this.pointerStart.x;this.dragY=this.pointerStart.y;this.dragging=false;this.app.unlockAudio();};
    const move=(event:Hit)=>{if(!event.uv)return;const x=event.uv.x*1280,y=(1-event.uv.y)*720;if(this.touchStick!==null&&event.pointerId===this.touchStick){this.app.market.setInput(Math.max(-1,Math.min(1,(x-this.touchStartX)/80)),Math.max(-1,Math.min(1,(y-this.touchStartY)/80)));return;}if(this.touches.has(event.pointerId??-1)){const point=this.touches.get(event.pointerId!)!;point.x=x;point.y=y;if(this.touches.size===2&&this.app.screen==='ar'){const points=[...this.touches.values()],distance=Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);this.app.zoom((this.pinchDistance-distance)/250);this.pinchDistance=distance;this.dragging=true;return;}}if(!this.pointerStart){this.app.keyboardFocus=this.app.buttons.findIndex(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h);return;}if(this.app.screen!=='ar')return;if(this.pointerStart.x>580||this.pointerStart.y<158||this.pointerStart.y>538)return;if(Math.hypot(x-this.pointerStart.x,y-this.pointerStart.y)>6)this.dragging=true;if(this.dragging)this.app.rotate((x-this.dragX)*Math.PI/450,(y-this.dragY)*Math.PI/450);this.dragX=x;this.dragY=y;};
    const up=(event:Hit)=>{this.app.pointerUp();this.touches.delete(event.pointerId??-1);if(this.touchStick!==null&&event.pointerId===this.touchStick){this.touchStick=null;this.app.market.setInput(0,0);return;}if(!this.pointerStart)return;const start=this.pointerStart;this.pointerStart=null;if(!this.dragging&&event.uv&&Math.hypot(event.uv.x*1280-start.x,(1-event.uv.y)*720-start.y)<12)this.app.pointer(start.x,start.y);};
    const cancel=()=>{this.app.pointerUp();this.pointerStart=null;this.dragging=false;this.touchStick=null;this.touches.clear();this.app.market.setInput(0,0);};
    board.addEventListener('pointerdown',down);board.addEventListener('pointermove',move);board.addEventListener('pointerup',up);board.addEventListener('pointercancel',cancel);
    this.preview.name='AR Portal dish';this.preview.position.set(-.68,1.48,-2.05);this.world.createTransformEntity(this.preview);
    this.holograms.name='Order Portal holograms';this.holograms.position.set(0,.68,-2);this.world.createTransformEntity(this.holograms);
    const light=new Group();light.add(new AmbientLight(0xffffff,1.8));const key=new DirectionalLight(0xffe0bd,3);key.position.set(-1,3,1);light.add(key);const rim=new DirectionalLight(0x65e9ff,2);rim.position.set(2,1,-2);light.add(rim);this.world.createTransformEntity(light);
    this.app.onPortal=id=>void this.loadPreview(id);this.app.onOrderReady=()=>void this.loadOrder();
    this.app.onXR=()=>{this.app.unlockAudio();if(!this.world.xrEnabled)this.app.notify('VR requires a compatible headset browser and a secure connection.');else this.world.launchXR();};
    const wheel=(event:WheelEvent)=>{if(this.app.screen==='ar'){event.preventDefault();this.app.zoom(event.deltaY>0?.1:-.1);}};
    window.addEventListener('wheel',wheel,{passive:false});
    this.cleanupFuncs.push(()=>{this.stopped=true;this.previewGeneration++;this.orderGeneration++;this.app.dispose();window.removeEventListener('wheel',wheel);this.texture.dispose();board.geometry.dispose();board.material.dispose();board.removeEventListener('pointerdown',down);board.removeEventListener('pointermove',move);board.removeEventListener('pointerup',up);board.removeEventListener('pointercancel',cancel);});
    this.cleanupFuncs.push(this.world.visibilityState.subscribe(state=>{if(state===VisibilityState.VisibleBlurred&&this.app.screen==='explore')this.app.setScreen('pause');}));
    // Dev-only inspection lets acceptance tests drive the same public actions, never shipped state bypasses.
    if(import.meta.env.DEV){(window as unknown as {glimmer:GlimmerApp}).glimmer=this.app;(window as unknown as {glimmerLoadModel:(id:string)=>Promise<boolean>}).glimmerLoadModel=async(id)=>{const model=await AssetManager.loadGLTFById(glimmerModelId(id));return model.scene.children.length>0;};}
    console.info('[GLIMMER] runtime ready');
  }
  private async model(id:string,width:number):Promise<Object3D>{
    await AssetManager.loadGLTFById(glimmerModelId(id));const model=AssetManager.getGLTF(glimmerModelId(id))!.scene;
    model.updateMatrixWorld(true);const box=new Box3().setFromObject(model),size=box.getSize(new Vector3()),center=box.getCenter(new Vector3());const scale=width/Math.max(size.x,size.z,.001);model.scale.setScalar(scale);model.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);return model;
  }
  private async loadPreview(id:string|null){
    const generation=++this.previewGeneration;this.preview.clear();this.preview.visible=!!id;if(!id)return;
    try{const model=await this.model(id,.54);if(this.stopped||generation!==this.previewGeneration)return;const pivot=new Group();pivot.add(model);this.preview.add(pivot);
      await AssetManager.loadGLTFById('glimmer-portal-pedestal');if(this.stopped||generation!==this.previewGeneration)return;const pedestal=AssetManager.getGLTF('glimmer-portal-pedestal')!.scene;pedestal.scale.setScalar(1.6);pedestal.position.y=-.06;this.preview.add(pedestal);console.info(`[GLIMMER] model loaded ${id}`);
    }catch(error){if(generation===this.previewGeneration){this.app.modelError='3D view unavailable';console.error('[GLIMMER] model failed',id,error);}}
  }
  private async loadOrder(){const generation=++this.orderGeneration;this.holograms.clear();for(const [index,line]of this.app.state.holograms.entries()){try{const model=await this.model(line.dish,.28);if(this.stopped||generation!==this.orderGeneration)return;const pivot=new Group();pivot.position.x=(index-(this.app.state.holograms.length-1)/2)*.4;pivot.add(model);this.holograms.add(pivot);}catch(error){console.error('[GLIMMER] order model failed',line.dish,error);this.app.notify('One order hologram is unavailable. Your ticket is still valid.');}}}
  update(delta:number){
    const dt=Math.min(delta,.1);const pad=this.input.xr.gamepads.left;
    const immersive=this.world.visibilityState.peek()!==VisibilityState.NonImmersive;
    let pads: readonly (Gamepad|null)[]=noGamepads;
    if(!immersive&&document.hasFocus()&&!document.hidden){try{pads=navigator.getGamepads?.()??noGamepads;}catch{/* Browser policy may disable gamepads. */}}
    this.browserGamepad.update(dt,pads,!immersive&&document.hasFocus()&&!document.hidden);
    if(immersive){const axes=pad?.getAxesValues(InputComponent.Thumbstick);this.app.market.setInput(axes?.x??0,axes?.y??0);}
    this.accumulator+=dt;if(this.accumulator>=1/30){this.app.update(this.accumulator);this.texture.needsUpdate=true;this.accumulator=0;}
    if(this.app.screen==='ar'){this.preview.rotation.y=this.app.portalYaw;this.preview.rotation.x=this.app.portalPitch;this.preview.scale.setScalar(1/this.app.portalZoom);}
    if(this.app.screen!=='pause'&&!this.app.reducedMotion)for(const model of this.holograms.children)model.rotation.y+=dt*Math.PI/6;
  }
}
