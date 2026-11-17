import {describe,it,expect,vi} from 'vitest';
import {MarketWorld} from '../src/glimmer/market';
import {districts} from '../src/glimmer/data';
describe('interaction after district travel',()=>{
 for(const district of districts.slice(1))it(`unlocks interaction after arriving in ${district.name}`,()=>{
  const onInteract=vi.fn(),onTravel=vi.fn();
  const world=Object.create(MarketWorld.prototype);
  Object.assign(world,{paused:false,enabled:true,entering:false,clock:0,travelRemaining:1.6,travelTarget:{to:district.district,arrive:[10,10]},district:'d1-rain-alley',map:district,player:{x:10,y:10},canvas:{width:640,height:360},cameraX:0,cameraY:0,reducedMotion:true,waterFrame:0,districtWalkers:new Map(),callbacks:{onInteract,onTravel},updateEffects:vi.fn(),updatePlayer:vi.fn(),draw:vi.fn(),paintBackground:vi.fn(),findFocus:()=>district.objects.find(o=>o.kind==='restaurant')});
  world.setDistrict=(id:string)=>{world.district=id;};
  // 1.6 is not divisible by .03: the old timer became negative and blocked E forever.
  for(let i=0;i<60;i++)world.update(.03);
  expect(world.travelRemaining).toBe(0);expect(onTravel).toHaveBeenCalledOnce();
  for(const object of district.objects.filter(o=>['restaurant','kiosk','find-person','find-cat','find-holo','vending'].includes(o.kind))){world.findFocus=()=>object;world.interact();expect(onInteract).toHaveBeenLastCalledWith(object.id);}
 });
});
