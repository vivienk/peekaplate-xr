// Quick live check of Shop MCP from your terminal: node scripts/test-shop.mjs
// Prints the top take-home products for every dish's shopQuery in public/menu.json.
import { readFile } from "node:fs/promises";

const menu = JSON.parse(await readFile("public/menu.json", "utf8"));
const P = "2026-07-28";

async function search(query) {
  const res = await fetch("https://mcp.shop.com/", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream",
      "MCP-Protocol-Version": P, "Mcp-Method": "tools/call", "Mcp-Name": "search_catalog" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: {
      name: "search_catalog",
      arguments: { catalog: { query, context: { address_country: "US", currency: "USD" }, pagination: { limit: 5 } } },
      _meta: { "io.modelcontextprotocol/protocolVersion": P,
        "io.modelcontextprotocol/clientInfo": { name: "peekaplate-xr", version: "1.0.0" },
        "io.modelcontextprotocol/clientCapabilities": {} } } }),
  });
  const text = await res.text();
  const json = text.trimStart().startsWith("{") ? JSON.parse(text)
    : JSON.parse(text.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5)).join(""));
  if (json.error) throw new Error(json.error.message);
  return json.result.structuredContent?.products ?? [];
}

for (const d of menu.dishes) {
  console.log(`\n🍽  ${d.name}  →  "${d.shopQuery}"`);
  try {
    const products = await search(d.shopQuery);
    if (!products.length) console.log("   (no results — try a different shopQuery)");
    for (const p of products) {
      const v = p.variants?.[0] ?? {};
      console.log(`   • ${p.title} — $${((v.price?.amount ?? 0) / 100).toFixed(2)} — ${v.seller?.name} (${v.seller?.domain})${v.availability?.available === false ? " [unavailable]" : ""}`);
    }
  } catch (e) { console.log("   ❌", e.message); }
}
