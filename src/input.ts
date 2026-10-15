/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  createSystem,
  Entity,
  InputComponent,
  Mesh,
  MeshStandardMaterial,
  StatefulGamepad,
  UIKit,
  UIKitMLAsset,
  Vector3,
} from '@iwsdk/core';
import { CUBE_COLORS, DemoCube } from './demo-cube-component.js';

const SCALE_STEP = 1.15;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3.0;
const HUD_INTERVAL = 0.1; // seconds between HUD refreshes

const HUD_FIELDS = [
  'l-x',
  'l-y',
  'l-trigger',
  'l-grip',
  'l-stick',
  'r-a',
  'r-b',
  'r-trigger',
  'r-grip',
  'r-stick',
] as const;

/**
 * Reads both XR controller gamepads every frame:
 * - Maps A/B/X/Y face buttons to visible actions on the demo cube.
 * - Mirrors live button / trigger / grip / thumbstick state onto the HUD panel.
 */
export class ControllerInputSystem extends createSystem({
  cube: { required: [DemoCube] },
}) {
  private hudEls: Record<string, UIKit.Text> = {};
  private hudCache: Record<string, string> = {};
  private lastHud = 0;

  private cubeEntity: Entity | null = null;
  private cubeMaterial: MeshStandardMaterial | null = null;
  private cubeHome!: Vector3;
  private cubeHomeScale = 1;
  private cubeScale = 1;
  private colorIndex = 0;

  init(): void {
    this.cubeHome = new Vector3();

    // The scene registry hands out clones that share the prototype's material,
    // so give this placement its own copy before recoloring it.
    this.queries.cube.subscribe('qualify', (entity) => {
      const mesh = entity.object3D as Mesh | null;
      if (mesh == null) {
        return;
      }
      this.cubeEntity = entity;
      this.cubeMaterial = (mesh.material as MeshStandardMaterial).clone();
      mesh.material = this.cubeMaterial;
      this.cubeHome.copy(mesh.position);
      this.cubeHomeScale = mesh.scale.x;
      this.cubeScale = this.cubeHomeScale;
      this.colorIndex = 0;
    });

    this.queries.cube.subscribe('disqualify', (entity) => {
      if (this.cubeEntity === entity) {
        this.cubeEntity = null;
      }
    });

    const hud = this.world.getSceneObject<UIKitMLAsset>('input-hud');
    for (const id of HUD_FIELDS) {
      const element = hud?.getElementById<UIKit.Text>(id);
      if (element != null) {
        this.hudEls[id] = element;
      }
    }

    this.cleanupFuncs.push(() => {
      this.cubeMaterial?.dispose();
      this.cubeMaterial = null;
    });
  }

  update(_delta: number, time: number): void {
    const left = this.input.xr.gamepads.left;
    const right = this.input.xr.gamepads.right;

    this.applyCubeActions(left, right);

    if (time - this.lastHud >= HUD_INTERVAL) {
      this.lastHud = time;
      this.updateHud(left, right);
    }
  }

  private applyCubeActions(
    left: StatefulGamepad | undefined,
    right: StatefulGamepad | undefined,
  ): void {
    const mesh = this.cubeEntity?.object3D as Mesh | undefined;
    if (mesh == null) {
      return;
    }

    if (right?.getButtonDown(InputComponent.A_Button)) {
      this.cubeScale = Math.min(this.cubeScale * SCALE_STEP, MAX_SCALE);
      mesh.scale.setScalar(this.cubeScale);
    }
    if (right?.getButtonDown(InputComponent.B_Button)) {
      this.cubeScale = Math.max(this.cubeScale / SCALE_STEP, MIN_SCALE);
      mesh.scale.setScalar(this.cubeScale);
    }
    if (left?.getButtonDown(InputComponent.X_Button)) {
      this.colorIndex = (this.colorIndex + 1) % CUBE_COLORS.length;
      this.cubeMaterial?.color.setHex(CUBE_COLORS[this.colorIndex]);
    }
    if (left?.getButtonDown(InputComponent.Y_Button)) {
      this.colorIndex = 0;
      this.cubeScale = this.cubeHomeScale;
      mesh.position.copy(this.cubeHome);
      mesh.scale.setScalar(this.cubeHomeScale);
      this.cubeMaterial?.color.setHex(CUBE_COLORS[0]);
    }
  }

  private updateHud(
    left: StatefulGamepad | undefined,
    right: StatefulGamepad | undefined,
  ): void {
    this.setHud('l-x', `X  ${btn(left?.getButtonPressed(InputComponent.X_Button))}`);
    this.setHud('l-y', `Y  ${btn(left?.getButtonPressed(InputComponent.Y_Button))}`);
    this.setHud('l-trigger', `Trig  ${val(left?.getButtonValue(InputComponent.Trigger))}`);
    this.setHud('l-grip', `Grip  ${btn(left?.getButtonPressed(InputComponent.Squeeze))}`);
    this.setHud('l-stick', `Stick  ${stick(left?.getAxesValues(InputComponent.Thumbstick))}`);

    this.setHud('r-a', `A  ${btn(right?.getButtonPressed(InputComponent.A_Button))}`);
    this.setHud('r-b', `B  ${btn(right?.getButtonPressed(InputComponent.B_Button))}`);
    this.setHud('r-trigger', `Trig  ${val(right?.getButtonValue(InputComponent.Trigger))}`);
    this.setHud('r-grip', `Grip  ${btn(right?.getButtonPressed(InputComponent.Squeeze))}`);
    this.setHud('r-stick', `Stick  ${stick(right?.getAxesValues(InputComponent.Thumbstick))}`);
  }

  private setHud(id: string, text: string): void {
    if (this.hudCache[id] === text) {
      return;
    }
    this.hudCache[id] = text;
    this.hudEls[id]?.setProperties({ text });
  }
}

function btn(pressed: boolean | undefined): string {
  return pressed ? 'ON' : 'off';
}

function val(value: number | undefined): string {
  return (value ?? 0).toFixed(2);
}

function stick(axes: { x: number; y: number } | undefined): string {
  if (axes == null) {
    return '0.00, 0.00';
  }
  return `${axes.x.toFixed(2)}, ${axes.y.toFixed(2)}`;
}
