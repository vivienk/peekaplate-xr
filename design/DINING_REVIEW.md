# Night Market dining integration — 2026-11-17

Reference: [PeekaPlate diner PR215 preview](https://pr-215.peekaplate-diner-preview.pages.dev/), checked against local source commit `6bf4498ff9ce2e1275f27a9d0e6e1d10310fb53f`.

## Delivered behavior

- Persistent bottom-right sound switch mutes effects, rain and music, retaining the separate music preference.
- One catalogue covers the original 32 dishes and every currently available published/demo dish. Search matches dish, restaurant, category and ingredients. A controller/ray-accessible keyboard also supports digits.
- Cream pixel detail panels put the dish image on the left, with subtle pointer parallax; supplied allergen labels and ingredient names have cached 16px sprites. Unknown ingredients use a neutral ingredient badge, not an inferred ingredient or dietary claim. Full descriptions and all ingredient pages remain accessible.
- Compare any two available dishes across restaurants. Similar dishes rank first using category, ingredient and name overlap. Both columns provide details, replace and portion actions. Prices retain their currency; missing sample prices remain TBA.
- Fullscreen portion view preserves native original models and falls back to a textured spatial photo. Approved public 2.5D layers are byte-count/hash/dimension checked; failures revert to the dish photo without claiming calibration. Layer metadata must match dish and revision. Pending requests are cancelled when leaving/switching dishes.
- Owner-measured plate boundaries define plane dimensions in metres only for a matching serving count. Count never multiplies a length. Headset zoom is locked. Unmeasured dishes remain labeled approximate. Current demo dishes have no measured calibration.
- View on Quest requests immersive AR through IWSDK `world.launchXR`; the title entry retains VR. The portion floats at a fixed scene position, without claiming detected-table placement or a spatial anchor.

## Validation

- Typecheck, 99 unit tests, production build.
- Managed browser: search by typing and on-screen keys; cross-restaurant comparison; both detail/portion return paths; replacement; demo menu dish opening; sound toggle; validated 2.5D layer preview.
- Existing district regression: real E/Escape on all 16 restaurant/NPC/cat/ad/order interactions across Lantern Steps and Fogline Pier.
- Quest 3 emulator: actual View on Quest click starts `immersive-ar`; controller ray toggles sound and returns from portal; preview group scale `[1,1,1]`; zoom disabled and ignored in headset mode.
- Visual captures: `artifacts/dining-detail.png`, `dining-comparison.png`, `dining-search.png`, `dining-portion-runtime.png`, `dining-portion-ar-emulator.png` (local review artifacts).

## Acceptance limits

Physical headset scale, passthrough appearance and real-controller comfort require a device check. Ember & Stone remains the explicitly labeled upstream synthetic demo; importing its PR215 layers does not turn it into a live restaurant publication. Actual published dishes continue through the existing staging directory and verified bundle path.

SDK APIs checked against the installed IWSDK 1.0.0-rc.2 types and [Meta's current WebXR guidance](https://developers.meta.com/vr/documentation/web/webxr-overview/). [WebXR geometry](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API/Geometry) defines metre-based scene coordinates; that alone does not certify a photo's size.
