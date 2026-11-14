// AI-GENERATED — not an architecture reference
import { t } from '@/i18n'
import type { DetailsState } from './Contribution.logic'
import type { ListedSupportTicket } from './SupportTicket.schema'

/** Still to be worked on: open, or with a question back to the member. */
export const isOpenTicket = ({ status }: ListedSupportTicket) =>
  status === 'OPEN' || status === 'IN_PROGRESS'

/** The colour of a request's row, by its state (SUA-007): open blue, closed green, deleted red. */
export const ticketRowTone = ({ status }: ListedSupportTicket) =>
  ({
    OPEN: 'table-primary',
    IN_PROGRESS: 'table-primary',
    CLOSED: 'table-success',
    DELETED: 'table-danger',
  })[status]

/**
 * What is going on with a request, for its details button, reckoned as for a contribution
 * (detailsState): a question back waits for the member; open, and the member had the last word;
 * a conversation with nothing waiting in it; or no conversation at all.
 */
export const ticketDetailsState = (ticket: ListedSupportTicket): DetailsState => {
  if (ticket.status === 'IN_PROGRESS') {
    return 'question'
  }
  if (ticket.status === 'OPEN' && ticket.lastMessageByModerator === false) {
    return 'answer'
  }
  return ticket.lastMessageType !== null ? 'conversation' : null
}

/**
 * Who closed or deleted a request, as the line below its text (SUA-008); '' while it is open, and
 * where the one who did it is no longer known. The member who closed their own ("Erledigt, danke")
 * is named as the member, not by name.
 */
export const closingLine = (ticket: ListedSupportTicket) => {
  if (ticket.status === 'CLOSED' && ticket.closedBy === ticket.userId) {
    return t('support.closedByMember')
  }
  if (!ticket.closedByUserName) {
    return ''
  }
  if (ticket.status === 'CLOSED') {
    return t('support.closedBy', { name: ticket.closedByUserName })
  }
  return ticket.status === 'DELETED'
    ? t('support.deletedBy', { name: ticket.closedByUserName })
    : ''
}
