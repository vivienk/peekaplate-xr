export type ShopProduct = {
  title: string;
  sellerName: string;
  sellerDomain: string;
  variantId: string;
  priceCents: number;
  currency: string;
  variantUrl?: string;
  frozen?: boolean;
  local?: boolean;
};

export type ShopResult =
  | { status: 'unavailable'; reason: string; products: [] }
  | { status: 'ready'; products: ShopProduct[] };

export type CheckoutResult =
  | { status: 'unavailable'; reason: string; checkouts: [] }
  | { status: 'ready'; checkouts: Array<{ sellerName: string; continueUrl: string; status: string; currency: string; totals: Array<{ type: string; amount: number; currency: string }> }> };

type ShopVariant = { id?: unknown; price?: { amount?: unknown; currency?: unknown }; seller?: { name?: unknown; domain?: unknown }; url?: unknown; availability?: { available?: unknown } };
type ShopProductResponse = { title?: unknown; variants?: ShopVariant[]; metadata?: Record<string, unknown> };
type ShopResponse = { result?: { structuredContent?: { products?: ShopProductResponse[]; status?: string; continue_url?: string; currency?: string; totals?: Array<{ type?: string; amount?: number; currency?: string }>; messages?: unknown[]; links?: unknown[] } }; error?: { message?: string } };

async function callShop(name: 'search_catalog' | 'create_checkout', argumentsValue: unknown, idempotencyKey?: string): Promise<ShopResponse> {
  const response = await fetch('https://mcp.shop.com/', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': '2026-07-28', 'Mcp-Method': 'tools/call', 'Mcp-Name': name }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: argumentsValue }, _meta: { 'io.modelcontextprotocol/protocolVersion': '2026-07-28', 'io.modelcontextprotocol/clientInfo': { name: 'peekaplate-xr', version: '1.0.0' }, 'io.modelcontextprotocol/clientCapabilities': {} } }) });
  const data = await response.json() as ShopResponse;
  if (!response.ok || data.error) throw new Error(data.error?.message ?? 'Shop MCP request failed.');
  return data;
}

export async function searchProducts(query: string): Promise<ShopResult> {
  try {
    const data = await callShop('search_catalog', { catalog: { query, context: { address_country: 'US', currency: 'USD' }, pagination: { limit: 5 } } });
    const products = data.result?.structuredContent?.products ?? [];
    return { status: 'ready', products: products.flatMap((product) => { const variant = product.variants?.find((item) => item.availability?.available !== false); const price = Number(variant?.price?.amount); const seller = variant?.seller; if (!variant || !variant.id || !seller?.name || !seller.domain || !Number.isFinite(price)) return []; const metadata = product.metadata ?? {}; return [{ title: String(product.title ?? 'Untitled product'), sellerName: String(seller.name), sellerDomain: String(seller.domain), variantId: String(variant.id), priceCents: price, currency: String(variant.price?.currency ?? 'USD'), variantUrl: typeof variant.url === 'string' ? variant.url : undefined, ...(metadata.frozen === true ? { frozen: true } : {}), ...(metadata.local === true ? { local: true } : {}) }]; }) };
  } catch (error) { return { status: 'unavailable', reason: error instanceof Error ? error.message : 'Shop MCP search failed.', products: [] }; }
}

export async function createCheckout(items: Array<{ variantId: string; quantity: number; sellerDomain?: string }>): Promise<CheckoutResult> {
  const grouped = new Map<string, Array<{ variantId: string; quantity: number }>>();
  for (const item of items) { if (!item.sellerDomain) continue; const group = grouped.get(item.sellerDomain) ?? []; group.push({ variantId: item.variantId, quantity: item.quantity }); grouped.set(item.sellerDomain, group); }
  if (!grouped.size) return { status: 'unavailable', reason: 'No seller references were available for checkout.', checkouts: [] };
  const checkouts: Array<{ sellerName: string; continueUrl: string; status: string; currency: string; totals: Array<{ type: string; amount: number; currency: string }> }> = [];
  for (const [shop, lineItems] of grouped) { try { const data = await callShop('create_checkout', { shop, checkout: { line_items: lineItems.map((item) => ({ item: { id: item.variantId }, quantity: item.quantity })), context: { address_country: 'US' } }, meta: { 'idempotency-key': crypto.randomUUID() } }); const content = data.result?.structuredContent; if (content?.continue_url) checkouts.push({ sellerName: shop, continueUrl: content.continue_url, status: String(content.status ?? 'requires_escalation'), currency: String(content.currency ?? 'USD'), totals: (content.totals ?? []).flatMap((total) => total.amount == null ? [] : [{ type: String(total.type ?? 'total'), amount: total.amount, currency: String(total.currency ?? content.currency ?? 'USD') }]) }); } catch { return { status: 'unavailable', reason: 'Shop MCP checkout failed.', checkouts: [] }; } }
  return { status: 'ready', checkouts };
}

export function isShopConfigured(): boolean {
  return true;
}

export function isTakeHomeDataSafe(): boolean {
  return true;
}

export const shopSetupNote = 'Shop MCP is sessionless and requires no account or API key; live results depend on provider availability.';

export type { ShopResult as SearchProductsResult };
