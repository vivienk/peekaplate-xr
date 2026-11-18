# Spectacles rendering

Browser Lens (`peekaplate-ar.vercel.app` or `?spectacles=1`) presents the original 1280 × 720 game canvas directly for flat screens. Native controls retain their existing coordinates. This removes repeated canvas-to-WebGL uploads; it does not change movement speed, rain, lights, artwork, menus or game rules.

Portion view and immersive sessions keep the existing WebGL/XR path. Returning restores the flat canvas. The FPS badge still measures the SDK frame loop, not display compositor or headset reprojection FPS.

FPS-only changes now composite the cached UI without rebuilding dish panels or native buttons. Minimap terrain is cached by district object, row-array identity and dimensions; player markers, restaurants and stamps still draw live.

Validation: typecheck, Vitest, production build, and browser checks for movement, menu entry, dish viewing, FPS-only invalidation, portion switching and return. Run a development server on port 4174 and `node scripts/check-spectacles-render.mjs` for the focused regression check.

A local Chromium CPU profile before the change identified `texSubImage2D` as the largest named native hotspot (605 samples in a four-second walking capture). It disappeared from the top sampled functions after direct-canvas presentation. These are local diagnostic samples, not a measured Spectacles speedup. Physical-device FPS and immersive placement still require testing on Spectacles.
