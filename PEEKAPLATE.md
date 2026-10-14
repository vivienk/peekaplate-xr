# PeekaPlate XR: add-on pieces

Drop-in files for the v0 / IWSDK app (Next.js App Router). They only add new files, so they merge cleanly with the v0 project.

| File | What it does |
|---|---|
| `public/menu.json` | Real menu from **Dumpling Home** (298 Gough St, Hayes Valley, SF): 6 dishes, prices from their online ordering menu (Oct 14, 2026), plus a `shopQuery` per dish for take-home search |
| `lib/menu.ts` | Menu loader and cart types (`Cart`, `CartLine`, `TakeHomeLine`) |
| `lib/shop.ts` | Shop MCP client: `searchProducts()`, `createCheckout()` (no API key needed) |
| `app/api/waiter/route.ts` | AI waiter (AI SDK + AI Gateway) with tools: `addToCart`, `removeFromCart`, `findTakeHome`, `addTakeHome`, `placeOrder` |
| `app/api/shop/search/route.ts` | `GET /api/shop/search?dish=pork-xiao-long-bao` or `?q=...`: live take-home products |
| `app/api/shop/checkout/route.ts` | `POST /api/shop/checkout`: one checkout per merchant, returns `continueUrl`s for QR codes |
| `scripts/test-shop.mjs` | `node scripts/test-shop.mjs`: prints live Shop results for every dish |
| `scripts/generate-models.mjs` | Dish photo → `.glb` via Microsoft TRELLIS.2 (run on your laptop, not in the app) |

## Setup

1. Install packages: `npm i ai zod` (and `npm i -D @gradio/client` for the model script).
2. Add `AI_GATEWAY_API_KEY` in Vercel → Project → Settings → Environment Variables. Optional: `WAITER_MODEL` (default `openai/gpt-4o-mini`).
3. Check Shop: `node scripts/test-shop.mjs`. If a dish returns nothing useful, change its `shopQuery` in `menu.json`. To mark local sellers, add `"localSellers": ["some-sf-brand.myshopify.com"]` at the top level of `menu.json`, using `seller.domain` values from the results.
4. 3D models: save photos as `dish-photos/<dish-id>.png`, `export HF_TOKEN=hf_...`, run `node scripts/generate-models.mjs`. The output goes to `public/models/<dish-id>.glb`.

## Waiter API

```ts
const res = await fetch("/api/waiter", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ messages, cart }), // messages: {role:"user"|"assistant", content}[]
});
const { reply, cart, total, takeHomeOptions, checkouts } = await res.json();
// reply → speech bubble · cart → cart panel · takeHomeOptions → take-home shelf
// checkouts → one QR panel per merchant (QR of checkout.continueUrl)
```

Keep `messages` and `cart` in client state and send both every turn. The server is stateless.

`checkout.totals` is an array. Display `totals.find(t => t.type === "total").amount / 100`.

## Verified live (Oct 14, 12:45pm)

- **Shop MCP search** returns real in-stock products for every dish, e.g. Ling Ling Pork & Vegetable Potstickers and Laoban Scallion Pancakes from **Mill Valley Market** (Bay Area), plus Frozen Chinese BBQ Pork Bao from **United Dumplings**. Both seller domains are in `localSellers`. Double-check United Dumplings is local before saying so in the demo.
- **`create_checkout`** works: it returns `status: "incomplete"` and a `continue_url` on `shop.app`, which the guest finishes on their phone.
- **TRELLIS.2 API** parameter names match `scripts/generate-models.mjs` (`/preprocess_image`, `/image_to_3d`, `/extract_glb`).

## v0 prompts for the UI (send one at a time)

1. "Load `/menu.json` (format: `{ restaurant, dishes[] }`). Show the restaurant name on a sign behind the table. Place each dish's glTF (`modelUrl`) in an arc on the table, about 20cm each, with a labeled plate as the fallback if a model fails to load."
2. "Make dishes grabbable. While held, show an info card with name, price, description, tags, and an 'Add to order' button."
3. "Keep `messages` and `cart` (types in `lib/menu.ts`) in client state. Add a floating cart panel on the left showing `cart.lines` and the total. 'Add to order' sends `{ messages: [...messages, {role:'user', content:'Add one <dish name>'}], cart }` to `/api/waiter`, then replaces `cart` with the response and shows `reply` as a waiter speech bubble."
4. "Add a 'Hold to talk' button: record the mic, transcribe, and send the text to `/api/waiter` the same way. Add quick-reply buttons: 'What do you recommend?', 'Yes, add it', 'I'm ready to order'."
5. "When the waiter response has `takeHomeOptions`, show them on a shelf on the right as text cards (title, sellerName, price = priceCents/100, ❄️ Frozen if frozen, 📍 Local if local) with an 'Add' button that sends 'Yes, add the <title> from <sellerName>' to the waiter. Show `cart.takeHome` under the cart."
6. "When the response has `checkouts`, show an order confirmation (restaurant total, ready in ~15 min) and, for each checkout with a `continueUrl`, a QR code panel: 'Scan to pay at <sellerName>'. Don't log `continueUrl`."
