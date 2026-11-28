/**
 * Where a name came from. There are four values rather than two because the origin
 * answers two questions that do not move together:
 *
 * 1. **Has the member answered the question the window at first login asks?**
 *    `chosen` and `adopted` say yes, `assigned` and `migrated` say no.
 * 2. **Does it count against the four picks a year?** Only `chosen` - the name the
 *    member typed themselves. Keeping the name the system built is an answer, not a
 *    pick, so it costs nothing (NU-010/011).
 *
 * Conflating the two is what made a kept name cost a quarter of the yearly quota for
 * a name nobody chose.
 *
 * `migrated` is an `assigned` that migration 0116 handed out. It is kept apart so the
 * rollback of that migration takes back its own work and leaves alone the names that
 * were already there.
 */

export const ALIAS_ORIGIN = {
  ASSIGNED: 'assigned',
  MIGRATED: 'migrated',
  CHOSEN: 'chosen',
  ADOPTED: 'adopted',
} as const

export type AliasOrigin = (typeof ALIAS_ORIGIN)[keyof typeof ALIAS_ORIGIN]
/** The member has answered - by typing a name or by keeping the one they were given. */
export const aliasOriginIsSettled = (origin: AliasOrigin): boolean =>
  origin === 'chosen' || origin === 'adopted'
