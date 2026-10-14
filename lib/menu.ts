import { readFile } from "node:fs/promises";
import path from "node:path";

export type Dish = {
  id: string;
  name: string;
  price: number;
  description: string;
  tags: string[];
  modelUrl: string;
  shopQuery: string;
};

export type Menu = {
  restaurant: { id: string; name: string; neighborhood: string; address: string; source: string; currency: string };
  dishes: Dish[];
  localSellers?: string[]; // optional Shopify seller domains to rank first as "local"
};

// Server-side menu loader (reads public/menu.json). Client code can fetch("/menu.json").
export async function getMenu(): Promise<Menu> {
  const file = await readFile(path.join(process.cwd(), "public", "menu.json"), "utf8");
  return JSON.parse(file);
}

export type CartLine = { dishId: string; name: string; price: number; quantity: number; notes?: string };
export type TakeHomeLine = {
  variantId: string;
  sellerDomain: string;
  sellerName: string;
  title: string;
  priceCents: number;
  quantity: number;
};
export type Cart = { lines: CartLine[]; takeHome: TakeHomeLine[]; status: "open" | "ordered" };

export const emptyCart = (): Cart => ({ lines: [], takeHome: [], status: "open" });

export const cartTotal = (cart: Cart) =>
  Math.round(cart.lines.reduce((s, l) => s + l.price * l.quantity, 0) * 100) / 100;
