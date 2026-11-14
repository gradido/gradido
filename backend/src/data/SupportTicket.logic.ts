// AI-GENERATED — not an architecture reference
import type { DbUser, SupportTicketMessageType, SupportTicketStatus } from 'database'
import { DomainError } from 'shared'

// Support requests (SUA-001): the rules of the member's side and of the moderation's. The bounds
// of a request and of a thread stand in `shared` (SUPPORT_TICKET_*), because the wallet holds a
// copy of them.

/**
 * How many writes of the support one HTTP request may carry -- createSupportTicket,
 * createSupportTicketMessage, closeSupportTicket, adminCreateSupportTicketMessage,
 * adminCloseSupportTicket, adminDeleteSupportTicket and adminReassignSupportTicket counted
 * together: a document may repeat a field under any number of aliases (RequestBudget), and each
 * write is a transaction or mails.
 */
export const SUPPORT_TICKET_WRITES_MAX_PER_REQUEST = 1

/**
 * How many lists, threads and counts of requests one HTTP request may read (listSupportTickets,
 * listSupportTicketMessages, adminListSupportTickets, adminListSupportTicketMessages,
 * adminCountOpenSupportTickets counted together). A thread may hold SUPPORT_TICKET_MESSAGES_MAX
 * dialog messages of MESSAGE_MAX_CHARS each, and the moderation's thread as many notes besides;
 * the wallet and the admin read one list or one thread at a time.
 */
export const SUPPORT_TICKET_READS_MAX_PER_REQUEST = 5

/** The longest page of requests: the PAGE_SIZE of the wallet's list and of the admin's. */
export const SUPPORT_TICKETS_PAGE_SIZE_MAX = 25

/** The window SUPPORT_TICKETS_PER_DAY_MAX counts in: the 24 hours before `now`. */
export const supportTicketsWindowStart = (now: Date): Date =>
  new Date(now.getTime() - 24 * 60 * 60 * 1000)

/** The states from which a member closes their own request ("Erledigt, danke", SUA-010). */
export const MEMBER_CLOSES_FROM: SupportTicketStatus[] = ['OPEN', 'IN_PROGRESS']

/**
 * The states from which a moderator closes a request with the tick, or deletes it (SUA-010,
 * SUA-018): those of the open tab. A closed one is neither; a deleted one is done.
 */
export const MODERATOR_CLOSES_FROM: SupportTicketStatus[] = ['OPEN', 'IN_PROGRESS']

/**
 * What a moderator's message does to the request (Bauplan G § 5): an answer makes it a question
 * back to the member, an answer that closes it closes it, a note changes nothing.
 */
export type ModeratorMessageKind = 'ANSWER' | 'ANSWER_AND_CLOSE' | 'NOTE'

/**
 * The kind of a moderator's message as the admin's form sends it -- its type, whether it closes
 * the request, and whether it sets a resubmission (K4). Null for a note that would close it -- a
 * note is for the moderation, and closing is done with an answer or with the tick --, and for an
 * answer that would close and wait for a resubmission at once: a closed request waits for nothing.
 */
export const moderatorMessageKind = (
  type: SupportTicketMessageType,
  close: boolean,
  resubmits: boolean,
): ModeratorMessageKind | null => {
  if (type === 'MODERATOR') {
    return close ? null : 'NOTE'
  }
  // the line a handing on leaves is the server's to write, never a moderator's message (K4)
  if (type !== 'DIALOG') {
    return null
  }
  if (close) {
    return resubmits ? null : 'ANSWER_AND_CLOSE'
  }
  return 'ANSWER'
}

/**
 * The words of the line a handing on leaves in the thread (K4, SUA-018): the group the request
 * came from and the one it went to, a line each, as they are named at that moment -- by their
 * name, without one by `#tag`, as everywhere in the admin and the wallet; an empty line for no
 * group. Two lines of text, no markup: a wallet loaded before the line existed shows it as words.
 * A line break inside a name becomes a blank, so that there are always exactly two.
 */
export const reassignedLine = (
  from: { tag: string | null; name: string | null },
  to: { tag: string | null; name: string | null },
): string => {
  const named = ({ tag, name }: { tag: string | null; name: string | null }) =>
    tag === null ? '' : (name || `#${tag}`).replace(/[\r\n]+/g, ' ')
  return `${named(from)}\n${named(to)}`
}

/**
 * Whether the member hears of a moderator's message by mail: an answer does, a note never
 * (SUA-018), and only to an address in force that the member confirmed (SUA-016). Without one --
 * an account gone, no address in force -- there is nobody to mail.
 */
export const supportAnswerMailDecision = (
  kind: ModeratorMessageKind,
  member: Pick<DbUser, 'emailContact'> | null,
): 'MAIL' | 'NOTE' | 'NO_MEMBER' | 'NOT_CONFIRMED' => {
  if (kind === 'NOTE') {
    return 'NOTE'
  }
  if (!member) {
    return 'NO_MEMBER'
  }
  return member.emailContact.emailChecked ? 'MAIL' : 'NOT_CONFIRMED'
}

/**
 * When and by whom a request was closed, as the moderation's list shows it (SUA-008): a deleted
 * one by when and by whom it was deleted, as for contributions; an open one by nobody, whatever
 * an earlier closing left in its row.
 */
export const closingOf = (ticket: {
  status: SupportTicketStatus
  closedAt: Date | null
  closedBy: number | null
  deletedAt: Date | null
  deletedBy: number | null
}): { at: Date | null; by: number | null } => {
  if (ticket.status === 'DELETED') {
    return { at: ticket.deletedAt, by: ticket.deletedBy }
  }
  if (ticket.status === 'CLOSED') {
    return { at: ticket.closedAt, by: ticket.closedBy }
  }
  return { at: null, by: null }
}

// The expected failures, as codes: the wallet words them in the reader's language.
export const SUPPORT_TICKET_INVALID = 'SUPPORT_TICKET_INVALID'
export const SUPPORT_TICKET_UNKNOWN_GROUP = 'SUPPORT_TICKET_UNKNOWN_GROUP'
export const SUPPORT_TICKETS_PER_DAY_REACHED = 'SUPPORT_TICKETS_PER_DAY_REACHED'
// Another member's request answers as a missing one does, and so does a deleted one.
export const SUPPORT_TICKET_NOT_FOUND = 'SUPPORT_TICKET_NOT_FOUND'
export const SUPPORT_TICKET_MESSAGES_REACHED = 'SUPPORT_TICKET_MESSAGES_REACHED'
export const SUPPORT_TICKET_NOT_STORED = 'SUPPORT_TICKET_NOT_STORED'
export const SUPPORT_TICKET_NOT_READ = 'SUPPORT_TICKET_NOT_READ'

/** A write in a thread that was not done, by its code. */
export class SupportTicketRefused extends DomainError {
  constructor(
    public readonly code: typeof SUPPORT_TICKET_NOT_FOUND | typeof SUPPORT_TICKET_MESSAGES_REACHED,
  ) {
    super(code)
  }
}
