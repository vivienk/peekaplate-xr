import dumplingHome from '../../public/menu.json';
import flores from '../../public/flores-menu.json';

// These two menus ship with the app independently of the Night Market save-code catalogue.
export const menuModelDishes = [
  ...dumplingHome.dishes.map(dish => ({
    ...dish, venueId: 'dumpling-home', restaurant: dumplingHome.restaurant,
    ingredients: dish.ingredientTags, dietary: dish.dietTags,
  })),
  ...flores.dishes.map(dish => ({
    ...dish, venueId: flores.restaurant.id, restaurant: flores.restaurant.name,
    ingredients: dish.ingredients, dietary: dish.diet,
  })),
];
