import { build } from 'esbuild'

build({
  entryPoints: ['src/index.ts'],
  outdir: 'build',
  platform: 'node',
  target: 'node24.21.0',
  bundle: true,
  keepNames: true,
  // legalComments: 'inline',
  external: ['dht-rpc', 'sodium-universal', 'shared-native'],
  minify: true,
  sourcemap: true,
})
