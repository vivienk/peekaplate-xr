import { defineAssets } from '@iwsdk/core';
import { modelAssets } from './glimmer/model-assets';

// The portal and the editor use the same lazy dish model catalogue.
export default defineAssets(modelAssets);
