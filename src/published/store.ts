import { loadPublishedMenu } from './client.js';
import { cardsFromMenu, type MenuCard } from './model.js';

export const publishedMode = !!import.meta.env.VITE_MENU_MODE && import.meta.env.VITE_MENU_MODE !== 'demo';
export type MenuState = { status: string; cards: MenuCard[]; loading: boolean; error: boolean };
// One store supplies both the browser and IWSDK panel; no token or menu persistence.
export class PublishedMenuStore {
  state: MenuState = { status: 'Loading published menu...', cards: [], loading: true, error: false };
  private listeners = new Set<(state: MenuState) => void>();
  private timer?: ReturnType<typeof setTimeout>;
  private generation = 0;
  constructor(private load = () => loadPublishedMenu(import.meta.env.VITE_PUBLIC_MENU_API_ORIGIN || '', location.pathname)) {}
  subscribe(listener: (state: MenuState) => void) {
    this.listeners.add(listener); listener(this.state);
    return () => { this.listeners.delete(listener); };
  }
  private emit(state: MenuState) { this.state = state; this.listeners.forEach(listener => listener(state)); }
  async refresh() {
    const generation = ++this.generation;
    clearTimeout(this.timer);
    this.emit({ status: 'Checking current publication...', cards: [], loading: true, error: false });
    try {
      if (import.meta.env.VITE_MENU_MODE !== 'published') throw new Error('Configure VITE_MENU_MODE=published or demo.');
      const result = await this.load();
      if (generation !== this.generation) return;
      const cards = cardsFromMenu(result.content);
      this.emit({status: `${result.content.restaurant.name}${cards.length ? '' : ' · No complete dishes available.'}`, cards, loading: false, error: false});
      this.timer = setTimeout(() => void this.refresh(), Math.max(1000, Math.min(60000, result.expiresAt - Date.now() - 60000)));
    } catch (error) {
      if (generation !== this.generation) return;
      this.emit({status: error instanceof Error && !('issues' in error) ? error.message : 'Menu validation failed. Please retry.', cards: [], loading: false, error: true});
    }
  }
  stop() { ++this.generation; clearTimeout(this.timer); }
}
export const publishedStore = new PublishedMenuStore();
