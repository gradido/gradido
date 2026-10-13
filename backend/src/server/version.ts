import { Elysia } from 'elysia'
import * as v from 'valibot'

// esbuild.config.ts rewrites it into a literal `const BUILD_INFO = { commit, source }` computed at build time. See
// esbuild.config.ts. `as const` narrows `source` to the BuildSource union.
export const BUILD_INFO = { commit: 'dev', source: 'unknown' } as const

/**
 * The running backend's build commit, served at GET /api/version. A backend-only deploy
 * is otherwise invisible from outside (the frontend/admin bundle hashes only track their
 * own builds), so this makes it verifiable with a plain request.
 *
 */

export const versionRoutes = new Elysia().get('/api/version', () => BUILD_INFO, {
  response: {
    200: v.object({
      commit: v.string(),
      source: v.picklist(['git', 'env', 'unknown']),
    }),
  },
})
