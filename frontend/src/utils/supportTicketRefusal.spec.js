// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'vitest'
import { supportTicketRefusal } from './supportTicketRefusal'

const t = (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key)
const refused = (code) => supportTicketRefusal(t, new Error(code))

describe('supportTicketRefusal', () => {
  it('words the limit of requests in a day with its number', () => {
    expect(refused('SUPPORT_TICKETS_PER_DAY_REACHED')).toBe('support.perDayReached {"max":10}')
  })

  it('words the limit of messages in a thread with its number', () => {
    expect(refused('SUPPORT_TICKET_MESSAGES_REACHED')).toBe('support.messagesReached {"max":100}')
  })

  it('reads a request that is gone, or not open any more, as changed in the meantime', () => {
    expect(refused('SUPPORT_TICKET_NOT_FOUND')).toBe('support.changed')
  })

  it('says only that it did not work, where the server says anything else', () => {
    expect(refused('SUPPORT_TICKET_NOT_STORED')).toBe('support.failed')
    expect(supportTicketRefusal(t, undefined)).toBe('support.failed')
  })
})
