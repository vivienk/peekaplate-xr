/** Reproducible, dependency-free OBJ/MTL -> glTF 2.0 transport conversion.
 * Geometry, normals, source parts and material identities remain intact.
 * The original OBJ/MTL files are never changed. See design/ASSETS.md.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'public/glimmer');
const output = resolve(root, 'public/glimmer-derived/models');
mkdirSync(output, { recursive: true });
const restaurants = JSON.parse(readFileSync(resolve(source, 'fixtures/restaurants.json'), 'utf8'));
const inputs = restaurants.flatMap(r => r.dishes.map(d => ({ id: d.id, file: d.xr.model })));
inputs.push({ id: 'portal-pedestal', file: 'assets/models/portal-pedestal.obj' });
const linear = x => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const reports = [];
for (const { id, file } of inputs) {
  const objBytes = readFileSync(resolve(source, file));
  const mtlBytes = readFileSync(resolve(source, file.replace(/\.obj$/, '.mtl')));
  const materials = []; let m;
  for (const line of mtlBytes.toString().split(/\r?\n/)) {
    const [key, ...tokens] = line.trim().split(/\s+/);
    if (key === 'newmtl') { m = { name: tokens.join(' '), Kd: [1,1,1], Ks: [0,0,0], Ns: 0, d: 1 }; materials.push(m); }
    else if (m && ['Kd', 'Ks', 'Ka', 'Ke'].includes(key)) m[key] = tokens.map(Number);
    else if (m && ['Ns', 'd', 'illum'].includes(key)) m[key] = Number(tokens[0]);
    else if (key.startsWith('map_')) throw new Error(`${id}: textured source needs an explicit conversion`);
  }
  const positions = [], normals = [], parts = []; let group = id, material = null, part;
  const index = (value, length) => Number(value) < 0 ? length + Number(value) : Number(value) - 1;
  for (const line of objBytes.toString().split(/\r?\n/)) {
    const [key, ...tokens] = line.trim().split(/\s+/);
    if (key === 'v') positions.push(tokens.map(Number));
    else if (key === 'vn') normals.push(tokens.map(Number));
    else if (key === 'g') { group = tokens.join(' '); part = undefined; }
    else if (key === 'usemtl') { material = tokens.join(' '); part = undefined; }
    else if (key === 'f') {
      if (!part) { part = { name: group, material, positions: [], normals: [], indices: [], lookup: new Map() }; parts.push(part); }
      const face = tokens.map(t => {
        const [v, uv, n] = t.split('/');
        if (uv || !n) throw new Error(`${id}: expected authored normals and no UVs`);
        const vi = index(v, positions.length), ni = index(n, normals.length), k = `${vi}/${ni}`;
        if (!positions[vi] || !normals[ni]) throw new Error(`${id}: invalid face index ${t}`);
        if (!part.lookup.has(k)) { part.lookup.set(k, part.positions.length / 3); part.positions.push(...positions[vi]); part.normals.push(...normals[ni]); }
        return part.lookup.get(k);
      });
      for (let i = 1; i < face.length - 1; i++) part.indices.push(face[0], face[i], face[i+1]);
    }
  }
  const gltf = {
    asset: { version: '2.0', generator: 'Glimmer Plate original OBJ/MTL transport converter' },
    extensionsUsed: ['KHR_materials_specular'],
    scene: 0, scenes: [{ nodes: [0] }], nodes: [{ name: id, children: [] }],
    meshes: [], materials: materials.map(x => {
      // Source Kd is explicitly sRGB in the GDD. glTF factors are linear.
      const base = x.Kd.map(linear), smoothness = x.Ns >= 150 ? 0.8 : x.Ns >= 60 ? 0.6 : 0.35;
      const steel = id === 'portal-pedestal' && x.name.startsWith('steel_');
      const glow = id === 'portal-pedestal' && x.name.startsWith('holo_');
      return { name: x.name, pbrMetallicRoughness: {
        baseColorFactor: [...base, x.d], metallicFactor: steel ? 0.6 : 0,
        roughnessFactor: steel ? 0.4 : 1 - smoothness,
      }, alphaMode: x.d < 1 ? 'BLEND' : 'OPAQUE', doubleSided: false,
      ...(glow ? { emissiveFactor: base } : {}),
      extensions: { KHR_materials_specular: { specularFactor: Math.max(...x.Ks), specularColorFactor: [1,1,1] } },
      extras: { originalMTL: x } };
    }),
    buffers: [{ byteLength: 0 }], bufferViews: [], accessors: [],
    extras: { sourceFile: file, sourceOBJsha256: sha(objBytes), sourceMTLsha256: sha(mtlBytes), units: 'metres', upAxis: 'Y', frontAxis: '+Z' },
  };
  const chunks = []; let byteLength = 0;
  function accessor(array, type, componentType, target, bounds = false) {
    const padding = (4 - byteLength % 4) % 4;
    if (padding) { chunks.push(Buffer.alloc(padding)); byteLength += padding; }
    const bytes = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
    const view = gltf.bufferViews.push({ buffer: 0, byteOffset: byteLength, byteLength: bytes.length, target }) - 1;
    chunks.push(bytes); byteLength += bytes.length;
    const a = { bufferView: view, componentType, count: array.length / (type === 'VEC3' ? 3 : 1), type };
    if (bounds) {
      a.min = [Infinity, Infinity, Infinity]; a.max = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < array.length; i++) { a.min[i % 3] = Math.min(a.min[i % 3], array[i]); a.max[i % 3] = Math.max(a.max[i % 3], array[i]); }
    }
    return gltf.accessors.push(a) - 1;
  }
  for (const p of parts) {
    const mi = materials.findIndex(x => x.name === p.material);
    if (mi < 0) throw new Error(`${id}: missing material ${p.material}`);
    const indexType = p.positions.length / 3 <= 65535 ? Uint16Array : Uint32Array;
    const primitive = { attributes: {
      POSITION: accessor(new Float32Array(p.positions), 'VEC3', 5126, 34962, true),
      NORMAL: accessor(new Float32Array(p.normals), 'VEC3', 5126, 34962),
    }, indices: accessor(new indexType(p.indices), 'SCALAR', indexType === Uint16Array ? 5123 : 5125, 34963), material: mi, mode: 4 };
    const mesh = gltf.meshes.push({ name: p.name, primitives: [primitive] }) - 1;
    gltf.nodes[0].children.push(gltf.nodes.push({ name: p.name, mesh }) - 1);
  }
  gltf.buffers[0].byteLength = byteLength;
  const bin = Buffer.concat(chunks), jsonRaw = Buffer.from(JSON.stringify(gltf));
  const json = Buffer.concat([jsonRaw, Buffer.alloc((4 - jsonRaw.length % 4) % 4, 0x20)]);
  const binary = Buffer.concat([bin, Buffer.alloc((4 - bin.length % 4) % 4)]);
  const header = Buffer.alloc(12), jsonHeader = Buffer.alloc(8), binHeader = Buffer.alloc(8);
  header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(28 + json.length + binary.length, 8);
  jsonHeader.writeUInt32LE(json.length, 0); jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  binHeader.writeUInt32LE(binary.length, 0); binHeader.writeUInt32LE(0x004e4942, 4);
  const glb = Buffer.concat([header, jsonHeader, json, binHeader, binary]);
  writeFileSync(resolve(output, `${id}.glb`), glb);
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const v of positions) v.forEach((x, i) => { min[i] = Math.min(min[i], x); max[i] = Math.max(max[i], x); });
  reports.push({ id, file, triangles: parts.reduce((n,p) => n + p.indices.length / 3, 0), materials: materials.length, parts: parts.length, bounds: { min, max }, bytes: glb.length, sourceOBJsha256: sha(objBytes), sourceMTLsha256: sha(mtlBytes), glbSha256: sha(glb) });
}
writeFileSync(resolve(output, 'conversion-report.json'), JSON.stringify({ source: 'glimmer-plate-full 1.0.0', models: reports }, null, 2) + '\n');
console.log(`Converted ${reports.length - 1} dishes and the original portal pedestal; ${reports.slice(0, -1).reduce((n,r) => n + r.triangles, 0)} dish triangles.`);
