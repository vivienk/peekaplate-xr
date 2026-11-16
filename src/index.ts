import { World } from '@iwsdk/core';
import projectOptions from 'virtual:iwsdk-project';
import { GlimmerSystem } from './glimmer/system';
World.create(document.getElementById('scene-container') as HTMLDivElement,projectOptions)
  .then(world=>world.registerSystem(GlimmerSystem))
  .catch((error:unknown)=>{console.error('[GLIMMER] startup failed',error);const p=document.createElement('p');p.textContent='The market could not start. Please reload in a WebGL-compatible browser.';document.body.append(p);});
