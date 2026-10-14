// AI waiter for PeekaPlate XR.
// Uses Vercel AI SDK through AI Gateway (set AI_GATEWAY_API_KEY in Vercel env vars).
// The client sends the conversation + current cart; the waiter's tools update a copy
// of the cart and we return it, so the VR scene just renders whatever comes back.
//
// POST /api/waiter
//   body: { messages: { role: "user" | "assistant", content: string }[], cart?: Cart }
//   returns: { reply, cart, takeHomeOptions, checkouts, total }
import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { getMenu, emptyCart, cartTotal, type Cart } from "../../../lib/menu";
import { searchProducts, createCheckout, type TakeHomeProduct } from "../../../lib/shop";

export const maxDuration = 60;

const MODEL = process.env.WAITER_MODEL ?? "openai/gpt-4o-mini";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const messages: { role: "user" | "assistant"; content: string }[] = body.messages ?? [];
  const cart: Cart = structuredClone(body.cart ?? emptyCart());
  const menu = await getMenu();

  let takeHomeOptions: TakeHomeProduct[] = [];
  let checkouts: { sellerName: string; status: string; continueUrl: string; totals: unknown }[] = [];

  const menuText = menu.dishes
    .map((d) => `- ${d.id}: ${d.name}, $${d.price.toFixed(2)}. ${d.description} [${d.tags.join(", ")}]`)
    .join("\n");

  const system = `You are the friendly waiter at ${menu.restaurant.name} in ${menu.restaurant.neighborhood}, serving a guest inside a VR dining experience called PeekaPlate.
Keep every reply to 1-2 short spoken sentences. Never invent dishes or prices; only use this menu:
${menuText}

Current order: ${JSON.stringify(cart.lines)}
Take-home items: ${JSON.stringify(cart.takeHome)}

Behavior:
- Use addToCart / removeFromCart whenever the guest orders or changes something. Put requests like "extra spicy" in notes.
- After the guest orders a dish, offer ONE take-home option once: call findTakeHome for that dish, then mention the best result in one sentence (say it's from a local SF kitchen only if local is true; say "frozen" only if frozen is true).
- Only call addTakeHome after the guest says yes.
- When the guest is ready, call placeOrder. If there are take-home items, mention they can scan the QR code to pay for those on their phone.
- Never claim a take-home purchase is complete and never promise delivery times or shipping conditions; the merchant's checkout page confirms those.`;

  const result = await generateText({
    model: MODEL,
    system,
    messages,
    stopWhen: stepCountIs(6),
    tools: {
      addToCart: tool({
        description: "Add a dish from the menu to the guest's restaurant order.",
        inputSchema: z.object({
          dishId: z.string(),
          quantity: z.number().int().min(1).default(1),
          notes: z.string().optional(),
        }),
        execute: async ({ dishId, quantity, notes }) => {
          const dish = menu.dishes.find((d) => d.id === dishId);
          if (!dish) return { ok: false, error: `Unknown dish ${dishId}` };
          const line = cart.lines.find((l) => l.dishId === dishId && (l.notes ?? "") === (notes ?? ""));
          if (line) line.quantity += quantity;
          else cart.lines.push({ dishId, name: dish.name, price: dish.price, quantity, notes });
          return { ok: true, cart: cart.lines, total: cartTotal(cart) };
        },
      }),
      removeFromCart: tool({
        description: "Remove a dish (or some quantity of it) from the order.",
        inputSchema: z.object({ dishId: z.string(), quantity: z.number().int().min(1).optional() }),
        execute: async ({ dishId, quantity }) => {
          const line = cart.lines.find((l) => l.dishId === dishId);
          if (!line) return { ok: false, error: "Not in order" };
          line.quantity -= quantity ?? line.quantity;
          cart.lines = cart.lines.filter((l) => l.quantity > 0);
          return { ok: true, cart: cart.lines, total: cartTotal(cart) };
        },
      }),
      findTakeHome: tool({
        description: "Search Shopify (Shop MCP) live for a frozen or pantry version of a dish the guest can take home.",
        inputSchema: z.object({ dishId: z.string() }),
        execute: async ({ dishId }) => {
          const dish = menu.dishes.find((d) => d.id === dishId);
          if (!dish) return { ok: false, error: `Unknown dish ${dishId}` };
          try {
            const { products } = await searchProducts(dish.shopQuery, { limit: 6, localSellers: menu.localSellers });
            takeHomeOptions = products.slice(0, 3);
            return {
              ok: true,
              options: takeHomeOptions.map((p) => ({
                variantId: p.variantId,
                title: p.title,
                sellerName: p.sellerName,
                sellerDomain: p.sellerDomain,
                price: (p.priceCents / 100).toFixed(2),
                priceCents: p.priceCents,
                frozen: p.frozen,
                local: p.local,
              })),
            };
          } catch (e: any) {
            return { ok: false, error: "Take-home search unavailable right now" };
          }
        },
      }),
      addTakeHome: tool({
        description: "Add a take-home product (from findTakeHome results) to the guest's take-home list.",
        inputSchema: z.object({
          variantId: z.string(),
          sellerDomain: z.string(),
          sellerName: z.string(),
          title: z.string(),
          priceCents: z.number().int(),
          quantity: z.number().int().min(1).default(1),
        }),
        execute: async (item) => {
          const existing = cart.takeHome.find((t) => t.variantId === item.variantId);
          if (existing) existing.quantity += item.quantity;
          else cart.takeHome.push(item);
          return { ok: true, takeHome: cart.takeHome };
        },
      }),
      placeOrder: tool({
        description: "Send the restaurant order to the kitchen and create take-home checkouts (one per merchant).",
        inputSchema: z.object({}),
        execute: async () => {
          if (!cart.lines.length && !cart.takeHome.length) return { ok: false, error: "Nothing ordered yet" };
          cart.status = "ordered";
          checkouts = await createCheckoutsBySeller(cart);
          return {
            ok: true,
            restaurantTotal: cartTotal(cart),
            estimatedMinutes: 15,
            takeHomeCheckouts: checkouts.map((c) => ({ sellerName: c.sellerName, status: c.status })),
          };
        },
      }),
    },
  });

  return Response.json({
    reply: result.text,
    cart,
    total: cartTotal(cart),
    takeHomeOptions,
    checkouts, // render each continueUrl as a QR code in VR; never log it
  });
}

async function createCheckoutsBySeller(cart: Cart) {
  const bySeller = new Map<string, Cart["takeHome"]>();
  for (const t of cart.takeHome) bySeller.set(t.sellerDomain, [...(bySeller.get(t.sellerDomain) ?? []), t]);
  const out = [];
  for (const [domain, items] of bySeller) {
    try {
      const c = await createCheckout(domain, items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })));
      out.push({ sellerName: items[0].sellerName, status: c.status, continueUrl: c.continueUrl, totals: c.totals });
    } catch {
      out.push({ sellerName: items[0].sellerName, status: "error", continueUrl: "", totals: null });
    }
  }
  return out;
}
