# Authoritative rules and implementation evidence

The game data comes directly from the uploaded package's JSON fixtures. `data.ts` adds the GDD's exact find order and dialogue text; it does not substitute real restaurant menus. District identifiers are `district` (the original schema), not `id`. All fixture asset paths are preserved.

## Grounding

| Mechanic | Classification | Owner |
| --- | --- | --- |
| Inventory, ordered tasting list, stamps, finds, wardrobe | Custom pure rules | `src/glimmer/state.ts` |
| Market code and order code | Custom exact GDD bit formats | `state.ts` |
| Demo order delay and travel lifecycle | Custom world-time state | `state.ts` |
| Quest rays, head/controller transforms, world lifecycle | SDK built-ins | integration owns |
| Spatial/desktop presentation and audio | Custom presentation using SDK renderer | integration owns |

The state API deliberately does not save automatically. `createState()` starts a fresh market. Restore resets the district to Rain Alley, drops the tray and live tickets, derives completed district finales, and suppresses a restored all-stamps grand finale. State changes occur synchronously in action handlers, avoiding animation-dependent duplicate rewards. UI must call `nextFinale()` only after returning to Explore, and must call `placeOrder()` only after confirmation at a portal. `advanceTime()` accepts paused world time: an order becomes ready at eight seconds, follows travel while pending, displays at most the first three lines, and is cleared by subsequent travel or ordering. The live order count can exceed 15; only its saved representation is capped, as specified.

## Evidence

- `npm run typecheck` passed after rule implementation.
- `vitest run --config ../peekaplate-xr/vitest.config.ts --root . tests/glimmer-state.test.ts`: 11 tests passed. A dedicated plugin-free test config is necessary because normal Vite configuration starts IWSDK's managed runtime ownership logic.
- Original content counts: 3 maps (44×32, 40×28, 40×28), restaurant dish counts 4/5/6/4/4/4/5, 32 dishes and 28 finds distributed 12/8/8.
- Both Market code examples match exactly: `800000-000000-000020` and `E1R000-021000-00J31T`.
- Both order vectors match exactly: `BDG00-00008` and `60000-00006`; all 32 dish indices and quantities 1–3 round-trip.
- Tests cover duplicate rewards, all six wardrobe thresholds, locked choices, six-line/three-quantity limits, double order submission, paused order time, travel while pending, and one-time finales.

## Source contradiction: checksum guarantee

The GDD's acceptance claim that *every* one-character alteration is rejected contradicts its specified weighted-byte checksum modulo 512. For the supplied example `E1R000-021000-00J31T`, three single-bit/single-character changes pass that exact checksum:

- `E1R010-021000-00J31T`
- `E1R000-021004-00J31T`
- `E1R000-021008-00J31T`

The implementation intentionally preserves the required algorithm and interoperability. A regression test records these collisions rather than claiming an impossible guarantee. Eliminating these collisions requires a new, versioned code format; that was not silently substituted. This is an inherited design limitation, not a claim that codes authenticate users or authorize purchases. Orders remain local demo orders.

## Limits

These tests validate pure rules and source compatibility. They do not prove walkability, rendering, controller interaction, timing under real headset frame rates, audio fidelity, or full visual/mechanical parity. Those require integrated runtime evidence.
