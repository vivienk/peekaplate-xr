import {describe,it,expect} from 'vitest';
import {FrameRateMeter} from '../src/glimmer/frame-rate';
describe('visual frame rate',()=>{
  it('measures a one-second window without counting the initial timestamp',()=>{
    const meter=new FrameRateMeter();meter.sample(0);
    for(let i=1;i<60;i++)expect(meter.sample(i*1000/60)).toBe(false);
    expect(meter.sample(1000)).toBe(true);expect(meter.fps).toBe(60);
  });
  it('counts 30 visual frames even with 60 game-loop ticks',()=>{
    const meter=new FrameRateMeter();meter.sample(0,false);
    for(let i=1;i<=60;i++)meter.sample(i*1000/60,i%2===0);
    expect(meter.fps).toBe(30);
  });
  it('reports zero for idle screens without feeding back badge refreshes',()=>{
    const meter=new FrameRateMeter();meter.sample(0,false);
    for(let i=1;i<=120;i++)meter.sample(i*1000/60,false);
    expect(meter.fps).toBe(0);
  });
  it('includes long stalls instead of capping their duration',()=>{
    const meter=new FrameRateMeter();meter.sample(0);meter.sample(500);meter.sample(1000);
    expect(meter.fps).toBe(2);
  });
  it('does not count time spent in a hidden tab after reset',()=>{
    const meter=new FrameRateMeter();meter.sample(0);meter.reset();meter.sample(10000);
    for(let i=1;i<=30;i++)meter.sample(10000+i*1000/30);
    expect(meter.fps).toBe(30);
  });
});
