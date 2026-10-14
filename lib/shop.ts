// Server-only client for Shopify's Shop MCP (https://shop.dev/docs).
// No account or API key needed. Each tool call is one stateless POST.
// Rules we follow: fetch live (no caching), keep URLs/IDs exactly as returned,
// one checkout per merchant, hand off via continue_url (never complete purchases here).
// Server-side only: import from API routes, never from client components.

const SHOP_MCP_URL = "https://mcp.shop.com/";
const PROTOCOL = "2026-07-28";

export async function callShop<T = any>(name: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(SHOP_MCP_URL, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "MCP-Protocol-Version": PROTOCOL,
      "Mcp-Method": "tools/call",
      "Mcp-Name": name,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name,
        arguments: args,
        _meta: {
          "io.modelcontextprotocol/protocolVersion": PROTOCOL,
          "io.modelcontextprotocol/clientInfo": { name: "peekaplate-xr", version: "1.0.0" },
          "io.modelcontextprotocol/clientCapabilities": {},
        },
      },
    }),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Shop MCP HTTP ${res.status}: ${text.slice(0, 200)}`);

  // Server may answer as JSON or as a single SSE event ("data: {...}").
  const json = text.trimStart().startsWith("{")
    ? JSON.parse(text)
    : JSON.parse(text.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5)).join(""));

  if (json.error) throw new Error(json.error.message);
  const result = json.result;
  if (result?.isError) throw new Error(result.content?.[0]?.text ?? "Shop MCP tool error");
  return (result.structuredContent ?? JSON.parse(result.content?.[0]?.text ?? "{}")) as T;
}

export type TakeHomeProduct = {
  productId: string;
  title: string;
  rating?: number;
  variantId: string;
  priceCents: number;
  currency: string;
  available: boolean;
  url: string; // keep exactly as returned
  sellerName: string;
  sellerDomain: string;
  frozen: boolean;
  local: boolean;
};

export async function searchProducts(
  query: string,
  opts: { limit?: number; localSellers?: string[] } = {},
): Promise<{ products: TakeHomeProduct[]; warnings: string[] }> {
  const doc = await callShop<any>("search_catalog", {
    catalog: {
      query,
      context: { address_country: "US", currency: "USD" },
      pagination: { limit: Math.min(opts.limit ?? 6, 50) },
    },
  });

  const local = new Set((opts.localSellers ?? []).map((d) => d.toLowerCase()));
  const products: TakeHomeProduct[] = (doc.products ?? [])
    .map((p: any) => {
      const v = p.variants?.[0];
      if (!v) return null;
      return {
        productId: p.id,
        title: p.title,
        rating: p.rating?.value,
        variantId: v.id,
        priceCents: v.price?.amount ?? p.price_range?.min?.amount ?? 0,
        currency: v.price?.currency ?? "USD",
        available: v.availability?.available !== false,
        url: v.url,
        sellerName: v.seller?.name ?? "",
        sellerDomain: v.seller?.domain ?? "",
        frozen: /frozen/i.test(p.title ?? ""),
        local: local.has(String(v.seller?.domain ?? "").toLowerCase()),
      } satisfies TakeHomeProduct;
    })
    .filter((p: TakeHomeProduct | null): p is TakeHomeProduct => !!p && p.available && !!p.sellerDomain)
    // local sellers first, then frozen items, then everything else
    .sort((a: TakeHomeProduct, b: TakeHomeProduct) => Number(b.local) - Number(a.local) || Number(b.frozen) - Number(a.frozen));

  const warnings = (doc.messages ?? [])
    .filter((m: any) => m.type === "warning")
    .map((m: any) => m.content as string);

  return { products, warnings };
}

export type CheckoutLine = { variantId: string; quantity: number };

export async function createCheckout(sellerDomain: string, lines: CheckoutLine[]) {
  const doc = await callShop<any>("create_checkout", {
    shop: sellerDomain,
    checkout: {
      line_items: lines.map((l) => ({ item: { id: l.variantId }, quantity: l.quantity })),
      context: { address_country: "US" },
    },
  });
  // continue_url and id contain access keys: never log them.
  return {
    status: doc.status as string,
    currency: doc.currency as string | undefined,
    totals: doc.totals,
    continueUrl: doc.continue_url as string,
    warnings: (doc.messages ?? []).filter((m: any) => m.type === "warning").map((m: any) => m.content as string),
  };
}
