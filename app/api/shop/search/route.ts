// GET /api/shop/search?q=frozen%20soup%20dumplings
// GET /api/shop/search?dish=pork-xiao-long-bao   (uses that dish's shopQuery)
// Live Shop MCP search for take-home products. Also handy as a quick test route.
import { searchProducts } from "../../../../lib/shop";
import { getMenu } from "../../../../lib/menu";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const menu = await getMenu();
  const dish = params.get("dish") ? menu.dishes.find((d) => d.id === params.get("dish")) : undefined;
  const q = params.get("q") ?? dish?.shopQuery;
  if (!q) return Response.json({ error: "Pass ?q= or ?dish=" }, { status: 400 });

  try {
    const { products, warnings } = await searchProducts(q, { limit: 6, localSellers: menu.localSellers });
    return Response.json({ query: q, products, warnings });
  } catch (e: any) {
    return Response.json({ query: q, error: e.message }, { status: 502 });
  }
}
