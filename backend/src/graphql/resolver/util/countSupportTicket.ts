// AI-GENERATED — not an architecture reference
import {
  SUPPORT_TICKET_READS_MAX_PER_REQUEST,
  SUPPORT_TICKET_WRITES_MAX_PER_REQUEST,
} from '@/data/SupportTicket.logic'
import { Context } from '@/server/context'
import { LogError } from '@/server/LogError'

// ⛔ Each counts in the HTTP request's budget: a document may repeat a field under any number of
// aliases (RequestBudget). Either count also keeps the answer of the request out of the log
// (plugins.ts): it carries the words of a member's request or of its thread.

/** Counts a list or a thread of requests read. */
export const countSupportTicketRead = (context: Context): void => {
  context.requestBudget.supportTicketReadsServed += 1
  const served = context.requestBudget.supportTicketReadsServed
  if (served > SUPPORT_TICKET_READS_MAX_PER_REQUEST) {
    throw new LogError('Too many support requests read at once', served)
  }
}

/** Counts a write: a request filed, a message written, a request closed. */
export const countSupportTicketWrite = (context: Context): void => {
  context.requestBudget.supportTicketWritesServed += 1
  const served = context.requestBudget.supportTicketWritesServed
  if (served > SUPPORT_TICKET_WRITES_MAX_PER_REQUEST) {
    throw new LogError('Too many support writes at once', served)
  }
}
