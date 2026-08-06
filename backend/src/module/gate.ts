import { MATCHING_RIGHTS } from '@/auth/MATCHING_RIGHTS'
import { RIGHTS } from '@/auth/RIGHTS'

import { StoredModuleSettings } from './settings'

// Which rights belong to which optional module. This is the one place a new module is
// registered for the backend's @Authorized path: add an entry here and every resolver
// asking for those rights is covered, today's and tomorrow's.
//
// Scope, so nobody reads more into it than it does: this reaches the backend GraphQL
// schema only. The federation service builds its own schema with no authChecker, and
// webhooks, the standalone export scripts and dlt-connector never pass through here.
// A module with a surface outside the @Authorized path needs its own check there.

interface GatedModule {
  /** For logs and error messages that stay inside the backend. */
  name: string
  /** Asking for any of these rights makes a request subject to this module's switch. */
  rights: RIGHTS[]
  isActive: (settings: StoredModuleSettings) => boolean
}

export const GATED_MODULES: GatedModule[] = [
  {
    name: 'matching',
    rights: MATCHING_RIGHTS,
    isActive: (settings) => settings.matchingActive,
  },
]

/**
 * The modules whose switch decides this request, empty for the vast majority of
 * requests. Callers use the empty case to skip reading the settings at all - that is
 * what keeps the gate free on every path that has nothing to do with a module.
 */
export function gatingModulesFor(rights: RIGHTS[]): GatedModule[] {
  return GATED_MODULES.filter((module) => rights.some((right) => module.rights.includes(right)))
}
