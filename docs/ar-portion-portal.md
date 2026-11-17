# AR portion portal

View Portion requests immersive AR on compatible browsers. Quest users allow mixed reality, point a controller or hand at a horizontal table, and press the trigger or pinch when the placement ring appears. Reposition scans again; Exit AR returns to the browser preview. When already in opaque VR, the first action closes VR and the next Open AR portal action requests passthrough with a fresh user gesture.

The portal uses IWSDK EnvironmentRaycastTarget (left/right input spaces), with required native WebXR hit-test support. No guessed table height is substituted when detection fails. Vertical surfaces are rejected. After placement, the dish stays at its world position with scale fixed to one; screen zoom and rotation do not affect AR. A compact panel leaves the remainder transparent for passthrough. Targets and reticle resources are cleaned up on exit/disposal.

Scale follows existing portion metadata: measured dimensions when available; otherwise a 27 cm dinner-plate reference, explicitly marked as estimated. This reference is life-sized in world metres, not a claim that the restaurant's serving or plate was measured. 2.5D cutouts remain layered images, not reconstructed volumetric food.

Validation: TypeScript passed; 118 tests passed; production build passed. Managed Quest 3 emulator with the meeting-room environment granted hit-test and alpha-blend AR, detected the table around 0.73 m high, and placed the dish with controller trigger at scale [1,1,1]. The panel canvas is transparent outside its controls. Unit tests cover no-hit/wall rejection, locked scale and position after viewer movement, reposition, and exit cleanup. Physical Quest passthrough, pinch ergonomics and real-room tracking still require headset validation.

Development simulation is excluded from production builds. Unsupported desktop browsers retain the screen preview and an explicit AR requirement; they do not receive a simulated headset runtime.
