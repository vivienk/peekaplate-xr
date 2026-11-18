import{it,expect}from'vitest';
import{servingLabel}from'../src/glimmer/serving-label';
it('distinguishes individual and sharing portions with an explicit estimate for missing counts',()=>{
 expect(servingLabel(1)).toBe('Serving for 1 person');
 expect(servingLabel(4)).toBe('Serves 4 people to share');
 for(const count of [undefined,0,-1,1.5,NaN])expect(servingLabel(count)).toBe('Estimated serving for 1 person');
});
