#!/usr/bin/env node
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

// Installs the system libraries that IWSDK's managed headless Chromium
// (Playwright) needs to launch inside the v0 / Vercel Sandbox.
//
// This is a DEV-ONLY concern: the app, the Vite dev server, and the
// production `dist/` build never launch Chromium. It exists so a freshly
// cloned chat doesn't hit `libnspr4.so: cannot open shared object file`
// before the managed browser can start.
//
// It is intentionally:
//   - guarded: only runs on Linux where `dnf` exists (the sandbox is Fedora)
//   - idempotent: skips immediately if the libraries are already present
//   - non-fatal: never fails `npm install` on unsupported platforms

import { execSync, spawnSync } from "node:child_process";

function has(cmd) {
  return (
    spawnSync("sh", ["-c", `command -v ${cmd}`], { stdio: "ignore" }).status ===
    0
  );
}

function librariesPresent() {
  // ldconfig cache is the cheapest way to check without launching Chromium.
  const res = spawnSync("sh", ["-c", "ldconfig -p | grep -q libnspr4.so"], {
    stdio: "ignore",
  });
  return res.status === 0;
}

if (process.platform !== "linux") {
  process.exit(0);
}

if (!has("dnf")) {
  // Not the Fedora-based v0 sandbox (e.g. a local Ubuntu/macOS machine or CI).
  // Playwright's own `npx playwright install-deps` handles apt-based systems.
  process.exit(0);
}

if (librariesPresent()) {
  process.exit(0);
}

// Chromium's full runtime dependency set on Fedora.
const packages = [
  "nspr",
  "nss",
  "atk",
  "at-spi2-atk",
  "at-spi2-core",
  "cups-libs",
  "libdrm",
  "libxkbcommon",
  "libXcomposite",
  "libXdamage",
  "libXext",
  "libXfixes",
  "libXrandr",
  "libXScrnSaver",
  "mesa-libgbm",
  "alsa-lib",
  "pango",
  "cairo",
  "gtk3",
];

const sudo = has("sudo") ? "sudo -n " : "";

// Keep the transaction as light as possible so it doesn't spike memory:
//   --setopt=install_weak_deps=False  skip optional/recommended deps
//   --nodocs                          skip man pages / docs
//   --setopt=max_parallel_downloads=1 avoid many concurrent download buffers
const dnfFlags =
  "--setopt=install_weak_deps=False --nodocs --setopt=max_parallel_downloads=1";

try {
  console.log("[setup] Installing managed-browser system libraries via dnf...");
  execSync(`${sudo}dnf install -y ${dnfFlags} ${packages.join(" ")}`, {
    stdio: "inherit",
  });
  console.log("[setup] Managed-browser system libraries installed.");
} catch (err) {
  // Non-fatal: the app and production build don't need Chromium. Only the
  // IWSDK managed browser (editor/scene/xr tooling) does.
  console.warn(
    "[setup] Could not install managed-browser system libraries automatically.\n" +
      "        This only affects IWSDK's managed browser tooling, not the app.\n" +
      `        Reason: ${err?.message ?? err}`,
  );
}

process.exit(0);
