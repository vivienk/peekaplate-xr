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

import { iwsdkDev } from '@iwsdk/vite-plugin-dev';
import { defineConfig } from 'vite';

// v0 and Vercel Sandbox terminate TLS at their proxy, so the server running
// inside the sandbox must speak plain HTTP. IWSDK otherwise enables a cached
// self-signed certificate so a physical headset gets a secure context over the
// LAN — opt back into that locally with IWSDK_DEV_HTTPS=1.
const devHttps = process.env.IWSDK_DEV_HTTPS === '1';

// The managed Playwright workspace is an authoring tool, not something the
// preview server should launch on boot. `iwsdk dev up` sets this variable
// explicitly, so only the plain `vite` path is affected; MCP and CLI callers
// can still launch the managed browser lazily on their first command.
process.env.IWSDK_DEV_OPEN ??= 'false';

const port = Number.parseInt(process.env.PORT ?? '', 10) || 5173;

export default defineConfig({
  plugins: [iwsdkDev({ https: devHttps })],
  server: {
    host: '0.0.0.0',
    port,
    open: false,
    // The sandbox is proxied through a generated hostname.
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port,
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production',
    target: 'esnext',
    rollupOptions: { input: './index.html' },
  },
  esbuild: { target: 'esnext' },
  optimizeDeps: {
    exclude: ['@babylonjs/havok'],
    esbuildOptions: { target: 'esnext' },
  },
  publicDir: 'public',
  // Absolute, not './': the SPA rewrite in vercel.json serves index.html for
  // deep paths, where a relative base resolves assets against the wrong
  // directory. Override with VITE_BASE_PATH when deploying under a subpath.
  base: process.env.VITE_BASE_PATH || '/',
});
