# Restaurant photos and preserved game dishes

Verified 2026-11-17. The user requested preserving all existing dish names and game mechanics. IDs, names, prices (retained without Demo labels, per user confirmation), save codes, stamps and source assets are unchanged. Display names are Noka Ramen, Sons and Garden and Farm House Thai.

Photos come from the menu payloads on the supplied restaurant pages. The source URL, source dish name, original-image URL and SHA-256 are recorded in `src/glimmer/restaurant-photos.json`.

| Existing dish | Source menu photo | Match boundary |
| --- | --- | --- |
| Miso-style Ramen | Noka Spicy Miso Ramen | Spicy miso variant, labeled |
| Pan-fried Gyoza | Noka Gyoza | Pork gyoza |
| Eggs Benedict | Son & Garden Country Benedict | Sausage rather than game recipe ham, labeled |
| Pad Thai-style Noodles | Farmhouse Pad Thai | Protein/preparation may vary, labeled |
| Green Curry with Rice | Farmhouse Green Curry | Photo is curry bowl; protein/preparation may vary, labeled |
| Holy Basil Stir-fry | Farmhouse Pad Ka Pow | Protein/preparation may vary, labeled |

Sources: https://nokaramen.com/menu, https://sonandgarden.com/menu, https://farmhousethai.com/menu/san-francisco.

No matching photos were identified in these linked menus for Shoyu-style Ramen (the source version uses beef instead of the game's pork), Spicy Tantan-style Ramen, Berry Soufflé Pancakes, Avocado Toast with Flowers, Matcha Latte, Rose Berry Parfait, Tom Yum-style Soup, Mango Sticky Rice, or Thai Iced Tea. These use separately labeled generated food illustrations on detail screens. Original pixel artwork remains on the menu lists. In particular, ricotta pancakes are not substituted for soufflé pancakes, and a different dessert is not substituted for mango sticky rice.

Source photos do not verify the game's ingredient or allergen lists. The detail view labels game-recipe ingredients, treats actual restaurant allergen information as unknown, and labels restaurant variants. Photo display does not imply live menu publication or ordering.

## Reproducible 2.5D preparation

`scripts/processing/peekaplate_processing/cutout.py` is the unchanged alpha-only mask implementation from PeekaPlate PR162 head `a09f35c7`. It uses rembg's `u2netp` model; the installed model is checked against upstream MD5 `8e83ca70e441ab06c318d82300c84806` and its SHA256 is included in the generated portion metadata. Food pixels are not synthesized.

Run `PYTHONPATH=scripts/processing <python-with-rembg-and-Pillow> scripts/prepare-restaurant-photos.py`. Private model weights live under ignored `.model-pipeline/models`; only the six reviewed cutouts and bounded T1 metadata ship. Local execution used the existing `../pr25-audit-20261107/focused-venv/bin/python` environment.

The browser detail uses PR162's perspective(900px), ±3-degree tilt, and 5px/3px foreground motion. Pointer, touch, arrow keys, Home/reset, original-photo switching and reduced-motion are supported. Failure exposes Retry. Exiting the detail hides its overlay; stale loads are aborted. Quest keeps its canvas-compatible preview and native portal; all dishes initially open their 2.5D cutout instead of an unrelated game 3D illustration. Dimensions remain approximate.

## Confirmed presentation update

The user approved illustrative food images for missing restaurant photos, retaining existing prices without visible Demo labels, and explicitly approximate portions when measured dimensions are unavailable. Twenty-six generated transparent food images complete the 32 original dishes alongside the six sourced photographs; the five existing Ember & Stone photo cutouts are retained. The ingredient cards use white backgrounds and vertically centered labels with pixel icons. Original artwork remains unchanged in public/glimmer and is used for menu thumbnails. Live dishes without authored pixel thumbnails use category icons in menu lists.

Generated assets ship under `public/illustrative-portions/`. `docs/illustrative-food-provenance.json` records each built-in image-generation prompt and original hash. `scripts/prepare-illustrative-portions.py` preserves transparency and packages optimized, hashed layers without fabricating measurements. Generated illustrations are not restaurant photographs. All current portions remain approximate; measured published portions retain their owner-entered plate dimensions and serving-count match. Headset scale stays locked at one world meter per meter, while browser zoom is presentation-only.
