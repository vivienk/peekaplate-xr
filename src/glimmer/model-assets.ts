import { AssetType } from '@iwsdk/core';
import restaurants from './fixtures/restaurants.json';
import suppliedDishes from './supplied-dishes.json';
import { reviewedModels } from './generated-models';
import { menuModelDishes } from './menu-models';

export const glimmerModelId = (dishId: string) => `glimmer-dish-${dishId}`;

interface DishModel {
  dishId: string;
  assetId: string;
  file: string;
  label: string;
}

const dishModels: DishModel[] = [
  {
    dishId: 'r2-1', assetId: 'supplied-berry-souffle-pancakes',
    file: 'supplied-dishes/berry-souffle-pancakes.glb', label: 'Supplied 3D model',
  },
  ...reviewedModels.map(model => ({
    dishId: model.dish_id, assetId: `tripo-dish-${model.key}`,
    file: `generated-models/${model.file}`, label: 'Tripo 3D model',
  })),
  ...restaurants.flatMap(restaurant => restaurant.dishes.map(dish => ({
    dishId: dish.id, assetId: glimmerModelId(dish.id),
    file: `glimmer-derived/models/${dish.id}.glb`, label: 'Game 3D illustration',
  }))),
  ...suppliedDishes.map(dish => ({
    dishId: dish.id, assetId: glimmerModelId(dish.id),
    file: `supplied-dishes/${dish.id}.glb`, label: 'Supplied 3D model',
  })),
  ...menuModelDishes.map(dish => ({
    dishId: dish.id, assetId: glimmerModelId(dish.id),
    file: dish.modelUrl.slice(1), label: 'Menu 3D illustration',
  })),
];

const modelsByDish = new Map<string, DishModel[]>();
for (const model of dishModels) {
  const variants = modelsByDish.get(model.dishId);
  if (variants) variants.push(model);
  else modelsByDish.set(model.dishId, [model]);
}
const noModels: readonly DishModel[] = [];
export const modelsForDish = (id: string): readonly DishModel[] => modelsByDish.get(id) ?? noModels;

const descriptor = (file: string, name: string) => ({
  type: AssetType.GLTF, url: `${import.meta.env.BASE_URL}${file}`, name, priority: 'lazy' as const,
});

export const modelAssets = {
  ...Object.fromEntries(dishModels.map(model => [
    model.assetId, descriptor(model.file, `${model.dishId} · ${model.label}`),
  ])),
  'glimmer-portal-pedestal': descriptor('glimmer-derived/models/portal-pedestal.glb', 'Original AR Portal hologram pedestal'),
};
