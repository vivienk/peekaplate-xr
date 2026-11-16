# Public API contract provenance

Snapshot source: `vivienk/peekaplate`, develop observed at commit `ae472fb50517c4209b6c806489680df6dfc72cfa` on 2026-11-14. Source file `packages/contracts/src/index.ts`, blob `d22811c8bb24171ffe4f8038a0e3017945a39ced`; allergen enum follows `docs/public-menu.md` and the imported owner-menu declaration.

Only public menu schemas, hash verification and supporting primitives are vendored. No backend implementation, secrets, owner routes or mobile components are copied. The exact-byte hash implementation in source resolves the older documentation's open hash-input wording: SHA-256 covers fetched bytes before parsing, with fatal UTF-8 decoding.

This local snapshot avoids coupling independent CI to a private Git checkout or an unpublished package. It is not a separately published shared npm package. When a versioned public contracts package is released, replace the snapshot with that pinned dependency. Until then, explicitly review source changes, copy only the public boundary, record commit/blob provenance, and run compatibility fixtures in a pull request. Unknown fields and versions fail closed.

Both the active pointer and bundle must match the requested venue/menu and approved revision. The observation token is discarded; this repository does not send analytics or implement token renewal. Do not add telemetry until the publication-bound event contract and privacy policy are approved.
