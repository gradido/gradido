// AI-GENERATED — not an architecture reference
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CHAT_NOTIFY_EMAIL, CHAT_NOTIFY_NONE, chatNotifyFor } from './chatNotify'

describe('chatNotifyFor', () => {
  // E-024: the first message of a pair always goes out as a mail; after it, the sender decides.
  it('asks for a mail for the first message, whatever the box says', () => {
    expect(chatNotifyFor({ first: true, alsoByEmail: false })).toBe('EMAIL')
    expect(chatNotifyFor({ first: true, alsoByEmail: true })).toBe('EMAIL')
  })

  it('asks for a mail after the first only where the box is ticked', () => {
    expect(chatNotifyFor({ first: false, alsoByEmail: true })).toBe('EMAIL')
    expect(chatNotifyFor({ first: false, alsoByEmail: false })).toBe('NONE')
  })
})

/**
 * ⛔ The names travel as the value of a GraphQL enum variable, and nothing on this side can tell
 * whether they are right: every spec that sends a message stands in for the server. A name the
 * schema does not have is turned away before any resolver runs. The schema's names are the KEYS
 * of `ChatMessageNotify` in the database package (the backend registers that object as the
 * enum), so this reads them there -- as text, since importing the schema file would pull the
 * whole ORM into the wallet's tests.
 *
 * ⚠️ `fileURLToPath`, not `new URL(...)`: jsdom brings its own `URL` class, and node turns an
 * instance of it away as coming from another realm.
 */
describe('the names, against the server', () => {
  const schema = readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      '../../../database/src/schemas/drizzle.schema.ts',
    ),
    'utf8',
  )
  const declared = schema.match(/export const ChatMessageNotify = \{([^}]*)\}/)?.[1] ?? ''
  const names = [...declared.matchAll(/([A-Z_]+)\s*:/g)].map((m) => m[1])

  it('reads the enum where the backend takes it from', () => {
    expect(declared, 'ChatMessageNotify moved -- this guard needs rewriting').not.toBe('')
    expect(names.length).toBeGreaterThan(0)
  })

  it('sends exactly the names the server declares', () => {
    expect(names.sort()).toEqual([CHAT_NOTIFY_EMAIL, CHAT_NOTIFY_NONE].sort())
  })
})
