import { defineAssets } from '@iwsdk/core';
import { modelAssets } from './glimmer/model-assets';

// The original OBJ/MTL sources remain under public/glimmer; these lossless GLB
// derivatives are loaded lazily through IWSDK when a portal or order needs them.
export default defineAssets({ ...modelAssets });
