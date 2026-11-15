import { expect, it, vi } from 'vitest';
import { sha256 } from '../src/published/contracts';
// @ts-expect-error The operator probe is a Node ES module rather than browser TypeScript.
import { checkPublishedMenu, corsSummary } from '../scripts/check-published-menu.mjs';
const config={api:'https://api.example.test',origin:'https://xr.example.test',venue:'11111111-1111-4111-8111-111111111111',menu:'22222222-2222-4222-8222-222222222222'};
it('does not mistake an HTTP 204 without a CORS grant for acceptance', async () => {
 const fetcher=vi.fn().mockResolvedValue(new Response(null,{status:204,headers:{vary:'Origin'}}));
 const result=await checkPublishedMenu(config,fetcher);expect(result.ok).toBe(false);expect(result.phase).toBe('preflight');expect(fetcher).toHaveBeenCalledTimes(1);
});
it('rejects a wildcard grant or a missing cache variation', () => {
 expect(corsSummary(new Response(null,{headers:{'access-control-allow-origin':'*',vary:'Origin'}}),config.origin).permitted).toBe(false);
 expect(corsSummary(new Response(null,{headers:{'access-control-allow-origin':config.origin}}),config.origin).permitted).toBe(false);
});
it('stops at withdrawn publication and never fetches bundle or images', async () => {
 const headers={'access-control-allow-origin':config.origin,vary:'Origin','access-control-allow-methods':'GET,OPTIONS'};
 const fetcher=vi.fn().mockResolvedValueOnce(new Response(null,{status:204,headers})).mockResolvedValueOnce(new Response('{"error":"not_found"}',{status:404,headers}));
 const result=await checkPublishedMenu(config,fetcher);expect(result.ok).toBe(false);expect(result.phase).toBe('publication');expect(fetcher).toHaveBeenCalledTimes(2);
});
it('does not disclose raw network error details in evidence', async () => {
 const fetcher=vi.fn().mockRejectedValue(new Error('secret-token-value'));
 expect(JSON.stringify(await checkPublishedMenu(config,fetcher))).not.toContain('secret-token-value');
});

it('accepts a matching hashed bundle while keeping the token out of evidence', async () => {
 const headers={'access-control-allow-origin':config.origin,vary:'Origin','access-control-allow-methods':'GET,OPTIONS'};
 const bytes=new TextEncoder().encode(JSON.stringify({schema_version:1,venue_id:config.venue,menu_id:config.menu,menu_revision_id:config.menu,restaurant:{name:'Synthetic venue',logo:null},categories:[]}));
 const pointer={schemaVersion:1,venueId:config.venue,menuId:config.menu,menuRevisionId:config.menu,publicationId:config.menu,publicationHash:'a'.repeat(64),availabilityVersion:1,tier:'T0',bundle:{url:'https://assets.example.test/menu.json',contentHash:await sha256(bytes),assetManifestHash:'b'.repeat(64)},menuToken:'sensitive-token',tokenExpiresAt:new Date(Date.now()+1800000).toISOString()};
 const fetcher=vi.fn().mockResolvedValueOnce(new Response(null,{status:204,headers})).mockResolvedValueOnce(Response.json(pointer,{headers})).mockResolvedValueOnce(new Response(bytes,{headers}));
 const report=await checkPublishedMenu(config,fetcher);expect(report.ok).toBe(true);expect(report.phase).toBe('complete');expect(JSON.stringify(report)).not.toContain('sensitive-token');expect(JSON.stringify(report)).not.toContain('Synthetic venue');
});
