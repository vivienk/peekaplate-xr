import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import illustrations from '../src/glimmer/illustrative-portions.json';
import {marketCatalogue} from '../src/glimmer/catalogue';
import {PublicPortionSchema} from '../src/published/portion';
import {portionScale} from '../src/glimmer/portion-preview';
it('covers every original dish with food imagery while keeping original pixel menu art',()=>{
 const all=marketCatalogue([]);expect(Object.keys(illustrations)).toHaveLength(26);
 for(const d of all){expect(d.image).not.toContain('/glimmer/');expect(d.menuImage).toContain('/glimmer/');expect(d.photoCredit||d.illustrative).toBeTruthy();expect(d.price).toMatch(/^USD \d+\.\d{2}$/);expect(portionScale(d).measured).toBe(false);}
});
it('delivers exact, bounded layers for all labeled illustrations without invented calibration',()=>{
 for(const entry of Object.values(illustrations)){const p=entry.portion;expect(PublicPortionSchema.safeParse(p).success).toBe(true);expect(p).not.toHaveProperty('physical_size');
 for(const l of p.layers){const b=readFileSync(new URL('../public/illustrative-portions/'+l.url.split('.invalid/')[1],import.meta.url));expect(b.length).toBe(l.size_bytes);expect(createHash('sha256').update(b).digest('hex')).toBe(l.sha256);}
 }
});
