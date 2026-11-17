import {describe,it,expect} from 'vitest';
import {cutoutBounds,standardPlateScale} from '../src/glimmer/standard-plate';
describe('standard plate estimate',()=>{
 it('keeps the same visible size with different transparent padding',()=>{
  for(const size of [100,200,640]){
   const b={left:20,top:10,right:80,bottom:50},s=standardPlateScale(size,size,b);
   expect(s.width*(b.right-b.left)/size).toBeCloseTo(.27);
   expect(s.depth/s.width).toBe(1);
   expect(s.offsetX+((b.left+b.right)/2/size-.5)*s.width).toBeCloseTo(0);
   expect(s.offsetZ+((b.top+b.bottom)/2/size-.5)*s.depth).toBeCloseTo(0);
  }
 });
 it('preserves source proportions and fits tall cutouts inside the reference',()=>{
  const s=standardPlateScale(100,200,{left:20,top:30,right:70,bottom:180});
  expect(s.depth*150/200).toBeCloseTo(.27);expect(s.depth/s.width).toBe(2);
 });
 it('ignores transparent padding and faint mask noise, with a finite empty fallback',()=>{
  const rgba=new Uint8ClampedArray(4*4*4);rgba[3]=20;rgba[(1*4+2)*4+3]=255;
  expect(cutoutBounds(rgba,4,4)).toEqual({left:2,top:1,right:3,bottom:2});
  const empty=cutoutBounds(new Uint8ClampedArray(64),4,4);
  expect(standardPlateScale(4,4,empty).width).toBe(.27);
 });
});
