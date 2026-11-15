import { describe, expect, it, vi } from 'vitest';
import { loadPublishedMenu, menuScope } from '../src/published/client';
import { PublicMenuContentBundleSchema, sha256, verifyPublicMenuContentBytes } from '../src/published/contracts';
import { cardsFromMenu } from '../src/published/model';
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
  it('omits incomplete dishes', () => { const menu=PublicMenuContentBundleSchema.parse({...content,categories:[{category_id:id,name:'Test',dishes:[{dish_id:id,dish_revision_id:id,complete:false}]}]}); expect(cardsFromMenu(menu)).toEqual([]); });
  it('keeps unknown and empty allergen declarations distinct', () => {
    const image={url:'https://assets.example.test/dish.png',width:100,height:100,alt:'Test'};
    const dish={dish_id:id,dish_revision_id:id,complete:true,name:'Test',description:'Test dish',price:{amount:'10',currency:'USD'},ingredients:[],allergens:null,dietary:[],images:{card:image,detail:image}};
    const parse=(allergens: null | string[])=>cardsFromMenu(PublicMenuContentBundleSchema.parse({...content,categories:[{category_id:id,name:'Test',dishes:[{...dish,allergens}]}]}))[0].allergens;
    expect(parse(null)).toContain('unavailable'); expect(parse([])).toContain('cross-contact'); expect(parse(['milk'])).toContain('milk');
  });
});
