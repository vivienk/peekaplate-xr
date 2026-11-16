# Night Market 2049: published restaurants

The game title is Night Market 2049 with no subtitle. The seven original restaurants and their 18-character save-code challenge remain intact. Published restaurants are additional shops with live menus; they do not pretend to be the original sample dishes or award legacy stamps. Native 3D dishes, demo coupons and demo ordering remain confined to the original sample catalogue. The current public-menu schema supplies no 3D model, cuisine, promotion or ordering contract.

## Connect approved restaurants

Edit `public/market-restaurants.json` with an HTTPS `apiOrigin` and a `restaurants` array. Every entry requires `venueId`, `menuId`, `district` (`d1-rain-alley`, `d2-lantern-steps`, `d3-fogline-pier`) and `style` (`ramen`, `cafe`, `thai`, `pearl`, `ember`, `tide`, `kaigan`). Choose the closest cuisine/storefront from the original assets. The public menu contract has no cuisine field; this explicit mapping avoids inventing one.

Only approved public menu endpoints are requested, using the contract already implemented in the separate XR published-menu branch. Exact-byte bundle SHA-256, schema, requested venue/menu identity and expiry are checked. Incomplete dishes are omitted. Unknown allergen information remains unknown. No credentials or observation tokens are stored or sent to analytics. Both API and bundle hosts must permit the preview origin through CORS.

The registry is checked on startup and every 60 seconds while exploring. Names and menus refresh from their active publications; entering a restaurant always fetches again. Withdrawn, expired, failed or removed publications display an unavailable menu, never a sample menu under the real restaurant's name. Updating this static registry currently requires a deployment; an owner-side directory endpoint/webhook has not been supplied.

## Placement and expansion

A new venue first checks unused facade space beside existing restaurants, with an open street and no overlapping fixture objects. If no slot fits, it extends the district east by 12 tiles and connects the street to the existing walkable edge. Original objects stay in place. Venue IDs prevent duplicate insertion. Shop styles reuse original chef, sign, lighting and building sprites. Collision, camera bounds, minimap and click paths use the expanded dimensions. Layout updates wait until scripted entry/travel has finished.

This implementation bounds the registry to 64 venues; it is not an infinite streaming world. Keep registry order and district/style assignments stable for stable positions across reloads. No live catalogue credentials, active approved menu IDs or configured API origin have been provided for this game preview. `market-restaurants.json` is deliberately empty. Live synchronisation cannot be claimed until those values and hosted CORS acceptance are verified.

## Checks

73 unit/integrity tests cover the existing game plus placement/idempotence, 20 additions, registry validation, verified menu fetching, corruption, cross-menu identity and withdrawal. Browser expansion acceptance is recorded separately in `artifacts/published-placement.json` using synthetic shops; it is not live restaurant acceptance.
