# Market movement, dining and model pipeline

The game preview keeps its original 32 dish assets and 3 districts. Walking is 100 pixels/second (previously 72), renderer-paced with bounded collision substeps, and the camera follows in 65ms. The original 32 dishes have explicitly labeled demo USD prices. Published menu prices are untouched.

The map separates geographic markers from the restaurant list. Every restaurant gets a pixel logo and a travel action that locates a free arrival position in its interaction area. Search and comparison share typed category/ingredient/keyword matching, category filters and the existing headset/controller keyboard.

## 2.5D source and provenance

`python3 scripts/prepare-game-portions.py` prepares all 37 current sample dishes, without provider calls. It preserves source files, expands the original pixel art by nearest-neighbour sampling, and reuses the five existing Ember & Stone sample photo cutouts. It exports bounded, hashed T1 layers plus private review inputs and resumable jobs. These are derived previews, not newly photographed or AI-reconstructed food. Published dishes use their own revision-bound T1 metadata; unknown physical dimensions stay approximate.

The left detail image and full-screen portal verify layer size, hash and dimensions before rendering. The original-photo option remains available. The original 32 GLBs remain available, with a 2.5D/3D switch. No generated asset or serving count is treated as a measurement.

## Tripo generation and installation

The private provider client and job engine are copied unchanged from PeekaPlate [PR 162](https://github.com/vivienk/peekaplate/pull/162), merged head `a09f35c7f87edf8616260c258512443d28235f6d`:

- `processing/src/peekaplate_processing/generate_model.py`
- `processing/src/peekaplate_processing/tripo.py`
- `processing/tests/test_generate_model.py`

They use the documented Tripo v3 file upload, image-to-model submission and task endpoints. Provider keys stay in the local process environment. They are never sent to the game, committed, or stored in the public manifest. Private inputs and provider state are ignored by Git.

1. Prepare inputs: `python3 scripts/prepare-game-portions.py` (Pillow required).
2. Inspect safe job summaries: `python3 scripts/game-models.py status`.
3. Configure `TRIPO_API_KEY` privately in the shell/process, then explicitly select a dish: `python3 scripts/game-models.py generate --dish r1-1`. This is billable. The default poll window is 45 seconds; rerunning resumes the existing task. Never resubmit a job marked `submission_unknown`; reconcile it with Tripo first.
4. Review `.model-pipeline/jobs/<key>/index.html` using a local HTTP server against the source cutout, including unseen surfaces and plate distortion. The output is a generated draft, not a physical measurement.
5. Install an accepted preview model: `python3 scripts/game-models.py install --dish r1-1 --reviewed`. Installation rechecks the source/revision and embedded GLB bytes, then updates the public manifest. Rebuild/deploy the game to serve it.
6. The portal automatically prefers a reviewed generated model whose source hashes still match; 2.5D and original-model fallbacks remain usable. A changed source invalidates the generated model.

No live Tripo model was generated in this change: the local process has no configured provider key. The 37 inputs are prepared; the public generated-model manifest intentionally remains empty. Provider tests use synthetic fake responses in temporary directories, never shipped assets. Physical Quest passthrough and actual-size accuracy require device verification.

## Validation

Run `npm run typecheck` before `npm test`, then `npm run build`. The asset checksum test protects every original source asset. The dining and movement tests cover price labeling, combined search, frame-rate-independent movement, collision/paused behavior, T1 bytes and generated-source matching.

`PYTHONPATH=scripts/processing python3 -m unittest discover -s scripts/processing/tests` tests provider request contracts, zero-credit handling, task resumption, unknown submissions, model integrity and installation. It does not establish live provider availability.

Managed-browser checks: `scripts/test-browser-market-upgrade.mjs`, `scripts/test-browser-dining.mjs`, and `scripts/test-browser-district-keyboard.mjs`.
