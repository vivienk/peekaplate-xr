import {describe,it,expect,vi} from 'vitest';
import {Group,Mesh,PlaneGeometry,MeshBasicMaterial,Vector3} from '@iwsdk/core';
import {ARPortionPortal} from '../src/glimmer/ar-portal';
function setup(){
 vi.stubGlobal('navigator',{});
 const app:any={screen:'ar',invalidate:vi.fn(),sound:vi.fn()};
 const head=new Group();head.position.y=1.6;
 const rays={right:new Group(),left:new Group()};rays.right.position.set(.3,1,-.3);rays.left.position.set(-.3,1,-.3);
 const targets:any[]=[];let select=false;
 const world:any={scene:new Group(),xrSession:{environmentBlendMode:'alpha-blend'},player:{head,raySpaces:rays},input:{xr:{gamepads:{right:{getSelectStart:()=>select},left:{getSelectStart:()=>false}}}},createTransformEntity:(object3D:any)=>{const e={object3D,hit:null,addComponent:vi.fn(),getValue:()=>e.hit,dispose:vi.fn()};targets.push(e);return e}};
 const board=new Mesh(new PlaneGeometry(1,1),new MeshBasicMaterial()),dish=new Group();dish.add(new Group());
 const portal=new ARPortionPortal(world,app,board,dish);portal.update();
 const hit=()=>{targets[0].hit={};targets[0].object3D.position.set(0,.75,-.8);targets[0].object3D.updateMatrixWorld(true);};
 return {app,world,targets,board,dish,portal,hit,select:()=>{select=true}};
}
describe('AR portion placement',()=>{
 it('waits for a surface and rejects walls',()=>{const t=setup();expect(t.dish.visible).toBe(false);t.hit();t.targets[0].object3D.rotation.x=Math.PI/2;t.targets[0].object3D.updateMatrixWorld(true);t.select();t.portal.update();expect(t.dish.visible).toBe(false);t.portal.dispose();});
 it('locks to the detected surface at physical scale and allows repositioning',()=>{const t=setup();t.hit();t.select();t.portal.update();expect(t.dish.visible).toBe(true);expect(t.dish.position.toArray()).toEqual([0,.754,-.8]);t.world.player.head.position.set(1,2,1);t.targets[0].object3D.position.set(9,9,9);t.dish.scale.setScalar(5);t.portal.update();expect(t.dish.scale.toArray()).toEqual([1,1,1]);expect(t.dish.position.distanceTo(new Vector3(0,.754,-.8))).toBe(0);t.app.onReposition();t.targets[0].hit=null;t.portal.update();expect(t.dish.visible).toBe(false);t.portal.dispose();});
 it('cleans up surface targets and restores the browser panel on exit',()=>{const t=setup();t.world.xrSession=null;expect(t.portal.update()).toBe(false);expect(t.app.portalAR).toBe(false);expect(t.board.scale.x).toBe(1);for(const target of t.targets)expect(target.dispose).toHaveBeenCalledOnce();t.portal.dispose();});
});
