// AI-GENERATED — not an architecture reference
import type { SupportTicketStatus } from 'database'
import { DomainError } from 'shared'

// Support requests (SUA-001): the rules of the member's side. The bounds of a request and of a
// thread stand in `shared` (SUPPORT_TICKET_*), because the wallet holds a copy of them.

/**
 * How many writes of the support one HTTP request may carry -- createSupportTicket,
 * createSupportTicketMessage and closeSupportTicket counted together: a document may repeat a
 * field under any number of aliases (RequestBudget), and each write is a transaction.
 */
export const SUPPORT_TICKET_WRITES_MAX_PER_REQUEST = 1

/**
 * How many lists and threads of requests one HTTP request may read (listSupportTickets,
 * listSupportTicketMessages counted together). A thread may hold SUPPORT_TICKET_MESSAGES_MAX
 * messages of MESSAGE_MAX_CHARS each; the wallet reads one list or one thread at a time.
 */
export const SUPPORT_TICKET_READS_MAX_PER_REQUEST = 5

/** The longest page of a member's own requests: the wallet's PAGE_SIZE. */
export const SUPPORT_TICKETS_PAGE_SIZE_MAX = 25

/** The window SUPPORT_TICKETS_PER_DAY_MAX counts in: the 24 hours before `now`. */
export const supportTicketsWindowStart = (now: Date): Date =>
  new Date(now.getTime() - 24 * 60 * 60 * 1000)

/** The states from which a member closes their own request ("Erledigt, danke", SUA-010). */
export const MEMBER_CLOSES_FROM: SupportTicketStatus[] = ['OPEN', 'IN_PROGRESS']

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
