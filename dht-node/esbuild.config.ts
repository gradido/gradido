import { build } from 'esbuild'

build({
  entryPoints: ['src/index.ts'],
  outdir: 'build',
  platform: 'node',
  target: 'node18.20.7',
  bundle: true,
  keepNames: true,
  // legalComments: 'inline',
  external: ['dht-rpc', 'sodium-universal'],
  minify: true,
  sourcemap: true,
})
