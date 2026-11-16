import { describe, expect, it, vi } from 'vitest';
import { loadPublishedMenu, loadRestaurantMenu, menuScope } from '../src/published/client';
import { PublicMenuContentBundleSchema, sha256, verifyPublicMenuContentBytes } from '../src/published/contracts';
const id = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const content = {schema_version:1, venue_id:id, menu_id:id, menu_revision_id:id, restaurant:{name:'Test venue',logo:null},categories:[]};
const path = `/venues/${id}/menus/${id}`;
async function fixture(bundle = content) {
  const bytes = new TextEncoder().encode(JSON.stringify(bundle));
  const pointer = {schemaVersion:1,venueId:id,menuId:id,menuRevisionId:id,publicationId:id,publicationHash:'a'.repeat(64),availabilityVersion:1,tier:'T0',bundle:{url:'https://assets.example.test/menu.json',contentHash:await sha256(bytes),assetManifestHash:'b'.repeat(64)},menuToken:'test-only',tokenExpiresAt:new Date(Date.now()+1800000).toISOString()};
  return {bytes,pointer};
}
describe('published menu boundary', () => {
  it('requires scoped UUID navigation', () => { expect(menuScope(path)).toEqual({venueId:id,menuId:id}); expect(()=>menuScope('/')).toThrow(); });
  it('fetches a verified delivery without credentials', async () => {
    const {bytes,pointer} = await fixture();
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json(pointer)).mockResolvedValueOnce(new Response(bytes));
    const result = await loadPublishedMenu('https://api.example.test',path,fetcher);
    expect(result.content.restaurant.name).toBe('Test venue');
    expect(result).not.toHaveProperty('menuToken');
    expect(fetcher.mock.calls[0][1]).toMatchObject({credentials:'omit',cache:'no-store'});
  });
  it('rejects corrupted bytes before parsing', async () => { const {bytes} = await fixture(); await expect(verifyPublicMenuContentBytes(bytes,'0'.repeat(64))).rejects.toThrow('hash'); });
  it('rejects cross-menu delivery even with a correct hash', async () => {
    const {bytes,pointer} = await fixture({...content,menu_id:other});
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json(pointer)).mockResolvedValueOnce(new Response(bytes));
    await expect(loadPublishedMenu('https://api.example.test',path,fetcher)).rejects.toThrow();
  });
  it('rejects a pointer for another requested menu', async () => {
    const {pointer} = await fixture(); pointer.menuId=other;
    await expect(loadPublishedMenu('https://api.example.test',path,vi.fn().mockResolvedValue(Response.json(pointer)))).rejects.toThrow('identity');
  });
  it('does not fall back to demo on withdrawal', async () => { await expect(loadPublishedMenu('https://api.example.test',path,vi.fn().mockResolvedValue(new Response('',{status:404})))).rejects.toThrow('unavailable'); });
  it('rejects insecure API origins and unknown contract fields', async () => { await expect(loadPublishedMenu('http://example.test',path)).rejects.toThrow('HTTPS'); expect(()=>PublicMenuContentBundleSchema.parse({...content,draft:true})).toThrow(); });
});


describe('stable restaurant links', () => {
  it('follows a replacement published menu on the next read', async () => {
    let menuId = id;
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/public/restaurants/ember_stone')) return Response.json({venueId:id, menuId});
      const {bytes, pointer} = await fixture({...content, menu_id:menuId});
      if (url === pointer.bundle.url) return new Response(bytes);
      expect(url).toBe(`https://api.example.test/public/venues/${id}/menus/${menuId}`);
      return Response.json({...pointer, menuId});
    });
    const entry = {venueId:id, menuId:id, slug:'ember_stone'};
    expect((await loadRestaurantMenu('https://api.example.test', entry, fetcher)).content.menu_id).toBe(id);
    menuId = other;
    expect((await loadRestaurantMenu('https://api.example.test', entry, fetcher)).content.menu_id).toBe(other);
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith('/ember_stone'))).toHaveLength(2);
  });
  it('does not follow a slug reassigned to another venue', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({venueId:other, menuId:id}));
    await expect(loadRestaurantMenu('https://api.example.test', {venueId:id, menuId:id, slug:'ember_stone'}, fetcher)).rejects.toThrow('identity');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('does not fall back to an old menu when a restaurant link is withdrawn', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('', {status:404}));
    await expect(loadRestaurantMenu('https://api.example.test', {venueId:id, menuId:id, slug:'ember_stone'}, fetcher)).rejects.toThrow('unavailable');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
