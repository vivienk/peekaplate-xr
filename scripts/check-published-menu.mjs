import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { z } from 'zod';
import { PublicMenuResponseSchema, PublicMenuDeliverySchema, verifyPublicMenuContentBytes } from '../src/published/contracts.ts';

export function corsSummary(response, origin) {
  const allowOrigin = response.headers.get('access-control-allow-origin');
  const vary = response.headers.get('vary') || '';
  return { status: response.status, allowOrigin, vary, permitted: allowOrigin === origin && vary.toLowerCase().split(',').map(s => s.trim()).includes('origin') };
}
function originValue(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw Error('Use an exact HTTPS origin.');
  return url.origin;
}
// Read-only acceptance probe. Never logs response bodies, tokens or restaurant facts.
export async function checkPublishedMenu(config, fetcher = fetch) {
  const api = originValue(config.api);
  const origin = originValue(config.origin);
  const venue = z.uuid().parse(config.venue).toLowerCase();
  const menu = z.uuid().parse(config.menu).toLowerCase();
  const url = `${api}/public/venues/${venue}/menus/${menu}`;
  const report = { checkedAt: new Date().toISOString(), apiOrigin: api, xrOrigin: origin, ok: false, phase: 'preflight', checks: [] };
  const request = (target, options = {}) => fetcher(target, { credentials: 'omit', redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(20000), ...options });
  try {
    const preflight = await request(url, { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'GET' } });
    const preflightCors = corsSummary(preflight, origin);
    const allowMethods = preflight.headers.get('access-control-allow-methods') || '';
    report.checks.push({ kind: 'preflight', ...preflightCors, allowMethods });
    await preflight.body?.cancel();
    if (!preflight.ok || !preflightCors.permitted || !allowMethods.split(',').map(s => s.trim().toUpperCase()).includes('GET')) return report;
    report.phase = 'publication';
    const pointer = await request(url, { headers: { Origin: origin } });
    const pointerCors = corsSummary(pointer, origin);
    report.checks.push({ kind: 'publication', ...pointerCors });
    if (!pointer.ok || !pointerCors.permitted) { await pointer.body?.cancel(); return report; }
    const response = PublicMenuResponseSchema.parse(await pointer.json());
    if (response.venueId !== venue || response.menuId !== menu || Date.parse(response.tokenExpiresAt) <= Date.now()) throw Error('Invalid publication identity or expiry.');
    report.phase = 'bundle';
    const bundle = await request(response.bundle.url, { headers: { Origin: origin } });
    const bundleCors = corsSummary(bundle, origin);
    report.checks.push({ kind: 'bundle', ...bundleCors });
    if (!bundle.ok || !bundleCors.permitted) { await bundle.body?.cancel(); return report; }
    const bytes = new Uint8Array(await bundle.arrayBuffer());
    const content = await verifyPublicMenuContentBytes(bytes, response.bundle.contentHash);
    PublicMenuDeliverySchema.parse({ response, content });
    report.checks.push({ kind: 'integrity-and-identity', passed: true });
    report.phase = 'images';
    const images = new Set(content.categories.flatMap(category => category.dishes.flatMap(dish => dish.complete ? [dish.images.detail.url] : [])));
    // Browser <img> display does not require an ACAO grant; future canvas textures will.
    for (const image of images) {
      const result = await request(image);
      const passed = result.ok && (result.headers.get('content-type') || '').startsWith('image/');
      report.checks.push({ kind: 'detail-image', status: result.status, passed });
      await result.body?.cancel();
      if (!passed) return report;
    }
    report.phase = 'complete'; report.ok = true;
  } catch {
    // Deliberately omit raw errors, which can include URLs, tokens or body content.
    report.error = 'Transport, identity, expiry, integrity or schema validation failed.';
  }
  return report;
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const report = await checkPublishedMenu({ api: process.env.XR_CHECK_API_ORIGIN, origin: process.env.XR_CHECK_ORIGIN, venue: process.env.XR_CHECK_VENUE_ID, menu: process.env.XR_CHECK_MENU_ID });
    console.log(JSON.stringify(report, null, 2)); process.exitCode = report.ok ? 0 : 1;
  } catch { console.error('Provide XR_CHECK_API_ORIGIN, XR_CHECK_ORIGIN and approved UUID values for XR_CHECK_VENUE_ID / XR_CHECK_MENU_ID.'); process.exitCode = 1; }
}
