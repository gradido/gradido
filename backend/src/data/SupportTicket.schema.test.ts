// AI-GENERATED — not an architecture reference
import { MESSAGE_MAX_CHARS, SUPPORT_TICKET_TEXT_MIN_CHARS } from 'shared'
import * as v from 'valibot'
import {
  supportTicketMessageSchema,
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
