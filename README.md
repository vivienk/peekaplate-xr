# Glimmer Plate: Neon Rain Market — Meta Quest

A browser/WebXR rebuild of the supplied Nimble Fox game design using Meta IWSDK. The original pixel-art market is a stationary spatial screen; dishes and fulfilled orders are native 3D holograms in front of it. This is a seated viewing adaptation, not a first-person reconstruction of the buildings.

## Run

Node 24 recommended.

```sh
npm ci
npm run dev
```

Open the local URL on desktop. For Quest, serve over HTTPS (or use `IWSDK_DEV_HTTPS=1 npm run dev:runtime` and trust the development certificate). Select **Enter Meta Quest VR**. A normal HTTP LAN address is not sufficient for WebXR.

- Walk: WASD/arrows, click-to-walk, or left Quest thumbstick.
- Interact: E/Enter or point at the market and select.
- Passport: Tab/B; map: M; tasting list: F; tray: O; pause/back: Escape.
- Menus: point/select, Tab/arrows then Enter/E/Space.
- AR Portal: drag, arrows, wheel, pinch or zoom buttons; R resets.
- Save: show the Market code from Passport/Pause/finale and write it down. There is deliberately no automatic persistence.

All menus are SAMPLE content; no purchases, network orders or real-world allergen verification occur. The original XR order code is a display-only demo code.

## Source and scope

`public/glimmer/` contains the unchanged supplied 1.0.0 archive, including GDD, fixtures, 32 OBJ/MTL dishes, pixel art, fonts/licenses and audio. The separately uploaded text is `UPLOADED-GDD.txt`. `public/glimmer-derived/` contains reproducible GLB derivatives. Nothing under the ChatGPT project's synced `sources/` was modified.

The implementation includes three districts, seven restaurants, 32 dishes, 28 finds, all 32 outfits, district/grand finales, AR previews, a six-line/three-quantity tray, demo tickets, eight-second order preparation and original Market/Order codes.

The package is marked `READY_FOR_IMPLEMENTATION`, not a Unity source-code export. There is no claim that undocumented behavior from the hosted Nimble Fox build has been recovered. Read [verification](design/VERIFICATION.md) and [world differences](design/WORLD.md) before treating this as exact visual parity or a headset-ready release.

## Check and reproduce

```sh
npm run check
npm run convert:models
```

The model conversion preserves original vertices, face winding, normals and material identities; sRGB OBJ colors are converted to glTF linear factors. Tests compare all originals to supplied SHA-256 checksums and all converted geometry/materials to the source.

SDK runtime checks use the existing managed browser:

```sh
npx @iwsdk/cli dev restart --allow-browser-automation
npx @iwsdk/cli browser run scripts/verify-glimmer.mjs
npx @iwsdk/cli browser run scripts/verify-input.mjs
```

These development scripts distinguish direct application-state scenarios from actual mouse/keyboard input. Development inspection hooks are omitted from production builds.

## Source-format limitation

The original Market-code weighted checksum does **not** detect every single-character typo, despite the GDD acceptance wording. We preserve compatibility with `800000-000000-000020` and `E1R000-021000-00J31T`. See [rule evidence](design/RULES.md). Fixing all collisions requires a separately versioned save format.
