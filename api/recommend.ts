import { generateText, gateway } from 'ai';
import { z } from 'zod';
import menuData from '../public/menu.json';
import restaurantsData from '../public/restaurants.json';
import type { MenuDish } from '../src/menu.js';

type Request = { method?: string; body?: unknown };
type Response = { status: (code: number) => Response; json: (body: unknown) => void; setHeader?: (name: string, value: string) => void };
type Profile = { allergies: string[]; diets: string[]; spice: number; budget: number };
type Restaurant = { id: string; name: string; neighborhood: string; cuisine: string; priceLevel: number; mapPosition: { x: number; z: number }; hasMenu: boolean };
declare const process: { env: Record<string, string | undefined> };
const menu = menuData as unknown as { restaurant: string; estimatesNote: string; dishes: MenuDish[] };
const restaurants = restaurantsData as Restaurant[];
const profileSchema = z.object({ allergies: z.array(z.string()).max(20).default([]), diets: z.array(z.string()).max(20).default([]), spice: z.number().int().min(0).max(3).default(1), budget: z.number().int().min(0).max(3).default(2) });
const resultSchema = z.object({ restaurants: z.array(z.object({ id: z.string(), reason: z.string().max(100) })), dishes: z.array(z.object({ id: z.string(), fit: z.enum(['great', 'ok', 'avoid']), reason: z.string().max(100) })) });
function reason(text: string) { return text.trim().split(/\s+/).slice(0, 11).join(' '); }
function fallback(profile: Profile) {
  const allergies = new Set(profile.allergies.map((value) => value.toLowerCase()));
  const dishes = menu.dishes.map((dish) => {
    const matched = (dish.allergens ?? []).find((allergen) => allergies.has(allergen.toLowerCase()));
    if (matched) return { id: dish.id, fit: 'avoid' as const, reason: reason(`Contains ${matched}, a selected allergen`) };
    const protein = Array.isArray(dish.proteinGrams) ? dish.proteinGrams[0] : 0;
    const great = profile.diets.some((diet) => (dish.dietTags ?? []).includes(diet)) || protein >= 20;
    return { id: dish.id, fit: great ? 'great' as const : 'ok' as const, reason: reason(great ? 'Fits your taste profile' : 'Worth exploring tonight') };
  });
  return { restaurants: restaurants.map((restaurant) => ({ id: restaurant.id, reason: reason(restaurant.hasMenu ? 'Menu available to explore' : 'Nearby restaurant to discover') })), dishes };
}
export default async function handler(req: Request, res: Response) {
  res.setHeader?.('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST is supported.' });
  const body = req.body && typeof req.body === 'object' ? req.body as Record<string, unknown> : {};
  const profile = profileSchema.parse(body.profile ?? {});
  const safeFallback = fallback(profile);
  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) return res.status(200).json({ ...safeFallback, source: 'deterministic-fallback' });
  try {
    const generated = await generateText({ model: gateway('openai/o4-mini'), system: 'Recommend only from the supplied IDs. Keep every reason under 12 words. Never claim medical safety or verified allergen-free status. Return JSON with restaurants and dishes arrays.', prompt: JSON.stringify({ profile, restaurants, dishes: menu.dishes }) });
    const candidate = JSON.parse(generated.text.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
    const parsed = resultSchema.parse(candidate);
    const knownIds = new Set(menu.dishes.map((dish) => dish.id));
    const byId = new Map(parsed.dishes.filter((dish) => knownIds.has(dish.id)).map((dish) => [dish.id, dish]));
    const safeDishes = menu.dishes.map((dish) => {
      const match = (dish.allergens ?? []).find((allergen) => profile.allergies.some((selected) => selected.toLowerCase() === allergen.toLowerCase()));
      return match ? { id: dish.id, fit: 'avoid' as const, reason: reason(`Contains ${match}, a selected allergen`) } : (byId.get(dish.id) ?? { id: dish.id, fit: 'ok' as const, reason: 'Worth exploring tonight' });
    });
    return res.status(200).json({ restaurants: parsed.restaurants.filter((item) => restaurants.some((restaurant) => restaurant.id === item.id)).map((item) => ({ ...item, reason: reason(item.reason) })), dishes: safeDishes, source: 'ai' });
  } catch { return res.status(200).json({ ...safeFallback, source: 'deterministic-fallback' }); }
}
declare global { namespace NodeJS { interface ProcessEnv { AI_GATEWAY_API_KEY?: string; VERCEL_OIDC_TOKEN?: string } } }
// The generated menu contract may be extended without breaking older seeded rows.
export {};

// Keep this file compatible with the existing Vite TypeScript setup.
const _menuContract = menu;
void _menuContract;

// Runtime data shape helpers for the enriched JSON contract.
