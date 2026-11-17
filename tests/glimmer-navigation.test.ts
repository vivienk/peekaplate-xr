import {describe,it,expect,vi} from 'vitest';
import {MarketWorld,WALK_SPEED} from '../src/glimmer/market';
function world(){
 const w=Object.create(MarketWorld.prototype);
 Object.assign(w,{paused:false,enabled:true,entering:false,clock:0,travelRemaining:0,district:'d1-rain-alley',map:{width_tiles:100,height_tiles:100,exits:[]},player:{x:10,y:10},canvas:{width:480,height:270},cameraX:0,cameraY:0,lookX:0,lookY:0,inputX:1,inputY:0,keys:new Set(),path:[],pathIndex:0,found:new Set(),callbacks:{onSound:vi.fn(),onInteract:vi.fn()},districtWalkers:new Map(),updateEffects:vi.fn(),draw:vi.fn(),findFocus:()=>null,movementFree:()=>true,bumpTime:0,footstepTime:0,footstepVariant:0});return w;
}
describe('responsive market movement',()=>{
 it('covers the same distance at 15, 30, 60 and 90 fps',()=>{for(const fps of [15,30,60,90]){const w=world();for(let i=0;i<fps;i++)w.update(1/fps);expect((w.player.x-10)*16).toBeCloseTo(WALK_SPEED,5);expect(w.player.y).toBe(10);}});
 it('uses the remaining walking distance after passing a path waypoint',()=>{const w=world();w.inputX=0;w.path=[[161,160],[180,160]];w.update(1/60);expect((w.player.x-10)*16).toBeCloseTo(WALK_SPEED/60);});
 it('does not move while paused or pass a blocked collision',()=>{const paused=world();paused.paused=true;paused.update(.1);expect(paused.player.x).toBe(10);const blocked=world();blocked.movementFree=()=>false;blocked.update(.1);expect(blocked.player.x).toBe(10);});
 it('draws once per presented frame while retaining elapsed simulation time',()=>{const w=world();w.update(.09);expect(w.clock).toBeCloseTo(.09);expect(w.draw).toHaveBeenCalledOnce();});
});
