// PeekaPlate: dish photo -> 3D model (.glb) using Microsoft TRELLIS.2 on Hugging Face.
//
// Run OFFLINE (on your laptop), not inside the deployed app: each model takes
// minutes on a shared GPU queue, longer than a Vercel function should wait.
//
// Setup:
//   npm i -D @gradio/client
//   export HF_TOKEN=hf_xxx          # huggingface.co/settings/tokens (read token) – gives you GPU quota
//   put photos in ./dish-photos/<dish-id>.png   (e.g. pork-xiao-long-bao.png; jpg also fine)
//
// Run:
//   node scripts/generate-models.mjs                 # all photos
//   node scripts/generate-models.mjs pork-xiao-long-bao  # just one
//
// Output: public/models/<dish-id>.glb  (matches modelUrl in menu.json)
// Photo filenames must match dish ids in public/menu.json, e.g. dish-photos/pork-xiao-long-bao.png

import { Client, handle_file } from "@gradio/client";
import { readdir, readFile, writeFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";

const SPACE = "microsoft/TRELLIS.2";
const PHOTO_DIR = "dish-photos";
const OUT_DIR = "public/models";

// Quest-friendly settings: fewest faces + smallest textures the Space allows.
const RESOLUTION = "512";          // "512" | "1024" | "1536" – 512 is fastest
const DECIMATION_TARGET = 100000;  // Space min (default 300000)
const TEXTURE_SIZE = 1024;         // Space min (default 2048)

const token = process.env.HF_TOKEN;
if (!token) console.warn("⚠️  No HF_TOKEN set – anonymous GPU quota is tiny and you'll likely be rate-limited.");

async function generate(dishId, photoPath) {
  const t0 = Date.now();
  // One client per dish = one Gradio session, so the generated 3D state
  // from image_to_3d is still there when extract_glb runs.
  const client = await Client.connect(SPACE, { hf_token: token });

  // The Space creates a per-session temp folder on page load; do the same.
  try { await client.predict("/start_session", {}); } catch { /* not exposed – fine */ }

  console.log(`[${dishId}] removing background + cropping…`);
  const pre = await client.predict("/preprocess_image", {
    input: handle_file(await readFile(photoPath)),
  });
  const cleanImage = pre.data[0];

  console.log(`[${dishId}] generating 3D (this is the slow part)…`);
  await client.predict("/image_to_3d", {
    image: handle_file(cleanImage.url ?? cleanImage.path),
    seed: 0,
    resolution: RESOLUTION,
  });

  console.log(`[${dishId}] extracting GLB…`);
  const glb = await client.predict("/extract_glb", {
    decimation_target: DECIMATION_TARGET,
    texture_size: TEXTURE_SIZE,
  });
  const file = glb.data[0];
  const url = file.url ?? file;

  const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error(`download failed: ${res.status}`);
  const outPath = path.join(OUT_DIR, `${dishId}.glb`);
  await writeFile(outPath, Buffer.from(await res.arrayBuffer()));

  const mb = ((await stat(outPath)).size / 1e6).toFixed(1);
  console.log(`✅ [${dishId}] ${outPath} (${mb} MB, ${Math.round((Date.now() - t0) / 1000)}s)`);
  if (mb > 5) console.log(`   ↳ big for Quest – shrink it: npx @gltf-transform/cli optimize ${outPath} ${outPath} --texture-size 1024`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const only = process.argv[2];
  const photos = (await readdir(PHOTO_DIR)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
  const jobs = photos
    .map((f) => ({ id: path.parse(f).name, file: path.join(PHOTO_DIR, f) }))
    .filter((j) => !only || j.id === only);
  if (!jobs.length) return console.log(`No photos found in ${PHOTO_DIR}/`);

  // Sequential on purpose: the shared GPU queue punishes parallel requests.
  for (const j of jobs) {
    try { await generate(j.id, j.file); }
    catch (e) { console.error(`❌ [${j.id}] ${e.message} – fallback: run this photo by hand in the Space UI`); }
  }
}

main();
