// AI-GENERATED — not an architecture reference
import { SupportTicketMessageType } from '@enum/SupportTicketMessageType'
import { SupportTicketStatus } from '@enum/SupportTicketStatus'
import { AdminOpenSupportTickets } from '@model/AdminOpenSupportTickets'
import { AdminSupportTicket, AdminSupportTicketList } from '@model/AdminSupportTicket'
import { AdminSupportTicketMessage } from '@model/AdminSupportTicketMessage'
import { User } from '@model/User'
import {
  dbCountOpenSupportTicketsInScope,
  dbFindMemberAvatarTimestamps,
  dbFindUsersWithEmailContactByIds,
  dbSelectNewestSupportTicketDialogs,
  dbSelectSupportTicketOwnerInScope,
  dbSelectSupportTicketsInScope,
  dbSelectSupportTicketThread,
  dbUpdateSupportTicketOfModerator,
  findUserNamesByIds,
  SupportTicketFilter,
  SupportTicketThreadMessage,
} from 'database'
import { avatarColorIndex, searchWords } from 'shared'
import { Arg, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'
import * as v from 'valibot'
import { RIGHTS } from '@/auth/RIGHTS'
import {
  closingOf,
  MODERATOR_CLOSES_FROM,
  moderatorMessageKind,
  SUPPORT_TICKET_INVALID,
  SUPPORT_TICKET_NOT_FOUND,
  SUPPORT_TICKET_NOT_READ,
  SUPPORT_TICKET_NOT_STORED,
} from '@/data/SupportTicket.logic'
import {
  adminSupportTicketsPageSchema,
  supportTicketMessageSchema,
  supportTicketResubmissionSchema,
} from '@/data/SupportTicket.schema'
import { moderatorWriter } from '@/interactions/writeSupportTicketMessage/Moderator.role'
import { writeSupportTicketMessage } from '@/interactions/writeSupportTicketMessage/WriteSupportTicketMessage.context'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'
import { countSupportTicketRead, countSupportTicketWrite } from './util/countSupportTicket'
import { GROUPED_FILTER, UNTAGGED_FILTER } from './util/findContributions'
import { fromDatabase } from './util/fromDatabase'
import { describeModeratorCreationGroups } from './util/moderatorCreationGroupScope'
import { mailMemberOfSupportAnswer } from './util/supportTicketAnswerMail'

/**
 * The group filter as the admin's choice sends it, the creation page's tokens (findContributions):
 * '' any group, `*grouped` some, `*untagged` none, else a group's tag.
 */
const groupFilterOf = (creationGroup: string): SupportTicketFilter['group'] => {
  if (creationGroup === GROUPED_FILTER) {
    return 'GROUPED'
  }
  if (creationGroup === UNTAGGED_FILTER) {
    return 'UNGROUPED'
  }
  return creationGroup ? { tag: creationGroup } : null
}

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
 * The moderation's side of support requests (SUA-005): the list under the admin's tabs and the
 * thread of an opened request (K2); answering, notes, closing with the tick, deleting, and the
 * count of the open tab (K3).
 *
 * A moderator reaches what their creation groups cover -- the list, its count, the thread and
 * every act on a request through one condition (supportTicketsInScope), read off their role and
 * never off an argument; an act has it in the condition of its write. Their own request stands
 * in the list like any other, but it is not theirs to read or act on: on it they are the member,
 * and the notes on it are the moderation's (SUA-018).
 *
 * Nothing of the words reaches the log: every read and every write counts in the request's
 * budget, which keeps the answer out of it (countSupportTicket.ts), and a database error is
 * logged by its code (fromDatabase).
 */
@Resolver()
export class SupportTicketModerationResolver {
  /**
   * A page of the requests in these states, the newest first, with their members -- narrowed by a
   * search and a group (K4), beside the scope and never in its place: each word of the search
   * turns up in the request's words, in its member or as its number; and, asked, without what
   * waits for a resubmission still to come. The members, the names of who closed, the pictures'
   * dates and the newest dialog message come in one query each for the whole page.
   *
   * ⛔ The search is a name or an address: it reaches no log (fromDatabase logs by the code).
   */
  @Authorized([RIGHTS.MANAGE_SUPPORT_TICKETS])
  @Query(() => AdminSupportTicketList)
  async adminListSupportTickets(
    @Arg('statuses', () => [SupportTicketStatus]) statuses: SupportTicketStatus[],
    @Arg('currentPage', () => Int) currentPage: number,
    @Arg('pageSize', () => Int) pageSize: number,
    @Arg('query', () => String, { defaultValue: '' }) query: string,
    @Arg('creationGroup', () => String, { defaultValue: '' }) creationGroup: string,
    @Arg('hideResubmission', () => Boolean, { defaultValue: false }) hideResubmission: boolean,
    @Ctx() context: Context,
  ): Promise<AdminSupportTicketList> {
    countSupportTicketRead(context)
    const page = v.safeParse(adminSupportTicketsPageSchema, {
      statuses,
      currentPage,
      pageSize,
      query,
      creationGroup,
      hideResubmission,
    })
    if (!page.success) {
      throw new LogError(SUPPORT_TICKET_INVALID)
    }
    const scope = describeModeratorCreationGroups(context.user?.userRole)
    return fromDatabase(SUPPORT_TICKET_NOT_READ, async () => {
      const { count, tickets } = await dbSelectSupportTicketsInScope(
        page.output.statuses,
        scope,
        {
          words: searchWords(page.output.query),
          group: groupFilterOf(page.output.creationGroup),
          hideResubmissionsAfter: page.output.hideResubmission ? new Date() : null,
        },
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
            resubmissionAt: ticket.resubmissionAt,
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

  /**
   * How many requests the open tab holds, as its two halves (K3): waiting for the moderation,
   * waiting for the member -- and apart from them what waits for a resubmission still to come,
   * which the tab opens without (K4). Within the scope, the moderator's own requests counted as
   * the tab lists them -- what the badges and the start page show.
   */
  @Authorized([RIGHTS.MANAGE_SUPPORT_TICKETS])
  @Query(() => AdminOpenSupportTickets)
  async adminCountOpenSupportTickets(@Ctx() context: Context): Promise<AdminOpenSupportTickets> {
    countSupportTicketRead(context)
    return fromDatabase(SUPPORT_TICKET_NOT_READ, () =>
      dbCountOpenSupportTicketsInScope(
        describeModeratorCreationGroups(context.user?.userRole),
        new Date(),
      ),
    )
  }

  /**
   * Writes in the thread of a request the moderator reaches (K3): an answer to the member -- a
   * question back then, or closed with `close` ("Antworten und schließen") -- or a note for the
   * moderation (`type` MODERATOR), which changes nothing of the request and reaches the member
   * nowhere. Into an open request, one with a question back or a closed one; never into a deleted
   * one, never into the moderator's own. A note that would close is no write (invalid). Each sets
   * the resubmission as the form's box stands (K4): `resubmissionAt`, or none -- a note with one
   * into an open request only, and an answer that closes with none (invalid). An answer is mailed
   * to the member once it is stored, to a confirmed address. Answers the message as the thread
   * shows it.
   */
  @Authorized([RIGHTS.MANAGE_SUPPORT_TICKETS])
  @Mutation(() => AdminSupportTicketMessage)
  async adminCreateSupportTicketMessage(
    @Arg('supportTicketId', () => Int) supportTicketId: number,
    @Arg('message', () => String) message: string,
    @Arg('type', () => SupportTicketMessageType) type: SupportTicketMessageType,
    @Arg('close', () => Boolean) close: boolean,
    @Arg('resubmissionAt', () => String, { nullable: true }) resubmissionAt: string | null,
    @Ctx() context: Context,
  ): Promise<AdminSupportTicketMessage> {
    countSupportTicketWrite(context)
    const moderator = getUser(context)
    const words = v.safeParse(supportTicketMessageSchema, message)
    const resubmission = v.safeParse(supportTicketResubmissionSchema, resubmissionAt)
    const kind =
      resubmission.success && moderatorMessageKind(type, close, resubmission.output !== null)
    if (!words.success || !resubmission.success || !kind) {
      throw new LogError(SUPPORT_TICKET_INVALID)
    }
    const scope = describeModeratorCreationGroups(context.user?.userRole)
    // The member who owns the request, whose row the transaction holds first: an owner never
    // changes. The write checks the scope again, in its own condition.
    const ownerId = await fromDatabase(SUPPORT_TICKET_NOT_STORED, () =>
      dbSelectSupportTicketOwnerInScope(supportTicketId, scope),
    )
    if (ownerId === null || ownerId === moderator.id) {
      throw new LogError(SUPPORT_TICKET_NOT_FOUND, supportTicketId)
    }
    const createdAt = new Date()
    const written = await fromDatabase(SUPPORT_TICKET_NOT_STORED, () =>
      writeSupportTicketMessage(
        moderatorWriter({
          moderator,
          ownerId,
          scope,
          kind,
          at: createdAt,
          resubmissionAt: resubmission.output,
        }),
        supportTicketId,
        words.output,
        createdAt,
      ),
    )
    if (!written.success) {
      throw new LogError(written.error.code, supportTicketId)
    }
    // Once the message is stored, and outside fromDatabase: the mail never throws, and nothing
    // that becomes of it may report the stored answer as failed.
    await mailMemberOfSupportAnswer({
      supportTicketId,
      ownerId,
      kind,
      moderatorAlias: moderator.alias || null,
      message: words.output,
    })
    return messageOf(
      {
        id: written.value,
        message: words.output,
        createdAt,
        type:
          kind === 'NOTE' ? SupportTicketMessageType.MODERATOR : SupportTicketMessageType.DIALOG,
        isModerator: true,
        authorId: moderator.id,
        authorAlias: moderator.alias,
        authorFirstName: moderator.firstName,
        authorLastName: moderator.lastName,
        authorGradidoId: moderator.gradidoID,
        authorCommunityUuid: moderator.communityUuid,
      },
      null,
    )
  }

  /**
   * Closes a request the moderator reaches, an open one or one with a question back, with no
   * message and no mail (the tick, SUA-010, SUA-018); the member sees it closed. A resubmission
   * goes with it (K4): a closed request waits for nothing.
   */
  @Authorized([RIGHTS.MANAGE_SUPPORT_TICKETS])
  @Mutation(() => Boolean)
  async adminCloseSupportTicket(
    @Arg('supportTicketId', () => Int) supportTicketId: number,
    @Ctx() context: Context,
  ): Promise<boolean> {
    countSupportTicketWrite(context)
    const moderator = getUser(context)
    const closed = await fromDatabase(SUPPORT_TICKET_NOT_STORED, () =>
      dbUpdateSupportTicketOfModerator(
        {
          id: supportTicketId,
          statusIn: MODERATOR_CLOSES_FROM,
          scope: describeModeratorCreationGroups(context.user?.userRole),
          moderatorId: moderator.id,
        },
        {
          status: SupportTicketStatus.CLOSED,
          closedAt: new Date(),
          closedBy: moderator.id,
          resubmissionAt: null,
        },
      ),
    )
    if (!closed) {
      throw new LogError(SUPPORT_TICKET_NOT_FOUND, supportTicketId)
    }
    return true
  }

  /**
   * Deletes a request the moderator reaches, an open one or one with a question back -- softly:
   * it stands under "Gelöscht" then, with no way back, and the member sees it as deleted, with no
   * thread. No message and no mail (SUA-018), and no resubmission left (K4).
   */
  @Authorized([RIGHTS.MANAGE_SUPPORT_TICKETS])
  @Mutation(() => Boolean)
  async adminDeleteSupportTicket(
    @Arg('supportTicketId', () => Int) supportTicketId: number,
    @Ctx() context: Context,
  ): Promise<boolean> {
    countSupportTicketWrite(context)
    const moderator = getUser(context)
    const deleted = await fromDatabase(SUPPORT_TICKET_NOT_STORED, () =>
      dbUpdateSupportTicketOfModerator(
        {
          id: supportTicketId,
          statusIn: MODERATOR_CLOSES_FROM,
          scope: describeModeratorCreationGroups(context.user?.userRole),
          moderatorId: moderator.id,
        },
        {
          status: SupportTicketStatus.DELETED,
          deletedAt: new Date(),
          deletedBy: moderator.id,
          resubmissionAt: null,
        },
      ),
    )
    if (!deleted) {
      throw new LogError(SUPPORT_TICKET_NOT_FOUND, supportTicketId)
    }
    return true
  }
}
