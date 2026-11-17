import { PublicPortionSchema } from './portion';
// Vendored public-only contract snapshot. See docs/published-menu-contract.md.
import { z } from 'zod';
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const uuid = z.uuid().transform(value => value.toLowerCase());
const postgresText = z.string().refine(value => !value.includes('\u0000'));
const PublicMenuAllergenCodeSchema = z.enum(['milk','egg','fish','crustacean shellfish','nuts','peanut','wheat','soy','sesame']);
export const PublicMenuBundleSchema = z.strictObject({
  url: z.url().refine((value) => value.startsWith('https://'), 'Public bundles require HTTPS'),
  contentHash: hash,
  assetManifestHash: hash,
});

const publicMenuText = postgresText.trim();
const publicHttpsUrl = z
  .url()
  .refine((value) => value.startsWith('https://'), 'Public menu assets require HTTPS');

export const PublicMenuImageSchema = z.strictObject({
  url: publicHttpsUrl,
  width: z.number().int().positive().max(16_384),
  height: z.number().int().positive().max(16_384),
  alt: publicMenuText.min(1).max(500),
});

export const PublicMenuIngredientSchema = z.strictObject({
  ingredient_id: uuid,
  name: publicMenuText.min(1).max(160),
  description: publicMenuText.max(1000).nullable(),
});

const publicMenuDishIdentity = {
  dish_id: uuid,
  dish_revision_id: uuid,
};

export const PublicMenuIncompleteDishSchema = z.strictObject({
  ...publicMenuDishIdentity,
  complete: z.literal(false),
});

export const PublicMenuDietaryCodeSchema = z.enum(['vegan', 'vegetarian', 'gluten-free']);

export const PublicMenuCompleteDishSchema = z.strictObject({
  serving_count: z.number().int().min(1).max(100).optional(),
  portion: PublicPortionSchema.optional(),
  ...publicMenuDishIdentity,
  complete: z.literal(true),
  name: publicMenuText.min(1).max(160),
  description: publicMenuText.min(1).max(4000),
  price: z.strictObject({
    amount: z.string().regex(/^(0|[1-9]\d{0,7})(\.\d{1,2})?$/),
    currency: z.string().regex(/^[A-Z]{3}$/),
  }),
  ingredients: z.array(PublicMenuIngredientSchema).max(100),
  allergens: z
    .array(PublicMenuAllergenCodeSchema)
    .max(9)
    .refine((values) => new Set(values).size === values.length, 'Allergen values must be unique')
    .nullable(),
  dietary: z
    .array(PublicMenuDietaryCodeSchema)
    .max(3)
    .refine((values) => new Set(values).size === values.length, 'Dietary values must be unique'),
  images: z.strictObject({
    card: PublicMenuImageSchema,
    detail: PublicMenuImageSchema,
  }),
});

export const PublicMenuDishSchema = z.discriminatedUnion('complete', [
  PublicMenuIncompleteDishSchema,
  PublicMenuCompleteDishSchema,
]);

export const PublicMenuCategorySchema = z.strictObject({
  category_id: uuid,
  name: publicMenuText.min(1).max(160),
  dishes: z.array(PublicMenuDishSchema).max(500),
});

export const PublicMenuContentBundleSchema = z
  .strictObject({
    schema_version: z.literal(1),
    venue_id: uuid,
    menu_id: uuid,
    menu_revision_id: uuid,
    restaurant: z.strictObject({
      name: publicMenuText.min(1).max(160),
      logo: PublicMenuImageSchema.nullable(),
    }),
    categories: z.array(PublicMenuCategorySchema).max(100),
  })
  .superRefine((bundle, ctx) => {
    const categoryIds = new Set<string>();
    const dishIds = new Set<string>();
    for (const [categoryIndex, category] of bundle.categories.entries()) {
      if (categoryIds.has(category.category_id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['categories', categoryIndex, 'category_id'],
          message: 'Category IDs must be unique',
        });
      }
      categoryIds.add(category.category_id);
      for (const [dishIndex, dish] of category.dishes.entries()) {
        if (dishIds.has(dish.dish_id)) {
          ctx.addIssue({
            code: 'custom',
            path: ['categories', categoryIndex, 'dishes', dishIndex, 'dish_id'],
            message: 'Dish IDs must be unique across the menu',
          });
        }
        dishIds.add(dish.dish_id);
        if (dish.complete) {
          const ingredientIds = new Set<string>();
          for (const [ingredientIndex, ingredient] of dish.ingredients.entries()) {
            if (ingredientIds.has(ingredient.ingredient_id)) {
              ctx.addIssue({
                code: 'custom',
                path: [
                  'categories',
                  categoryIndex,
                  'dishes',
                  dishIndex,
                  'ingredients',
                  ingredientIndex,
                  'ingredient_id',
                ],
                message: 'Ingredient IDs must be unique within a dish',
              });
            }
            ingredientIds.add(ingredient.ingredient_id);
          }
        }
      }
    }
  });

export const PublicMenuResponseSchema = z.strictObject({
  schemaVersion: z.literal(1),
  venueId: uuid,
  menuId: uuid,
  menuRevisionId: uuid,
  publicationId: uuid,
  publicationHash: hash,
  availabilityVersion: z.number().int().positive().max(2_147_483_647),
  tier: z.literal('T0'),
  bundle: PublicMenuBundleSchema,
  menuToken: z.string().min(1).max(8192),
  tokenExpiresAt: z.iso.datetime(),
});

export const PublicMenuDeliverySchema = z
  .strictObject({
    response: PublicMenuResponseSchema,
    content: PublicMenuContentBundleSchema,
  })
  .superRefine(({ response, content }, ctx) => {
    const identities = [
      ['venue_id', response.venueId, content.venue_id],
      ['menu_id', response.menuId, content.menu_id],
      ['menu_revision_id', response.menuRevisionId, content.menu_revision_id],
    ] as const;
    for (const [field, expected, actual] of identities) {
      if (actual !== expected) {
        ctx.addIssue({
          code: 'custom',
          path: ['content', field],
          message: `${field} must match the active public response`,
        });
      }
    }
  });


export type PublicMenuContentBundle = z.infer<typeof PublicMenuContentBundleSchema>;
export async function sha256(value: string | Uint8Array): Promise<string> {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  const digest = await crypto.subtle.digest(
    'SHA-256',
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
  );
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export type PublicMenuIntegrityErrorCode =
  | 'content_hash_mismatch'
  | 'invalid_utf8'
  | 'invalid_json'
  | 'invalid_bundle';

export class PublicMenuIntegrityError extends Error {
  readonly code: PublicMenuIntegrityErrorCode;

  constructor(code: PublicMenuIntegrityErrorCode, message: string) {
    super(message);
    this.name = 'PublicMenuIntegrityError';
    this.code = code;
  }
}

/**
 * Verifies fetched public menu bundle bytes against the published `contentHash`, then decodes and
 * validates them. The hash covers the exact bytes the producer stored (UTF-8 canonical JSON, no
 * trailing newline); consumers must hash before parsing and never re-serialize.
 */
export async function verifyPublicMenuContentBytes(
  bytes: Uint8Array,
  expectedContentHash: string,
): Promise<PublicMenuContentBundle> {
  if ((await sha256(bytes)) !== expectedContentHash) {
    throw new PublicMenuIntegrityError(
      'content_hash_mismatch',
      'Bundle bytes do not match the published content hash',
    );
  }
  let text: string;
  try {
    // ignoreBOM keeps a BOM in the text so it fails JSON.parse instead of being silently dropped.
    text = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    throw new PublicMenuIntegrityError('invalid_utf8', 'Bundle bytes are not valid UTF-8');
  }
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new PublicMenuIntegrityError('invalid_json', 'Bundle bytes are not valid JSON');
  }
  const parsed = PublicMenuContentBundleSchema.safeParse(value);
  if (!parsed.success) {
    throw new PublicMenuIntegrityError('invalid_bundle', 'Bundle does not match the v1 schema');
  }
  return parsed.data;
}


