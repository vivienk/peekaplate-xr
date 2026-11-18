# AR portion portal

Choose a dish from a restaurant menu or **Search dishes**, then select **View portion in AR**. The portal opens its preferred 3D model. For Berry Soufflé Pancakes, **Switch 3D model** cycles between the supplied textured pancakes and the original game illustration. Search includes the eight illustrated menu dishes from Dumpling Home and Flores. Dishes with only photos use their portion preview.

In AR, the dish appears in front of you while you aim. Point at a horizontal surface, then press the trigger or pinch when the placement ring appears. You can walk around the placed dish or choose **Reposition**. **Exit AR** returns to the browser preview. From an existing VR session, choose **Open AR portal** after VR closes.

The portal uses IWSDK EnvironmentRaycastTarget (left/right input spaces), with required native WebXR hit-test support. No guessed table height is substituted when detection fails. Vertical surfaces are rejected. After placement, the dish stays at its world position with scale fixed to one; screen zoom and rotation do not affect AR. A compact panel leaves the remainder transparent for passthrough. Targets and reticle resources are cleaned up on exit/disposal.

Scale follows existing portion metadata: measured dimensions when available; otherwise a 27 cm dinner-plate reference, explicitly marked as estimated. This reference is life-sized in world metres, not a claim that the restaurant's serving or plate was measured. 2.5D cutouts remain layered images, not reconstructed volumetric food.

The Quest 3 emulator displayed all 43 bundled food models across 42 dishes before placement. The check opened each dish through **View Portion**, switched pancake models inside AR, and matched the displayed mesh to its bundled file. In its meeting room, the controller detected a table about 0.73 m high. Pressing the trigger placed the ramen, which stayed in position when the simulated headset moved. Physical Quest passthrough and real-room tracking still require headset validation.

The public Night Market demo enables the Quest 3 emulator on desktop and includes its simulated meeting room. The browser portion preview is also available when an immersive session cannot start.

## Snap Spectacles Browser Lens

Open the preview with `?spectacles=1` (or `&spectacles=1` when the URL already contains a query). The title then provides Browse dishes for Spectacles; choose a dish and View Portion. The regular browser portion screen also has a Spectacles button.

Spectacles mode requires WebXR hand tracking and a local reference space, without requesting hit-test. Rest one index fingertip at the desired plate center on the table, keep that hand still, and pinch with the other hand. The resting fingertip sets table height and position; the opposite-hand standard WebXR selectstart event confirms placement. Keep both hands visible. Reposition repeats calibration. The plate remains horizontal, fixed in world metres, with the same measured-or-estimated size policy. A fingertip resting on the tabletop is an approximate manual alignment, not automatic table detection.

Snap's current WebXR documentation states hit testing is emulated and gamepads are not practically usable, while native hand input is supported. Therefore this path deliberately does not report an emulated hit as a real table. Source: https://developers.snap.com/spectacles/about-spectacles-features/webxr (checked 2026-11-17).

Validation includes automated missing-hand, same-hand rejection, opposite-hand placement and listener-cleanup tests. Actual Spectacles optics, hand tracking, performance and Browser Lens compatibility require a physical device test. 2.5D portions remain layered images. No Lens Studio publication is needed for Browser Lens.

Short Spectacles preview: https://peekaplate-ar.vercel.app opens hand-placement mode automatically without a query string. The alias retains Vercel authentication until public access is approved and points to a reviewed preview deployment; update it explicitly when publishing a newer Spectacles preview. Other deployment URLs retain their own access settings.

## Spectacles responsiveness (2026-11-17)

Spectacles browser mode uses native, canvas-aligned button hit targets instead of relying on 3D canvas mouse-ray forwarding. They are removed from the viewport during immersive AR so hand interactions remain in the XR scene. The visual pixel buttons are preserved. Search input and dish imagery remain native browser elements.

The market stops updating behind Spectacles menus and portions; exploration retains its normal simulation. Static panels redraw only when invalidated or during their short entrance transition. GPU canvas uploads follow canvas revisions rather than every render frame. Browser pixel ratio is capped at one in Spectacles mode.

Managed browser verification: `npx @iwsdk/cli browser run scripts/verify-spectacles-browser.mjs --timeout 60000` checks real clicks through browse/search/dish/save/back and asserts zero market updates and zero canvas redraws over an idle dish-screen interval. Real-click AR entry was also checked. This verifies input routing and work reduction, not physical Spectacles frame rate; hardware confirmation remains required.

Spectacles walking/audio follow-up: the native browser overlay now routes uncovered map taps directly to the existing pathfinder (one tap walks to a storefront and opens its menu). Native buttons also play their normal selection sound. Music, ambience, kitchen loops and effects use the unlocked shared Web Audio context; media-element playback remains a decode/unavailable-context fallback. Rain keeps its crossfaded loop and quieter mix. Buffered music and effects respect mute controls and finale interruption.

`npx @iwsdk/cli browser run scripts/verify-spectacles-walk-audio.mjs --timeout 60000` passed: real storefront click, arrival at Farm House Thai, menu open, running audio context, nonzero music and rain analyser samples, and decoded UI selection sound. Mute/unmute gain checks passed separately. These checks establish browser signal output, not audible output on physical Spectacles.
