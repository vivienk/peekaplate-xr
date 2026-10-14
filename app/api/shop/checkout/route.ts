// POST /api/shop/checkout
//   body: { items: { variantId, sellerDomain, sellerName, quantity }[] }
//   returns: { checkouts: { sellerName, status, continueUrl, totals }[] }
// Creates ONE checkout per merchant. Show each continueUrl as a QR code in VR;
// the guest pays on the merchant's page on their phone. Never log continueUrl.
import { createCheckout } from "../../../../lib/shop";

export const dynamic = "force-dynamic";

type Item = { variantId: string; sellerDomain: string; sellerName: string; quantity: number };

export async function POST(req: Request) {
  const { items = [] } = (await req.json().catch(() => ({}))) as { items?: Item[] };
  if (!items.length) return Response.json({ error: "No items" }, { status: 400 });

  const bySeller = new Map<string, Item[]>();
  for (const i of items) bySeller.set(i.sellerDomain, [...(bySeller.get(i.sellerDomain) ?? []), i]);

  const checkouts = await Promise.all(
    [...bySeller].map(async ([domain, group]) => {
      try {
        const c = await createCheckout(domain, group.map((g) => ({ variantId: g.variantId, quantity: g.quantity })));
        return { sellerName: group[0].sellerName, status: c.status, continueUrl: c.continueUrl, totals: c.totals, warnings: c.warnings };
      } catch (e: any) {
        return { sellerName: group[0].sellerName, status: "error", continueUrl: "", totals: null, warnings: [e.message] };
      }
    }),
  );

  return Response.json({ checkouts });
}
