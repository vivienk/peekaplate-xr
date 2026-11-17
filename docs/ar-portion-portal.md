# AR portion portal

View Portion requests immersive AR on compatible browsers. Quest users allow mixed reality, point a controller or hand at a horizontal table, and press the trigger or pinch when the placement ring appears. Reposition scans again; Exit AR returns to the browser preview. When already in opaque VR, the first action closes VR and the next Open AR portal action requests passthrough with a fresh user gesture.

The portal uses IWSDK EnvironmentRaycastTarget (left/right input spaces), with required native WebXR hit-test support. No guessed table height is substituted when detection fails. Vertical surfaces are rejected. After placement, the dish stays at its world position with scale fixed to one; screen zoom and rotation do not affect AR. A compact panel leaves the remainder transparent for passthrough. Targets and reticle resources are cleaned up on exit/disposal.

Scale follows existing portion metadata: measured dimensions when available; otherwise a 27 cm dinner-plate reference, explicitly marked as estimated. This reference is life-sized in world metres, not a claim that the restaurant's serving or plate was measured. 2.5D cutouts remain layered images, not reconstructed volumetric food.

Validation: TypeScript passed; 118 tests passed; production build passed. Managed Quest 3 emulator with the meeting-room environment granted hit-test and alpha-blend AR, detected the table around 0.73 m high, and placed the dish with controller trigger at scale [1,1,1]. The panel canvas is transparent outside its controls. Unit tests cover no-hit/wall rejection, locked scale and position after viewer movement, reposition, and exit cleanup. Physical Quest passthrough, pinch ergonomics and real-room tracking still require headset validation.

Development simulation is excluded from production builds. Unsupported desktop browsers retain the screen preview and an explicit AR requirement; they do not receive a simulated headset runtime.

## Snap Spectacles Browser Lens

Open the preview with `?spectacles=1` (or `&spectacles=1` when the URL already contains a query). The title then provides Browse dishes for Spectacles; choose a dish and View Portion. The regular browser portion screen also has a Spectacles button.

Spectacles mode requires WebXR hand tracking and a local reference space, without requesting hit-test. Rest one index fingertip at the desired plate center on the table, keep that hand still, and pinch with the other hand. The resting fingertip sets table height and position; the opposite-hand standard WebXR selectstart event confirms placement. Keep both hands visible. Reposition repeats calibration. The plate remains horizontal, fixed in world metres, with the same measured-or-estimated size policy. A fingertip resting on the tabletop is an approximate manual alignment, not automatic table detection.

Snap's current WebXR documentation states hit testing is emulated and gamepads are not practically usable, while native hand input is supported. Therefore this path deliberately does not report an emulated hit as a real table. Source: https://developers.snap.com/spectacles/about-spectacles-features/webxr (checked 2026-11-17).

Validation includes automated missing-hand, same-hand rejection, opposite-hand placement and listener-cleanup tests. Actual Spectacles optics, hand tracking, performance and Browser Lens compatibility require a physical device test. 2.5D portions remain layered images. No Lens Studio publication is needed for Browser Lens.

Short Spectacles preview: https://peekaplate-ar.vercel.app opens hand-placement mode automatically without a query string. The alias retains Vercel authentication until public access is approved and points to a reviewed preview deployment; update it explicitly when publishing a newer Spectacles preview. Other deployment URLs retain their own access settings.
