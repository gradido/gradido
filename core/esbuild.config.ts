import { build } from 'esbuild'

build({
  entryPoints: ['src/index.ts'],
  outdir: 'build',
  platform: 'node',
  target: 'node18.20.7',
  loader: {
    '.png': 'binary',
    '.jpeg': 'binary',
    '.jpg': 'binary',
  },
  bundle: true,
  sourcemap: true,
  packages: 'external',
})
