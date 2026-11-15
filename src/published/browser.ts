import { publishedStore } from './store.js';

export function mountPublishedMenu() {
  const root = document.createElement('section');
  root.id = 'published-menu-browser'; root.setAttribute('aria-label', 'Published restaurant menu');
  Object.assign(root.style, {position:'fixed',top:'16px',left:'16px',width:'min(480px, calc(100vw - 32px))',maxHeight:'65vh',overflow:'auto',background:'#f7f4f0',color:'#242329',padding:'20px',boxSizing:'border-box',borderRadius:'16px',fontFamily:'system-ui',zIndex:'10'});
  const heading = document.createElement('h1'); heading.textContent = 'PeekaPlate · Published menu';
  const status = document.createElement('p'); status.setAttribute('role','status');
  const retry = document.createElement('button'); retry.textContent = 'Refresh menu'; retry.onclick = () => void publishedStore.refresh();
  const xr = document.createElement('button'); xr.id = 'published-enter-xr'; xr.textContent = 'Enter XR'; xr.disabled = true;
  const list = document.createElement('div');
  const note = document.createElement('p'); note.textContent = 'Published photos and menu details. No measured portion sizes or ordering. Confirm allergens and cross-contact with restaurant staff.';
  root.append(heading,status,retry,xr,note,list); document.body.append(root);
  const unsubscribe = publishedStore.subscribe(state => {
    status.textContent = state.status; retry.disabled = state.loading; list.replaceChildren();
    for (const card of state.cards) {
      const article = document.createElement('article');
      const title = document.createElement('h2'); title.textContent = card.name; article.append(title);
      if (card.image) { const img = document.createElement('img'); img.src = card.image; img.alt = card.name; img.style.width = '100%'; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer'; article.append(img); }
      for (const value of [card.price,card.description,card.allergens]) { const text = document.createElement('p'); text.textContent = value; article.append(text); }
      list.append(article);
    }
  });
  const visible = () => { if (!document.hidden) void publishedStore.refresh(); };
  document.addEventListener('visibilitychange', visible);
  window.addEventListener('pagehide', () => { publishedStore.stop(); unsubscribe(); document.removeEventListener('visibilitychange',visible); }, {once:true});
  // A bfcache restoration reloads to revalidate rather than showing stale content.
  window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
  void publishedStore.refresh();
}
