# Storefront refinement workflow

Run `npm run review:storefronts` from the repository root. It typechecks, tests
stable per-venue architecture, then uses the renderer itself in headless
Playwright to create `artifacts/storefront-cuisine-comparison-v6.png` and
`artifacts/storefront-review.json`. The seven cuisine variants are shown above
the unmodified source art at 2× nearest-neighbor scale. Ember & Stone uses its
actual game ID; the remaining columns use reproducible example IDs.

The report verifies 64 different structural layouts in the fixed sample. This
is not a mathematical uniqueness guarantee for all possible restaurant IDs.
The image includes local generated neon halos; world rain, steam and pavement
reflections are omitted. Keep the underlying source assets unchanged.

Refinement loop: render, inspect silhouettes/material detail/readability at
native scale, correct visible defects, rerun, and inspect again. Automated
checks catch technical regressions; they do not certify aesthetic quality.
Before deploying, run the production build. Current materials and glow are
baked into cached canvases per venue, not regenerated every animation frame.

The November 16 refinement added bevelled irregular bricks, timber grain and
nails, recessed-window shadows, warm bounce lighting, one-pixel weathering,
local neon halos, bottles, noticeboards, pipes, fuller plants and stool feet.
A second visual review replaced sparse/out-of-bounds roof seams with clipped
shingle patterns. Cuisine classification still uses the published menu text
because the current public contract has no cuisine field.

The next warmth pass reduced the facade shadow strength, added kitchen strip
lighting and amber transoms, enlarged the neon halos, and introduced ribbed
paper lanterns, flower clusters and colorful bunting.

The cuisine-material pass replaces shared brick with timber-framed plaster
(ramen), stippled stucco (café), node-jointed bamboo (Thai), glazed square tiles
(tea/dim sum), warm brick and iron (grill), weathered blue dock boards (seafood),
and pale wood with indigo noren (sushi). Fixtures include pastry cases, herb
baskets, hanging woks, stacked steamers, charcoal/log bins, ice crates and
serving boards. Existing source neon emblems are retained as cuisine symbols.

Per-venue composition now independently selects massing, canopy construction,
sign format and street display type from the stable venue ID, in addition to
entrance side, window dimensions and counter position. Cuisine controls material
and food details; it no longer selects one complete facade. Sign formats include
hanging emblems, branded vertical totems and wide business-name marquees.
Run `node scripts/review-storefronts.mjs --venues` to inspect seven restaurants
of the same cuisine in `artifacts/storefront-individual-venues.png`. These are
compositional variants, not an unbounded guarantee of one-of-a-kind artwork.
