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
 *
 * ⚠️ The one named exception: supportTicketsMenu (K5) counts in neither budget. It rides in the
 * chat's beat, and a count here would keep the chat's answer out of the log; it carries two
 * numbers and a truth value, no words, and the cap of root fields bounds its aliases.
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
 * A member with a role as the mail about a new request reads them (K5, SUA-018, SUA-024): whether
 * they may handle requests at all -- the right MANAGE_SUPPORT_TICKETS of their role row, which an
 * administrator always holds and a moderator with the tick of K6 (SUA-025, roleOfHolder) --,
 * whether their role is ADMIN, whether they switched the support off for themself ("Meine Gruppen",
 * MG5; only an administrator can), and their scope as describeModeratorCreationGroups reads it.
 */
export interface SupportTicketMailCandidate {
  id: number
  handlesSupportTickets: boolean
  isAdmin: boolean
  supportOff: boolean
  tags: string[]
  seesAllCreationGroups: boolean
  seesUntagged: boolean
}

/** The most moderators one request mails (SUA-018, point 3). */
export const SUPPORT_TICKET_MAIL_RECIPIENTS_MAX = 20

/** A scope's tag against a request's group, ignoring case and accents as the column's collation does. */
const sameTag = (a: string, b: string): boolean =>
  a.localeCompare(b, undefined, { sensitivity: 'base' }) === 0

/**
 * Who hears of a request by mail -- a new one, or one handed on to `groupTag` (null: no group): a
 * staircase (SUA-027), each step among those who find the request in their list
 * (supportTicketsInScope). First the moderators its group is assigned to (for one without a group:
 * those with "no group"); only where none is left, the moderators who see everything; only where
 * none of them is left either, the administrators, whatever their scope says. Each step by their
 * number, at most SUPPORT_TICKET_MAIL_RECIPIENTS_MAX. Who may not handle requests gets nothing, and
 * neither does anybody in `notFor` -- the asking member, who handed on: they fall out first, so the
 * request of a group's only moderator still reaches somebody. Of the administrators the ones who
 * switched the support off ("Meine Gruppen", MG5) are left out -- but where all of them did, all are
 * mailed all the same: a request reaches somebody (Bernd, 22.11.2026).
 */
export const supportTicketMailRecipients = <T extends SupportTicketMailCandidate>(
  candidates: T[],
  groupTag: string | null,
  notFor: number[],
): T[] => {
  const left = candidates
    .filter(({ id, handlesSupportTickets }) => handlesSupportTickets && !notFor.includes(id))
    .sort((a, b) => a.id - b.id)
  const assigned = left.filter(
    ({ isAdmin, seesAllCreationGroups, tags, seesUntagged }) =>
      !isAdmin &&
      !seesAllCreationGroups &&
      (groupTag === null ? seesUntagged : tags.some((tag) => sameTag(tag, groupTag))),
  )
  const seeEverything = left.filter(
    ({ isAdmin, seesAllCreationGroups }) => !isAdmin && seesAllCreationGroups,
  )
  const administrators = left.filter(({ isAdmin }) => isAdmin)
  const administratorsOn = administrators.filter(({ supportOff }) => !supportOff)
  const step =
    [assigned, seeEverything, administratorsOn, administrators].find((each) => each.length > 0) ??
    []
  return step.slice(0, SUPPORT_TICKET_MAIL_RECIPIENTS_MAX)
}

/**
 * A request's group as the mail to the moderation names it (K5): by its name, without one by
 * `#tag`, as everywhere in the admin; null for no group.
 */
export const supportTicketGroupName = (
  group: { tag: string; name: string | null } | null,
): string | null => (group ? group.name || `#${group.tag}` : null)

/** How many requests within an hour start mails to the moderation (SUA-024, point 7). */
export const SUPPORT_TICKET_MAILED_PER_HOUR_MAX = 20
const SUPPORT_TICKET_MAIL_HOUR_MS = 60 * 60 * 1000

/**
 * Whether a request at `now` may start mails, given when the earlier ones did (milliseconds):
 * under SUPPORT_TICKET_MAILED_PER_HOUR_MAX in the hour before. Answers the moments that still
 * count, `now` among them where it may.
 */
export const supportTicketMailsAllowed = (
  mailedAt: number[],
  now: number,
): { allowed: boolean; mailedAt: number[] } => {
  const recent = mailedAt.filter((at) => at > now - SUPPORT_TICKET_MAIL_HOUR_MS)
  return recent.length < SUPPORT_TICKET_MAILED_PER_HOUR_MAX
    ? { allowed: true, mailedAt: [...recent, now] }
    : { allowed: false, mailedAt: recent }
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
// New requests are switched off in this community (K5, SUA-019); what runs, runs on.
export const SUPPORT_TICKETS_OFF = 'SUPPORT_TICKETS_OFF'
// The tick "may handle support requests" is a moderator's (K6): the member holds no moderator role,
// or no longer -- the admin words it in the reader's language.
export const SUPPORT_DUTY_NOT_A_MODERATOR = 'SUPPORT_DUTY_NOT_A_MODERATOR'

/** A write in a thread that was not done, by its code. */
export class SupportTicketRefused extends DomainError {
  constructor(
    public readonly code: typeof SUPPORT_TICKET_NOT_FOUND | typeof SUPPORT_TICKET_MESSAGES_REACHED,
  ) {
    super(code)
  }
}
