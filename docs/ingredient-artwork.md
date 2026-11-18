# Ingredient artwork in the XR market

Adapts PeekaPlate PR #165, head `e6affaf37e94d2384004985690597f23ed72ca76` (includes #178 lifecycle fixes):
- `frontend/diner/src/menu/liveArtwork.ts`, `icons.ts`
- `packages/contracts/src/ingredient-artwork.ts`
- The original 32 bundled `frontend/diner/src/assets/icons/ingredients/*.svg` were copied byte-for-byte from that revision.

Dish-detail tiles use exact bundled ingredient names (normalized case/spacing), not regex food guesses. Unknown ingredients keep their centered text without an unrelated food icon. Live published menus request only approved venue-scoped artwork on entry and every 30 seconds, at most 20 labels per request. Remote PNG bytes are fetched without cache or credentials and verified against their approved hash. Errors/revocations restore bundled decoration or text. Navigation aborts requests and clears remote images; late responses cannot update a new dish. Sample/game restaurants and the Ember & Stone fixture never call artwork APIs. Ingredient and allergen facts are unchanged.

Upstream's reviewed generated build catalogue at this revision is empty. The local extension described below does not approve or upload venue artwork; live remote artwork still requires upstream approved artwork and available public routes. No staff credentials or backend migrations are introduced into the game.


## Complete current-catalogue coverage

100 additional native SVG illustrations extend the original set with explicit
ingredient identities from all 39 current game, supplied and diner-fixture dishes.
The 36px viewBox, restrained natural colors, simple geometric shading and
transparent background follow PR165. No bitmap AI provider was used: these extend
the existing editable SVG illustration system directly.

`scripts/ingredient-artwork-source.json` records each exact ingredient and its dish
bindings. `scripts/generate-ingredient-icons.mjs` contains the individual drawings;
run it with `--update` only to regenerate those 100 files plus the house-sauce repair. It leaves the original
32 assets unchanged. Exact normalization, never substring or category inference,
selects the icon. The coverage test reads the current dish data and diner fixture,
so a newly introduced ingredient without artwork fails the coverage check.

These bundled decorative assets work without the upstream directory API. They do
not imply verified restaurant recipes, ingredient approval, or automatic artwork
generation for future unknown ingredients. Remote approved venue artwork retains
precedence, refresh/revocation behavior and hash verification.

The original house-sauce export contains text, not an ingredient illustration. An
explicit exact-name override uses `house-sauce-illustration.svg`, a neutral sauce
droplet that makes no claim about recipe contents, while preserving the original.

The house-sauce repair is retained for exact-label use in future menus; it has no
binding to the current 39 dishes. Only the 100 missing current ingredient labels
are counted as current-catalogue additions.
