import { afterEach, expect, it, vi } from 'vitest';
import { PublishedMenuStore } from '../src/published/store';
import { detailPages } from '../src/published/text';
const content = {schema_version:1 as const,venue_id:'v',menu_id:'m',menu_revision_id:'r',restaurant:{name:'Approved menu',logo:null},categories:[]};
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });
it('clears old content and reports withdrawal instead of a demo fallback', async () => {
  vi.stubEnv('VITE_MENU_MODE','published'); vi.useFakeTimers();
  const load=vi.fn().mockResolvedValueOnce({content,expiresAt:Date.now()+1800000}).mockRejectedValueOnce(new Error('This menu is unavailable.'));
  const store=new PublishedMenuStore(load); await store.refresh(); expect(store.state.status).toBe('Approved menu · No complete dishes available.');
  await vi.advanceTimersByTimeAsync(60000); expect(store.state.error).toBe(true); expect(store.state.cards).toEqual([]); store.stop();
});
it('ignores late responses from a superseded request', async () => {
  vi.stubEnv('VITE_MENU_MODE','published');
  let resolve!: (value: unknown)=>void;
  const load=vi.fn().mockImplementationOnce(()=>new Promise(r=>{resolve=r;})).mockRejectedValueOnce(new Error('Withdrawn'));
  const store=new PublishedMenuStore(load); const first=store.refresh(); await store.refresh();
  resolve({content,expiresAt:Date.now()+1800000}); await first;
  expect(store.state.status).toBe('Withdrawn'); store.stop();
});
it('fails closed on a misspelled mode', async () => {
  vi.stubEnv('VITE_MENU_MODE','publshed'); const load=vi.fn(); const store=new PublishedMenuStore(load); await store.refresh(); expect(load).not.toHaveBeenCalled(); expect(store.state.error).toBe(true);
});
it('keeps all long description and allergen text accessible through bounded pages', () => {
  const card={name:'Dish',price:'JPY 100',description:'Long text '.repeat(200),allergens:'Unknown — ask the restaurant.'};
  const pages=detailPages(card); expect(pages.join('')).toBe(card.description+'\n\n'+card.allergens); expect(pages.every(page=>Array.from(page).length<=240)).toBe(true);
});
