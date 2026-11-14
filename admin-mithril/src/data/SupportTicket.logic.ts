// AI-GENERATED — not an architecture reference
import type { Option } from '@/components/ThemedSelect'
import { t } from '@/i18n'
import { type DetailsState, groupFilterOptions } from './Contribution.logic'
import type { Moderator } from './Moderator.schema'
import type { ListedSupportTicket } from './SupportTicket.schema'

/**
 * The bounds of a thread as the server holds them (shared/src/const/index.ts, SUA-015, SUA-020):
 * the longest message, and how many messages of one kind -- the dialog, the notes -- a request
 * takes. Copies: the admin cannot import that file, it loads the native addon. The test reads it
 * as text and holds the two numbers to it.
 */
export const MESSAGE_MAX_CHARS = 5000
export const SUPPORT_TICKET_MESSAGES_MAX = 100

/** The characters of a message as the server counts them: the blanks around gone, by code points. */
export const charactersOf = (text: string) => Array.from(text.trim()).length

/** Whether a message may be sent: words left after the trimming, and no more than the server takes. */
export const sendable = (text: string) => {
  const characters = charactersOf(text)
  return characters > 0 && characters <= MESSAGE_MAX_CHARS
}

/**
 * What the form sends (adminCreateSupportTicketMessage): its tab says message or note, its button
 * whether the answer closes the request -- a note closes nothing --, its box the resubmission (K4):
 * an ISO moment, null to take it away, or undefined where the box was not touched -- then nothing
 * is sent of it, and the request keeps what it has.
 */
export const answerVariables = (
  supportTicketId: number,
  text: string,
  {
    note,
    close,
    resubmissionAt,
  }: { note: boolean; close: boolean; resubmissionAt: string | null | undefined },
) => ({
  supportTicketId,
  message: text,
  type: note ? 'MODERATOR' : 'DIALOG',
  close: !note && close,
  resubmissionAt,
})

/**
 * The moment a request waits for (K4), where it is still to come; one that is due waits no more:
 * the request stands in the list again, and the form's box opens empty.
 */
export const waitingUntil = (
  { resubmissionAt }: Pick<ListedSupportTicket, 'resubmissionAt'>,
  now = new Date(),
) => {
  const moment = resubmissionAt === null ? null : new Date(resubmissionAt)
  return moment && moment > now ? moment : null
}

/**
 * A refusal of the server in the moderator's words: out of reach (missing, outside the groups,
 * deleted, the own request), a thread full of the kind sent -- messages, notes, or the lines of
 * handing it on (K4) --, a group that does not exist, or anything else.
 */
export const refusalWords = (
  messages: string[],
  full: 'support.messagesReached' | 'support.notesReached' | 'support.reassignedReached',
) => {
  if (messages.includes('SUPPORT_TICKET_NOT_FOUND')) {
    return t('support.notFound')
  }
  if (messages.includes('SUPPORT_TICKET_MESSAGES_REACHED')) {
    return t(full, { max: SUPPORT_TICKET_MESSAGES_MAX })
  }
  if (messages.includes('SUPPORT_TICKET_UNKNOWN_GROUP')) {
    return t('support.unknownGroup')
  }
  return t('support.failed')
}

/**
 * The line a handing on left in the thread (K4), as the moderation reads it: from which group to
 * which, "(ohne Gruppe)" for none. The server writes it as two lines; null where it is not that.
 */
export const reassignedFromTo = (message: string) => {
  const lines = message.split('\n')
  if (lines.length !== 2) {
    return null
  }
  const [from, to] = lines.map((line) => line || t('contribution.noGroup'))
  return t('support.reassignedFromTo', { from, to })
}

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

/**
 * The choices of the support's group filter (K4): the creation page's, and for a moderator of
 * groups who sees the requests of no group as well "(mit und ohne Gruppe)" before them, the one
 * value that shows all they see -- the creation page has none for them and begins with their
 * groups alone. The first choice is the one the page opens with: all a moderator sees, as the
 * badges count it. The server keeps to the scope whatever is chosen.
 */
export const supportGroupFilterOptions = (
  moderator: Pick<Moderator, 'seesAllCreationGroups' | 'visibleCreationGroups' | 'seesUntagged'>,
  groups: Parameters<typeof groupFilterOptions>[1],
): Option[] => {
  const options = groupFilterOptions(moderator, groups)
  return !moderator.seesAllCreationGroups &&
    moderator.seesUntagged &&
    moderator.visibleCreationGroups.length > 0
    ? [{ value: '', text: t('creationGroupFilter.all') }, ...options]
    : options
}

/**
 * What the magnifier of a row searches for: the member's address, as on the creation page, and
 * without one their username. Null where there is no member, or nothing to search them by.
 */
export const memberSearchOf = ({ user, userEmail }: ListedSupportTicket) =>
  user ? userEmail || user.alias || null : null
