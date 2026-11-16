# Architecture
- `public/glimmer`: unchanged original package plus separately named uploaded GDD; checksums verified.
- `public/glimmer-derived/models`: reproducible GLB conversion for manifest loading.
- `src/glimmer/data.ts`, `state.ts`: original fixture types and game rules.
- `src/glimmer/market.ts`: sprite world, movement, camera and world interaction.
- `src/glimmer/app.ts`: modal stack, shared UI canvas, keyboard and menu actions.
- `src/glimmer/system.ts`: IWSDK ray interaction, spatial canvas, 3D previews and controller input.
- `src/index.ts`: app entry and World initialization.
- Tests: inventory/integrity, exact code vectors and state transitions. Runtime: title/start, travel, menu/order, 3D models and XR ray controls.

Milestones: baseline typecheck/runtime; source and logic; original world and UI; spatial integration; end-to-end tests and fidelity audit. Each runtime gap must remain named in verification report, never marked complete based on compilation.
