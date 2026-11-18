import {describe,it,expect} from 'vitest';
import {usesSpectacles} from '../src/glimmer/xr-mode';
describe('XR route selection',()=>{
 it('keeps /xr on Meta on both hosts even with an old Spectacles query',()=>{
  for(const hostname of ['peekaplate.vercel.app','peekaplate-ar.vercel.app'])
   for(const pathname of ['/xr','/xr/'])expect(usesSpectacles({hostname,pathname,search:'?spectacles=1'})).toBe(false);
 });
 it('keeps /xr/1 in Spectacles mode on either host',()=>{
  for(const hostname of ['peekaplate.vercel.app','peekaplate-ar.vercel.app'])
   expect(usesSpectacles({hostname,pathname:'/xr/1/',search:''})).toBe(true);
 });
 it('retains the legacy AR home page',()=>{
  expect(usesSpectacles({hostname:'peekaplate-ar.vercel.app',pathname:'/',search:''})).toBe(true);
  expect(usesSpectacles({hostname:'peekaplate.vercel.app',pathname:'/',search:''})).toBe(false);
 });
});
