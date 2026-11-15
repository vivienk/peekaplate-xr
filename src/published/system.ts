import { createSystem, UIKitMLAsset, VisibilityState, RayInteractable } from '@iwsdk/core';
import { publishedStore } from './store.js';
import { detailPages } from './text.js';

export class PublishedMenuSystem extends createSystem({}) {
  init(): void {
    const panel = this.world.getSceneObject<UIKitMLAsset>('stage-flow-panel');
    if (!panel) return;
    // The published surface faces the seated user (+Z); demo placement stays untouched.
    panel.rotation.y = 0;
    this.world.getSceneEntity('stage-flow-panel')?.addComponent(RayInteractable);
    let index = 0; let page = 0;
    const text = (id: string, value: string) => panel.getElementById(id)?.setProperties({ text: value });
    const render = () => {
      const state = publishedStore.state; const card = state.cards[index];
      text('published-status', state.status);
      text('published-name', card?.name || ''); text('published-price', card?.price || '');
      const pages = card ? detailPages(card) : [];
      text('published-detail', pages[page] || 'Open /venues/{venueId}/menus/{menuId} to browse a published menu.');
      text('published-position', card ? `Dish ${index+1}/${state.cards.length} · Details ${page+1}/${pages.length}` : '');
      for (const id of ['published-next','published-previous','published-more']) panel.getElementById(id)?.setProperties({display: card ? 'flex' : 'none'});
    };
    const bind = (id: string, fn: () => void) => {
      const button = panel.getElementById(id); button?.addEventListener('click',fn);
      this.cleanupFuncs.push(() => button?.removeEventListener('click',fn));
    };
    bind('published-next', () => { index=(index+1)%Math.max(1,publishedStore.state.cards.length); page=0; render(); });
    bind('published-previous', () => { index=(index-1+publishedStore.state.cards.length)%Math.max(1,publishedStore.state.cards.length); page=0; render(); });
    bind('published-more', () => { const card=publishedStore.state.cards[index]; if (card) page=(page+1)%detailPages(card).length; render(); });
    bind('published-retry', () => void publishedStore.refresh());
    bind('published-xr', () => { void this.world.launchXR(); });
    bind('published-exit', () => { void this.world.exitXR(); });
    this.cleanupFuncs.push(publishedStore.subscribe(() => { index=0; page=0; render(); }));
    const browser = document.getElementById('published-menu-browser');
    const enter = document.getElementById('published-enter-xr') as HTMLButtonElement | null;
    const launch = () => { void this.world.launchXR(); };
    if (enter) { enter.disabled = !this.world.xrEnabled; enter.addEventListener('click',launch); }
    this.cleanupFuncs.push(() => enter?.removeEventListener('click',launch));
    panel.getElementById('published-xr')?.setProperties({display:this.world.xrEnabled ? 'flex':'none'});
    this.cleanupFuncs.push(this.world.visibilityState.subscribe(state => {
      const flat = state === VisibilityState.NonImmersive;
      if (browser) browser.hidden = !flat;
      panel.getElementById('published-exit')?.setProperties({display:flat ? 'none':'flex'});
    }));
  }
}
