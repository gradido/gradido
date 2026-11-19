// AI-GENERATED — not an architecture reference

import { describe, expect, it } from 'vitest'
import { MESSAGE_MAX_CHARS, MESSAGE_MIN_CHARS, SUPPORT_TICKET_TEXT_MIN_CHARS } from 'shared/browser'
import { message, supportTicketText } from './validationSchemas'

// The wallet's rules for a message and for a support request stop where the server's bounds
// are: counted as the server counts, at the numbers of `shared`.

describe('the length of a chat message, on both sides', () => {
  it('is what the wallet holds a message to, the shortest and the longest', () => {
    const min = MESSAGE_MIN_CHARS
    const max = MESSAGE_MAX_CHARS

    expect(min).toBeGreaterThan(0)
    expect(message.isValidSync('x'.repeat(min))).toBe(true)
    expect(message.isValidSync('x'.repeat(min - 1))).toBe(false)
    expect(message.isValidSync('x'.repeat(max))).toBe(true)
    expect(message.isValidSync('x'.repeat(max + 1))).toBe(false)
  })
})

// The bounds of a support request: the server refuses at them, the wallet stops there and words
// the refusal with the same numbers.
describe('the bounds of a support request, on both sides', () => {
  it('hold a request to its shortest and longest, without the blanks around it', () => {
    const min = SUPPORT_TICKET_TEXT_MIN_CHARS
    const max = MESSAGE_MAX_CHARS

    expect(supportTicketText.isValidSync('x'.repeat(min))).toBe(true)
    expect(supportTicketText.isValidSync('x'.repeat(min - 1))).toBe(false)
    // what ValidatedInput reads from the rules: `min` and `max`, each with its number
    const tests = supportTicketText.describe().tests
    expect(tests.find((test) => test.name === 'min').params.min).toBe(min)
    expect(tests.find((test) => test.name === 'max').params.max).toBe(max)
    // counted as the server counts: a flower is one character, not two UTF-16 units
    expect(supportTicketText.isValidSync('🌸'.repeat(min))).toBe(true)
    expect(supportTicketText.isValidSync('🌸'.repeat(min - 1))).toBe(false)
    expect(supportTicketText.isValidSync(`  ${'x'.repeat(min - 1)}  `)).toBe(false)
    expect(supportTicketText.isValidSync('x'.repeat(max))).toBe(true)
    expect(supportTicketText.isValidSync('x'.repeat(max + 1))).toBe(false)
  })
})
