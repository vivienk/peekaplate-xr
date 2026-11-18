import {describe,it,expect} from 'vitest';
import {RenderCadence,renderInterval} from '../src/glimmer/low-power';
describe('low-power rendering',()=>{
 it('never limits immersive headset rendering',()=>{expect(renderInterval(true,true,true)).toBe(0);expect(renderInterval(true,true,false)).toBe(0);});
 it('uses 30 Hz for desktop portions and 4 Hz for the background behind flat canvas',()=>{expect(renderInterval(true,false,false)).toBeCloseTo(1000/30);expect(renderInterval(true,false,true)).toBe(250);expect(renderInterval(false,false,false)).toBe(0);});
 it('draws 30 of 60 render ticks without catch-up bursts',()=>{const gate=new RenderCadence();let count=0;for(let i=0;i<60;i++)if(gate.due(i*1000/60,1000/30))count++;expect(count).toBe(30);expect(gate.due(5000,1000/30)).toBe(true);expect(gate.due(5000,1000/30)).toBe(false);});
 it('allows immediate painting after resize or a mode change',()=>{const gate=new RenderCadence();gate.due(0,250);gate.reset();expect(gate.due(1,250)).toBe(true);});
});
