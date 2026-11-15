# PeekaPlate XR: TRELLIS.2 food-asset experiment

## Scope
Separate experimental image-to-3D workflow in `peekaplate-xr`. Do not merge any generation API into the existing PeekaPlate diner, owner onboarding, or menu publishing path. The GPU worker is not hosted on Vercel; Vercel only hosts the IWSDK/Vite XR frontend.

## Style benchmark
The Meshy chirashi bowl is the style target, not a TRELLIS checkpoint. The benchmark is a painted-diffuse look: rounded medium-poly geometry, vivid fish colors, broad *baked* specular strokes, single color texture where possible, low metallic reflectance. Image-to-3D alone does not guarantee style consistency; first create a consistent stylized reference image for each restaurant dish and record its source photograph, prompt version, review state and generated asset lineage.

## Prototype
1. Produce a 3/4-elevated, isolated, stylized dish PNG inspired by the reference, preserving menu contents and identity. Do not invent allergens or ingredients from generated art.
2. Provision a **separate, authenticated Linux NVIDIA GPU with >=24 GB VRAM**. Install official `microsoft/TRELLIS.2` (including recursive submodules) following upstream setup.sh instructions, conda and CUDA prerequisites.
3. In a working directory containing both this repo and installed upstream dependencies, run:
   `python services/trellis2/generate.py --input /data/chirashi-reference.png --output /data/chirashi-trellis.glb`
4. Validate the GLB (geometry, bounds, textures, normals, visual accuracy at 3/4 and rear angles). Export a lighter web/mobile variant, and retain the original master privately.
5. Upload approved GLB to the XR asset origin, add a versioned asset ID to the IWSDK catalog, and confirm mobile performance. Use the existing 2.5D fallback on unsupported/slow clients.

The script mirrors the official TRELLIS.2 Python pipeline. The `--resolution` flag is reserved for experimentation; it does not change upstream inference until a supported model-specific parameter is wired. Do not interpret it as a guaranteed output resolution.

## Environment isolation
- **Production:** GitHub `main` => Vercel production, public XR site. Explicit manual approval required to promote new generated models; use immutable versioned asset paths.
- **Staging:** GitHub `develop` => Vercel preview/staging. Experimental assets and GPU jobs only; no production secrets or assets.
- **Feature branches:** PR previews, no production generation credentials.
- **GPU:** independent worker/service and billing, never execute TRELLIS inference in a Vercel build or browser.
- **Secrets:** inject server-side only (GPU provider token, object storage writes, signing tokens). Never use `VITE_` variables for secrets, as those are public in bundles.
- **Storage:** separate staging/prod asset prefixes or buckets, least-privilege write credentials, and private sources. Generated approved GLBs can be served via a public CDN.
- **Review gate:** source photo => styled image => generated model => QA => approved/published.

Suggested environment variables:
```
# public, safe in Vite bundle
VITE_XR_ENV=staging|production
VITE_ASSET_BASE_URL=https://<environment-specific-asset-host>/

# secrets: GPU service only; do NOT commit or prefix VITE_
TRELLIS_API_TOKEN=<secret>
R2_ACCESS_KEY_ID=<secret>
R2_SECRET_ACCESS_KEY=<secret>
```

## Acceptance
- Chirashi source -> stylistic reference -> exported GLB, reviewed side by side with Meshy source.
- Two more dishes generated, with no ingredient hallucinations in visual presentation.
- Single asset loads in desktop browser and Quest WebXR without regressions.
- Staging vs production have independent deployment targets and model/asset permissions.
- Failures do not interrupt diner or owner publishing; no paid GPU job automatically runs from PR/CI.

## Current status
This change provides configuration, reproducible proof-of-concept script, and deployment design. It does **not** provision a GPU, issue a paid inference run, deploy the worker, create R2 buckets, or imply successful model generation.
