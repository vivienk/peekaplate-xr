import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required for db:seed.');
const sql = neon(url);
const schema = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
for (const statement of schema.split(';').map((s) => s.trim()).filter(Boolean)) await sql.query(statement);
await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key uuid`;
await sql`UPDATE orders SET idempotency_key = gen_random_uuid() WHERE idempotency_key IS NULL`;
await sql`ALTER TABLE orders ALTER COLUMN idempotency_key SET NOT NULL`;
await sql`CREATE UNIQUE INDEX IF NOT EXISTS orders_diner_idempotency_idx ON orders (diner_id, idempotency_key)`;
await sql`ALTER TABLE dishes ALTER COLUMN spice DROP NOT NULL`;
await sql`ALTER TABLE dishes ALTER COLUMN protein_grams DROP NOT NULL`;
const menu = JSON.parse(await readFile(new URL('../public/menu.json', import.meta.url), 'utf8'));
const flores = JSON.parse(await readFile(new URL('../public/flores-menu.json', import.meta.url), 'utf8'));
for (const restaurant of [
  { id: 'dumpling-home', name: menu.restaurant, neighborhood: 'Chinatown', cuisine: 'Chinese', price: 2 },
  { id: 'flores', name: flores.restaurant.name, neighborhood: flores.restaurant.neighborhood, cuisine: flores.restaurant.cuisine, price: 2 },
]) await sql`INSERT INTO restaurants (id, name, neighborhood, cuisine, price_level, has_menu) VALUES (${restaurant.id}, ${restaurant.name}, ${restaurant.neighborhood}, ${restaurant.cuisine}, ${restaurant.price}, true) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, neighborhood=EXCLUDED.neighborhood, cuisine=EXCLUDED.cuisine, has_menu=true`;
for (const [restaurantId, source] of [['dumpling-home', menu], ['flores', flores]]) for (const dish of source.dishes) await sql`INSERT INTO dishes (id, restaurant_id, name, price, description, category, tags, allergens, diet, protein_grams, spice, portion, model_url, model_scale, model_includes_vessel, model_source, allergen_status, allergens_verified, shop_query) VALUES (${dish.id}, ${restaurantId}, ${dish.name}, ${dish.price}, ${dish.description}, ${dish.category ?? ''}, ${dish.tags ?? []}, ${dish.allergens ?? []}, ${dish.dietTags ?? []}, ${typeof dish.proteinGrams === 'string' ? dish.proteinGrams : dish.proteinGrams ? `${dish.proteinGrams[0]}-${dish.proteinGrams[1]}g` : null}, ${dish.spice ?? null}, ${dish.portion ?? {}}, ${dish.modelUrl ?? null}, ${dish.modelScale ?? null}, ${dish.modelIncludesVessel ?? null}, ${dish.modelSource ?? null}, ${dish.allergenStatus ?? 'unknown'}, ${dish.allergensVerified ?? false}, ${dish.shopQuery ?? ''}) ON CONFLICT (id) DO UPDATE SET restaurant_id=EXCLUDED.restaurant_id, name=EXCLUDED.name, price=EXCLUDED.price, description=EXCLUDED.description, category=EXCLUDED.category, tags=EXCLUDED.tags, allergens=EXCLUDED.allergens, diet=EXCLUDED.diet, protein_grams=EXCLUDED.protein_grams, spice=EXCLUDED.spice, portion=EXCLUDED.portion, model_url=EXCLUDED.model_url, model_scale=EXCLUDED.model_scale, model_includes_vessel=EXCLUDED.model_includes_vessel, model_source=EXCLUDED.model_source, allergen_status=EXCLUDED.allergen_status, allergens_verified=EXCLUDED.allergens_verified, shop_query=EXCLUDED.shop_query`;
console.log(`Seeded ${menu.dishes.length + flores.dishes.length} dishes across Dumpling Home and Flores.`);
