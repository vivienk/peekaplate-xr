import type { MenuCard } from './model.js';
// Bounded pages keep complete long descriptions/declarations reachable in XR.
export function detailPages(card: MenuCard): string[] {
  const text = `${card.description}\n\n${card.allergens}`;
  return Array.from(text.match(/[^]{1,240}/gu) || ['']);
}
