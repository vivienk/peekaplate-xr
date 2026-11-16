import { AssetType } from '@iwsdk/core';
import restaurants from '../../public/glimmer/fixtures/restaurants.json';

/** Asset IDs shared by the application and independent editor realm. */
export const glimmerModelId = (dishId: string): string => `glimmer-dish-${dishId}`;
export const modelAssets = Object.fromEntries([
  ...restaurants.flatMap(restaurant => restaurant.dishes.map(dish => [
    glimmerModelId(dish.id), {
      type: AssetType.GLTF,
      url: `${import.meta.env.BASE_URL}glimmer-derived/models/${dish.id}.glb`,
      name: dish.name,
      priority: 'lazy' as const,
    },
  ] as const)),
  ['glimmer-portal-pedestal', {
    type: AssetType.GLTF,
    url: `${import.meta.env.BASE_URL}glimmer-derived/models/portal-pedestal.glb`,
    name: 'Original AR Portal hologram pedestal',
    priority: 'lazy' as const,
  }] as const,
]);
