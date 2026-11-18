# PeekaPlate XR

PeekaPlate XR is the WebXR companion to `vivienk/peekaplate`, the canonical PeekaPlate restaurant-menu application. In **Night Market 2049**, you walk between pixel-art food stalls on a screen in a virtual dining room, compare dishes at the counter, then place a 3D bowl on a table to judge its portion. [PeekaPlate application][core]

**[Play Night Market in XR][live]** · [Open the PeekaPlate web game][web-game] · [Browse the demo branch][demo-branch]

| Rain Alley on the virtual screen | The fried chicken bowl on the simulated table |
| --- | --- |
| ![The Rain Alley gate on a screen between two emulated Quest controllers][market-still] | ![The Fried Chicken Bowl with Sunny Egg placed on the emulator’s tabletop][table-still] |

## Watch the demos

Both recordings run **2:45** and use the Quest 3 profile in Meta’s Immersive Web Emulator. The gray room and table are simulated. Physical-headset passthrough remains unverified.

| Walkthrough | Moments in the recording |
| --- | --- |
| [Noka Ramen (MP4)][ramen-video] | **0:18** find the coupon in a puddle · **0:49** open it at Noka · **1:19** compare the two ramen bowls · **2:04** place the steak ramen on the table |
| [Farm House Thai (MP4)][chicken-video] | **0:13** walk through Rain Alley · **1:04** choose the Fried Chicken Bowl with Sunny Egg · **1:55** place it on the table |

## How XR connects to PeekaPlate

The core application publishes restaurant menus. XR adopts its published-menu format, ingredient artwork, and tools for preparing dish cutouts and 3D models. This repository owns the pixel-art market, Quest controls, and AR placement. [Core menu publication flow][core-menus] · [Upstream portion tools (PR #162)][portion-pr] · [Upstream ingredient artwork (PR #165)][artwork-pr]

The XR client is configured to read PeekaPlate’s public staging restaurant directory. For each available restaurant, it checks the venue and menu IDs and verifies the downloaded menu bundle against its published hash before adding the storefront. On November 18, 2026, the staging API returned HTTP 404 for `GET /public/restaurants`. Noka Ramen and Farm House Thai ship with the game, so both walkthroughs are playable independently of that service. [Live connection settings][registry] · [XR menu reader][reader] · [Upstream directory work][directory-pr]

## Try the Noka Ramen route

1. Open the live demo, select **Enter Meta Quest VR**, then **Start**. In Rain Alley, follow the lane east from Noka’s red counter toward the pink café. Pause in the puddle by the turquoise sign to find the Flaming Steak Ramen coupon.
2. Walk back to Noka, choose **Open menu**, then **Coupon ready**. The coupon is a Passport collectible. The menu keeps its displayed prices.
3. Open **Spicy Tantan-style Ramen**, select **Compare**, and choose **Flaming Steak Ramen**. The cards show the Tan Tan bowl at **$18** with sesame, chili, and minced pork, and the steak bowl at **$19** with noodles, egg yolk, and scallion.
4. Choose **Portion** on the steak ramen card. If you started in VR, choose **Open AR portal** from the browser preview. The 3D bowl appears in front of you while you aim. Point at a tabletop and press the right trigger when the placement ring appears. Move around the bowl to inspect it at its fixed scale.

The steak ramen preview labels the dish as an estimated serving for one. Its size uses a **27 cm dinner plate** as a reference. [AR placement and scale][ar]

## Run the game locally

The Vite and TypeScript game uses Meta’s Immersive Web SDK (IWSDK). Clone `night-market-xr-demo` for the version shown in both recordings. The game’s `.nvmrc` pins Node.js `22.12.0`.

```sh
git clone --branch night-market-xr-demo https://github.com/vivienk/peekaplate-xr.git
cd peekaplate-xr
npm ci
npm run dev
```

Open the local URL printed by the server. Use **WASD** or the **arrow keys** to walk, **E** to interact, **M** for the map, and **Tab** for the Passport. In VR, walk with the left thumbstick and point and select with the controller. To resume a visit later, copy the **Market code** from the pause menu and choose **Continue with code** on the title screen.

On the demo branch, `npm run check` runs TypeScript checks, tests, and the production build. `npm run convert:models` rebuilds the GLB files from the supplied dish models. The original Nimble Fox market package, including its art, audio, fonts, and 32 source models, is in `public/glimmer/`. [Model pipeline][portion-tools] · [Verification notes][verification] · [World design][world] · [Save-code rules][rules]

## Development history

Shared diner features are reviewed in `vivienk/peekaplate`. XR pull request #3 grouped 69 commits for the market rebuild and closed unmerged. The playable Quest screen and first demo recording landed directly on `night-market-xr-demo`. [Core pull requests][core-prs] · [XR pull requests, including closed reviews][xr-prs] · [Quest screen commit][screen-commit] · [XR demo commit history][demo-history]

The Play link opens the current public XR game. The recordings used an earlier Night Market build where you selected **3D model** before opening the portal. [Recorded build][recorded-build]

For the project’s license, see [Apache License 2.0][license].

[core]: https://github.com/vivienk/peekaplate
[live]: https://peekaplate-xr.vercel.app/
[recorded-build]: https://peekaplate-b484j0gfa-viviens-projects-842ec178.vercel.app/
[web-game]: https://peekaplate.vercel.app/xr
[demo-branch]: https://github.com/vivienk/peekaplate-xr/tree/night-market-xr-demo
[market-still]: https://raw.githubusercontent.com/vivienk/peekaplate-xr/night-market-xr-demo/docs/demo/quest-emulator/night-market-quest-emulator.jpg
[table-still]: https://raw.githubusercontent.com/vivienk/peekaplate-xr/night-market-xr-demo/docs/demo/quest-emulator/Night%20Market%202049%20-%20AR%20tabletop.jpg
[ramen-video]: https://raw.githubusercontent.com/vivienk/peekaplate-xr/night-market-xr-demo/docs/demo/quest-emulator/PeekaPlate%20-%20Noka%20Ramen%20-%20Quest%20Emulator.mp4
[chicken-video]: https://raw.githubusercontent.com/vivienk/peekaplate-xr/night-market-xr-demo/docs/demo/quest-emulator/PeekaPlate%20-%20Night%20Market%202049%20-%20Quest%20Emulator.mp4
[core-menus]: https://github.com/vivienk/peekaplate/blob/main/docs/diner-connection.md
[portion-tools]: https://github.com/vivienk/peekaplate-xr/blob/night-market-xr-demo/docs/market-portion-pipeline.md
[portion-pr]: https://github.com/vivienk/peekaplate/pull/162
[artwork-pr]: https://github.com/vivienk/peekaplate/pull/165
[registry]: https://peekaplate-xr.vercel.app/market-restaurants.json
[reader]: https://github.com/vivienk/peekaplate-xr/blob/night-market-xr-demo/src/published/client.ts
[directory-pr]: https://github.com/vivienk/peekaplate/pull/214
[ar]: https://github.com/vivienk/peekaplate-xr/blob/night-market-xr-demo/docs/ar-portion-portal.md
[verification]: https://github.com/vivienk/peekaplate-xr/blob/night-market-xr-demo/design/VERIFICATION.md
[world]: https://github.com/vivienk/peekaplate-xr/blob/night-market-xr-demo/design/WORLD.md
[rules]: https://github.com/vivienk/peekaplate-xr/blob/night-market-xr-demo/design/RULES.md
[core-prs]: https://github.com/vivienk/peekaplate/pulls?q=is%3Apr
[xr-prs]: https://github.com/vivienk/peekaplate-xr/pulls?q=is%3Apr
[screen-commit]: https://github.com/vivienk/peekaplate-xr/commit/d8bfb13966da14ded184d0764e94960d406cb59c
[demo-history]: https://github.com/vivienk/peekaplate-xr/commits/night-market-xr-demo/
[license]: LICENSE
