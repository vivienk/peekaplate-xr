# Ingredient artwork in the XR market

Adapts PeekaPlate PR #165, head `e6affaf37e94d2384004985690597f23ed72ca76` (includes #178 lifecycle fixes):
- `frontend/diner/src/menu/liveArtwork.ts`, `icons.ts`
- `packages/contracts/src/ingredient-artwork.ts`
- Bundled `frontend/diner/src/assets/icons/ingredients/*.svg` copied byte-for-byte from that revision.

Dish-detail tiles use exact bundled ingredient names (normalized case/spacing), not regex food guesses. Unknown ingredients keep their centered text without an unrelated food icon. Live published menus request only approved venue-scoped artwork on entry and every 30 seconds, at most 20 labels per request. Remote PNG bytes are fetched without cache or credentials and verified against their approved hash. Errors/revocations restore bundled decoration or text. Navigation aborts requests and clears remote images; late responses cannot update a new dish. Sample/game restaurants and the Ember & Stone fixture never call artwork APIs. Ingredient and allergen facts are unchanged.

Upstream's reviewed generated build catalogue at this revision is empty. This integration does not generate, approve, or upload icons; live artwork still requires upstream approved artwork and available public routes. No staff credentials or backend migrations are introduced into the game.
