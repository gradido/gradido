// AI-GENERATED — not an architecture reference
import { SUPPORT_TICKET_MESSAGES_MAX, SUPPORT_TICKETS_PER_DAY_MAX } from '@/validationSchemas'

type Translate = (key: string, values?: Record<string, unknown>) => string

/**
 * What the member reads where the server refused a write of the support: the server answers
 * with a code (SupportTicket.logic.ts), the words are the wallet's. Another member's request
 * and one that is gone answer alike on the server; here both read as changed in the meantime.
 */
export const supportTicketRefusal = (t: Translate, error: unknown): string => {
  const message = String((error as Error | null)?.message ?? '')
  if (message.includes('SUPPORT_TICKETS_PER_DAY_REACHED')) {
    return t('support.perDayReached', { max: SUPPORT_TICKETS_PER_DAY_MAX })
  }
  if (message.includes('SUPPORT_TICKET_MESSAGES_REACHED')) {
    return t('support.messagesReached', { max: SUPPORT_TICKET_MESSAGES_MAX })
  }
  if (message.includes('SUPPORT_TICKET_NOT_FOUND')) {
    return t('support.changed')
  }
  return t('support.failed')
}
