// AI-GENERATED — not an architecture reference
import {
  dbCountSupportTicketMessagesOfModerator,
  dbLockUserRowDrizzle,
  dbReassignSupportTicketOfModerator,
  dbUpdateSupportTicketOfModerator,
  SupportTicketMessageType,
  SupportTicketResubmission,
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

/**
 * The open tab's states: a note that sets a resubmission goes into an open request only -- a
 * closed one waits for nothing --, and only an open one is handed on, as for contributions (K4).
 */
const OPEN_TAB: SupportTicketStatus[] = ['OPEN', 'IN_PROGRESS']

export interface ModeratorWrite {
  moderator: { id: number }
  /** the member who owns the request, read before the transaction: an owner never changes */
  ownerId: number
  scope: SupportTicketScope
  kind: ModeratorMessageKind
  /** the moment of the message, which closes the request where the answer does */
  at: Date
  /**
   * the resubmission as the form's box stands with the message (K4): a moment, none, or 'keep'
   * where the box was not touched
   */
  resubmissionAt: SupportTicketResubmission
}

/**
 * A moderator as writer (K3): an answer -- the request is a question back to the member then,
 * and who closed it is gone --, an answer that closes it, or a note, which is the moderation's
 * alone. Each sets the resubmission as the form's box stands (K4): an answer and a note to the
 * moment, to none, or -- the box untouched -- they keep what the request has now, also what the
 * member or a colleague did since the form opened; an answer that closes to none. A note changes
 * nothing else of the request. The count and the write stand on one condition: this request, from
 * these states, within the scope, not the moderator's own.
 */
export const moderatorWriter = ({
  moderator,
  ownerId,
  scope,
  kind,
  at,
  resubmissionAt,
}: ModeratorWrite): SupportTicketWriter => {
  const type =
    kind === 'NOTE' ? SupportTicketMessageType.MODERATOR : SupportTicketMessageType.DIALOG
  const statusIn = kind === 'NOTE' && resubmissionAt instanceof Date ? OPEN_TAB : WRITES_INTO
  const where = (id: number) => ({ id, statusIn, scope, moderatorId: moderator.id })
  return {
    userId: moderator.id,
    isModerator: true,
    type,
    // the member's row, not the moderator's: the member and every moderator wait at the same one
    lock: (_supportTicketId, tx) => dbLockUserRowDrizzle(ownerId, tx),
    countMessages: (supportTicketId, tx) =>
      dbCountSupportTicketMessagesOfModerator(where(supportTicketId), type, tx),
    // Fixed values, never the row read and written back: a note sets no state, so whatever the
    // member did just before stays as it is.
    moveRequest: (supportTicketId, tx) =>
      dbUpdateSupportTicketOfModerator(
        where(supportTicketId),
        {
          NOTE: { resubmissionAt },
          ANSWER: {
            status: SupportTicketStatus.IN_PROGRESS,
            closedAt: null,
            closedBy: null,
            resubmissionAt,
          },
          ANSWER_AND_CLOSE: {
            status: SupportTicketStatus.CLOSED,
            closedAt: at,
            closedBy: moderator.id,
            resubmissionAt: null,
          },
        }[kind],
        tx,
      ),
  }
}

export interface ModeratorReassign {
  moderator: { id: number }
  /** the member who owns the request, read before the transaction: an owner never changes */
  ownerId: number
  scope: SupportTicketScope
  /** the group the request was read in before the transaction, and the one it goes to; null: none */
  from: number | null
  to: number | null
}

/**
 * A moderator handing a request on to another group, or to none (K4, SUA-018), as the third
 * writer: the line it leaves in the thread is of its own kind, at most SUPPORT_TICKET_MESSAGES_MAX
 * of them. Only an open request is handed on, never the moderator's own, and only from the group
 * it still stands in -- so the line never names a group the request was not in. The target is not
 * checked against the scope: handing on is out of the own groups. The state stays; a resubmission
 * goes with it.
 */
export const moderatorReassigner = ({
  moderator,
  ownerId,
  scope,
  from,
  to,
}: ModeratorReassign): SupportTicketWriter => {
  const where = (id: number) => ({ id, statusIn: OPEN_TAB, scope, moderatorId: moderator.id })
  return {
    userId: moderator.id,
    isModerator: true,
    type: SupportTicketMessageType.REASSIGNED,
    // the member's row, as for every write into the request
    lock: (_supportTicketId, tx) => dbLockUserRowDrizzle(ownerId, tx),
    countMessages: (supportTicketId, tx) =>
      dbCountSupportTicketMessagesOfModerator(
        where(supportTicketId),
        SupportTicketMessageType.REASSIGNED,
        tx,
      ),
    moveRequest: (supportTicketId, tx) =>
      dbReassignSupportTicketOfModerator(where(supportTicketId), from, to, tx),
  }
}
