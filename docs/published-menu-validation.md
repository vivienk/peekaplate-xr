# Integration validation — 2026-11-14

- TypeScript check passed after the published-mode integration and ray-interaction changes.
- Initial integration: 13 tests passed: contract hash/identity validation, missing/withdrawn menu behavior, HTTPS, strict fields, incomplete dishes, allergen unknown states, refresh failures, superseded responses and complete long-text pagination.
- Demo and published production builds passed locally. Build warnings include the existing large IWSDK/emulator bundle and harmless upstream Zod annotation warnings.
- Isolated IWSDK panel render succeeded. Explicit primitive controls replace Horizon button defaults that initially overflowed the panel.
- Browser companion and the live spatial panel rendered the unconfigured published-mode state after managed-browser recovery and the locomotion fix. No demo dish fallback appeared. Runtime inspection confirmed the panel carries RayInteractable. Local artifacts under ignored `artifacts/` are debugging evidence, not headset acceptance.
- Runtime inspection found inherited locomotion moving the viewer below the scene without a walkable floor. Published mode now stops locomotion and resets the viewer origin for stationary browsing; typecheck and tests pass after the fix. A subsequent runtime capture confirmed the panel is visible with the expected configuration error. Interactive controller/headset acceptance remains pending.
- GitHub CI passed both demo/published jobs on the initial integration head; subsequent commits require the same checks.
- Initial integration did not verify live infrastructure. Follow-up read-only API/CORS and DNS findings are recorded below; successful hosted publication delivery, physical Quest acceptance and production deployment remain unverified.
- Follow-up validation: 18 tests, TypeScript, both build modes and the patched native SVG conversion pass. Five added acceptance-probe tests cover CORS denial, withdrawn publication, redaction and valid hashed delivery.
- Follow-up dependency remediation resolves all 15 previously reported dependency nodes; the full audit now reports zero known vulnerabilities. Live API probes confirm the requested XR origin is not CORS-allowlisted and its DNS does not resolve. See [security and live API evidence](security-and-live-api-checks.md) for remaining acceptance blockers.

The change should remain draft until controller/headset interaction checks and environment acceptance are completed. A schema-valid synthetic test is not evidence of an approved live menu or physical portion accuracy.
