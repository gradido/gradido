// AI-GENERATED — not an architecture reference
import { SupportTicket, SupportTicketList } from '@model/SupportTicket'
import { SupportTicketMessage } from '@model/SupportTicketMessage'
import {
  DrizzleTransaction,
  dbCountSupportTicketsOfUserSince,
  dbFindMemberAvatarTimestamps,
  dbInsertSupportTicket,
  dbLockUserRowDrizzle,
  dbSelectCreationGroupByTag,
  dbSelectSupportTicketDialogOfOwner,
  dbSelectSupportTicketsOfUser,
  dbUpdateSupportTicketOfOwner,
  drizzleDb,
  SupportTicketDialogMessage,
  SupportTicketMessageType,
  SupportTicketStatus,
} from 'database'
import { avatarColorIndex, SUPPORT_TICKETS_PER_DAY_MAX } from 'shared'
import { Arg, Authorized, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql'
import * as v from 'valibot'
import { RIGHTS } from '@/auth/RIGHTS'
import {
  MEMBER_CLOSES_FROM,
  SUPPORT_TICKET_INVALID,
  SUPPORT_TICKET_NOT_FOUND,
  SUPPORT_TICKET_NOT_READ,
  SUPPORT_TICKET_NOT_STORED,
  SUPPORT_TICKET_UNKNOWN_GROUP,
  SUPPORT_TICKETS_PER_DAY_REACHED,
  supportTicketsWindowStart,
} from '@/data/SupportTicket.logic'
import {
  supportTicketMessageSchema,
  supportTicketsPageSchema,
  supportTicketTextSchema,
} from '@/data/SupportTicket.schema'
import { memberWriter } from '@/interactions/writeSupportTicketMessage/Member.role'
import { writeSupportTicketMessage } from '@/interactions/writeSupportTicketMessage/WriteSupportTicketMessage.context'
import { Context, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'
import { countSupportTicketRead, countSupportTicketWrite } from './util/countSupportTicket'
import { fromDatabase } from './util/fromDatabase'

/** A message of the thread as the member reads it; the date of the author's picture beside it. */
const messageOf = (
  row: SupportTicketDialogMessage,
  avatarUpdatedAt: Date | null,
): SupportTicketMessage => ({
  id: row.id,
  message: row.message,
  createdAt: row.createdAt,
  type: row.type,
  userAlias: row.authorAlias,
  userAvatarColorIndex:
    row.authorAlias === null ? null : avatarColorIndex(row.authorFirstName, row.authorLastName),
  userGradidoID: row.authorGradidoId,
  userCommunityUuid: row.authorCommunityUuid,
  userAvatarUpdatedAt: avatarUpdatedAt,
})

/**
 * Files the request, unless the member filed SUPPORT_TICKETS_PER_DAY_MAX in the 24 hours before:
 * counted and filed in one transaction behind the member's row, so that two requests of one
 * moment count one after the other. Answers its number, or null where the limit is reached.
 */
const ticketFiled = (
  userId: number,
  creationGroupId: number | null,
  text: string,
  createdAt: Date,
): Promise<number | null> =>
  drizzleDb().transaction(async (tx: DrizzleTransaction) => {
    await dbLockUserRowDrizzle(userId, tx)
    const filed = await dbCountSupportTicketsOfUserSince(
      userId,
      supportTicketsWindowStart(createdAt),
      tx,
    )
    return filed >= SUPPORT_TICKETS_PER_DAY_MAX
      ? null
      : dbInsertSupportTicket({ userId, creationGroupId, text, createdAt }, tx)
  })

/**
 * The member's side of support requests (SUA-001): a member asks the support of their community
 * in the wallet, finds the request in their list, reads the thread, writes in it and closes it.
 * The moderation's side is SupportTicketModerationResolver.
 *
 * No operation takes a member: it is always the signed-in one, and every query has them in its
 * condition -- another member's request answers as a missing one does. The member reads the
 * DIALOG messages and no other kind, and never a row number of anybody.
 *
 * Nothing of the words reaches the log: the request log writes no variables, the answer of a
 * request that read or wrote stays out of it (countSupportTicket.ts), and a database error is
 * logged by its code (fromDatabase). No event either: the rows are the trace.
 */
@Resolver()
export class SupportTicketResolver {
  /** Files a request in the group of this tag, or in none; the words without their blanks. */
  @Authorized([RIGHTS.USE_SUPPORT_TICKETS])
  @Mutation(() => SupportTicket)
  async createSupportTicket(
    @Arg('text', () => String) text: string,
    @Arg('creationGroupTag', () => String, { nullable: true }) creationGroupTag: string | null,
    @Ctx() context: Context,
  ): Promise<SupportTicket> {
    const member = getUser(context)
    countSupportTicketWrite(context)
    const words = v.safeParse(supportTicketTextSchema, text)
    if (!words.success) {
      throw new LogError(SUPPORT_TICKET_INVALID)
    }
    const group = creationGroupTag
      ? await fromDatabase(SUPPORT_TICKET_NOT_STORED, () =>
          dbSelectCreationGroupByTag(creationGroupTag),
        )
      : null
    if (creationGroupTag && !group) {
      throw new LogError(SUPPORT_TICKET_UNKNOWN_GROUP)
    }
    const createdAt = new Date()
    const id = await fromDatabase(SUPPORT_TICKET_NOT_STORED, () =>
      ticketFiled(member.id, group?.id ?? null, words.output, createdAt),
    )
    if (id === null) {
      throw new LogError(SUPPORT_TICKETS_PER_DAY_REACHED)
    }
    return {
      id,
      text: words.output,
      status: SupportTicketStatus.OPEN,
      creationGroupTag: group?.tag ?? null,
      creationGroupName: group?.name ?? null,
      createdAt,
    }
  }

  /** A page of the member's own requests, the newest first, without their threads. */
  @Authorized([RIGHTS.USE_SUPPORT_TICKETS])
  @Query(() => SupportTicketList)
  async listSupportTickets(
    @Arg('currentPage', () => Int) currentPage: number,
    @Arg('pageSize', () => Int) pageSize: number,
    @Ctx() context: Context,
  ): Promise<SupportTicketList> {
    const member = getUser(context)
    countSupportTicketRead(context)
    const page = v.safeParse(supportTicketsPageSchema, { currentPage, pageSize })
    if (!page.success) {
      throw new LogError(SUPPORT_TICKET_INVALID)
    }
    return fromDatabase(SUPPORT_TICKET_NOT_READ, () =>
      dbSelectSupportTicketsOfUser(
        member.id,
        (page.output.currentPage - 1) * page.output.pageSize,
        page.output.pageSize,
      ),
    )
  }

  /**
   * The thread of one of the member's own requests, the oldest message first. Loaded when the
   * member opens it, not with the list: a thread may hold SUPPORT_TICKET_MESSAGES_MAX messages of
   * MESSAGE_MAX_CHARS each. The dates of the authors' pictures in one query for the thread.
   */
  @Authorized([RIGHTS.USE_SUPPORT_TICKETS])
  @Query(() => [SupportTicketMessage])
  async listSupportTicketMessages(
    @Arg('supportTicketId', () => Int) supportTicketId: number,
    @Ctx() context: Context,
  ): Promise<SupportTicketMessage[]> {
    const member = getUser(context)
    countSupportTicketRead(context)
    return fromDatabase(SUPPORT_TICKET_NOT_READ, async () => {
      const dialog = await dbSelectSupportTicketDialogOfOwner(supportTicketId, member.id)
      const dates = await dbFindMemberAvatarTimestamps([
        ...new Set(dialog.map((row) => row.authorId)),
      ])
      return dialog.map((row) => messageOf(row, dates.get(row.authorId) ?? null))
    })
  }

  /**
   * Writes in the thread of one of the member's own requests -- an open one, one with a question
   * back, a closed one; afterwards it is open. Answers the message as the thread shows it.
   */
  @Authorized([RIGHTS.USE_SUPPORT_TICKETS])
  @Mutation(() => SupportTicketMessage)
  async createSupportTicketMessage(
    @Arg('supportTicketId', () => Int) supportTicketId: number,
    @Arg('message', () => String) message: string,
    @Ctx() context: Context,
  ): Promise<SupportTicketMessage> {
    const member = getUser(context)
    countSupportTicketWrite(context)
    const words = v.safeParse(supportTicketMessageSchema, message)
    if (!words.success) {
      throw new LogError(SUPPORT_TICKET_INVALID)
    }
    const createdAt = new Date()
    const written = await fromDatabase(SUPPORT_TICKET_NOT_STORED, () =>
      writeSupportTicketMessage(memberWriter(member), supportTicketId, words.output, createdAt),
    )
    if (!written.success) {
      throw new LogError(written.error.code, supportTicketId)
    }
    return messageOf(
      {
        id: written.value,
        message: words.output,
        createdAt,
        type: SupportTicketMessageType.DIALOG,
        authorId: member.id,
        authorAlias: member.alias,
        authorFirstName: member.firstName,
        authorLastName: member.lastName,
        authorGradidoId: member.gradidoID,
        authorCommunityUuid: member.communityUuid,
      },
      null,
    )
  }

  /** Closes one of the member's own requests ("Erledigt, danke"), an open one or one with a question back. */
  @Authorized([RIGHTS.USE_SUPPORT_TICKETS])
  @Mutation(() => Boolean)
  async closeSupportTicket(
    @Arg('supportTicketId', () => Int) supportTicketId: number,
    @Ctx() context: Context,
  ): Promise<boolean> {
    const member = getUser(context)
    countSupportTicketWrite(context)
    const closed = await fromDatabase(SUPPORT_TICKET_NOT_STORED, () =>
      dbUpdateSupportTicketOfOwner(
        { id: supportTicketId, userId: member.id, statusIn: MEMBER_CLOSES_FROM },
        { status: SupportTicketStatus.CLOSED, closedAt: new Date(), closedBy: member.id },
      ),
    )
    if (!closed) {
      throw new LogError(SUPPORT_TICKET_NOT_FOUND, supportTicketId)
    }
    return true
  }
}
