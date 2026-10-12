// AI-GENERATED — not an architecture reference

import { Point } from 'typeorm'

import { RIGHTS } from '@/auth/RIGHTS'
import { CONFIG } from '@/config'
import { Context } from '@/server/context'

import { Point2Location } from './Location2Point'

/**
 * What the rule reads off a member's row. The entity and a Drizzle `users` row both carry
 * the three under these names, so either can be handed in as it is.
 */
type MemberRow = {
  gmsAllowed: boolean | null
  location: unknown
  deletedAt: Date | null
}

/**
 * Whether a member stands on the map of the member search: they allow being found AND a
 * place with two usable coordinates is pinned -- the rule the wallet applies to its own
 * member before it opens the map (`mayFind` in frontend/src/utils/matchingPosition.js).
 * `gms_registered` is not asked, there as here.
 *
 * ⛔ Written down once for its two readers: the member search of the admin interface and the
 * `User` type both answer from here, so the two cannot come to disagree about who carries a
 * pin.
 *
 * Added to the wallet's rule, each for a reason of this side:
 *  - the two switches, as in apis/gms/mapMemberCount.ts: the wallet registers the map route
 *    only with MATCHING_ACTIVE, and GMS_ACTIVE alone is the older integration. Where either
 *    is off there is no map to show anybody on, and a pin would lead nowhere;
 *  - not deleted: the admin's search loads deleted members as well, and a deleted account
 *    takes no part in matching any more.
 *
 * A yes or no, never the point. Where the member lives is `users.location`, which stays
 * with the member (the guard on `User.userLocation`); what the map draws for everybody is
 * the point the GMS holds -- for a member who did not choose "exact", one this server moved
 * away from their home before sending it (apis/gms/approximatePoint.ts).
 */
export const isFindableOnMap = (member: MemberRow): boolean =>
  CONFIG.GMS_ACTIVE &&
  CONFIG.MATCHING_ACTIVE &&
  Boolean(member.gmsAllowed) &&
  Point2Location(member.location as Point) !== null &&
  !member.deletedAt

/**
 * Who is told whether a member stands on the map: the moderation, and the member
 * themselves. Everybody else reads null on `User.findableOnMap`.
 *
 * The moderation by SEARCH_USERS and by no right of its own: that right is what lets
 * somebody look members up in the admin interface, and the pin behind a member's name there
 * is the one reader this answer has. One predicate for both halves, so that the field
 * resolver has a single line to get wrong.
 *
 * ⛔ Somebody has to be asking, as for the guards on a member's own settings (UserResolver):
 * a member object without an id exists -- a link from another community names its sender
 * that way -- and against a caller without a login the two ids alone compare as equal,
 * undefined on both sides.
 */
export const mayKnowFindable = (context: Context, member: { id?: number | null }): boolean =>
  context.role?.hasRight(RIGHTS.SEARCH_USERS) === true ||
  (Boolean(context.user) && context.user?.id === member.id)
