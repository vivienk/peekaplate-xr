# Waiter foundation

The Vite app exposes `POST /api/waiter` as a Vercel Function. It validates menu IDs and prices from `public/menu.json`, supports demo-only cart/order tools, and returns an explicitly labeled deterministic waiter when AI Gateway credentials are unavailable.

The take-home adapter in `lib/shop.ts` intentionally returns `unavailable` until the official Shopify Shop MCP is connected. It does not fabricate products, checkout URLs, seller data, or payment status. No restaurant order or payment is sent by the demo order tool.

For AI responses, configure `AI_GATEWAY_API_KEY` locally or deploy where Vercel OIDC is available. Do not commit secret values; `.env.example` contains names only.
