# Original assets and IWSDK model transport

The supplied `glimmer-plate-full-1.0.0 (1).zip` is preserved under `public/glimmer/`, including its manifest, source OBJ/MTL files, original audio, fonts, pixel art, fixtures and target images. `UPLOADED-GDD.txt` is the separately supplied design file. The original archive's `CHECKSUMS.sha256` is used by the test suite to check every archived content file.

## Conversion

Run `node scripts/convert-glimmer-models.mjs` from the repository to regenerate `public/glimmer-derived/models/`. This reads only the original OBJ/MTL files and fixture; it never edits them. The 32 dish models contain exactly 70,591 triangles in total, with at most 3,864 triangles and 12 materials per dish. The original portal pedestal is also converted (2,016 triangles). Output is approximately 2.5 MB total.

The GLB transport preserves source triangle winding, part/group names, coordinates, authored normals, material assignments, axes (Y up, +Z front), metre scale and bottom-centre pivot. Floating-point attributes use glTF's standard float32 storage. The originals contain only triangles; the converter additionally supports fan triangulation if a future source contains convex polygon faces. Source OBJ/MTL hashes and all original material numeric fields are retained in GLB metadata and `conversion-report.json`.

This is geometry-preserving format conversion, not an assertion that Phong and PBR lighting are identical. Source `Kd` is explicitly sRGB in the GDD, so it is converted to linear glTF base-color factors. Source alpha is preserved with front faces and BLEND mode for translucent parts. PBR roughness follows the GDD's proposed smoothness tiers (0.35 / 0.6 / 0.8); the specular extension carries source Ks intensity. The pedestal keeps its steel metallic setting and colored emissive rings. Exact appearance depends on runtime lighting and transparent-part sorting and must be assessed in the actual viewer.

## Runtime integration

`src/glimmer/model-assets.ts` exports `modelAssets`, containing lazy IWSDK GLTF descriptors for all dishes, plus `glimmerModelId(dishId)` (for example `glimmer-dish-r1-1`). The pedestal asset ID is `glimmer-portal-pedestal`. Spread `modelAssets` into the application `defineAssets()` manifest, then load through IWSDK AssetManager. Every URL uses `import.meta.env.BASE_URL`; no standalone runtime OBJ/GLTF loader or second Three.js instance is introduced.

## Verification scope

`tests/glimmer-assets.test.ts` checks archived source checksums, restaurant/dish inventory, picture signatures, all converted GLB structure, source and converted triangle-by-triangle position/normal/material equality, winding, colors, alpha and content budgets. Runtime GLB loading and visual inspection are application-level checks owned by the integration verification. No claim of a physical Quest performance or appearance test is made here.
