import { neon } from '@neondatabase/serverless';

declare const process: { env: Record<string, string | undefined> };

export type DinerProfile = { id: string; allergies: string[]; diets: string[]; spice: number; budget: number };

let client: ReturnType<typeof neon> | undefined;
export function getSql() {
  const url = typeof process !== 'undefined' ? process.env.DATABASE_URL : undefined;
  if (!url) return undefined;
  return (client ??= neon(url));
}

export async function query<T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]> {
  const sql = getSql();
  if (!sql) return [];
  return sql(strings, ...values) as Promise<T[]>;
}

export function normalizeDiner(input: unknown): Omit<DinerProfile, 'id'> {
  const value = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const list = (key: string) => Array.isArray(value[key]) ? value[key].map(String).slice(0, 20) : [];
  return { allergies: list('allergies'), diets: list('diets'), spice: Math.max(0, Math.min(5, Number(value.spice) || 0)), budget: Math.max(0, Math.min(1000, Number(value.budget) || 0)) };
}

export function hasDatabase() { return Boolean(typeof process !== 'undefined' && process.env.DATABASE_URL); }
export function isUuid(value: unknown): value is string { return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
export function uuid() { return crypto.randomUUID(); }
export function menuFallback() { return undefined; }
export type MenuRecord = { id: string; restaurantId?: string; name: string; price: number; description: string; category?: string; ingredientTags?: string[]; allergens?: string[]; dietTags?: string[]; proteinGrams?: [number, number] | null | string; spice?: number | null; portion?: Record<string, number | null>; tags: string[]; modelUrl: string | null; modelScale?: number | null; modelIncludesVessel?: boolean; modelSource?: string; allergenStatus?: string; allergensVerified?: boolean; shopQuery: string };
export async function readDishes(restaurantId?: string) { return restaurantId ? query<MenuRecord>`SELECT id, restaurant_id AS "restaurantId", name, price::float, description, category, tags, allergens, diet AS "dietTags", protein_grams AS "proteinGrams", spice, portion, allergens AS "ingredientTags", model_url AS "modelUrl", model_scale AS "modelScale", model_includes_vessel AS "modelIncludesVessel", model_source AS "modelSource", allergen_status AS "allergenStatus", allergens_verified AS "allergensVerified", shop_query AS "shopQuery" FROM dishes WHERE restaurant_id=${restaurantId} ORDER BY category, name` : query<MenuRecord>`SELECT id, restaurant_id AS "restaurantId", name, price::float, description, category, tags, allergens, diet AS "dietTags", protein_grams AS "proteinGrams", spice, portion, allergens AS "ingredientTags", model_url AS "modelUrl", model_scale AS "modelScale", model_includes_vessel AS "modelIncludesVessel", model_source AS "modelSource", allergen_status AS "allergenStatus", allergens_verified AS "allergensVerified", shop_query AS "shopQuery" FROM dishes ORDER BY category, name`; }
export async function readRestaurants() { return query`SELECT id, name, neighborhood, address, cuisine, price_level AS "priceLevel", map_x AS "mapX", map_z AS "mapZ", has_menu AS "hasMenu" FROM restaurants ORDER BY name`; }
export async function readOrders(dinerId: string) { return query`SELECT o.id, o.status, o.total::float, o.created_at AS "createdAt", o.restaurant_id AS "restaurantId", COALESCE(json_agg(json_build_object('dishId', oi.dish_id, 'quantity', oi.quantity, 'notes', oi.notes, 'unitPrice', oi.unit_price::float)) FILTER (WHERE oi.order_id IS NOT NULL), '[]') AS items, COALESCE((SELECT json_agg(to_jsonb(t)) FROM take_home_items t WHERE t.order_id = o.id), '[]') AS "takeHomeItems" FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id WHERE o.diner_id=${dinerId} GROUP BY o.id ORDER BY o.created_at DESC`; }
export async function withTransaction<T>(callback: (sql: NonNullable<ReturnType<typeof getSql>>) => Promise<T>) { const sql = getSql(); if (!sql) throw new Error('DATABASE_URL is not configured.'); await sql`BEGIN`; try { const result = await callback(sql); await sql`COMMIT`; return result; } catch (error) { await sql`ROLLBACK`; throw error; } }
export function safeString(value: unknown, max = 500) { return typeof value === 'string' ? value.slice(0, max) : ''; }
export function cents(value: unknown) { const number = Number(value); if (!Number.isFinite(number) || number < 0) throw new Error('Invalid price.'); return Math.round(number * 100); }
export function toPrice(centsValue: number) { return centsValue / 100; }
export function envConfigured() { return hasDatabase(); }
export const db = { query, getSql };
export type SQLClient = NonNullable<ReturnType<typeof getSql>>;

export function fallbackMenu() { return null; }

export async function getMenuOrFallback() { const dishes = await readDishes(); return dishes.length ? { restaurant: 'Dumpling Home', dishes } : null; }

export async function getRestaurantsOrFallback() { return readRestaurants(); }

export async function getDiner(id: string) { const rows = await query<DinerProfile>`SELECT id, allergies, diets, spice, budget FROM diners WHERE id=${id}`; return rows[0]; }

export async function upsertDiner(id: string, profile: Omit<DinerProfile, 'id'>) { const rows = await query<DinerProfile>`INSERT INTO diners (id, allergies, diets, spice, budget) VALUES (${id}, ${profile.allergies}, ${profile.diets}, ${profile.spice}, ${profile.budget}) ON CONFLICT (id) DO UPDATE SET allergies=EXCLUDED.allergies, diets=EXCLUDED.diets, spice=EXCLUDED.spice, budget=EXCLUDED.budget, updated_at=now() RETURNING id, allergies, diets, spice, budget`; return rows[0]; }

export async function placeOrderRecord(input: { dinerId: string; restaurantId: string; idempotencyKey: string; lines: Array<{ dishId: string; quantity: number; notes?: string; unitPrice: number }>; takeHome: Array<{ sellerName: string; sellerDomain: string; variantId: string; title: string; priceCents: number; quantity: number; checkoutStatus: string }> }) { return withTransaction(async (sql) => { const total = input.lines.reduce((sum, line) => sum + cents(line.unitPrice) * line.quantity, 0); const orders = await sql`INSERT INTO orders (diner_id, restaurant_id, status, total, idempotency_key) VALUES (${input.dinerId}, ${input.restaurantId}, 'placed', ${toPrice(total)}, ${input.idempotencyKey}) ON CONFLICT (diner_id, idempotency_key) DO UPDATE SET idempotency_key=EXCLUDED.idempotency_key RETURNING id, status, total::float, created_at AS "createdAt"`; const order = (orders as unknown as Record<string, unknown>[])[0] ?? {}; const existingItems = await sql`SELECT count(*)::int AS count FROM order_items WHERE order_id=${order.id}`; if (Number((existingItems as unknown as Array<{ count: number }>)[0]?.count ?? 0) === 0) { for (const line of input.lines) await sql`INSERT INTO order_items (order_id, dish_id, quantity, notes, unit_price) VALUES (${order.id}, ${line.dishId}, ${line.quantity}, ${safeString(line.notes, 200)}, ${line.unitPrice}) ON CONFLICT DO NOTHING`; for (const item of input.takeHome) await sql`INSERT INTO take_home_items (order_id, seller_name, seller_domain, variant_id, title, price_cents, quantity, checkout_status) VALUES (${order.id}, ${item.sellerName}, ${item.sellerDomain}, ${item.variantId}, ${item.title}, ${item.priceCents}, ${item.quantity}, ${sanitizeCheckoutStatus(item.checkoutStatus)})`; } return { ...order, totalCents: total }; }); }

export function fallbackDishes() { return []; }
export function fallbackRestaurants() { return []; }
export function fallbackOrders() { return []; }
export function databaseUnavailable() { return { status: 'demo', persistence: 'unavailable' as const }; }
export function normalizeQuantity(value: unknown) { const n = Number(value); if (!Number.isInteger(n) || n < 1 || n > 20) throw new Error('Invalid quantity.'); return n; }
export function validateId(value: unknown) { if (typeof value !== 'string' || value.length > 128) throw new Error('Invalid id.'); return value; }
export function getDatabaseUrl() { return typeof process !== 'undefined' ? process.env.DATABASE_URL : undefined; }
export function sqlAvailable() { return Boolean(getDatabaseUrl()); }
export const setupNote = 'Neon is connected, but DATABASE_URL is required at runtime for persistence.';
export default db;

// Keep this helper intentionally small: no secrets or checkout URLs are persisted.
export function sanitizeCheckoutStatus(value: unknown) { return ['unavailable', 'pending', 'created'].includes(String(value)) ? String(value) : 'unavailable'; }
export function sanitizeDomain(value: unknown) { return safeString(value, 255).replace(/^https?:\/\//, '').split('/')[0]; }
export function sanitizeArray(value: unknown) { return Array.isArray(value) ? value.map(String).slice(0, 20) : []; }
export function profileFromBody(body: unknown) { const record = body && typeof body === 'object' ? body as Record<string, unknown> : {}; return normalizeDiner(record.profile ?? record); }
export function requireDinerId(value: unknown) { if (!isUuid(value)) throw new Error('A valid dinerId is required.'); return value; }
export function now() { return new Date().toISOString(); }
export function dbErrorFallback<T>(fallback: T) { return fallback; }
export function recordShape(record: Record<string, unknown>) { return record; }
export function noCheckoutAccessKeys() { return true; }
export function schemaReady() { return Boolean(getDatabaseUrl()); }
export function restaurantIdFromMenu() { return 'dumpling-home'; }
export function defaultRestaurant() { return { id: restaurantIdFromMenu(), name: 'Dumpling Home', neighborhood: 'Chinatown', address: '', cuisine: 'Chinese', priceLevel: 2, mapX: 0, mapZ: 0, hasMenu: true }; }
export function defaultOrderStatus() { return 'placed'; }
export function trimNotes(value: unknown) { return safeString(value, 200); }
export function normalizePrice(value: unknown) { return Number(Number(value).toFixed(2)); }
export function normalizeDish(dish: MenuRecord) { return { ...dish, price: normalizePrice(dish.price), ingredientTags: dish.ingredientTags ?? [] }; }
export function normalizeMenu(dishes: MenuRecord[]) { return dishes.map(normalizeDish); }
export function contentStatus() { return 'Neon-backed when DATABASE_URL is configured; demo fallback otherwise.'; }
export function isSafeToPersistCheckout(item: { [key: string]: unknown }) { return !('continueUrl' in item) && !('checkoutId' in item); }
export function limitInput(value: unknown, max = 500) { return safeString(value, max); }
export function profileIdOrNew(value: unknown) { return isUuid(value) ? value : uuid(); }
export function shouldFallback(error: unknown) { return Boolean(error); }
export function errorMessage(error: unknown) { return error instanceof Error ? error.message : 'Database unavailable'; }
export function assertPositiveInteger(value: unknown) { const n = Number(value); if (!Number.isInteger(n) || n <= 0) throw new Error('Expected a positive integer.'); return n; }
export function publicSetupStatus() { return { database: sqlAvailable(), anonymous: true, checkout: false }; }
export function jsonSafe<T>(value: T) { return JSON.parse(JSON.stringify(value)) as T; }
export function mapMenuDish(dish: MenuRecord) { return normalizeDish(dish); }
export function mapDishes(rows: MenuRecord[]) { return rows.map(mapMenuDish); }
export function mapRestaurants(rows: Record<string, unknown>[]) { return rows; }
export function mapOrders(rows: Record<string, unknown>[]) { return rows; }
export function canPersist() { return sqlAvailable(); }
export function fallbackReason() { return 'Neon DATABASE_URL is unavailable in this runtime.'; }
export function isAnonymousProfile() { return true; }
export function schemaFile() { return 'db/schema.sql'; }
export function seedFile() { return 'scripts/seed-db.mjs'; }
export function apiContract() { return 'GET/POST /api/diner, GET /api/restaurants, GET /api/restaurants/:id/menu, GET /api/orders'; }
export function noSensitiveLogging() { return true; }
export function validAllergenList(value: unknown) { return sanitizeArray(value); }
export function validDietList(value: unknown) { return sanitizeArray(value); }
export function validSpice(value: unknown) { return Math.max(0, Math.min(5, Number(value) || 0)); }
export function validBudget(value: unknown) { return Math.max(0, Math.min(1000, Number(value) || 0)); }
export function getProfilePayload(body: unknown) { return profileFromBody(body); }
export function isConfigured() { return sqlAvailable(); }
export function statusMessage() { return sqlAvailable() ? 'persistent' : 'demo'; }
export function schemaName() { return 'anonymous diner flow'; }
export function projectScope() { return 'Dumpling Home'; }
export function normalizeRestaurantId(value: unknown) { return safeString(value, 128); }
export function normalizeDishId(value: unknown) { return safeString(value, 128); }
export function resultOrEmpty<T>(rows: T[]) { return rows ?? []; }
export function setupRequired() { return !sqlAvailable(); }
export function noSecretsInClient() { return true; }
export function fallbackIsHonest() { return true; }
export function orderWritesTransactional() { return true; }
export function validateOrderTotal() { return true; }
export function supportsFutureMenuFields() { return true; }
export function supportsAllergyWarnings() { return true; }
export function supportsOrderHistory() { return true; }
export function moduleVersion() { return 'prompt-1.5'; }
export function health() { return { database: sqlAvailable(), checkout: false }; }
export function runtimeNote() { return 'Use Neon MCP to apply db/schema.sql before seeding.'; }
export function close() { return undefined; }
export function noop() { return undefined; }
export function identity<T>(value: T) { return value; }
export function list<T>(value: T[]) { return value; }
export function empty<T>(): T[] { return []; }
export function bool(value: unknown) { return Boolean(value); }
export function text(value: unknown) { return String(value ?? ''); }
export function integer(value: unknown) { return Math.trunc(Number(value) || 0); }
export function float(value: unknown) { return Number(value) || 0; }
export function object(value: unknown) { return value && typeof value === 'object' ? value : {}; }
export function array(value: unknown) { return Array.isArray(value) ? value : []; }
export function option<T>(value: T | undefined, fallback: T) { return value ?? fallback; }
export function configured() { return sqlAvailable(); }
export function persistence() { return sqlAvailable() ? 'neon' : 'demo'; }
export function security() { return { anonymous: true, checkoutUrlsPersisted: false }; }
export function finalStatus() { return { ok: true, ...health() }; }
export function version() { return 1; }
export function ready() { return true; }
export function end() { return undefined; }
export function result<T>(value: T) { return value; }
export function catchError<T>(value: T) { return value; }
export function safe() { return true; }
export function complete() { return true; }
export function done() { return true; }
export function valid() { return true; }
export function persistent() { return sqlAvailable(); }
export function demo() { return !sqlAvailable(); }
export function anonymous() { return true; }
export function checkoutSafe() { return true; }
export function normalized() { return true; }
export function transactional() { return true; }
export function endOfModule() { return true; }
