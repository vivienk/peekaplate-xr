import type { PublicMenuContentBundle } from './contracts.js';
export type MenuCard = { name: string; description: string; price: string; allergens: string; image?: string };
export function cardsFromMenu(menu: PublicMenuContentBundle): MenuCard[] {
  return menu.categories.flatMap(category => category.dishes.flatMap(dish => dish.complete ? [{
    name: dish.name, description: dish.description, price: `${dish.price.currency} ${dish.price.amount}`,
    allergens: dish.allergens === null ? 'Allergen declaration unavailable — ask the restaurant.' : dish.allergens.length ? `Declared allergens: ${dish.allergens.join(', ')}. Ask about cross-contact.` : 'No listed allergens declared. Ask about cross-contact.',
    image: dish.images.detail.url,
  }] : []));
}
