# Supplied dish additions

Two append-only dish IDs follow the original 32 dish IDs:

- `thai-chicken-bowl`: Fried Chicken Bowl with Sunny Egg, Farm House Thai. Uses the user-supplied fried chicken GLB, Katsu Bowl illustration for its pixel menu icon, and the supplied chicken photograph for its edited 2.5D cutout.
- `noka-steak-ramen`: Flaming Steak Ramen, Noka Ramen. Uses the user-supplied Meshy steak ramen GLB, illustrated flaming ramen reference for its pixel icon, and the supplied restaurant photograph for its edited 2.5D cutout.

These are descriptive display names. No published prices, verified ingredient lists, allergens or measured plate sizes were supplied. Prices remain unavailable, allergens unknown, and AR uses the existing explicitly estimated 27 cm reference. No provider generation calls were needed for the models. The original uploaded files are unchanged.

The supplied chicken model contains utensils and a background cup; these remain in its derivative. The generated photo cutout excludes surrounding objects. The supplied ramen model has a dark bowl; the reference photograph and cutout have a pale bowl. These are intentionally separate user-provided sources, not claimed to be exact reconstructions of the cutouts. The ramen cutout reconstructs the cropped bowl edges.

Model derivatives retain the supplied textures at up to 2048px and reduce geometry to 45,000 triangles each. Source and output hashes are in `supplied-models-provenance.json`; image provenance is in `supplied-dishes-provenance.json`.

Legacy market and order codes retain their original bit layouts. Market version 2 adds two saved-dish bits and accepts 19 characters; extended orders use a P2 prefix and six-bit dish indices. Existing 18-character market and 10-character order codes still decode. Original dish indices never shift.

Validation: typecheck, 122 tests, production build, and browser verification of both menus, search, save, tray, photo layers, 3D loading and 2.5D/3D switching. Headset hardware is not verified.
