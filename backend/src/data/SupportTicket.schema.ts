// AI-GENERATED — not an architecture reference
import { SupportTicketStatus } from 'database'
import {
  MESSAGE_MAX_CHARS,
  MESSAGE_MIN_CHARS,
  positiveIntegerSchema,
  SUPPORT_TICKET_TEXT_MIN_CHARS,
} from 'shared'
import * as v from 'valibot'
import { SUPPORT_TICKETS_PAGE_SIZE_MAX } from './SupportTicket.logic'

// Counted by code points, as the chat counts (core/src/crossCommunity/schema.ts): a pair of
// surrogates is one character.
const characters = (text: string): number => Array.from(text).length

// ⛔ The messages quote nothing of what was sent: a message can end up in the error log.

/** The words of a request (SUA-015, SUA-020), without the blanks around them. */
export const supportTicketTextSchema = v.pipe(
  v.string(),
  v.trim(),
  v.check(
    (text) =>
      characters(text) >= SUPPORT_TICKET_TEXT_MIN_CHARS && characters(text) <= MESSAGE_MAX_CHARS,
    'Support request: the text is too short or too long',
  ),
)

/** A message in the thread of a request, the bounds of a chat message (SUA-020). */
export const supportTicketMessageSchema = v.pipe(
  v.string(),
  v.trim(),
  v.check(
    (message) =>
      characters(message) >= MESSAGE_MIN_CHARS && characters(message) <= MESSAGE_MAX_CHARS,
    'Support request: the message is too short or too long',
  ),
)

/** A page of the member's own requests. */
export const supportTicketsPageSchema = v.object({
  currentPage: positiveIntegerSchema,
  pageSize: v.pipe(positiveIntegerSchema, v.maxValue(SUPPORT_TICKETS_PAGE_SIZE_MAX)),
})

/** A page of the moderation's list: the states of a tab -- never none -- and the page. */
export const adminSupportTicketsPageSchema = v.object({
  statuses: v.pipe(v.array(v.enum(SupportTicketStatus)), v.nonEmpty()),
  ...supportTicketsPageSchema.entries,
})
