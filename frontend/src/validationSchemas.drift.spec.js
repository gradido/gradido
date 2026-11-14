// AI-GENERATED — not an architecture reference

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  MESSAGE_MAX_CHARS,
  message,
  SUPPORT_TICKET_MESSAGES_MAX,
  SUPPORT_TICKET_TEXT_MIN_CHARS,
  SUPPORT_TICKETS_PER_DAY_MAX,
  supportTicketText,
} from './validationSchemas'

// How long a chat message may be exists twice: in `shared`, where the server takes it from, and
// here, where the compose bar's field stops and words kept for later are cut. The wallet does
// not depend on `shared`.
//
// What drift costs: a wallet that stops lower cuts a text short that the server would have
// taken; one that stops higher lets a member write what the server then refuses -- with no more
// words than "not sent".
//
// ⚠️ Read as text, not imported: shared/src/const/index.ts loads `shared-native`, a native
// binding, with its first line. And `fileURLToPath`, not `new URL(...)`: jsdom brings its own
// `URL` class, and node turns an instance of it away as coming from another realm.
const sharedConst = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'shared', 'src', 'const', 'index.ts'),
  'utf8',
)

const inShared = (name) =>
  (sharedConst.match(new RegExp(`^export const ${name} = (\\d+)$`, 'm')) ?? [])[1]

describe('the length of a chat message, on both sides', () => {
  it('is the same number here and in shared', () => {
    const max = inShared('MESSAGE_MAX_CHARS')

    // The fixture has to prove itself: no match would compare a number with nothing.
    expect(max).toBeDefined()
    expect(MESSAGE_MAX_CHARS).toBe(Number(max))
  })

  it('is what the wallet holds a message to, the shortest and the longest', () => {
    const min = Number(inShared('MESSAGE_MIN_CHARS'))
    const max = Number(inShared('MESSAGE_MAX_CHARS'))

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
  it('are the same numbers here and in shared', () => {
    const inSharedNumbers = [
      'SUPPORT_TICKET_TEXT_MIN_CHARS',
      'SUPPORT_TICKETS_PER_DAY_MAX',
      'SUPPORT_TICKET_MESSAGES_MAX',
    ].map((name) => Number(inShared(name)))

    expect(inSharedNumbers.every((number) => number > 0)).toBe(true)
    expect([
      SUPPORT_TICKET_TEXT_MIN_CHARS,
      SUPPORT_TICKETS_PER_DAY_MAX,
      SUPPORT_TICKET_MESSAGES_MAX,
    ]).toEqual(inSharedNumbers)
  })

  it('hold a request to its shortest and longest, without the blanks around it', () => {
    const min = Number(inShared('SUPPORT_TICKET_TEXT_MIN_CHARS'))
    const max = Number(inShared('MESSAGE_MAX_CHARS'))

    expect(supportTicketText.isValidSync('x'.repeat(min))).toBe(true)
    expect(supportTicketText.isValidSync('x'.repeat(min - 1))).toBe(false)
    expect(supportTicketText.isValidSync(`  ${'x'.repeat(min - 1)}  `)).toBe(false)
    expect(supportTicketText.isValidSync('x'.repeat(max))).toBe(true)
    expect(supportTicketText.isValidSync('x'.repeat(max + 1))).toBe(false)
  })
})
