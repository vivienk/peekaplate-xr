import { z } from 'zod';
import { PublicMenuResponseSchema, PublicMenuDeliverySchema, verifyPublicMenuContentBytes } from './contracts.js';

export function menuScope(path: string) {
  const match = /^\/venues\/([^/]+)\/menus\/([^/]+)\/?$/.exec(path);
  if (!match) throw new Error('Open a published menu link: /venues/{venueId}/menus/{menuId}');
  return { venueId: z.uuid().parse(match[1]).toLowerCase(), menuId: z.uuid().parse(match[2]).toLowerCase() };
}
export async function loadPublishedMenu(origin: string, path: string, fetcher = fetch) {
  let base: URL;
  try { base = new URL(origin); } catch { throw new Error('Published menu API is not configured.'); }
  if (base.protocol !== 'https:' || base.username || base.password || base.pathname !== '/' || base.search || base.hash) throw new Error('Configure an HTTPS API origin.');
  const scope = menuScope(path);
  const options = { credentials: 'omit' as const, cache: 'no-store' as const, signal: AbortSignal.timeout(15000) };
  const result = await fetcher(`${base.origin}/public/venues/${scope.venueId}/menus/${scope.menuId}`, options);
  if (result.status === 404) throw new Error('This menu is unavailable.');
  if (!result.ok) throw new Error('Menu service unavailable. Please retry.');
  const response = PublicMenuResponseSchema.parse(await result.json());
  if (response.venueId !== scope.venueId || response.menuId !== scope.menuId) throw new Error('Menu identity mismatch.');
  if (Date.parse(response.tokenExpiresAt) <= Date.now()) throw new Error('Publication expired. Please retry.');
  const bundle = await fetcher(response.bundle.url, { ...options, signal: AbortSignal.timeout(15000) });
  if (!bundle.ok) throw new Error('Menu content unavailable. Please retry.');
  const content = await verifyPublicMenuContentBytes(new Uint8Array(await bundle.arrayBuffer()), response.bundle.contentHash);
  PublicMenuDeliverySchema.parse({response, content});
  // Observation tokens are deliberately not exposed to UI or persisted.
  return { content, expiresAt: Date.parse(response.tokenExpiresAt) };
}
