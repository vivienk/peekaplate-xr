# Grounding and implementation plan
Official Meta overview and setup checked 2026-11-15: https://developers.meta.com/vr/documentation/iwsdk/guides/overview/ and https://developers.meta.com/vr/documentation/iwsdk/guides/01-project-setup/ . Installed 1.0.0-rc.2 declarations are exact API authority for this existing repository; do not silently mix newer release APIs.

| Mechanic | Classification | Implementation |
|---|---|---|
| XR session, controller rays, hands | Built-in | World.create(projectOptions), RayInteractable, native pointer events, world.launchXR |
| Scene/model loading | Built-in | manifest, AssetManager.loadGLTFById; immutable clones |
| Walking in original tiled market | Custom | original 2D collision/A*; canvas displayed spatially; no physical locomotion needed |
| Quest comfort | Configure | stationary rig, locomotion disabled; original avatar moves within spatial market |
| Menus and original pixel layout | Custom | shared canvas UI hit regions through SDK pointer UV; same layout desktop/Quest |
| Dish orbit/zoom | Custom | GLB clones of source OBJ geometry, camera-relative 3D display and button/drag orbit |
| Finds, wardrobe, finales, codes, tray | Custom | pure typed state functions tested against source examples |
| Audio/weather | Custom | original audio and sprite assets; pause/reduced motion controls |

No payment, accounts or remote order submission. Original AR Portal is a hologram, not camera passthrough. Native immersive adaptation places 3D models in viewing space.
