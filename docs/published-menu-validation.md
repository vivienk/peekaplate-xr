# Integration validation — 2026-11-14

- TypeScript check passed after the published-mode integration and ray-interaction changes.
- 13 tests passed: contract hash/identity validation, missing/withdrawn menu behavior, HTTPS, strict fields, incomplete dishes, allergen unknown states, refresh failures, superseded responses and complete long-text pagination.
- Demo and published production builds passed locally. Build warnings include the existing large IWSDK/emulator bundle and harmless upstream Zod annotation warnings.
- Isolated IWSDK panel render succeeded. Explicit primitive controls replace Horizon button defaults that initially overflowed the panel.
- Browser companion and the live spatial panel rendered the unconfigured published-mode state after managed-browser recovery and the locomotion fix. No demo dish fallback appeared. Runtime inspection confirmed the panel carries RayInteractable. Local artifacts under ignored `artifacts/` are debugging evidence, not headset acceptance.
- Runtime inspection found inherited locomotion moving the viewer below the scene without a walkable floor. Published mode now stops locomotion and resets the viewer origin for stationary browsing; typecheck and tests pass after the fix. A subsequent runtime capture confirmed the panel is visible with the expected configuration error. Interactive controller/headset acceptance remains pending.
- GitHub CI passed both demo/published jobs on the initial integration head; subsequent commits require the same checks.
- No real API, hosted CORS, published restaurant, controller session, physical Quest comfort/performance, DNS or production deployment was verified.
- Dependency audit reports 15 advisories (4 moderate, 10 high, 1 critical), in the current toolchain including `@iwsdk/reference`, `@iwsdk/vite-plugin-dev`, Vite and transitive packages. The critical advisory is `proxy-addr`. No broad SDK dependency upgrade was attempted in this integration. Review remediation before release.

The change should remain draft until controller/headset interaction checks and environment acceptance are completed. A schema-valid synthetic test is not evidence of an approved live menu or physical portion accuracy.
