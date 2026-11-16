import { describe, expect, it } from 'vitest';
import { blendRainLoop } from '../src/glimmer/rain-loop';

describe('rain loop seam', () => {
  it('joins the tail to the head without silence', () => {
    const rate=1000, input=new Float32Array(10000);
    for(let i=0;i<input.length;i++) input[i]=Math.sin(i*.47);
    const before=input.slice(), output=blendRainLoop(input,rate);
    expect(input).toEqual(before);
    expect(output.length).toBe(9750);
    const rms=(start:number,end:number)=>Math.sqrt(output.slice(start,end).reduce((sum,v)=>sum+v*v,0)/(end-start));
    expect(rms(0,100)).toBeGreaterThan(.5);
    expect(rms(output.length-100,output.length)).toBeGreaterThan(.4);
    // End maps to sample 249, start to 250: one normal sample step at wrap.
    expect(output[output.length-1]).toBeCloseTo(input[249],6);
    expect(output[0]).toBe(input[250]);
    expect([...output].every(Number.isFinite)).toBe(true);
  });
  it('handles short clips without invalid samples or lengths',()=>{
    for(const size of [0,1,7,8,100]){
      const output=blendRainLoop(new Float32Array(size).fill(.1),44100);
      expect(output.length).toBeGreaterThanOrEqual(0);
      expect([...output].every(Number.isFinite)).toBe(true);
    }
  });
});
