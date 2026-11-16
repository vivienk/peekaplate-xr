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
- UI uses the original fonts, nine-slice panel/button art and orange palette, with a 1280×720 spatial layout. The November 16 pass below restores the supplied HUD, dialogue, pause and kiosk layouts, including typewriter text. Exact original responsive breakpoints, all screen-reader journeys and every screenshot target are not verified/reproduced.
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

## Rain loop continuity

Rain and awning rain now decode once into looping Web Audio buffers, with a 250 ms equal-power seam blend. Original OGG assets and the quieter -18/-19 dB mix remain unchanged. No timer or file restart is used at loop boundaries. HTML media remains a fallback if Web Audio decoding is unavailable.

`npm run typecheck`, all 63 tests and production build passed. `scripts/test-browser-rain.mjs` rendered three repetitions of each actual recording through OfflineAudioContext: join RMS / overall RMS was 0.958 (rain) and 1.065 (awning), with no silent join. Live browser checks confirmed source identity survives district changes/repeated unlock and Sound off mutes the buffered rain. Physical Quest listening remains unverified. Playback follows the [Web Audio looping API](https://www.w3.org/TR/webaudio/#AudioBufferSourceNode).

## Screenshot and discovery restoration — 2026-11-16

Compared the 13 user-supplied gameplay captures with the supplied GDD, UI HTML/CSS and original asset pack. Restored the corner HUD/minimap with visited checks, stamp/find/tasting counters, stacked proximity prompts, bottom portrait dialogue and cyan holo dialogue, cream rail/flap pause menu, kiosk tabs and outfit preview, gold wardrobe selections and locked thresholds. The Passport exposes each district's original stamp images and individual discovery slots.

Dialogue reveals at 40 characters/second with speech blips and talking sprites. A first continuation reveals the current line; a subsequent continuation advances. Keyboard E no longer both opens dialogue and reveals it in the same event. Holo scans delay the panel for the source glitch effect; cat greetings use the original happy frames, heart and sounds. Stamp/find notices wait until returning to the street, and the completion card waits until queued notices finish. Pointer press art and reduced-motion-aware overlay transitions share the existing mouse, gamepad and Quest-ray targets.

The world view now uses the supplied 480×270 reference framing. Rain slants across the view. Neon/lamp/portal light blooms render above their source objects, while reflection streaks and pools render on the ground. Original PNGs, audio, fixtures and all dish models are unchanged.

`scripts/test-browser-reference.mjs` passes: all 7 restaurant stamps and all 28 discoveries have a reachable interaction position; the test invokes the live world interaction from that position. Puddle finds use the actual stationary dwell path. Repeat interactions do not increase counts; save codes restore 7 stamps and 28 finds; the grand finale opens. This uses a flood-fill and positions the player at reachable cells, rather than claiming a manual walk-through of every route. It also checks dialogue continuation, including real keyboard events. Results are saved in `reference-checks.json`; screenshots are generated under ignored `artifacts/reference/`.

The standard-mapped browser controller regression passes Start, movement, Pause/Back, tray, Passport, map, restaurant, dish, portal rotation and disconnect. It uses a simulated Gamepad API device; physical Xbox, PlayStation and Quest hardware remain untested. The prior seamless rain audio implementation is retained.

Final checks passed: TypeScript, all 63 unit/integrity tests, production build, the reference interaction script, the browser controller script, and `verify-glimmer.mjs` including order confirmation/readiness, wardrobe/modal return, and all 32 native dish loads. Pause remains frozen when opening Passport and Market code. One test-browser connection dropped before the broader regression began; restarting the managed browser and rerunning the combined checks passed.

Reviewed screen captures are retained under `reference-ui/`. The supplied screens have been visually compared, not certified pixel-identical. Remaining limits include the fixed 16:9 spatial board, deterministic background tile variation where no painted tile map was supplied, and timing/performance on physical Quest. These do not prevent preview testing.
