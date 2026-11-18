import {describe,it,expect} from 'vitest';
import {RenderCadence,renderInterval,PortionResolution} from '../src/glimmer/low-power';
describe('low-power rendering',()=>{
 it('never limits immersive headset rendering',()=>{expect(renderInterval(true,true,true)).toBe(0);expect(renderInterval(true,true,false)).toBe(0);});
 it('uses 30 Hz for desktop portions and 4 Hz for the background behind flat canvas',()=>{expect(renderInterval(true,false,false)).toBeCloseTo(1000/30);expect(renderInterval(true,false,true)).toBe(250);expect(renderInterval(false,false,false)).toBe(0);});
 it('draws 30 of 60 render ticks without catch-up bursts',()=>{const gate=new RenderCadence();let count=0;for(let i=0;i<60;i++)if(gate.due(i*1000/60,1000/30))count++;expect(count).toBe(30);expect(gate.due(5000,1000/30)).toBe(true);expect(gate.due(5000,1000/30)).toBe(false);});
 it('keeps 30 Hz under irregular 60 Hz browser callbacks',()=>{
   const gate=new RenderCadence();let count=0;
   for(let i=0;i<600;i++)if(gate.due(i*1000/60+(i%3)*.8,1000/30))count++;
   expect(count).toBeGreaterThanOrEqual(299);expect(count).toBeLessThanOrEqual(301);
 });
 it('allows immediate painting after resize or a mode change',()=>{const gate=new RenderCadence();gate.due(0,250);gate.reset();expect(gate.due(1,250)).toBe(true);});
});

describe('portion resolution',()=>{
 it('keeps full starting quality after a single dip or a healthy window',()=>{const r=new PortionResolution();r.observe(20);r.observe(30);r.observe(20);expect(r.scale).toBe(.75);});
 it('reduces bounded raster cost after sustained drops and resets for the next view',()=>{const r=new PortionResolution();r.observe(28);r.observe(28);expect(r.scale).toBe(.65);for(let i=0;i<8;i++)r.observe(24);expect(r.scale).toBe(.55);r.reset();expect(r.scale).toBe(.75);});
});
