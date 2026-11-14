// AI-GENERATED — not an architecture reference
import type { DrizzleTransaction, SupportTicketMessageType } from 'database'
import { dbInsertSupportTicketMessage, dbLockUserRowDrizzle, drizzleDb } from 'database'
import { Result, SUPPORT_TICKET_MESSAGES_MAX } from 'shared'
import {
  SUPPORT_TICKET_MESSAGES_REACHED,
  SUPPORT_TICKET_NOT_FOUND,
  SupportTicketRefused,
} from '@/data/SupportTicket.logic'

/**
 * Who writes in the thread of a support request, and what the message does to the request
 * (Bauplan G § 5). One role per writer: the member in their own request (Member.role.ts); the
 * moderation's roles come with K3.
 */
export interface SupportTicketWriter {
  /** The account that writes. Its row is held while the thread is counted and written to. */
  userId: number
  isModerator: boolean
  type: SupportTicketMessageType
  /** How many messages the thread holds, where this writer may see it -- 0 otherwise. */
  countMessages(supportTicketId: number, tx: DrizzleTransaction): Promise<number>
  /**
   * Moves the request on as this writer's message does, and answers whether it may write into
   * it: who may write and from which state are the condition of that write.
   */
  moveRequest(supportTicketId: number, tx: DrizzleTransaction): Promise<boolean>
}

/**
 * Writes a message in the thread of a support request, as the writer's role says, and answers
 * its id. One transaction behind the writer's row: two writes of one member count one after the
 * other, and the request and its message change together or not at all. A thread that is full
 * (SUPPORT_TICKET_MESSAGES_MAX) or not open to the writer is refused, with nothing written. The
 * full thread is counted first, for the writer's own threads only, so that somebody else's
 * request answers as a missing one does.
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
    await dbLockUserRowDrizzle(writer.userId, tx)
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
