// AI-GENERATED — not an architecture reference
import {
  dbCountSupportTicketMessagesOfModerator,
  dbLockSupportTicketOfModerator,
  dbLockUserRowDrizzle,
  dbUpdateSupportTicketOfModerator,
  SupportTicketMessageType,
  SupportTicketScope,
  SupportTicketStatus,
} from 'database'
import type { ModeratorMessageKind } from '@/data/SupportTicket.logic'
import type { SupportTicketWriter } from './WriteSupportTicketMessage.context'

/**
 * The moderation writes in a request its scope reaches (SUA-010, SUA-018): into an open one, one
 * with a question back, or a closed one -- never into a deleted one, and never into the
 * moderator's own.
 */
const WRITES_INTO: SupportTicketStatus[] = ['OPEN', 'IN_PROGRESS', 'CLOSED']

export interface ModeratorWrite {
  moderator: { id: number }
  /** the member who owns the request, read before the transaction: an owner never changes */
  ownerId: number
  scope: SupportTicketScope
  kind: ModeratorMessageKind
  /** the moment of the message, which closes the request where the answer does */
  at: Date
}

/**
 * A moderator as writer (K3): an answer -- the request is a question back to the member then,
 * and who closed it is gone --, an answer that closes it, or a note, which changes nothing of the
 * request and is the moderation's alone. The count, the write and the check before a note stand
 * on one condition: this request, from these states, within the scope, not the moderator's own.
 */
export const moderatorWriter = ({
  moderator,
  ownerId,
  scope,
  kind,
  at,
}: ModeratorWrite): SupportTicketWriter => {
  const type =
    kind === 'NOTE' ? SupportTicketMessageType.MODERATOR : SupportTicketMessageType.DIALOG
  const where = (id: number) => ({ id, statusIn: WRITES_INTO, scope, moderatorId: moderator.id })
  return {
    userId: moderator.id,
    isModerator: true,
    type,
    // the member's row, not the moderator's: the member and every moderator wait at the same one
    lock: (_supportTicketId, tx) => dbLockUserRowDrizzle(ownerId, tx),
    countMessages: (supportTicketId, tx) =>
      dbCountSupportTicketMessagesOfModerator(where(supportTicketId), type, tx),
    moveRequest: (supportTicketId, tx) =>
      kind === 'NOTE'
        ? // the state as it is now, held: whatever the member did just before stays as it is
          dbLockSupportTicketOfModerator(where(supportTicketId), tx)
        : dbUpdateSupportTicketOfModerator(
            where(supportTicketId),
            kind === 'ANSWER_AND_CLOSE'
              ? { status: SupportTicketStatus.CLOSED, closedAt: at, closedBy: moderator.id }
              : { status: SupportTicketStatus.IN_PROGRESS, closedAt: null, closedBy: null },
            tx,
          ),
  }
}
