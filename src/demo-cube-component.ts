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

import { createComponent } from '@iwsdk/core';

/** Tag for the grabbable demo cube that the controller face buttons drive. */
export const DemoCube = createComponent('DemoCube', {});

/** Palette cycled by the X button. Index 0 is the cube's initial color. */
export const CUBE_COLORS = [0x3b82f6, 0x22c55e, 0xef4444, 0xeab308, 0xa855f7];
