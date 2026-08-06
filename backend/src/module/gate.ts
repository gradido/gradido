import { RIGHTS } from '@/auth/RIGHTS'

import { StoredModuleSettings } from './settings'

// Which rights belong to which optional module (E-001). This is the ONE place a new
// module is registered: add an entry here and the authorization gate covers every
// resolver that asks for those rights, today's and tomorrow's, without anyone having
// to remember to add a check.

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
    rights: [
      RIGHTS.CREATE_MATCHING_ENTRY,
      RIGHTS.UPDATE_MATCHING_ENTRY,
      RIGHTS.DELETE_MATCHING_ENTRY,
      RIGHTS.LIST_MATCHING_ENTRY,
    ],
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
