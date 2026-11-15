# Security and live API checks — November 14, 2026

## Dependency remediation

The initial full audit reported 15 vulnerable dependency nodes, including critical `proxy-addr`. Compatible lockfile updates resolved the HTTP/server/parser/tooling advisories without changing the IWSDK 1.0.0-rc.2 packages. The remaining high-severity chain was caused by this repository's exact `sharp: 0.35.4` override. Updating that existing override to `0.35.5` resolves [GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w); the loaded native library reports librsvg 2.63.2, and SVG → PNG conversion passes.

Key updates: Vite 7.3.8, proxy-addr 2.0.8, MCP SDK 1.32.2, body-parser 2.4.0, fast-uri 3.1.9, Hono 4.13.18, @hono/node-server 2.1.8, ip-address 10.7.6, qs 6.17.1, source-map-js 1.2.2, undici 7.30.2 and Sharp 0.35.5. Full `npm audit` reports zero known vulnerabilities at verification time; this is not a guarantee against undisclosed issues.

CI runs `npm run security:audit` against all dependencies with a low-severity threshold, rather than hiding development-tool findings. GitHub Actions are pinned to the verified release commits for checkout 7.0.1, setup-node 7.1.0 and upload-artifact 7.0.2. Dependabot checks npm and Actions weekly.

## Live findings

The owning backend's `develop` configuration identifies `https://peekaplate-api-staging.vxkong.workers.dev`. Read-only TLS-verified requests show:

| Boundary | Observed result |
| --- | --- |
| API health | 200 |
| XR DNS | `xr.peekaplate.io` does not resolve from the test machine |
| XR preflight | 204, `Vary: Origin`, **no Access-Control-Allow-Origin** |
| XR GET | 404 for the known withdrawn synthetic menu, **no Access-Control-Allow-Origin** |
| Existing staging diner origin | Exact CORS grant on both OPTIONS and GET |
| Untrusted origin | No CORS grant on either request |

A 204 preflight response alone is not a successful CORS check. The deployed API does not grant the requested XR origin. This agrees with the current backend source allowlist, which includes the existing diner origins and localhost but no XR domain. No shared backend or live infrastructure was changed.

[Sanitized HTTP evidence](evidence/xr-live-cors-2026-11-14.json) contains only status and CORS/cache headers. The tested ID belongs to the previously withdrawn synthetic acceptance menu. Its 404 establishes neither successful publication delivery nor a regression. No active restaurant publication was supplied; bundle integrity and image delivery against live approved content remain unverified.

Vercel access succeeded after the initial team-authorization error. The accessible `peekaplate-xr-meta` project uses Vite and Node 24, has a READY preview deployment, and lists only `peekaplate-xr-meta.vercel.app` and `peekaplate-xr-meta-viviens-projects-842ec178.vercel.app` as domains. Its latest deployment has no Git metadata, so this is not evidence that PR #1 is deployed. No `xr.peekaplate.io` domain is attached there. GitHub reports no repository environments or deployments. No environment variable values were retrieved or changed. DNS configuration, API allowlist changes and a production release remain separate environment actions.

## Repeatable acceptance command

After an exact XR staging/production origin and active published IDs are approved:

```sh
XR_CHECK_API_ORIGIN=https://approved-api.example \
XR_CHECK_ORIGIN=https://approved-xr.example \
XR_CHECK_VENUE_ID=<approved-venue-uuid> \
XR_CHECK_MENU_ID=<approved-menu-uuid> \
npm run check:live-menu
```

Replace example values before running. No credentials are accepted. The command exits nonzero at the first failed boundary: exact-origin preflight, current publication, bundle CORS, exact-byte hash/schema/identity, then public detail-image delivery. It logs no publication token, content body or raw network error. It does not mutate menus, manufacture a publication, configure CORS or deploy. Header checks are necessary but do not replace a real browser request from the approved hosted XR origin; complete that browser test and physical Quest acceptance before release.

## Remaining merge/readiness blockers

1. Confirm which separate XR hosting project will serve this repository and its approved stable origin; the existing Vercel project is not yet verified as a deployment of this PR.
2. Backend owner must approve and deploy the exact XR origin in the public-read CORS allowlist, with matching bundle-host rules. Do not use a wildcard, substitute a mobile origin, or route through a proxy to conceal the missing grant.
3. Supply an active approved venue/menu link; verify successful pointer, bundle, hash/identity and image reads from the hosted XR page.
4. Complete the previously outstanding physical Quest/controller acceptance.

Keep PR #1 draft while these acceptance requirements are unresolved. The code/security changes can pass CI independently of live readiness; neither CI nor a withdrawn synthetic-menu probe completes live acceptance.
