// AI-GENERATED — not an architecture reference
import { databaseErrorCode } from 'core'
import { dbCountOpenSupportTicketsInScope } from 'database'
import { getLogger } from 'log4js'
import { Authorized, Ctx, Query, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { LOG4JS_BASE_CATEGORY_NAME } from '@/config/const'
import { ModerationWaiting } from '@/graphql/model/ModerationWaiting'
import { Context } from '@/server/context'
import {
  countContributionsWaitingForModeration,
  describeModeratorCreationGroups,
  handledSupportGroupsOfRole,
} from './util/moderatorCreationGroupScope'

const createLogger = () =>
  getLogger(`${LOG4JS_BASE_CATEGORY_NAME}.graphql.resolver.ModerationWaitingResolver`)

@Resolver()
export class ModerationWaitingResolver {
  /**
   * The two numbers behind "Admin" in the wallet's menu ("Meine Gruppen", MG3): what waits for the
   * moderation in the caller's own groups -- the contributions in those of the column "Schöpfung",
   * the requests in those of the column "Support" (MG2b) -- the lines "n warten auf die Moderation" of the admin's
   * start page, counted with the same conditions: `waitingForModeration` of adminOpenCreationCounts
   * (see countContributionsWaitingForModeration), and `forModeration` of the very statement of
   * adminCountOpenSupportTickets. Each only with the right that reads it on the start page; whoever
   * has neither gets null before anything is counted.
   *
   * ⛔ Nullable, and its whole body caught, as supportTicketsMenu: every wallet asks it with the
   * chat's beat. Not nullable, a failure would empty the whole answer, the chat's part with it; not
   * caught, it would write an error into the log at every beat (logPlugin). Where a count fails it
   * answers null and logs the code; for a signed-in member it never throws. Not in the support's
   * read budget: it carries two numbers and no words, and the cap of root fields bounds its aliases
   * (see SUPPORT_TICKET_READS_MAX_PER_REQUEST).
   */
  @Authorized([RIGHTS.MODERATION_WAITING])
  @Query(() => ModerationWaiting, { nullable: true })
  async moderationWaiting(@Ctx() context: Context): Promise<ModerationWaiting | null> {
    try {
      const countsCreations = context.role?.hasRight(RIGHTS.ADMIN_LIST_CONTRIBUTIONS) === true
      const countsSupportTickets = context.role?.hasRight(RIGHTS.MANAGE_SUPPORT_TICKETS) === true
      if (!countsCreations && !countsSupportTickets) {
        return null
      }
      const role = context.user?.userRole
      const [creations, supportTickets] = await Promise.all([
        countsCreations ? countContributionsWaitingForModeration(role) : null,
        countsSupportTickets
          ? dbCountOpenSupportTicketsInScope(
              describeModeratorCreationGroups(role),
              new Date(),
              handledSupportGroupsOfRole(role),
            ).then(({ forModeration }) => forModeration)
          : null,
      ])
      return { creations, supportTickets }
    } catch (error) {
      createLogger().error(`moderation waiting not counted (${databaseErrorCode(error)})`)
      return null
    }
  }
}
