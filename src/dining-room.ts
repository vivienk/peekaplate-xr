import {
  AssetManager,
  Box3,
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Sprite,
  SpriteMaterial,
  CylinderGeometry,
  Vector3,
  createSystem,
} from '@iwsdk/core';
import { loadMenu, type MenuDish } from './menu.js';

const arcPositions = [-0.78, -0.47, -0.16, 0.16, 0.47, 0.78];
const plateColors = [0xc86b4a, 0x4f8b8a, 0xd99a42, 0x8a5a9b, 0x6d9b5d, 0xd26f82];

function makeLabel(text: string): Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 96;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to create dish label');
  context.fillStyle = '#fff8ec';
  context.font = '600 34px Arial';
  context.textAlign = 'center';
  context.fillText(text, 320, 58);
  const sprite = new Sprite(new SpriteMaterial({ map: new CanvasTexture(canvas), transparent: true }));
  sprite.scale.set(0.46, 0.07, 1);
  sprite.position.y = 0.19;
  return sprite;
}

function makeFallback(dish: MenuDish, index: number): Group {
  const group = new Group();
  const plate = new Mesh(new CylinderGeometry(0.105, 0.11, 0.018, 32), new MeshStandardMaterial({ color: 0xf4ead7, roughness: 0.7 }));
  const food = new Mesh(new CircleGeometry(0.075, 32), new MeshStandardMaterial({ color: plateColors[index], roughness: 0.8 }));
  food.rotation.x = -Math.PI / 2;
  food.position.y = 0.012;
  group.add(plate, food, makeLabel(dish.name));
  return group;
}

function makeTable(): Group {
  const table = new Group();
  const wood = new MeshStandardMaterial({ color: 0x8a593b, roughness: 0.72 });
  const top = new Mesh(new BoxGeometry(1.9, 0.09, 0.9), wood);
  top.position.y = 0.76;
  const legGeometry = new BoxGeometry(0.09, 0.76, 0.09);
  for (const x of [-0.78, 0.78]) for (const z of [-0.32, 0.32]) {
    const leg = new Mesh(legGeometry, wood);
    leg.position.set(x, 0.38, z);
    table.add(leg);
  }
  table.add(top);
  return table;
}

export class DiningRoomSystem extends createSystem({}) {
  private started = false;

  init(): void {
    const tableEntity = this.world.createTransformEntity();
    const tableObject = tableEntity.object3D!;
    tableObject.add(makeTable());
    tableObject.position.set(0, 0, -0.8);
    void this.populate(tableObject);
  }

  private async populate(table: Object3D): Promise<void> {
    if (this.started) return;
    this.started = true;
    const menu = await loadMenu();
    await Promise.all(menu.dishes.map(async (dish, index) => {
      const dishEntity = this.world.createTransformEntity();
      const dishObject = dishEntity.object3D!;
      dishObject.position.set(arcPositions[index], 0.86 - Math.abs(arcPositions[index]) * 0.05, -0.08 - Math.abs(arcPositions[index]) * 0.12);
      dishObject.rotation.y = -arcPositions[index] * 0.18;
      table.add(dishObject);
  try {
    if (!dish.modelUrl) throw new Error('No verified dish model is available.');
    const gltf = await AssetManager.loadGLTF(`${import.meta.env.BASE_URL}${dish.modelUrl.replace(/^\//u, '')}`, dish.id);
        const model = gltf.scene.clone(true);
        model.updateMatrixWorld(true);
        const size = new Box3().setFromObject(model).getSize(new Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z) || 1;
        model.scale.setScalar(0.2 / maxDimension);
        model.position.y = 0.02;
        model.add(makeLabel(dish.name));
        dishObject.add(model);
      } catch {
        dishObject.add(makeFallback(dish, index));
      }
    }));
  }
}
