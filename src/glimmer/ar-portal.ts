import { EnvironmentRaycastTarget, RaycastSpace, Box3, Group, Mesh, RingGeometry, MeshBasicMaterial, DoubleSide, Vector3, Quaternion, Raycaster, SessionMode, ReferenceSpaceType, type World, type Entity, type Intersection, type Object3D } from '@iwsdk/core';
import type { GlimmerApp } from './app';
const hands=['right','left'] as const;
const aimAtTable = 'Preview · Point at a tabletop';
const touchTable = 'Touch the table with one fingertip · Pinch with the other hand';
/** Native surface detection comes from IWSDK; this owns placement and presentation. */
export class ARPortionPortal {
 private targets:Entity[]=[];
 private selectedHand:XRHandedness='none';
 private listeningSession:XRSession|null=null;
 private onSelect=(event:XRInputSourceEvent)=>{this.selectedHand=event.inputSource.handedness;};
 private active=false;private placed=false;private awaiting=false;
 private point=new Vector3();private orientation=new Quaternion();private normal=new Vector3();
 private previewCenter = new Vector3();
 private centerOffset = new Vector3();
 private head=new Vector3();private direction=new Vector3();private ray=new Raycaster();private hits:Intersection<Object3D>[]=[];
 private reticle=new Mesh(new RingGeometry(.125,.135,64),new MeshBasicMaterial({color:0x67e6cd,side:DoubleSide,transparent:true,opacity:.85,depthWrite:false}));
 constructor(private world:World,private app:GlimmerApp,private board:Mesh,private dish:Group){
  this.reticle.name='AR table placement target';this.reticle.rotation.x=-Math.PI/2;this.reticle.visible=false;world.scene.add(this.reticle);
  app.onReposition=()=>{this.placed=false;this.message(this.app.handPlacement?touchTable:aimAtTable);};
  if(navigator.xr)void navigator.xr.isSessionSupported('immersive-ar').then(supported=>{app.arSupported=supported;app.invalidate();}).catch(()=>{});
 }
 enter(){
  const session=this.world.xrSession;
  if(session){
   if(session.environmentBlendMode==='opaque'){this.world.exitXR();this.message('VR closed. Select Open AR portal to enter passthrough.');}
   return;
  }
  this.awaiting=true;this.message('Allow mixed reality to place the dish in your room.');
  this.world.launchXR({sessionMode:SessionMode.ImmersiveAR,referenceSpace:this.app.handPlacement?ReferenceSpaceType.Local:ReferenceSpaceType.LocalFloor,features:{hitTest:this.app.handPlacement?false:{required:true},handTracking:this.app.handPlacement?{required:true}:true}});
 }
 private message(text:string){if(this.app.portalPlacement!==text){this.app.portalPlacement=text;this.app.invalidate();}}
 private begin(){
  this.active=true;this.placed=false;this.app.portalAR=true;
  if(!this.app.handPlacement)for(const hand of hands){const target=new Group();target.name=`AR ${hand} table hit`;const entity=this.world.createTransformEntity(target);entity.addComponent(EnvironmentRaycastTarget,{space:hand=== 'right'?RaycastSpace.Right:RaycastSpace.Left,maxDistance:3});this.targets.push(entity);}
  this.listeningSession=this.world.xrSession??null;this.listeningSession?.addEventListener?.('selectstart',this.onSelect);
  this.world.player.head.getWorldPosition(this.head);this.world.player.head.getWorldDirection(this.direction);this.direction.y=0;this.direction.normalize();
  // A compact control panel above the table; the scene behind it remains passthrough.
  this.board.scale.setScalar(.36);this.board.position.copy(this.head).addScaledVector(this.direction,-1.2);this.board.position.y+=.12;this.board.lookAt(this.head);
  this.message(this.app.handPlacement?touchTable:aimAtTable);
 }
 private end(){
  this.listeningSession?.removeEventListener?.('selectstart',this.onSelect);this.listeningSession=null;this.selectedHand='none';
  for(const target of this.targets)target.dispose();this.targets.length=0;this.reticle.visible=false;
  this.active=false;this.placed=false;this.app.portalAR=false;this.app.portalPlacement='';this.app.invalidate();
  this.board.scale.setScalar(1);this.board.position.set(0,1.65,-2.8);this.board.quaternion.identity();
 }
 addPortion(content: Object3D){
  // Bounds are local to the portion while it is detached. Placement still uses its base.
  new Box3().setFromObject(content).getCenter(this.previewCenter);
  this.dish.add(content);
 }
 private showViewerPreview(){
  const head = this.world.player.head;
  head.getWorldPosition(this.head);
  head.getWorldQuaternion(this.dish.quaternion);
  this.dish.position.set(0, -.055, -.62).applyQuaternion(this.dish.quaternion).add(this.head);
  this.dish.rotateX(Math.PI / 6);
  this.dish.position.sub(this.centerOffset.copy(this.previewCenter).applyQuaternion(this.dish.quaternion));
 }
 private showPlacementTarget(){
  this.dish.position.copy(this.point);
  this.dish.quaternion.copy(this.orientation);
  this.reticle.position.copy(this.point);
  this.reticle.quaternion.copy(this.orientation);
  this.reticle.rotateX(-Math.PI / 2);
  this.reticle.visible = true;
 }
 update(){
  const selected=this.selectedHand;this.selectedHand='none';
  const session=this.world.xrSession,ar=!!session&&session.environmentBlendMode!=='opaque'&&this.app.screen==='ar';
  if(this.awaiting&&!this.world.sessionRequestPending){this.awaiting=false;if(!session)this.message('AR did not start. Use a supported headset and allow mixed reality, then retry.');}
  if(ar&&!this.active)this.begin();else if(!ar&&this.active)this.end();
  if(!this.active)return false;
  this.dish.scale.setScalar(1);
  this.dish.visible = this.dish.children.length > 0;
  this.reticle.visible = false;
  if(this.placed){this.dish.position.copy(this.point);this.dish.quaternion.copy(this.orientation);return true;}
  this.showViewerPreview();
  if(this.app.handPlacement){this.updateHandPlacement(selected);return true;}
  for(let i=0;i<hands.length;i++){
   const hand=hands[i],entity=this.targets[i],target=entity.object3D!;
   const confirm = selected === hand || this.world.input.xr.gamepads[hand]?.getSelectStart();
   if(this.reticle.visible && !confirm)continue;
   if(!target.visible||!entity.getValue(EnvironmentRaycastTarget,'xrHitTestResult'))continue;
   target.getWorldQuaternion(this.orientation);this.normal.set(0,1,0).applyQuaternion(this.orientation);
   if(this.normal.y<.9)continue; // Never place a plate on a wall or steep surface.
   target.getWorldPosition(this.point);this.point.y+=.004;
   const space=this.world.player.raySpaces[hand];space.getWorldPosition(this.ray.ray.origin);space.getWorldDirection(this.ray.ray.direction);this.ray.ray.direction.negate();
   this.hits.length=0;this.ray.intersectObject(this.board,false,this.hits);if(this.hits.length)continue;
   this.showPlacementTarget();
   this.message('Table found · Trigger or pinch to place');
   if(confirm){
    this.placed=true;this.reticle.visible=false;
    this.message('Placed · Physical scale locked · Walk around to inspect');this.app.sound('sfx-ui-select');break;
   }
  }
  if(!this.reticle.visible&&!this.placed)this.message(aimAtTable);
  return true;
 }
 private updateHandPlacement(selected:XRHandedness){
  const frame=this.world.xrFrame,reference=this.world.xrReferenceSpace,session=this.world.xrSession;
  if(!frame||!reference||!session)return;
  // The resting fingertip sets the physical table point. The OTHER hand confirms,
  // so the pinch does not move the calibration point. No emulated surface is used.
  for(const source of session.inputSources){
   if(!source.hand||source.handedness==='none'||source.handedness===selected)continue;
   const tip=source.hand.get('index-finger-tip');if(!tip)continue;
   const pose=frame.getJointPose?.(tip,reference);if(!pose)continue;
   const p=pose.transform.position;this.point.set(p.x,p.y+.004,p.z);this.orientation.identity();
   this.showPlacementTarget();
   this.message(touchTable);
   if(selected!=='none'){
    // Ignore a confirmation aimed at the control panel.
    const raySpace=this.world.player.raySpaces[selected];raySpace.getWorldPosition(this.ray.ray.origin);raySpace.getWorldDirection(this.ray.ray.direction);this.ray.ray.direction.negate();
    this.hits.length=0;this.ray.intersectObject(this.board,false,this.hits);if(this.hits.length)return;
    this.placed=true;this.reticle.visible=false;
    this.message('Placed by hand · Physical scale locked');this.app.sound('sfx-ui-select');
   }
   return;
  }
  this.message('Preview · Show both hands and rest one fingertip on the table');
 }
 dispose(){if(this.active)this.end();this.reticle.removeFromParent();this.reticle.geometry.dispose();this.reticle.material.dispose();}
}
