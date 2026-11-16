# Brief

## The creator's request (word for word)

# PeekaPlate — Pixel Night Market Adventure

Create a fully playable, interactive 2D pixel-art night market game inspired by the style and gameplay of this reference:

Sea You Forever https://nimblefox.ai/g/gOvMDfMo9Q

## World & Art Direction

Build a magical, cozy night market inspired by Tokyo alleyways, Taiwanese night markets, and San Francisco's diverse food scene.

**Visual style:**
- Beautiful, detailed pixel art with a nostalgic indie-game aesthetic.
- Top-down / three-quarter perspective, similar to Stardew Valley and classic Pokémon exploration.
- Deep navy and purple nighttime sky, warm golden lanterns, colorful neon signs, and glowing restaurant windows.
- Cobblestone paths, wooden storefronts, hanging banners, street food carts, potted plants, fairy lights, steam, and animated signage.
- Lively atmosphere with animated NPCs, food aromas represented by steam particles, and subtle ambient effects.
- Smooth character movement, charming animations, and polished pixel-art UI.

Create one cohesive explorable night market village, not a collection of disconnected screens.

## Restaurant District

Turn each restaurant into a recognizable, uniquely designed food stall or miniature restaurant that players can enter or interact with.

### 1. Noka Ramen — Japanese Ramen Alley
- Traditional Japanese ramen shop with glowing red lanterns, wooden noren curtains, and a prominent "NOKA RAMEN" sign.
- Steaming ramen bowls, ramen chef animations, Japanese banners, and cozy counter seating.
- Interactive menu featuring ramen dishes and beautiful pixel-art food illustrations.

### 2. Son & Garden — Enchanted Garden Café
- Whimsical, floral restaurant storefront covered in roses, greenery, pastel flowers, and fairy lights.
- Pink, lavender, cream, and sage-green palette.
- Dreamy garden seating, decorative arches, and elegant food displays.
- Interactive menu with visually rich brunch and café dishes.

### 3. Thai Farm Table — Thai Street Food Market
- Vibrant Thai-inspired food stall with tropical plants, colorful lanterns, woven decorations, and warm lighting.
- Animated wok cooking, sizzling pans, fragrant steam, and chefs preparing food.
- Interactive menu with Thai dishes, curries, noodles, and specialty drinks.

### 4. Additional Restaurants
Build a modular restaurant system so additional restaurants can be added easily.

Each restaurant should have:
- Its own pixel-art storefront and sign
- Unique color palette and cultural design identity
- 3–6 featured dish slots
- Animated kitchen or food preparation details
- An interactive menu
- A food discovery interaction
- An optional portal to its PeekaPlate menu or XR dish experience

Do not invent real restaurant menu items or prices. Use clearly labeled placeholders until actual restaurant data is provided.

## Player & Gameplay

Create a small, charming customizable pixel-art player character.

**Controls:**
- WASD / arrow keys to walk
- E or Space to interact
- Mouse/touch support
- Smooth camera follow
- Collisions with buildings, stalls, and decorations

**Gameplay loop:**
1. Player enters the night market through a glowing PeekaPlate entrance gate.
2. Explore the market and discover restaurants.
3. Approach a restaurant to see its name and an interaction indicator.
4. Press E to open the restaurant's interactive pixel-art menu.
5. Browse dishes, descriptions, ingredients, and dietary information.
6. Select a dish to see a larger food preview.
7. Save favorite dishes to a personal food collection.
8. Earn a restaurant discovery stamp for each visited restaurant.
9. Continue exploring to discover the remaining restaurants.

## Interactive Food Menu

Opening a restaurant launches a beautiful retro RPG-style menu overlay.

Display:
- Restaurant name and logo
- Pixel-art dish images
- Dish names and prices
- Short descriptions
- Ingredient and allergen labels
- Save / favorite button
- "View in 3D / XR" action, when an XR asset or link is available
- Close button to return to exploration

Design the UI using rounded pixel-art borders, warm cream panels, deep brown shadows, and delightful hover animations.

## World Features

Add:
- Animated wandering NPCs
- Cats resting near food stalls
- Floating lanterns and glowing signs
- Puddles reflecting the neon lights
- Ambient steam and cooking animations
- Outdoor seating and interactive decorations
- A mini-map showing restaurant locations
- A restaurant discovery passport
- A PeekaPlate information kiosk
- Small hidden discoveries that reward exploration

## Technical Requirements

Create a functional browser-based game with:
- Responsive desktop and mobile layouts
- A smooth, performant game loop
- Interactive restaurant collision zones
- Reusable restaurant data and components
- Configurable menu data
- Persisted favorites and visited restaurants
- Working navigation between world and menu overlays
- Optional external XR links
- No broken interactions or placeholder buttons that appear functional

Make the game visually impressive but lightweight enough to run smoothly in a web browser.

## Overall Creative Direction

Imagine **Stardew Valley meets Spirited Away meets a San Francisco food festival**, transformed into a magical interactive restaurant discovery game.

The experience should feel nostalgic, immersive, playful, culturally rich, and full of tiny delightful details.

**Primary goal:** Make players feel excited to wander around, discover restaurants, explore beautiful food menus, and eventually experience dishes through PeekaPlate's 3D/XR technology.

Prioritize delivering a polished, playable night market with three complete restaurant experiences before expanding the world.

## The creator's chosen look

"Neon Rain Alley Market": "It's the same night market to explore and the same restaurants to discover. This time it's a moodier pixel-art take inspired by rainy Tokyo backstreets. Gentle rain falls, the cobblestones are wet and mirror the neon signs, and the steam glows magenta and cyan against the dark." Chosen by the creator before design began. Image: `references/look-neon-rain-alley.jpg` (reference ID `look-neon-rain-alley`), the binding master target.

## The creator's answers

| Question | Options offered (recommended first) | Creator's answer |
| --- | --- | --- |
| Market goal: what happens once all three restaurant stamps are collected? | Finale plus secrets tally; Passport finale; Endless wandering | In their own words: "this will be for food ordering experience in meta xr" |
| Hidden finds: what kind of hidden discoveries reward exploring the rainy alleys? | Mix of both; Black cats to pet; Puddle reflections | In their own words: "all the aboves + people interactions on the street + ads from cyberpunk" |
| Character: how does the player customize their character? | Pick at the gate; Change at the kiosk | Change at the kiosk |

## How the answers are applied, and assumptions

- **Market goal.** The creator's words name the product's purpose (food ordering in Meta XR) rather than picking an ending. This browser build cannot connect to XR, take orders or open links, so the design uses the recommended "Finale plus secrets tally" and frames it toward that purpose: the finale shows the player's saved dishes as a "Tasting List" that the full game would carry into XR ordering, plus the hidden-finds tally. XR ordering is listed as a full-game addition. (Assumption.)
- **Hidden finds.** All kinds: black cats to greet, puddle reflections that reveal secret neon charms, street people to talk with, and cyberpunk-style hologram ads. The ads are original, made-up brands in a cyberpunk style; no existing game, film or real brand is shown. (Interpretation of "ads from cyberpunk".)
- **Character.** The player starts in the yellow raincoat and changes raincoat colour and headwear at the information kiosk at any time.

## Scope changes forced by the platform or rules

- **Names and brands.** Platform rules require original content in place of requested brands. The real restaurant names "Noka Ramen", "Son & Garden" and "Thai Farm Table", and the "PeekaPlate" name, are replaced in-game with original names (see GDD "Original names"). Every name lives in one data field per restaurant, so the creator can restore the real names once the rights are confirmed; that is an external release gate.
- **XR and external links.** The game runs with no network or external links, so "View in 3D / XR" and portals to external menus cannot open anything. Each dish record keeps an optional `xr` field; the button appears only when a dish has an in-game 3D preview, and none does in this slice, so no button shows that would do nothing. The dish detail shows a plain, non-interactive note instead.
- **Persistence.** Progress lasts only while the page is open (platform rule), so favourites and stamps are kept for the session, not saved between visits.
- **Menu data.** No real dishes or prices are invented: every dish is a generic dish type marked "SAMPLE", with "Price TBA".
- **Reference game.** "Sea You Forever" was not opened (no network); it is treated as mood inspiration only.

---

# Full game (glimmer-plate-full)

## The creator's request for the full game (word for word)

Adds: XR dish ordering · Real partner restaurant menus · More market districts · 3D dish previews in this style(https://www.meshy.ai/posts/chirashi-sushi-bowl-01a090ed-9a84-7677-834e-132eca2f6775) in AR portal · Saved progress between visits · More outfits and hidden finds

## Requirements: the slice's `full_game_adds`

These are what the creator was shown when choosing the full game; every one is built.

1. XR dish ordering
2. Real partner restaurant menus
3. More market districts
4. 3D dish previews (the creator adds: "in this style" of the linked chirashi sushi bowl, "in AR portal")
5. Saved progress between visits
6. More outfits and hidden finds

## The creator's note during design (word for word)

replace all the red UI elements in #F89537

## Answers and assumptions (full game)

Three questions were asked at 21:01 UTC; the creator was not answering, so the recommended options are used (assumptions):

| Question | Options offered (recommended first) | Used |
| --- | --- | --- |
| A browser game here can't keep data after the page closes. How should "Saved progress between visits" work? | Market code; Session only | Market code (assumption) |
| Real partner menus: do you have the menu data ready? | Keep labelled samples; I'll paste menus | Keep labelled samples (assumption) |
| XR dish ordering can't connect to a headset or take payment here. What should ordering do? | Demo order + XR code; Served in-game only | Demo order + XR code (assumption) |

How each requirement is delivered (GDD "Scope and player journey" has the detail):

- **XR dish ordering.** An Order Tray (up to 6 dishes) placed at an Order Portal in every district as a demo order: an order ticket with a 10-character XR order code, then the dishes appear as 3D holograms at the portal table. No payment, network or headset link exists on this platform, so nothing is charged or sent.
- **Real partner restaurant menus.** No menu data was supplied, and real names and dishes need the partners' rights, so every dish stays a generic SAMPLE dish with "Price TBA". Real menus replace the records in `fixtures/restaurants.json`, which is the only place they live (external release gate).
- **More market districts.** Two new districts beside Rain Alley: Lantern Steps (Taiwanese-night-market-inspired hillside stalls) and Fogline Pier (San-Francisco-waterfront-inspired pier), each with two restaurants. That makes 3 districts and 7 restaurants.
- **3D dish previews in the AR portal.** All 32 dishes have a 3D model shown in an in-game AR Portal overlay (orbit, zoom, reset). The linked chirashi bowl is used as style inspiration only; it is not copied or packaged. There is no camera passthrough on this platform, so "AR" is a holographic portal inside the game.
- **Saved progress between visits.** The platform keeps nothing after the page closes, so progress is carried by an 18-character Market code. The game shows it, and the player enters it at the title screen to continue.
- **More outfits and hidden finds.** Raincoats go from 4 to 8 colours and headwear from 2 to 4; the new items unlock through finds. Hidden finds go from 12 to 28.
- **Creator's colour note.** Every red element of the UI (panels, flaps, buttons, icons, focus and error accents, the heart) uses #F89537 and its derived shades. World art, dish art, restaurant emblems and passport stamps are restaurant and world identity, not UI, so they keep their colours (interpretation).
