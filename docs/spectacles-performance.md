# Spectacles rendering

Browser Lens (`peekaplate-ar.vercel.app` or `?spectacles=1`) presents the original 1280 × 720 game canvas directly for flat screens. Native controls retain their existing coordinates. This removes repeated canvas-to-WebGL uploads; it does not change movement speed, rain, lights, artwork, menus or game rules.

Portion view and immersive sessions keep the existing WebGL/XR path. Returning restores the flat canvas. The FPS badge measures application visual updates: canvas/2.5D changes for flat screens and completed render calls for 3D/XR. It cannot measure headset compositor or reprojection FPS.

FPS-only changes now composite the cached UI without rebuilding dish panels or native buttons. Minimap terrain is cached by district object, row-array identity and dimensions; player markers, restaurants and stamps still draw live.

Validation: typecheck, Vitest, production build, and browser checks for movement, menu entry, dish viewing, FPS-only invalidation, portion switching and return. Run a development server on port 4174 and `node scripts/check-spectacles-render.mjs` for the focused regression check.

A local Chromium CPU profile before the change identified `texSubImage2D` as the largest named native hotspot (605 samples in a four-second walking capture). It disappeared from the top sampled functions after direct-canvas presentation. These are local diagnostic samples, not a measured Spectacles speedup. Physical-device FPS and immersive placement still require testing on Spectacles.

## Low-power mode

Defaults on at `peekaplate-ar.vercel.app` (including `/xr/1`) and with `?spectacles=1`. Pause → Low power switches it on/off; the choice is saved locally, with a safe default if storage is blocked.

- Market artwork redraws at up to 30 Hz; simulation, input polling, collision, audio and interaction checks continue on every game-loop tick.
- Rain uses 24 streaks. Title effects update at 4 Hz instead of 8 Hz. Automatic portion/hologram rotation stops; manual rotation and photo tilt still work.
- The otherwise static WebGL background behind direct-canvas screens renders at 4 Hz; non-immersive 3D portions render at up to 30 Hz. Browser Lens WebGL pixel density drops from 1 to 0.75, while the direct game/menu canvas stays full-resolution.
- Immersive XR rendering is never frame-capped. The FPS badge counts actual application visual frames after throttling. Idle flat screens can show 0; counter-only refreshes and the hidden WebGL background are excluded. Measurement resets when screen or power mode changes.
- Normal walking speed is 73.95 world pixels/second (13% below 85). Low-power mode applies an additional 15% reduction to 62.8575 world pixels/second. Both speeds are shared by keyboard, controller and click/tap navigation.

This reduces application workload; no thermal-runtime or shutdown-prevention claim is established without physical Spectacles testing.
