# Verification — 2026-11-15

## Current evidence

- Repository base: current `origin/main`, `3224b29`; isolated `codex/glimmer-plate-quest` branch. Prior published-menu work remains on its own worktree/branch.
- Read both recovered attachments. Original archive contains 494 entries including its checksums file; all 493 listed original-file hashes pass.
- Official Meta documentation checked against installed IWSDK 1.0.0-rc.2 declarations. Existing version retained; no speculative API upgrade.
- Typecheck passes after integration.
- 48 unit/integrity tests pass: exact save/order examples, inventory, collection idempotence, unlocks, tray caps, order timing/travel, finales and all converted-model geometry/materials.
- Browser application scenarios pass (see `browser-checks.json`): title guard, entry pause/resume, stamp award, AR/detail/menu return chain, wardrobe return, order confirmation/clearing/readiness, dialogue closing and **all 32 GLBs loaded by IWSDK**.
- Original rain/steps/pier and portal screenshots captured and inspected. Narrow-window crop found and fixed with desktop camera fitting. This is visual inspection, not pixel-identical reference matching.
- Runtime entering an IWER Quest session succeeded. Full controller press/release acceptance passed; see final input evidence below.
- Final `npm run check` passed: typecheck, 48 tests and production build. Build warnings are the SDK bundle size (roughly 8 MB before gzip) and two third-party comment annotations.

## Important limits

- This is a stationary spatial-screen market with native 3D dishes. It does not invent 3D interiors/architecture from the original 2D art.
- Physical Meta Quest, real hand tracking, sustained headset frame rate, comfort, mobile touch and actual audio listening have not been tested. The emulator cannot prove these.
- UI uses the original fonts, nine-slice panel/button art and orange palette, with a 1280×720 spatial layout. Exact original responsive breakpoints, some UI transitions/typewriter effects, all screen-reader journeys and every screenshot target are not verified/reproduced.
- World uses the exact fixture layout and original sprites. Deterministic tile variation, fixed source viewport and some inherited-slice ambient/collision details differ; see WORLD.md.
- Market-code typo guarantee is impossible with the supplied checksum as written. Compatibility is preserved; collision tests/documentation expose the limitation.
- Hologram models are displayed on a spatial shelf in the headset view rather than composited into the original 2D portal-table anchor. Demo codes remain display-only, as specified; no external XR order service exists.
- Native 3D models are cached lazily. The canvas world/UI refresh at 30 Hz while XR rendering and model rotation follow the headset render loop. Measure real-device frame budget before release.
- No production deployment or merge has occurred.

## Final input evidence

- `scripts/verify-input.mjs` passes actual pointer Start, keyboard motion after entry (x 22 → 19.525 at y 27), Tab→Passport and Escape→Explore.
- All four district exit paths accepted and arrived in the specified district through the live world transition code. See `input-checks.json`.
- IWER Quest ray test passed: entered XR, aimed right controller at Passport world target (-1.51, 0.76, -2.8), sent trigger 1 then 0; live application reported `screen: passport` at player (40.5,24.5). This validates SDK ray/UV dispatch through the canvas UI, not physical-controller hardware.
- Performance improvement: UI rendering and button-handler construction are cached until a state/input/image/font change; the animated original market refreshes at 30 Hz. Original UI sprites are nine-sliced rather than replaced.
