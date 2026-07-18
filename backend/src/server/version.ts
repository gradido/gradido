import { BUILD_INFO } from './buildInfo'

export type BuildSource = 'git' | 'env' | 'unknown'

export interface BuildInfo {
  commit: string
  source: BuildSource
}

/**
 * The running backend's build commit, served at GET /api/version. A backend-only deploy
 * is otherwise invisible from outside (the frontend/admin bundle hashes only track their
 * own builds), so this makes it verifiable with a plain request.
 *
 * The value is baked in at BUILD time, not resolved at request time: esbuild.config.ts
 * rewrites the `./buildInfo` import above into a literal `const BUILD_INFO = { ... }`
 * computed from the BUILD_COMMIT env (set for container builds) or `git rev-parse HEAD`
 * (a bare-metal deploy builds inside the checkout), falling back to "unknown". The
 * dev/ts-node path keeps the ./buildInfo placeholder. No child process runs per request.
 */
export function getBuildInfo(): BuildInfo {
  return BUILD_INFO
}
