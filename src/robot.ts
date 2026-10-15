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

import { AudioUtils, createSystem, Pressed, Vector3 } from '@iwsdk/core';
import { Robot } from './robot-component.js';

export class RobotSystem extends createSystem({
  robot: { required: [Robot] },
  robotClicked: { required: [Robot, Pressed] },
}) {
  private lookAtTarget = new Vector3();
  private robotPosition = new Vector3();

  init(): void {
    this.queries.robotClicked.subscribe('qualify', (entity) => {
      AudioUtils.play(entity);
    });
  }

  update(): void {
    this.queries.robot.entities.forEach((entity) => {
      const robot = entity.object3D;
      if (robot == null) {
        return;
      }
      this.player.head.updateWorldMatrix(true, false);
      robot.updateWorldMatrix(true, false);
      this.lookAtTarget.setFromMatrixPosition(this.player.head.matrixWorld);
      this.robotPosition.setFromMatrixPosition(robot.matrixWorld);
      this.lookAtTarget.y = this.robotPosition.y;
      robot.lookAt(this.lookAtTarget);
    });
  }
}
