import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { marketCatalogue, searchDishes } from '../src/glimmer/catalogue';
import { modelAssets, modelsForDish } from '../src/glimmer/model-assets';
import { menuModelDishes } from '../src/glimmer/menu-models';
import suppliedModels from '../docs/supplied-models-provenance.json';

vi.mock('@iwsdk/core', () => ({ AssetType: { GLTF: 'GLTF' } }));

describe('dish models available in the AR portal', () => {
  it('makes every bundled dish GLB reachable and registered for lazy loading', () => {
    const files = ['glimmer-derived/models', 'supplied-dishes', 'models', 'generated-models'].flatMap(dir =>
      readdirSync('public/' + dir)
        .filter(file => file.endsWith('.glb') && file !== 'portal-pedestal.glb')
        .map(file => dir + '/' + file));
    const options = marketCatalogue([]).flatMap(dish => modelsForDish(dish.id));
    expect(options.map(model => model.file).sort()).toEqual(files.sort());
    const assets = new Map(Object.entries(modelAssets));
    for (const model of options) {
      expect(assets.get(model.assetId)).toMatchObject({ url: '/' + model.file, priority: 'lazy' });
    }
    expect(modelsForDish('a-photo-only-published-dish')).toHaveLength(0);
  });

  it('prefers the uploaded pancakes, with the game model available as the second view', () => {
    const [pancakes, illustration] = modelsForDish('r2-1');
    const source = suppliedModels.find(model => model.id === 'r2-1')!;
    expect(illustration.file).toBe('glimmer-derived/models/r2-1.glb');
    const bytes = readFileSync('public/' + pancakes.file);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(source.sha256);
    expect(bytes.length).toBe(source.bytes);
    const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
    const primitive = gltf.meshes[0].primitives[0];
    expect(gltf.accessors[primitive.indices].count / 3).toBe(source.triangles);
    expect(source.triangles).toBeLessThanOrEqual(45000);
    expect(gltf.images).toHaveLength(3);
    expect(gltf.images.every((image: {bufferView?: number}) => image.bufferView !== undefined)).toBe(true);
    expect(modelsForDish('scallion-pancake')[0].file).toBe('models/scallion-pancake.glb');
  });

  it('finds each imported menu dish by venue and name, with its own model and thumbnail', () => {
    const dishes = marketCatalogue([]);
    for (const item of menuModelDishes) {
      const match = searchDishes(dishes, item.restaurant + ' ' + item.name).find(d => d.id === item.id)!;
      expect(modelsForDish(match.id)[0].file).toBe(item.modelUrl.slice(1));
      expect(readFileSync('public' + match.image).readUInt32BE(0)).toBe(0x89504e47);
      expect(match.orderable).toBeFalsy();
    }
  });
});
