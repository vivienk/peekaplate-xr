import { EnvironmentRaycastTarget, RaycastSpace, Group, Mesh, RingGeometry, MeshBasicMaterial, DoubleSide, Vector3, Quaternion, Raycaster, SessionMode, type World, type Entity, type Intersection, type Object3D } from '@iwsdk/core';
import type { GlimmerApp } from './app';
const hands=['right','left'] as const;
/** Native surface detection comes from IWSDK; this owns placement and presentation. */
export class ARPortionPortal {
 private targets:Entity[]=[];
 private active=false;private placed=false;private awaiting=false;
 private point=new Vector3();private orientation=new Quaternion();private normal=new Vector3();
 private head=new Vector3();private direction=new Vector3();private ray=new Raycaster();private hits:Intersection<Object3D>[]=[];
 private reticle=new Mesh(new RingGeometry(.125,.135,64),new MeshBasicMaterial({color:0x67e6cd,side:DoubleSide,transparent:true,opacity:.85,depthWrite:false}));
 constructor(private world:World,private app:GlimmerApp,private board:Mesh,private dish:Group){
  this.reticle.name='AR table placement target';this.reticle.rotation.x=-Math.PI/2;this.reticle.visible=false;world.scene.add(this.reticle);
  app.onReposition=()=>{this.placed=false;this.message('Point at a table · Trigger or pinch to place');};
  if(navigator.xr)void navigator.xr.isSessionSupported('immersive-ar').then(supported=>{app.arSupported=supported;app.invalidate();}).catch(()=>{});
 }
 enter(){
  const session=this.world.xrSession;
  if(session){
   if(session.environmentBlendMode==='opaque'){this.world.exitXR();this.message('VR closed. Select Open AR portal to enter passthrough.');}
   return;
  }
  this.awaiting=true;this.message('Allow mixed reality to place the dish in your room.');
  this.world.launchXR({sessionMode:SessionMode.ImmersiveAR,features:{hitTest:{required:true},handTracking:true}});
 }
 private message(text:string){if(this.app.portalPlacement!==text){this.app.portalPlacement=text;this.app.invalidate();}}
 private begin(){
  this.active=true;this.placed=false;this.app.portalAR=true;this.dish.visible=false;
  for(const hand of hands){const target=new Group();target.name=`AR ${hand} table hit`;const entity=this.world.createTransformEntity(target);entity.addComponent(EnvironmentRaycastTarget,{space:hand=== 'right'?RaycastSpace.Right:RaycastSpace.Left,maxDistance:3});this.targets.push(entity);}
  this.world.player.head.getWorldPosition(this.head);this.world.player.head.getWorldDirection(this.direction);this.direction.y=0;this.direction.normalize();
  // A compact control panel above the table; the scene behind it remains passthrough.
  this.board.scale.setScalar(.36);this.board.position.copy(this.head).addScaledVector(this.direction,-1.2);this.board.position.y+=.12;this.board.lookAt(this.head);
  this.message('Point at a table · Trigger or pinch to place');
 }
 private end(){
  for(const target of this.targets)target.dispose();this.targets.length=0;this.reticle.visible=false;
  this.active=false;this.placed=false;this.app.portalAR=false;this.app.invalidate();
  this.board.scale.setScalar(1);this.board.position.set(0,1.65,-2.8);this.board.quaternion.identity();
 }
 update(){
  const session=this.world.xrSession,ar=!!session&&session.environmentBlendMode!=='opaque'&&this.app.screen==='ar';
  if(this.awaiting&&!this.world.sessionRequestPending){this.awaiting=false;if(!session)this.message('AR did not start. Use a supported headset and allow mixed reality, then retry.');}
  if(ar&&!this.active)this.begin();else if(!ar&&this.active)this.end();
  if(!this.active)return false;
  this.dish.scale.setScalar(1);this.dish.quaternion.identity();this.reticle.visible=false;
  if(this.placed){this.dish.position.copy(this.point);this.dish.quaternion.copy(this.orientation);this.dish.visible=this.dish.children.length>0;return true;}
  this.dish.visible=false;
  for(let i=0;i<hands.length;i++){
   const hand=hands[i],entity=this.targets[i],target=entity.object3D!;
   if(!target.visible||!entity.getValue(EnvironmentRaycastTarget,'xrHitTestResult'))continue;
   target.getWorldQuaternion(this.orientation);this.normal.set(0,1,0).applyQuaternion(this.orientation);
   if(this.normal.y<.9)continue; // Never place a plate on a wall or steep surface.
   target.getWorldPosition(this.point);this.point.y+=.004;
   const space=this.world.player.raySpaces[hand];space.getWorldPosition(this.ray.ray.origin);space.getWorldDirection(this.ray.ray.direction);this.ray.ray.direction.negate();
   this.hits.length=0;this.ray.intersectObject(this.board,false,this.hits);if(this.hits.length)continue;
   this.reticle.position.copy(this.point);this.reticle.quaternion.copy(this.orientation);this.reticle.rotateX(-Math.PI/2);this.reticle.visible=true;
   this.message('Table found · Trigger or pinch to place');
   if(this.world.input.xr.gamepads[hand]?.getSelectStart()){
    this.placed=true;this.dish.position.copy(this.point);this.dish.quaternion.copy(this.orientation);this.dish.visible=this.dish.children.length>0;this.reticle.visible=false;
    this.message('Placed · Physical scale locked · Walk around to inspect');this.app.sound('sfx-ui-select');break;
   }
  }
  if(!this.reticle.visible&&!this.placed)this.message('Point at a table · Trigger or pinch to place');
  return true;
 }
 dispose(){if(this.active)this.end();this.reticle.removeFromParent();this.reticle.geometry.dispose();this.reticle.material.dispose();}
}
