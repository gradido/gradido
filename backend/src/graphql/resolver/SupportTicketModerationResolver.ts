// AI-GENERATED — not an architecture reference
import { SupportTicketStatus } from '@enum/SupportTicketStatus'
import { AdminSupportTicket, AdminSupportTicketList } from '@model/AdminSupportTicket'
import { AdminSupportTicketMessage } from '@model/AdminSupportTicketMessage'
import { User } from '@model/User'
import {
  dbFindMemberAvatarTimestamps,
  dbFindUsersWithEmailContactByIds,
  dbSelectNewestSupportTicketDialogs,
  dbSelectSupportTicketOwnerInScope,
  dbSelectSupportTicketsInScope,
  dbSelectSupportTicketThread,
  findUserNamesByIds,
  SupportTicketThreadMessage,
} from 'database'
import { avatarColorIndex } from 'shared'
import { Arg, Authorized, Ctx, Int, Query, Resolver } from 'type-graphql'
import * as v from 'valibot'
import { RIGHTS } from '@/auth/RIGHTS'
import {
  closingOf,
  SUPPORT_TICKET_INVALID,
  SUPPORT_TICKET_NOT_FOUND,
  SUPPORT_TICKET_NOT_READ,
} from '@/data/SupportTicket.logic'
import { adminSupportTicketsPageSchema } from '@/data/SupportTicket.schema'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'
import { countSupportTicketRead } from './util/countSupportTicket'
import { fromDatabase } from './util/fromDatabase'
import { describeModeratorCreationGroups } from './util/moderatorCreationGroupScope'

/** A message of the thread as the moderation reads it; the date of the author's picture beside it. */
const messageOf = (
  row: SupportTicketThreadMessage,
  avatarUpdatedAt: Date | null,
): AdminSupportTicketMessage => ({
  id: row.id,
  message: row.message,
  createdAt: row.createdAt,
  type: row.type,
  userAlias: row.authorAlias,
  userId: row.authorId,
  userAvatarColorIndex:
    row.authorGradidoId === null ? null : avatarColorIndex(row.authorFirstName, row.authorLastName),
  userGradidoID: row.authorGradidoId,
  userCommunityUuid: row.authorCommunityUuid,
  userAvatarUpdatedAt: avatarUpdatedAt,
  isModerator: row.isModerator,
})

/**
 * The moderation's side of support requests (K2, SUA-005): the list under the admin's tabs and
 * the thread of an opened request, to read. Answering, notes, closing and deleting come with K3.
 *
 * A moderator reaches what their creation groups cover -- the list, its count and the thread
 * through one condition (supportTicketsInScope), read off their role and never off an argument.
 * Their own request stands in the list like any other, but its thread is not theirs to read: on
 * it they are the member, and the notes on it are the moderation's (SUA-018).
 *
 * Nothing of the words reaches the log: both reads count in the request's budget, which keeps the
 * answer out of it (countSupportTicket.ts), and a database error is logged by its code
 * (fromDatabase).
 */
@Resolver()
export class SupportTicketModerationResolver {
  /**
   * A page of the requests in these states, the newest first, with their members. The members,
   * the names of who closed, the pictures' dates and the newest dialog message come in one query
   * each for the whole page.
   */
  @Authorized([RIGHTS.MANAGE_SUPPORT_TICKETS])
  @Query(() => AdminSupportTicketList)
  async adminListSupportTickets(
    @Arg('statuses', () => [SupportTicketStatus]) statuses: SupportTicketStatus[],
    @Arg('currentPage', () => Int) currentPage: number,
    @Arg('pageSize', () => Int) pageSize: number,
    @Ctx() context: Context,
  ): Promise<AdminSupportTicketList> {
    countSupportTicketRead(context)
    const page = v.safeParse(adminSupportTicketsPageSchema, { statuses, currentPage, pageSize })
    if (!page.success) {
      throw new LogError(SUPPORT_TICKET_INVALID)
    }
    const scope = describeModeratorCreationGroups(context.user?.userRole)
    return fromDatabase(SUPPORT_TICKET_NOT_READ, async () => {
      const { count, tickets } = await dbSelectSupportTicketsInScope(
        page.output.statuses,
        scope,
        (page.output.currentPage - 1) * page.output.pageSize,
        page.output.pageSize,
      )
      if (tickets.length === 0) {
        return { count, tickets: [] }
      }
      const closings = tickets.map(closingOf)
      const memberIds = [...new Set(tickets.map(({ userId }) => userId))]
      const [members, avatarDates, names, newest] = await Promise.all([
        // without deleted accounts: a deleted member's request lists no member
        dbFindUsersWithEmailContactByIds(memberIds),
        dbFindMemberAvatarTimestamps(memberIds),
        findUserNamesByIds([...new Set(closings.flatMap(({ by }) => (by === null ? [] : [by])))]),
        dbSelectNewestSupportTicketDialogs(tickets.map(({ id }) => id)),
      ])
      const memberById = new Map(members.map((member) => [member.id, member]))
      return {
        count,
        tickets: tickets.map((ticket, index): AdminSupportTicket => {
          const member = memberById.get(ticket.userId)
          const user = member ? new User(member) : null
          if (user) {
            user.avatarUpdatedAt = avatarDates.get(user.id) ?? null
          }
          const { at, by } = closings[index]
          const last = newest.get(ticket.id)
          return {
            id: ticket.id,
            userId: ticket.userId,
            user,
            userEmail: member?.emailContact?.email ?? null,
            text: ticket.text,
            status: ticket.status,
            creationGroupTag: ticket.creationGroupTag,
            creationGroupName: ticket.creationGroupName,
            createdAt: ticket.createdAt,
            closedAt: at,
            closedBy: by,
            closedByUserName: by === null ? null : (names.get(by) ?? null),
            lastMessageType: last?.type ?? null,
            lastMessageByModerator: last?.isModerator ?? null,
          }
        }),
      }
    })
  }

  /**
   * The whole thread of a request, the notes among it, the oldest message first -- after the check
   * that the moderator reaches the request: an empty thread says only that nobody wrote yet.
   * Outside the scope, missing and the moderator's own request answer alike.
   */
  @Authorized([RIGHTS.MANAGE_SUPPORT_TICKETS])
  @Query(() => [AdminSupportTicketMessage])
  async adminListSupportTicketMessages(
    @Arg('supportTicketId', () => Int) supportTicketId: number,
    @Ctx() context: Context,
  ): Promise<AdminSupportTicketMessage[]> {
    countSupportTicketRead(context)
    const moderator = getUser(context)
    const owner = await fromDatabase(SUPPORT_TICKET_NOT_READ, () =>
      dbSelectSupportTicketOwnerInScope(
        supportTicketId,
        describeModeratorCreationGroups(context.user?.userRole),
      ),
    )
    if (owner === null || owner === moderator.id) {
      throw new LogError(SUPPORT_TICKET_NOT_FOUND, supportTicketId)
    }
    return fromDatabase(SUPPORT_TICKET_NOT_READ, async () => {
      const thread = await dbSelectSupportTicketThread(supportTicketId)
      const dates = await dbFindMemberAvatarTimestamps([
        ...new Set(thread.map(({ authorId }) => authorId)),
      ])
      return thread.map((row) => messageOf(row, dates.get(row.authorId) ?? null))
    })
  }
}
