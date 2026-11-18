import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const source = resolve('public/glimmer');
const derived = resolve('public/glimmer-derived/models');
const restaurants = JSON.parse(readFileSync(resolve(source, 'fixtures/restaurants.json'), 'utf8'));
const dishes = restaurants.flatMap((r: { dishes: { id: string; image: string; xr: { model: string } }[] }) => r.dishes);
const models = [...dishes.map((d: { id: string; xr: { model: string } }) => ({ id: d.id, path: d.xr.model })), { id: 'portal-pedestal', path: 'assets/models/portal-pedestal.obj' }];
const sha = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

function glb(id: string) {
  const bytes = readFileSync(resolve(derived, `${id}.glb`));
  expect(bytes.readUInt32LE(0)).toBe(0x46546c67);
  expect(bytes.readUInt32LE(4)).toBe(2);
  expect(bytes.readUInt32LE(8)).toBe(bytes.length);
  const jsonLength = bytes.readUInt32LE(12);
  const doc = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
  const binary = bytes.subarray(28 + jsonLength);
  function values(index: number): number[] {
    const a = doc.accessors[index], v = doc.bufferViews[a.bufferView];
    const step = a.componentType === 5123 ? 2 : 4;
    const count = a.count * (a.type === 'VEC3' ? 3 : 1);
    const begin = (v.byteOffset ?? 0) + (a.byteOffset ?? 0);
    expect(begin + count * step).toBeLessThanOrEqual(binary.length);
    return Array.from({ length: count }, (_, i) => a.componentType === 5126 ? binary.readFloatLE(begin + i * step) : a.componentType === 5123 ? binary.readUInt16LE(begin + i * step) : binary.readUInt32LE(begin + i * step));
  }
  return { doc, values };
}

describe('original Glimmer Plate archive', () => {
  it('preserves every file covered by the original SHA256 manifest', () => {
    const lines = readFileSync(resolve(source, 'CHECKSUMS.sha256'), 'utf8').trim().split('\n');
    expect(lines.length).toBe(493);
    for (const line of lines) {
      const [, hash, path] = /^(\w{64})\s+(.+)$/.exec(line)!;
      expect(sha(readFileSync(resolve(source, path))), path).toBe(hash);
    }
  });
  it('keeps seven original restaurants and all 32 dish pictures and 3D models', () => {
    expect(restaurants).toHaveLength(7);
    expect(restaurants.map((r: { dishes: unknown[] }) => r.dishes.length)).toEqual([4,5,6,4,4,4,5]);
    expect(dishes).toHaveLength(32);
    for (const dish of dishes) {
      expect(readFileSync(resolve(source, dish.image)).readUInt32BE(0)).toBe(0x89504e47);
      expect(readFileSync(resolve(source, dish.xr.model), 'utf8')).toContain(`o ${dish.id}`);
    }
  });
});

describe('IWSDK glTF transport conversion', () => {
  it('provides exactly the 32 dishes plus the original pedestal', () => {
    expect(readdirSync(derived).filter(n => n.endsWith('.glb')).sort()).toEqual(models.map(m => `${m.id}.glb`).sort());
  });
  for (const model of models) it(`preserves ${model.id} triangle positions, normals, winding, and material assignments`, () => {
    const obj = readFileSync(resolve(source, model.path), 'utf8');
    const vertices: number[][] = [], normals: number[][] = [], expected: { position: number[]; normal: number[]; material: string }[] = [];
    let material = '';
    for (const line of obj.split('\n')) {
      const [key, ...args] = line.trim().split(/\s+/);
      if (key === 'v') vertices.push(args.map(Number));
      else if (key === 'vn') normals.push(args.map(Number));
      else if (key === 'usemtl') material = args.join(' ');
      else if (key === 'f') {
        const face = args.map(token => { const [v,,n] = token.split('/').map(Number); return { position: vertices[v-1].map(Math.fround), normal: normals[n-1].map(Math.fround), material }; });
        for (let i = 1; i < face.length-1; i++) expected.push(face[0], face[i], face[i+1]);
      }
    }
    const { doc, values } = glb(model.id);
    expect(doc.extras.sourceOBJsha256).toBe(sha(readFileSync(resolve(source, model.path))));
    const actual = [];
    for (const mesh of doc.meshes) for (const p of mesh.primitives) {
      const positions = values(p.attributes.POSITION), n = values(p.attributes.NORMAL), indices = values(p.indices);
      expect(p.mode).toBe(4);
      for (const i of indices) actual.push({ position: positions.slice(i*3, i*3+3), normal: n.slice(i*3,i*3+3), material: doc.materials[p.material].name });
    }
    expect(actual).toEqual(expected);
    for (const m of doc.materials) {
      const original = m.extras.originalMTL;
      const linear = (x: number) => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
      const color = m.pbrMetallicRoughness.baseColorFactor;
      expect(color).toHaveLength(4);
      // The sRGB exponent can round differently on different CPU architectures.
      original.Kd.forEach((channel: number, index: number) => {
        expect(Math.abs(color[index] - linear(channel))).toBeLessThanOrEqual(Number.EPSILON);
      });
      expect(color[3]).toBe(original.d);
      expect(m.alphaMode).toBe(original.d < 1 ? 'BLEND' : 'OPAQUE');
      expect(m.doubleSided).toBe(false);
    }
  });
  it('retains the source 70,591-triangle dish budget', () => {
    const report = JSON.parse(readFileSync(resolve(derived, 'conversion-report.json'), 'utf8'));
    const dishReports = report.models.filter((m: { id: string }) => m.id !== 'portal-pedestal');
    expect(dishReports.reduce((sum: number, m: { triangles: number }) => sum + m.triangles, 0)).toBe(70591);
    for (const m of dishReports) { expect(m.triangles).toBeLessThanOrEqual(4000); expect(m.materials).toBeLessThanOrEqual(12); }
  });
});
