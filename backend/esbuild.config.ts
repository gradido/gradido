import { execSync } from 'node:child_process'
import fs from 'node:fs'
import { esbuildDecorators } from '@anatine/esbuild-decorators'
import { build } from 'esbuild'

// Resolve the build commit ONCE, at build time (not per request — see src/server/version.ts).
// BUILD_COMMIT is set for container builds (docker build-arg); a bare-metal deploy builds
// inside the git checkout, so `git rev-parse HEAD` returns the deployed commit. The
// Dockerfile default "0000000" (all-zero) counts as unset and falls through.
function resolveBuildInfo(): { commit: string; source: 'git' | 'env' | 'unknown' } {
  const fromEnv = process.env.BUILD_COMMIT?.trim()
  if (fromEnv && !/^0+$/.test(fromEnv)) {
    return { commit: fromEnv, source: 'env' }
  }
  try {
    const commit = execSync('git rev-parse HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    if (commit) {
      return { commit, source: 'git' }
    }
  } catch {
    // not a git checkout (e.g. a container image without .git) — fall through
  }
  return { commit: 'unknown', source: 'unknown' }
}

build({
  entryPoints: ['src/index.ts', 'src/password/worker.js'],
  outdir: 'build',
  platform: 'node',
  target: 'node18.20.7',
  bundle: true,
  keepNames: true,
  entryNames: '[name]',
  // legalComments: 'inline',
  external: ['sodium-native', 'email-templates', 'shared-native'],
  plugins: [
    esbuildDecorators(),
    {
      // Bake the build commit into server/version.ts as a literal, so the running backend
      // reports its commit at GET /api/version without any per-request child process.
      // Mirrors database/esbuild.config.ts (latestDbVersion).
      name: 'inline-build-info',
      setup(build) {
        build.onLoad({ filter: /server[/\\]version\.ts$/ }, async (args) => {
          let source = await fs.promises.readFile(args.path, 'utf8')
          source = source.replace(
            /export const BUILD_INFO = {[a-z:', ]*} as const/,
            `const BUILD_INFO = ${JSON.stringify(resolveBuildInfo())}`,
          )
          return { contents: source, loader: 'ts' }
        })
      },
    },
  ],
  minify: true,
  sourcemap: true,
})
