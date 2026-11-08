import { esbuildDecorators } from '@anatine/esbuild-decorators'
import { build } from 'esbuild'

build({
  entryPoints: ['src/index.ts'],
  outdir: 'build',
  platform: 'node',
  target: 'node24.21.0',
  bundle: true,
  keepNames: true,
  entryNames: '[name]',
  // legalComments: 'inline',
  // Nothing from node_modules goes into the bundle, for now: core comes in as its CJS build and
  // requires elysia, this code imports it as ESM, and esbuild would bundle both files. A status()
  // of the one copy fails the instanceof checks of the other, and the peer api answers 500 for
  // every status it means to give. One copy from node_modules at runtime until the Bun test runner
  // lets the backend drop core's CJS build and the builds go ESM.
  packages: 'external',
  plugins: [esbuildDecorators()],
  minify: true,
  sourcemap: true,
})