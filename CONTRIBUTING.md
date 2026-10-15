# Contributing

Use Node.js 24 or another version allowed by `package.json`, then install with
`npm ci`.

Before opening a pull request, run:

```bash
npm run check
npm run test:coverage
npm run build:all
npm run smoke:sdk
```

Keep IWSDK packages on the same exact version. Import Three.js runtime values
from `@iwsdk/core`, use `AssetManager` for assets, avoid allocations in ECS
`update()` methods, and register every subscription in `cleanupFuncs`.

Bug reports and pull requests should include reproduction steps, the tested
browser/headset, and whether the issue also occurs in the IWER emulator.
