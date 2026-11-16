import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
describe('bundled world data',()=>{
 for(const name of ['restaurants','market-map','district-lantern-steps','district-fogline-pier','manifest']){
  it(`keeps ${name} identical to the original game asset`,()=>{
   const original=name==='manifest'?`public/glimmer/${name}.json`:`public/glimmer/fixtures/${name}.json`;
   expect(readFileSync(`src/glimmer/fixtures/${name}.json`,'utf8')).toBe(readFileSync(original,'utf8'));
  });
 }
});
