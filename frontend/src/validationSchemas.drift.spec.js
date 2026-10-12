// AI-GENERATED — not an architecture reference

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { MESSAGE_MAX_CHARS, message } from './validationSchemas'

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
