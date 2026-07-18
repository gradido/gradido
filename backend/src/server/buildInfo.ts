// Dev/ts-node placeholder only. Production (bundled) builds never keep this import:
// esbuild.config.ts rewrites `import { BUILD_INFO } from './buildInfo'` in version.ts
// into a literal `const BUILD_INFO = { commit, source }` computed at build time. See
// version.ts and esbuild.config.ts. `as const` narrows `source` to the BuildSource union.
export const BUILD_INFO = { commit: 'dev', source: 'unknown' } as const
