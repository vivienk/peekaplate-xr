# Neon foundation

Prompt 1.5 adds anonymous diner, restaurant, dish, order, and take-home tables in `db/schema.sql`. Apply the schema through the connected Neon integration, then run `npm run db:seed` to safely upsert the Dumpling Home menu from `public/menu.json`.

The Vite/IWSDK app keeps its Vercel function endpoints under `api/`: `/api/diner`, `/api/restaurants`, `/api/restaurants/:id/menu`, and `/api/orders`. When `DATABASE_URL` is absent or unavailable, reads use the menu fallback and writes return an honest demo response; no checkout URL or checkout ID is persisted. Shopify remains unavailable until its official MCP is connected.
