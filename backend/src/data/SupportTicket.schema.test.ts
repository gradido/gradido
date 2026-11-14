// AI-GENERATED — not an architecture reference
import { MESSAGE_MAX_CHARS, SUPPORT_TICKET_TEXT_MIN_CHARS } from 'shared'
import * as v from 'valibot'
import {
  adminSupportTicketsPageSchema,
  supportTicketMessageSchema,
  supportTicketResubmissionSchema,
  supportTicketsPageSchema,
  supportTicketTextSchema,
} from './SupportTicket.schema'

const text = (input: unknown) => v.safeParse(supportTicketTextSchema, input)
const message = (input: unknown) => v.safeParse(supportTicketMessageSchema, input)
// A sign of two code points: one character, two units of UTF-16.
const BLOSSOM = '🌸'

describe('supportTicketTextSchema', () => {
  it('takes the words of a request, without the blanks around them', () => {
    expect(text('  Wie schöpfe ich?\n')).toMatchObject({
      success: true,
      output: 'Wie schöpfe ich?',
    })
  })

  it('takes as few and as many characters as the bounds say, no fewer, no more', () => {
    expect(text('x'.repeat(SUPPORT_TICKET_TEXT_MIN_CHARS)).success).toBe(true)
    expect(text('x'.repeat(SUPPORT_TICKET_TEXT_MIN_CHARS - 1)).success).toBe(false)
    expect(text('x'.repeat(MESSAGE_MAX_CHARS)).success).toBe(true)
    expect(text('x'.repeat(MESSAGE_MAX_CHARS + 1)).success).toBe(false)
  })

  it('counts the blanks around the words out', () => {
    expect(text(`  ${'x'.repeat(SUPPORT_TICKET_TEXT_MIN_CHARS - 1)}  `).success).toBe(false)
  })

  it('counts a sign of two code points as one character, as the chat does', () => {
    expect(text(BLOSSOM.repeat(MESSAGE_MAX_CHARS)).success).toBe(true)
    expect(text(BLOSSOM.repeat(MESSAGE_MAX_CHARS + 1)).success).toBe(false)
  })

  it('quotes nothing of the words in its message', () => {
    const refused = text('Ramo')
    expect(refused.success).toBe(false)
    expect(JSON.stringify(refused.issues?.map((issue) => issue.message))).not.toContain('Ramo')
  })
})

describe('supportTicketMessageSchema', () => {
  it('takes a short answer, and nothing that is only blanks', () => {
    expect(message('Ja')).toMatchObject({ success: true, output: 'Ja' })
    expect(message('   ').success).toBe(false)
  })

  it('takes as many characters as a chat message, no more', () => {
    expect(message(BLOSSOM.repeat(MESSAGE_MAX_CHARS)).success).toBe(true)
    expect(message('x'.repeat(MESSAGE_MAX_CHARS + 1)).success).toBe(false)
  })
})

describe('supportTicketsPageSchema', () => {
  it('takes a page from the first on, of at most 25 requests', () => {
    expect(v.safeParse(supportTicketsPageSchema, { currentPage: 1, pageSize: 25 }).success).toBe(
      true,
    )
    expect(v.safeParse(supportTicketsPageSchema, { currentPage: 0, pageSize: 25 }).success).toBe(
      false,
    )
    expect(v.safeParse(supportTicketsPageSchema, { currentPage: 1, pageSize: 26 }).success).toBe(
      false,
    )
    expect(v.safeParse(supportTicketsPageSchema, { currentPage: 1, pageSize: 0 }).success).toBe(
      false,
    )
  })
})

describe('adminSupportTicketsPageSchema', () => {
  const page = (input: object) =>
    v.safeParse(adminSupportTicketsPageSchema, {
      currentPage: 1,
      pageSize: 25,
      query: '',
      creationGroup: '',
      hideResubmission: false,
      ...input,
    }).success

  it('takes the states of a tab, one or more', () => {
    expect(page({ statuses: ['CLOSED'] })).toBe(true)
    expect(page({ statuses: ['OPEN', 'IN_PROGRESS'] })).toBe(true)
  })

  it('refuses no state at all and a state that does not exist', () => {
    expect(page({ statuses: [] })).toBe(false)
    expect(page({ statuses: ['PENDING'] })).toBe(false)
  })

  it('takes the page as the member side does', () => {
    expect(page({ statuses: ['OPEN'], pageSize: 26 })).toBe(false)
    expect(page({ statuses: ['OPEN'], currentPage: 0 })).toBe(false)
  })

  it('takes a search and a group filter, empty ones too, and nothing that is no text', () => {
    expect(page({ statuses: ['OPEN'], query: 'bibi garten', creationGroup: '*grouped' })).toBe(true)
    expect(page({ statuses: ['OPEN'], query: 5 })).toBe(false)
    expect(page({ statuses: ['OPEN'], creationGroup: null })).toBe(false)
  })
})

describe('supportTicketResubmissionSchema', () => {
  const read = (input: unknown) => v.safeParse(supportTicketResubmissionSchema, input)

  it('takes a moment as the form sends it, and none', () => {
    expect(read('2026-11-20T08:00:00.000Z')).toMatchObject({
      success: true,
      output: new Date('2026-11-20T08:00:00.000Z'),
    })
    expect(read(null)).toMatchObject({ success: true, output: null })
    expect(read(undefined)).toMatchObject({ success: true, output: null })
  })

  it('takes a moment in the past: it hides nothing', () => {
    expect(read('2020-01-01T00:00:00.000Z').success).toBe(true)
  })

  it('takes no day that rolls over, no time read in the server zone, and no text', () => {
    expect(read('2026-02-30T08:00:00.000Z').success).toBe(false)
    expect(read('2026-11-20 08:00')).toMatchObject({ success: false })
    expect(read('2026-11-20T08:00:00Z').success).toBe(false)
    expect(read('Fri Nov 20 2026 09:00:00 GMT+0100').success).toBe(false)
    expect(read('soon').success).toBe(false)
  })
})
