import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
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

// Run with the IWSDK managed Quest emulator, starting outside an XR session.
export default async function ({ frame, workspaceRoot }) {
  await frame.waitForFunction(() => window.glimmer?.arSupported);
  const directory = join(workspaceRoot, 'artifacts', 'ar-model-preview');
  await mkdir(directory, { recursive: true });
  const results = [];

  for (const id of ['r2-1', 'noka-steak-ramen']) {
    await frame.evaluate(id => window.glimmer.dining.show(id), id);
    await clickPanelButton(frame, 'View Portion');
    await frame.waitForFunction(id => {
      const app = window.glimmer;
      const portal = window.glimmerARPortal;
      return app.portalDishId === id && app.portalAR && !app.portalFlat &&
        portal.dish.visible && portal.dish.children.length > 0;
    }, id, { timeout: 30000 });

    const result = await frame.evaluate(() => {
      const app = window.glimmer, portal = window.glimmerARPortal;
      let triangles = 0;
      portal.dish.traverse(object => {
        if (object.isMesh) {
          const geometry = object.geometry;
          triangles += (geometry.index?.count ?? geometry.attributes.position.count) / 3;
        }
      });
      return {
        id: app.portalDishId, status: app.portalStatus, placed: portal.placed,
        scale: portal.dish.scale.toArray(), triangles,
        blendMode: portal.world.xrSession.environmentBlendMode,
      };
    });
    assert.equal(result.placed, false);
    assert.match(result.status, /3D/);
    assert.ok(result.triangles > 2, 'Expected a volumetric dish mesh');
    assert.deepEqual(result.scale, [1, 1, 1]);
    assert.notEqual(result.blendMode, 'opaque');
    await frame.page().screenshot({ path: join(directory, id + '.png') });
    results.push(result);
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
