// esbuild.config.ts rewrites it into a literal `const BUILD_INFO = { commit, source }` computed at build time. See
// esbuild.config.ts. `as const` narrows `source` to the BuildSource union.
export const BUILD_INFO = { commit: 'dev', source: 'unknown' } as const

/**
 * The running backend's build commit, served at GET /api/version. A backend-only deploy
 * is otherwise invisible from outside (the frontend/admin bundle hashes only track their
 * own builds), so this makes it verifiable with a plain request.
 *
 */

export async function apiVersion(req: any, res: any): Promise<void> {
  res.json(BUILD_INFO)
}
