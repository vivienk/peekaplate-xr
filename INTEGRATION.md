# Flores illustrative models
Two procedural models generated and rendered in Blender 2.93.9 on macOS. These are not scans or measured restaurant servings. Menu names/prices are from the existing saved Cow Hollow dataset; not reverified live.

GLBs are Y-up, meters, with vessel included. Load at scale 1 for life-size, use longest horizontal dimension for miniature-only scaling. Their bottoms sit at y=0. Do not add another plate beneath the embedded serving plate. For comparison show a separate 27cm reference outline or reference plate beside the model.

Keep Flores separate from Dumpling Home and associate cart lines/orders with the correct restaurant. Allergy fields are explicitly unknown; empty arrays must never imply allergy-safe. Do not invent nutrition or weights. Add optional modelScale, modelIncludesVessel and allergenStatus fields to the app schema and preserve them through database/fallback APIs.

The generator script was copied into scripts; change ROOT to repository root and OUT to public/models when integrating. Use CPU rendering. No Meshy credentials or credits used.
