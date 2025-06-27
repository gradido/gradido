import { esbuildDecorators } from '@anatine/esbuild-decorators'
import { build } from 'esbuild'

build({
  entryPoints: ['src/index.ts'],
  outdir: 'build',
  platform: 'node',
  target: 'node18.20.7',
  bundle: true,
  keepNames: true,
  // legalComments: 'inline',
  external: ['sodium-native'],
  plugins: [esbuildDecorators()],
  minify: true,
  sourcemap: true,
})