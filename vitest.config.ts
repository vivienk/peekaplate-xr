import { defineConfig } from 'vitest/config';
export default defineConfig({test:{include:['tests/glimmer-*.test.ts'],environment:'node'}});
