# Independent pipeline for xr.peekaplate.io

Source: `vivienk/peekaplate-xr`. Target: `https://xr.peekaplate.io`. No DNS, hosting project, secrets, or production deployment is configured by this change. The prior `peekaplate-webxr` repository is not part of this pipeline.

## CI and preview

CI runs typecheck, public-contract/state tests and the IWSDK build on main and PRs. It uploads `dist` for inspection, not publication. The test runner has a separate configuration so tests do not start the IWSDK managed browser.

`vercel.json` disables automatic Git deployments to avoid publishing commits before the environment is ready. The manually dispatched **Deploy preview (opt-in)** workflow runs only from main when repository variable `XR_PREVIEW_DEPLOY_ENABLED=true`. It uses GitHub environment `xr-preview`, its `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` variables and `VERCEL_TOKEN` secret. None are added by this change. Configure environment reviewer protection before enabling it. Verify that IDs identify a new, separate XR project, never the mobile/backend project.

The preview workflow checks source, pulls only the separate project's preview settings, builds via pinned Vercel CLI and deploys prebuilt output without `--prod`. Keep preview mode `demo` with no production database, AI or API credentials. Vercel also packages existing `api/` functions; this app is not strictly static. Do not attach shared production database or waiter credentials merely to serve published menus.

## Live staging and production prerequisites

1. Confirm ownership of `peekaplate.io`, the DNS provider, separate Vercel team/project, API origin and real published venue/menu UUIDs.
2. Choose an approved stable staging origin. Have backend and asset-host owners allow exactly that origin and later `https://xr.peekaplate.io`, with `Vary: Origin`. Do not enable arbitrary PR previews or wildcard domains against the shared API.
3. Set `VITE_MENU_MODE=published` and the approved HTTPS `VITE_PUBLIC_MENU_API_ORIGIN` in the separate project's environment. The pointer and immutable bundle hosts must allow browser GET requests. Photos must be publicly readable. A CSP should be restricted to the confirmed API, asset, font and IWSDK runtime sources after hosted testing.
4. Configure protected release approval, require CI on main, and confirm runtime function scope. These repository settings are operator prerequisites, not configured claims.
5. Add `xr.peekaplate.io` to that separate project. Use exactly the DNS value supplied by Vercel, verify TLS, and leave apex/mobile records untouched.
6. After explicit production authorization, stage the approved commit with `vercel deploy --prod --skip-domain`. Verify the staged production build, then promote that exact deployment. No production workflow or command is run by this integration.

## Acceptance and rollback

Before promotion, verify HTTPS deep links on Quest Browser; pointer/bundle/image CORS; a real publication; wrong identity and corrupted-hash rejection; empty/incomplete menus; withdrawal/error clearing on both browser and headset; refresh/retry; both controllers; long-text pagination; XR entry/exit; seated readability; frame time and memory. Do not treat emulator checks as physical-headset evidence. Current emulator injection in `iwsdk.config.json` is inherited from the existing demo; review bundle weight and approved production emulator policy before release.

Rollback only this separate Vercel project to a compatible known-good XR deployment. Do not roll back PeekaPlate's shared backend or mobile pipeline. Check domain routing and publication compatibility after rollback; Vercel rollback may suspend automatic domain assignment until a later promotion.
