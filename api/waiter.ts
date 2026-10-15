import { generateText, gateway, tool } from 'ai';
import { z } from 'zod';
import menuData from '../public/menu.json';
import floresData from '../public/flores-menu.json';
import type { MenuDish } from '../src/menu.js';
import { getDiner, hasDatabase, isUuid, placeOrderRecord, uuid } from '../lib/db.js';
import { createCheckout, searchProducts } from '../lib/shop.js';

declare const process: { env: Record<string, string | undefined> };

type Request = { method?: string; body?: unknown };
type Response = { status: (code: number) => Response; json: (body: unknown) => void; setHeader?: (name: string, value: string) => void };
type CartLine = { dishId: string; name: string; quantity: number; unitPriceCents: number };

type WaiterBody = {
  restaurantId?: string;
  dinerId?: string;
  profile?: unknown;
  messages?: Array<{ role: string; content: string }>;
  cart?: Array<{ dishId: string; quantity: number }>;
  optionRef?: string;
  idempotencyKey?: string;
  takeHomeOptionRefs?: string[];
};

const menus = { 'dumpling-home': menuData, flores: floresData } as const;

function jsonError(response: Response, status: number, message: string) {
  response.status(status).json({ error: message });
}

function validateCart(input: WaiterBody['cart'], dishesById: Map<string, MenuDish>): CartLine[] {
  if (!Array.isArray(input)) return [];
  return input.map((line) => {
    const dish = dishesById.get(String(line?.dishId ?? ''));
    const quantity = Number(line?.quantity);
    if (!dish || !Number.isInteger(quantity) || quantity <= 0 || quantity > 20) {
      throw new Error('Cart contains an invalid dish or quantity.');
    }
    return { dishId: dish.id, name: dish.name, quantity, unitPriceCents: Math.round(dish.price * 100) };
  });
}

function cartTotal(lines: CartLine[]) {
  return lines.reduce((total, line) => total + line.unitPriceCents * line.quantity, 0);
}

function addMessageDish(lines: CartLine[], message: string, menu: { dishes: MenuDish[] }): CartLine[] {
  const match = message.match(/^Add one (.+)$/i);
  if (!match) return lines;
  const dish = menu.dishes.find((item) => item.name.toLowerCase() === match[1].trim().toLowerCase());
  if (!dish) throw new Error('That dish is not on the menu.');
  const existing = lines.find((line) => line.dishId === dish.id);
  if (existing) return lines.map((line) => line.dishId === dish.id ? { ...line, quantity: Math.min(20, line.quantity + 1) } : line);
  return [...lines, { dishId: dish.id, name: dish.name, quantity: 1, unitPriceCents: Math.round(dish.price * 100) }];
}

function demoReply(lines: CartLine[], profile: unknown) {
  const name = profile && typeof profile === 'object' && 'name' in profile ? String((profile as { name?: unknown }).name ?? '') : '';
  const suffix = name ? `, ${name}` : '';
  if (lines.length === 0) return `Welcome${suffix}. I can help you explore the menu and build an order.`;
  return `Great choice${suffix}. I have ${lines.map((line) => `${line.quantity} ${line.name}`).join(', ')} in your cart.`;
}

export default async function handler(request: Request, response: Response) {
  response.setHeader?.('Cache-Control', 'no-store');
  if (request.method !== 'POST') return jsonError(response, 405, 'Only POST is supported.');

  try {
    const body = (request.body ?? {}) as WaiterBody;
    const restaurantId = body.restaurantId === 'flores' ? 'flores' : 'dumpling-home';
    const menu = menus[restaurantId] as unknown as { restaurant: string; dishes: MenuDish[] };
    const dishesById = new Map(menu.dishes.map((dish) => [dish.id, dish]));
    const lastMessage = Array.isArray(body.messages) && body.messages.length > 0 ? body.messages[body.messages.length - 1]?.content ?? '' : '';
    const storedDiner = isUuid(body.dinerId) ? await getDiner(body.dinerId) : undefined;
    const profile = storedDiner ?? body.profile;
    const lines = addMessageDish(validateCart(body.cart, dishesById), lastMessage, menu);
    const isReadyToOrder = /i['’]m ready to order/i.test(lastMessage);
    const idempotencyKey = isReadyToOrder && isUuid(body.idempotencyKey) ? body.idempotencyKey : uuid();
    let reply = isReadyToOrder ? `Demo order: ${menu.restaurant} doesn't take online orders here · $${(cartTotal(lines) / 100).toFixed(2)} total · ~15 min (estimated)` : demoReply(lines, profile);
    let restaurantOrder: { status: 'demo'; orderId: string; totalCents: number; estimatedMinutes: number; persistence: 'neon' | 'demo' } | undefined = isReadyToOrder ? { status: 'demo', orderId: 'demo-order', totalCents: cartTotal(lines), estimatedMinutes: 15, persistence: hasDatabase() ? 'neon' : 'demo' } : undefined;
    let takeHomeOptions: Array<{ optionRef: string; title: string; sellerName: string; priceCents: number; frozen?: boolean; local?: boolean }> = [];
    if (lastMessage || isReadyToOrder) {
      const shopResult = await searchProducts('take home food related to ' + (lines[0]?.name ?? 'dinner'));
      if (shopResult.status === 'ready') takeHomeOptions = shopResult.products.map((product) => ({ optionRef: `${product.sellerDomain}:${product.variantId}`, title: product.title, sellerName: product.sellerName, priceCents: product.priceCents, ...(product.frozen === true ? { frozen: true } : {}), ...(product.local === true ? { local: true } : {}) }));
    }
    let checkouts: Array<{ sellerName: string; continueUrl: string; totals: Array<{ type: string; amount: number; currency: string }> }> = [];
    if (isReadyToOrder) {
      const selected = new Set(Array.isArray(body.takeHomeOptionRefs) ? body.takeHomeOptionRefs : []);
      const selectedOptions = takeHomeOptions.filter((option) => selected.has(option.optionRef));
      if (selectedOptions.length) {
        const checkout = await createCheckout(selectedOptions.map((option) => { const [sellerDomain, ...variant] = option.optionRef.split(':'); return { sellerDomain, variantId: variant.join(':'), quantity: 1 }; }));
        if (checkout.status === 'ready') checkouts = checkout.checkouts;
      }
      if (isUuid(body.dinerId)) {
        const checkoutBySeller = new Map(checkouts.map((checkout) => [checkout.sellerName, checkout]));
        const takeHome = selectedOptions.map((option) => { const [sellerDomain, ...variant] = option.optionRef.split(':'); const checkout = checkoutBySeller.get(option.sellerName); return { sellerName: option.sellerName, sellerDomain, variantId: variant.join(':'), title: option.title, priceCents: option.priceCents, quantity: 1, checkoutStatus: checkout ? 'created' : 'unavailable' }; });
        try { await placeOrderRecord({ dinerId: body.dinerId, restaurantId, idempotencyKey, lines: lines.map((line) => ({ dishId: line.dishId, quantity: line.quantity, unitPrice: line.unitPriceCents / 100 })), takeHome }); restaurantOrder = { ...restaurantOrder!, persistence: 'neon' }; } catch { /* demo response remains explicitly marked */ }
      }
    }

    const addDish = tool({
      description: 'Add one validated menu dish to the diner cart.',
      inputSchema: z.object({ dishId: z.string(), quantity: z.number().int().min(1).max(20) }),
      execute: async ({ dishId, quantity }) => {
        const dish = dishesById.get(dishId);
        if (!dish) throw new Error('That dish is not on the menu.');
        return { dishId: dish.id, name: dish.name, quantity, unitPriceCents: Math.round(dish.price * 100) };
      },
    });
    const placeOrder = tool({
      description: 'Place a demo-only restaurant order. Never charges a diner.',
      inputSchema: z.object({ confirmation: z.literal(true) }),
      execute: async () => ({ status: 'demo' as const, message: 'Demo order prepared; no restaurant order was sent.' }),
    });

    if (process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN) {
      const result = await generateText({
        model: gateway('openai/o4-mini'),
        system: `You are the ${menu.restaurant} waiter. Keep replies concise and friendly. Menu dish IDs are: ${menu.dishes.map((dish) => `${dish.id} (${dish.name})`).join(', ')}. Prices are server-validated.`,
        prompt: lastMessage || 'Greet the diner.',
        tools: { addDish, placeOrder },
        maxOutputTokens: 180,
      });
      reply = result.text || reply;
      const toolCall = result.toolResults.find((item) => item.toolName === 'placeOrder');
      if (toolCall) restaurantOrder = { status: 'demo', orderId: 'demo-order', totalCents: cartTotal(lines), estimatedMinutes: 15, persistence: hasDatabase() ? 'neon' : 'demo' };
    }

    response.status(200).json({
      reply,
      cart: { lines, total: cartTotal(lines) },
      takeHomeOptions,
      checkouts,
      ...(restaurantOrder ? { restaurantOrder } : {}),
    });
  } catch (error) {
    jsonError(response, 400, error instanceof Error ? error.message : 'Unable to process waiter request.');
  }
}
