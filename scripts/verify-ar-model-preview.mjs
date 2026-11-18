import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

async function clickPanelButton(frame, label) {
  await frame.getByRole('button', { name: label, exact: true }).waitFor({ state: 'attached' });
  const button = await frame.evaluate(label => {
    const b = window.glimmer.buttons.find(b => b.label === label);
    return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
  }, label);
  const surface = await frame.locator('canvas').first().boundingBox();
  const scale = Math.min(surface.width / 1280, surface.height / 720) / 1.04;
  await frame.page().mouse.click(surface.x + surface.width / 2 + (button.x - 640) * scale,
    surface.y + surface.height / 2 + (button.y - 360) * scale);
}

function trianglesInScene(bytes) {
  const gltf = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
  function triangles(nodeIndex) {
    const node = gltf.nodes[nodeIndex];
    const parts = gltf.meshes[node.mesh]?.primitives ?? [];
    return parts.reduce((n, p) => n + gltf.accessors[p.indices ?? p.attributes.POSITION].count / 3, 0)
      + (node.children ?? []).reduce((n, child) => n + triangles(child), 0);
  }
  return gltf.scenes[gltf.scene ?? 0].nodes.reduce((n, index) => n + triangles(index), 0);
}

// Exercise the same dish action, immersive session, and alternate-model button as a player.
export default async function ({ frame, workspaceRoot }) {
  await frame.waitForFunction(() => window.glimmer?.arSupported);
  const directory = join(workspaceRoot, 'artifacts', 'ar-model-preview');
  await mkdir(directory, { recursive: true });
  const dishes = await frame.evaluate(async () => {
    const { marketCatalogue } = await import('/src/glimmer/catalogue.ts');
    const { modelsForDish } = await import('/src/glimmer/model-assets.ts');
    return marketCatalogue().map(dish => ({ id: dish.id, options: modelsForDish(dish.id) }))
      .filter(dish => dish.options.length).sort((a, b) => Number(b.id === 'r2-1') - Number(a.id === 'r2-1'));
  });
  const results = [];
  for (const { id, options } of dishes) {
    await frame.evaluate(id => window.glimmer.dining.show(id), id);
    await clickPanelButton(frame, 'View Portion');
    for (const [index, option] of options.entries()) {
      if (index > 0) {
        await frame.getByRole('button', { name: 'Switch 3D model', exact: true }).evaluate(el => el.click());
      }
      try {
        await frame.waitForFunction(({ id, index, label }) => {
          const app = window.glimmer, portal = window.glimmerARPortal;
          return app.portalDishId === id && app.portalAR && !app.portalFlat && app.portalModelIndex === index
            && app.portalStatus.startsWith(label) && portal.dish.visible && portal.dish.children.length > 0;
        }, { id, index, label: option.label }, { timeout: 20000 });
      } catch (error) {
        throw new Error('AR portal did not show ' + option.file, { cause: error });
      }
      const result = await frame.evaluate(() => {
        const app = window.glimmer, portal = window.glimmerARPortal;
        let triangles = 0;
        portal.dish.traverse(object => {
          if (object.isMesh) triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3;
        });
        return { id: app.portalDishId, status: app.portalStatus, placed: portal.placed,
          scale: portal.dish.scale.toArray(), triangles, blendMode: portal.world.xrSession.environmentBlendMode };
      });
      assert.equal(result.placed, false);
      assert.ok(result.triangles > 2);
      assert.equal(result.triangles, trianglesInScene(await readFile(join(workspaceRoot, 'public', option.file))), option.file);
      assert.deepEqual(result.scale, [1, 1, 1]);
      assert.notEqual(result.blendMode, 'opaque');
      if (id === 'r2-1' || id === 'noka-steak-ramen') {
        await frame.page().screenshot({ path: join(directory, option.assetId + '.png') });
      }
      results.push({file: option.file, ...result});
    }
    await frame.evaluate(() => window.glimmer.onXR());
    await frame.waitForFunction(() => !window.glimmer.portalAR && !window.glimmer.immersive);
  }
  await clickPanelButton(frame, '2.5D view');
  await frame.waitForFunction(() => window.glimmer.portalFlat &&
    window.glimmerARPortal.dish.children.length && !window.glimmer.portalStatus.startsWith('Loading'));
  await clickPanelButton(frame, '3D model');
  await frame.waitForFunction(() => !window.glimmer.portalFlat && window.glimmer.portalStatus.includes('3D'));
  return results;
}
