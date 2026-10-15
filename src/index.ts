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

import { World } from '@iwsdk/core';
import projectOptions from 'virtual:iwsdk-project';
import { ControllerInputSystem } from './input.js';
import { PanelSystem } from './panel.js';
import { RobotSystem } from './robot.js';
import { DiningRoomSystem } from './dining-room.js';
import { StageFlowSystem } from './stage-flow.js';
import { mountFallback } from './fallback.js';

mountFallback();

World.create(
  document.getElementById('scene-container') as HTMLDivElement,
  projectOptions,
).then((world) => {
  world.registerSystem(DiningRoomSystem);
  world.registerSystem(RobotSystem);
  world.registerSystem(PanelSystem);
  world.registerSystem(ControllerInputSystem);
  world.registerSystem(StageFlowSystem);
}).catch((error: unknown) => {
  console.error('[v0] World startup failed', error);
  const message = error instanceof Error ? error.message : String(error);
  const container = document.getElementById('scene-container');
  if (container != null) {
    container.textContent = `Unable to start the dining experience: ${message}`;
    container.style.color = '#ff5f1f';
    container.style.padding = '24px';
    container.style.fontFamily = 'sans-serif';
  }
});
