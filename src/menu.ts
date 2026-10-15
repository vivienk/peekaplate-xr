export type MenuDish = {
  id: string;
  name: string;
  price: number;
  description: string;
  category?: string;
  ingredientTags?: string[];
  tags: string[];
  allergens?: string[];
  dietTags?: string[];
  spice?: number | null;
  portion?: { plateDiameterCm?: number | null; weightG?: number | null; pieces?: number | null };
  proteinGrams?: [number, number] | null | string;
  modelUrl: string | null;
  modelScale?: number | null;
  modelIncludesVessel?: boolean;
  modelSource?: 'illustrative-demo' | string;
  allergenStatus?: 'known' | 'unknown' | string;
  allergensVerified?: boolean;
  restaurantId?: string;
  shopQuery: string;
};

export type Menu = { restaurant: string; restaurantId?: string; estimatesNote?: string; dishes: MenuDish[] };

const menuPromises = new Map<string, Promise<Menu>>();

export function loadMenu(restaurantId = 'dumpling-home'): Promise<Menu> {
  const existing = menuPromises.get(restaurantId);
  if (existing) return existing;
  const promise = fetch(`${import.meta.env.BASE_URL}api/restaurants/${encodeURIComponent(restaurantId)}/menu`).then(async (response) => {
    if (response.ok) return (await response.json()) as Menu;
    const fallback = await fetch(`${import.meta.env.BASE_URL}${restaurantId === 'flores' ? 'flores-menu.json' : 'menu.json'}`);
    if (!fallback.ok) throw new Error(`Menu request failed: ${response.status}`);
    return (await fallback.json()) as Menu;
  });
  menuPromises.set(restaurantId, promise);
  return promise;
}
