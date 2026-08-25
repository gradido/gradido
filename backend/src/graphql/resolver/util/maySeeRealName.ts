// AI-GENERATED — not an architecture reference

import { RIGHTS } from '@/auth/RIGHTS'
import { User } from '@/graphql/model/User'
import { Context } from '@/server/context'

/**
 * Who may read a member's real name (NU-019): the moderation, and the member themselves.
 * Everyone else speaks of them by alias.
 *
 * ⛔ One predicate for both halves of the name. firstName and lastName carried the same
 * two conditions in two copies, and a guard that has to be edited twice is a guard that
 * will one day be edited once.
 *
 * The owner exception is spelled out against `context.user`, NOT modelled as a second
 * right: VIEW_OWN_USER_CONTACT next door is assigned to no role and guards nothing --
 * that construction is the one this deliberately avoids. The login mutation sets
 * `context.user` to the member it just authenticated, so the wallet's login answer
 * carries the member's own name.
 */
export const maySeeRealName = (context: Context, user: User): boolean =>
  context.role?.hasRight(RIGHTS.VIEW_USER_REAL_NAME) === true ||
  (context.user !== undefined && context.user !== null && context.user.id === user.id)
