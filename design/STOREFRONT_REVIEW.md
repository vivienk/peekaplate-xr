# Storefront refinement workflow

Run `npm run review:storefronts` from the repository root. It typechecks, tests
stable per-venue architecture, then uses the renderer itself in headless
Playwright to create `artifacts/storefront-cuisine-comparison-v4.png` and
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
