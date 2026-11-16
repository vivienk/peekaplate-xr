# Source-art market renderer

`src/glimmer/market.ts` implements the three original district fixtures as a pixel-art canvas, suitable for desktop and as an IWSDK canvas texture in a comfortable spatial board. It loads only original packaged PNGs; it does not replace the source artwork or reconstruct buildings from generic shapes.

## Interface

```ts
const world = new MarketWorld({ onInteract(id), onTravel(districtId), onSound?(assetId) });
await world.ready;
world.update(deltaSeconds);
```

- `canvas`: 640×360 source-pixel viewport; use nearest-neighbor display/texture sampling.
- `player`: live `{x, y}` in tile coordinates; `district`, `name`, `objects`, `focus`, `isSeated`, `isTravelling` expose readable state.
- `setDistrict(id, [tileX,tileY]?)`: loads fixture/arrival and clears click path. Default uses district fixture spawn.
- `setEnabled(boolean)`: gates world input while a menu is open and clears held input. Normal click paths clear; scripted gate entry pauses and resumes safely. World animation continues.
- `setPaused(boolean)`: freezes simulation/animation and clears held input.
- `startEntry()`: new-market Rain Alley gate walk-in. Start this after enabling the world. Movement and interaction remain blocked until arrival.
- `setOutfit(colorIndex, hatIndex)`, `setFound(new Set(ids))`, `setSeated(boolean)` synchronize gameplay state.
- `setInput(x,y)`: normalized controller/touch movement direction; keyboard WASD/arrows also work. Zero it on release.
- `pointer(canvasPixelX,canvasPixelY)`: click-to-walk, including walking to an object's reachable interaction zone and interacting on arrival.
- `moveTo(tileX,tileY)`: A* destination, returning acceptance; `interact()` uses the nearest eligible zone.
- `triggerFinale(grand:boolean)`: visual-only ceremony, four lanterns for four seconds or six for six seconds. Parent owns finale card, state and audio.
- `dispose()`: removes keyboard/blur listeners and image/tint references.

Travel uses the fixture's four exits, 0.2s fade-out / 1.2s title / 0.2s fade-in, sets the destination and exact arrival internally, then calls `onTravel`. The parent should synchronize game state without moving the player back to the default spawn. No callbacks are emitted just by externally calling `setDistrict`.

## Implemented

- Original district layout, Lantern Steps' explicit tile layers, source building back/chef/front/sign layering, three district palettes, all 32 original outfit sheets.
- 72px/s normalized movement, grid/prop collision with a 10×6px foot box, axis sliding, A* with no diagonal corner cutting, unreachable destination marker, click-to-interact, nearest eligible focus and tie priority.
- A 4px configuration-space path grid supports the source's narrow passages around props; this is more precise than a whole-tile obstacle mask.
- Every restaurant/find/kiosk/portal/signpost/bench/vending/gate interaction target from the fixtures. Non-sittable benches are excluded. Puddle dwell auto-reveals through the gameplay callback.
- All ten walkers follow source routes and retain position per district, work animations for all seven chefs, original cat sleep/awake/happy and NPC talking sheets, steam, rain, wet reflection pools and player reflection, lanterns, sign flicker, two-frame water and scrolling fog.
- Scripted gate entry, sitting pose, travel, reduced-motion setting, footsteps and bump/travel sound callbacks.
- Walkers stop for the player and reverse after two seconds blocked; each district retains walkers while away.

## Verification

- `npm run typecheck`: passed before integration; rerun final combined check after other modules land.
- Configuration-space flood-fill at 4px using actual collision predicates and fixture spawn: Rain Alley 7,520 reachable cells, Lantern Steps 5,720, Fogline Pier 6,302 (after source collider refinement). Every interactive zone in every district intersects the reachable set. This verifies reachability, not exact screenshots or headset interactions.
- Regression check after follow-up: entry interrupted mid-walk by disabled input plus Pause resumes and reaches (22,27) without locking controls. Finale count/duration checks passed (4/4s and 6/6s), closed-loop walker flag passed.
- Source audit corrected lamp (16×48), cat (16×16), lantern-string (64×16, static), player (16×24), walker (24×32), NPC (24×32), chef (24×24), and new restaurant sign/chef anchors against the GDD.

## Remaining visual/behavior differences

This is a renderer implementation, not a claim of fully verified visual parity. Parent integration owns screenshots, input inspection and headset verification.

- Rain Alley and Fogline Pier background tile variation is deterministically selected from original tile sets; only Lantern Steps supplies an exact painted tile-index map. The source art and layout remain intact, but screenshot-level tile placement is not asserted.
- Camera uses a fixed 640×360 source viewport, smoothed follow, bounds clamp and the source 12px directional look-ahead (disabled for reduced motion). The GDD's responsive integer-scale viewport is not reproduced.
- Follow-up implements source tinted glows/reflections, a 10Hz rain-splash pool, puddle ripples and charm fades, find sparkles, finale lantern ceremonies, vending can drop, precise kitchen steam anchors/rates/tints and Thai flame. The optional café fairy-light extension remains omitted (painted fairy lights remain in original storefront art).
- Ambient variation remains deterministic rather than reproducing the original random sequence. Cat frame periods, 2s greeting/800ms heart, 400ms holo scan, water/fog and kitchen rates now follow source timing; exact inherited-slice cat wake hysteresis was not supplied and uses a 2s nearby timeout. Animation draws continue behind modal overlays; only Pause freezes them.
- Small prop footprints now use their source rectangle dimensions (plants, crates, barrel, umbrella stand, lamp, cats and all four pier prop variants). Restaurant collision height is simplified over already-solid fixture tiles. Moving walkers block the player and reverse after two seconds blocked; A* paths exclude temporary walkers to avoid permanently unreachable destinations.
- Pathfinding is A* without the optional line-of-sight smoothing. The configuration-space grid is finer than the GDD's stated tile-grid implementation.
- The renderer exposes keyboard and pointer/vector input; parent UI owns touch joystick layout, focus-loss pause, accessibility/settings controls, dialogues, order holograms, sound mixing, menu/wardrobe state, and save codes.
