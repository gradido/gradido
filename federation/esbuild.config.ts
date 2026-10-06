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
  external: ['sodium-native', 'email-templates', 'shared-native'],
  plugins: [esbuildDecorators()],
  minify: true,
  sourcemap: true,
})