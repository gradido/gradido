// AI-GENERATED — not an architecture reference
import {
  dbCountSupportTicketDialogOfOwner,
  dbLockUserRowDrizzle,
  dbUpdateSupportTicketOfOwner,
  SupportTicketMessageType,
  SupportTicketStatus,
} from 'database'
import type { SupportTicketWriter } from './WriteSupportTicketMessage.context'

/**
 * The member writes in their own request (SUA-010): into an open one, one with a question back,
 * or a closed one -- never into a deleted one. Afterwards it is open, and who closed it is gone:
 * the moderation is to answer again.
 */
const WRITES_INTO: SupportTicketStatus[] = ['OPEN', 'IN_PROGRESS', 'CLOSED']

/** The member as writer: a DIALOG message in a request of their own, and no other. */
export const memberWriter = (member: { id: number }): SupportTicketWriter => ({
  userId: member.id,
  isModerator: false,
  type: SupportTicketMessageType.DIALOG,
  // The member owns every request it writes into: its own row is the owner's.
  lock: (_supportTicketId, tx) => dbLockUserRowDrizzle(member.id, tx),
  countMessages: (supportTicketId, tx) =>
    dbCountSupportTicketDialogOfOwner(supportTicketId, member.id, tx),
  moveRequest: (supportTicketId, tx) =>
    dbUpdateSupportTicketOfOwner(
      { id: supportTicketId, userId: member.id, statusIn: WRITES_INTO },
      { status: SupportTicketStatus.OPEN, closedAt: null, closedBy: null },
      tx,
    ),
})
