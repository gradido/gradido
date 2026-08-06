// AI-GENERATED — not an architecture reference
import { MATCHING_RIGHTS } from '@/auth/MATCHING_RIGHTS'
import { RIGHTS } from '@/auth/RIGHTS'

// Which rights belong to which optional module. This is the one place a new module is
// registered: add an entry here and every right it owns is withdrawn while the module is
// switched off - from every path that asks a role what it may do, not only from the
// @Authorized directive.
//
// Scope, so nobody reads more into it than it does: this governs the backend service.
// The federation service builds its own schema with no auth checker, and webhooks, the
// standalone export scripts and dlt-connector never resolve a role at all. A module with
// a surface outside those roles needs its own check there.

/** What the stored switches say. One flag per registered module. */
export interface ModuleActivation {
  matchingActive: boolean
}

interface OptionalModule {
  /** For logs and for the admin UI's own naming. */
  name: string
  /** Withdrawn from every role while the module is off. */
  rights: RIGHTS[]
  isActive: (activation: ModuleActivation) => boolean
}

export const OPTIONAL_MODULES: OptionalModule[] = [
  {
    name: 'matching',
    rights: MATCHING_RIGHTS,
    isActive: (activation) => activation.matchingActive,
  },
]

/**
 * The rights no role may exercise right now, because the module that owns them is off.
 *
 * Returns the set rather than filtering a role here, so this stays a plain rule that
 * knows nothing about roles or requests: the caller decides what to do with it.
 */
export function withdrawnRights(activation: ModuleActivation): Set<RIGHTS> {
  const withdrawn = new Set<RIGHTS>()
  for (const optionalModule of OPTIONAL_MODULES) {
    if (!optionalModule.isActive(activation)) {
      for (const right of optionalModule.rights) {
        withdrawn.add(right)
      }
    }
  }
  return withdrawn
}
