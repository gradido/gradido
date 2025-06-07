import { build } from 'esbuild'
import fs from 'node:fs'
import { latestDbVersion } from './src/detectLastDBVersion'

build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  target: 'node18.20.7',
  platform: 'node',
  packages: 'external',
  outdir: './build',
  plugins: [
    {
      // hardcode last db version string into index.ts, before parsing
      name: 'replace-latest-db-version-import',
      setup(build) {
        build.onLoad({ filter: /index\.ts$/ }, async (args) => {
          let source = await fs.promises.readFile(args.path, 'utf8')
          source = source.replace(
            /import\s*\{\s*latestDbVersion\s*\}\s*from\s*['"][^'"]+['"]/,
            `const latestDbVersion = "${latestDbVersion}";`,
          )
          return { contents: source, loader: 'ts' }
        })
      },
    },
  ],
})
