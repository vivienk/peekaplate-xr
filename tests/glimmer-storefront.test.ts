import {describe,it,expect} from 'vitest';
import {storefrontPlan} from '../src/glimmer/storefront';
describe('venue architecture',()=>{
 it('retains the same geometry for the same venue',()=>{
  expect(storefrontPlan('venue-1','ramen',112,128)).toEqual(storefrontPlan('venue-1','ramen',112,128));
 });
 it('varies structure within the same cuisine, not just color',()=>{
  const plans=Array.from({length:64},(_,i)=>storefrontPlan(`venue-${i}`,'ramen',112,128));
  const geometry=plans.map(p=>JSON.stringify([p.side,p.bay,p.center,p.windowY,p.doorX,p.doorRise,p.variant,p.form,p.canopy,p.signMount,p.fixture]));
  expect(new Set(geometry).size).toBe(64);
  expect(new Set(plans.map(p=>p.doorX)).size).toBe(2);
  expect(new Set(plans.map(p=>p.bay)).size).toBeGreaterThan(2);
  for(const field of ['form','canopy','signMount','fixture'] as const)expect(new Set(plans.map(p=>p[field])).size).toBe(3);
 });
});

it('uses the lantern-counter design for Ember and provides all three concept adaptations',()=>{
 expect(storefrontPlan('diner-demo:ember-stone','ember',112,112).concept).toBe(0);
 const concepts=new Set(Array.from({length:64},(_,i)=>storefrontPlan(`venue-${i}`,'ramen',112,128).concept));
 for(const concept of [0,1,2])expect(concepts.has(concept)).toBe(true);
});
