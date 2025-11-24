import { build } from 'esbuild'

build({
  entryPoints: ['src/index.ts'],
  outdir: 'build',
  platform: 'node',
  target: 'node18.20.7',
  loader: {
    '.png': 'dataurl',
    '.jpeg': 'dataurl',
    '.jpg': 'dataurl',
  },
  bundle: true,
  sourcemap: true,
  packages: 'external',
})
