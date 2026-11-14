// AI-GENERATED — not an architecture reference
import type { DrizzleTransaction, SupportTicketMessageType } from 'database'
import { dbInsertSupportTicketMessage, drizzleDb } from 'database'
import { Result, SUPPORT_TICKET_MESSAGES_MAX } from 'shared'
import {
  SUPPORT_TICKET_MESSAGES_REACHED,
  SUPPORT_TICKET_NOT_FOUND,
  SupportTicketRefused,
} from '@/data/SupportTicket.logic'

/**
 * Who writes in the thread of a support request, and what the message does to the request
 * (Bauplan G § 5). One role per writer: the member in their own request (Member.role.ts), a
 * moderator with an answer, an answer that closes, or a note (Moderator.role.ts).
 */
export interface SupportTicketWriter {
  /** The account that writes. */
  userId: number
  isModerator: boolean
  type: SupportTicketMessageType
  /**
   * Holds, as the first statement of the transaction, the row every write into this request
   * waits for: the row of the member who owns the request. The member holds its own; a writer
   * for somebody else's request holds the owner's as well, or a member and a moderator who both
   * count 99 messages at the same moment both write one.
   */
  lock(supportTicketId: number, tx: DrizzleTransaction): Promise<void>
  /**
   * How many messages of this writer's kind the thread holds, where the request is open to this
   * writer -- 0 otherwise, so that a full thread out of reach answers as a missing request.
   */
  countMessages(supportTicketId: number, tx: DrizzleTransaction): Promise<number>
  /**
   * Moves the request on as this writer's message does, and answers whether it may write into
   * it: who may write and from which state are the condition of that write, also where the
   * message changes nothing of the request.
   */
  moveRequest(supportTicketId: number, tx: DrizzleTransaction): Promise<boolean>
}

/**
 * Writes a message in the thread of a support request, as the writer's role says, and answers
 * its id. One transaction behind the row of the request's member: two writes into one request
 * count one after the other, and the request and its message change together or not at all. A
 * thread that is full (SUPPORT_TICKET_MESSAGES_MAX of the writer's kind) or not open to the
 * writer is refused, with nothing written. The full thread is counted first, where the request is
 * open to the writer only, so that a request out of reach answers as a missing one does.
 *
 * What the database throws is the caller's to catch: its message carries the words.
 */
export async function writeSupportTicketMessage(
  writer: SupportTicketWriter,
  supportTicketId: number,
  message: string,
  createdAt: Date,
): Promise<Result<number, SupportTicketRefused>> {
  return drizzleDb().transaction(async (tx: DrizzleTransaction) => {
    await writer.lock(supportTicketId, tx)
    if ((await writer.countMessages(supportTicketId, tx)) >= SUPPORT_TICKET_MESSAGES_MAX) {
      return { success: false, error: new SupportTicketRefused(SUPPORT_TICKET_MESSAGES_REACHED) }
    }
    if (!(await writer.moveRequest(supportTicketId, tx))) {
      return { success: false, error: new SupportTicketRefused(SUPPORT_TICKET_NOT_FOUND) }
    }
    const id = await dbInsertSupportTicketMessage(
      {
        supportTicketId,
        userId: writer.userId,
        message,
        type: writer.type,
        isModerator: writer.isModerator,
        createdAt,
      },
      tx,
    )
    return { success: true, value: id }
  })
}
