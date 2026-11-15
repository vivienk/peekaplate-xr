import { defineConfig } from 'vitest/config';
// Contract tests do not start the IWSDK managed browser or dev plugin.
export default defineConfig({ test: { environment: 'node', include: ['tests/**/*.test.ts'] } });
