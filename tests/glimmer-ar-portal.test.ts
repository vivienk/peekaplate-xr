import {describe,it,expect,vi} from 'vitest';
import {BoxGeometry,Group,Mesh,PlaneGeometry,MeshBasicMaterial,Vector3} from '@iwsdk/core';
import {ARPortionPortal} from '../src/glimmer/ar-portal';
function setup(){
 vi.stubGlobal('navigator',{});
 const app:any={screen:'ar',invalidate:vi.fn(),sound:vi.fn()};
 const head=new Group();head.position.y=1.6;
 const rays={right:new Group(),left:new Group()};rays.right.position.set(.3,1,-.3);rays.left.position.set(-.3,1,-.3);
 const targets:any[]=[];let select=false;
 const add=vi.fn();const world:any={scene:new Group(),xrSession:{environmentBlendMode:'alpha-blend',addEventListener:add,removeEventListener:vi.fn()},player:{head,raySpaces:rays},input:{xr:{gamepads:{right:{getSelectStart:()=>select},left:{getSelectStart:()=>false}}}},createTransformEntity:(object3D:any)=>{const e={object3D,hit:null,addComponent:vi.fn(),getValue:()=>e.hit,dispose:vi.fn()};targets.push(e);return e}};
 const board=new Mesh(new PlaneGeometry(1,1),new MeshBasicMaterial()),dish=new Group();dish.add(new Group());
 const portal=new ARPortionPortal(world,app,board,dish);portal.update();
 const hit=()=>{targets[0].hit={};targets[0].object3D.position.set(0,.75,-.8);targets[0].object3D.updateMatrixWorld(true);};
 return {app,world,targets,board,dish,portal,hit,add,select:()=>{select=true}};
}
describe('AR portion placement',()=>{
 it('places from a native hand select event without a gamepad',()=>{const t=setup();t.hit();t.add.mock.calls[0][1]({inputSource:{handedness:'right'}});t.portal.update();expect(t.dish.visible).toBe(true);expect(t.dish.position.y).toBe(.754);t.portal.dispose();});
 it('shows a model that finishes loading before there is a surface',()=>{
  const t=setup();
  t.dish.clear();t.portal.update();
  expect(t.dish.visible).toBe(false);
  t.dish.add(new Group());t.portal.update();
  expect(t.dish.visible).toBe(true);
  expect(t.dish.position.z).toBeLessThan(t.world.player.head.position.z);
  expect(t.dish.position.distanceTo(t.world.player.head.position)).toBeLessThan(1);
  expect(t.app.portalPlacement).toContain('Preview');
  t.portal.dispose();
 });
 it('keeps the preview in view and rejects a trigger on a wall',()=>{
  const t=setup();
  t.world.player.head.position.set(1,1.6,0);t.world.player.head.rotation.y=Math.PI/2;
  t.hit();t.targets[0].object3D.rotation.x=Math.PI/2;t.targets[0].object3D.updateMatrixWorld(true);
  t.select();t.portal.update();
  expect(t.dish.visible).toBe(true);
  expect(t.dish.position.x).toBeLessThan(1);
  expect(t.dish.position.z).toBeCloseTo(0);
  expect(t.world.scene.getObjectByName('AR table placement target').visible).toBe(false);
  expect(t.app.sound).not.toHaveBeenCalled();
  t.portal.dispose();
 });
 it('centres a tall preview in view and places its base on the table',()=>{
  const t=setup();
  t.dish.clear();
  const food=new Mesh(new BoxGeometry(.27,.30,.27),new MeshBasicMaterial());
  food.position.y=.15;
  t.portal.addPortion(food);t.portal.update();
  const center=t.dish.localToWorld(new Vector3(0,.15,0));
  expect(center.y).toBeLessThan(t.world.player.head.position.y);
  expect(center.y).toBeGreaterThan(t.world.player.head.position.y-.1);
  t.hit();t.select();t.portal.update();
  expect(t.dish.position.y).toBeCloseTo(.754);
  food.geometry.dispose();food.material.dispose();t.portal.dispose();
 });
 it('previews a horizontal hit, locks it on confirmation and shows the dish while repositioning',()=>{
  const t=setup(),reticle=t.world.scene.getObjectByName('AR table placement target');
  t.hit();t.portal.update();
  expect(t.dish.position.toArray()).toEqual([0,.754,-.8]);
  expect(reticle.visible).toBe(true);
  expect(t.app.sound).not.toHaveBeenCalled();
  t.select();t.portal.update();
  expect(t.dish.visible).toBe(true);
  expect(reticle.visible).toBe(false);
  expect(t.app.portalPlacement).toContain('Placed');
  t.world.player.head.position.set(1,2,1);t.targets[0].object3D.position.set(9,9,9);t.dish.scale.setScalar(5);t.portal.update();
  expect(t.dish.scale.toArray()).toEqual([1,1,1]);
  expect(t.dish.position.distanceTo(new Vector3(0,.754,-.8))).toBe(0);
  t.app.onReposition();t.targets[0].hit=null;t.portal.update();
  expect(t.dish.visible).toBe(true);
  expect(t.app.portalPlacement).toContain('Preview');
  expect(t.dish.position.distanceTo(t.world.player.head.position)).toBeLessThan(1);
  t.portal.dispose();
 });
 it('cleans up surface targets and restores the browser panel on exit',()=>{const t=setup();t.world.xrSession=null;expect(t.portal.update()).toBe(false);expect(t.app.portalAR).toBe(false);expect(t.board.scale.x).toBe(1);for(const target of t.targets)expect(target.dispose).toHaveBeenCalledOnce();t.portal.dispose();});
});
describe('Spectacles manual table calibration',()=>{
 it('uses the resting fingertip and opposite-hand select without gamepad or hit-test',()=>{
  const t=setup();t.world.xrSession=null;t.portal.update();t.app.handPlacement=true;
  const tip={} as XRJointSpace,add=vi.fn(),remove=vi.fn();
  t.world.xrSession={environmentBlendMode:'additive',addEventListener:add,removeEventListener:remove,inputSources:[{hand:new Map([['index-finger-tip',tip]]),handedness:'left'}]};
  t.world.xrReferenceSpace={};t.world.xrFrame={getJointPose:()=>({transform:{position:{x:.2,y:.8,z:-.5}}})};
  t.portal.update();expect(t.dish.visible).toBe(true);expect(t.dish.position.toArray()).toEqual([.2,.804,-.5]);expect(add).toHaveBeenCalledWith('selectstart',expect.any(Function));
  const select=add.mock.calls[0][1];select({inputSource:{handedness:'left'}});t.portal.update();expect(t.app.sound).not.toHaveBeenCalled();
  select({inputSource:{handedness:'right'}});t.portal.update();expect(t.dish.visible).toBe(true);expect(t.dish.position.toArray()).toEqual([.2,.804,-.5]);expect(t.dish.scale.x).toBe(1);
  t.portal.dispose();expect(remove).toHaveBeenCalledWith('selectstart',select);
 });
 it('does not place when fingertip tracking is unavailable',()=>{
  const t=setup();t.world.xrSession=null;t.portal.update();t.app.handPlacement=true;t.world.xrSession={environmentBlendMode:'additive',inputSources:[]};t.world.xrFrame={};t.world.xrReferenceSpace={};t.portal.update();expect(t.dish.visible).toBe(true);expect(t.app.sound).not.toHaveBeenCalled();expect(t.app.portalPlacement).toContain('Show both hands');t.portal.dispose();
 });
});
