// AI-GENERATED — not an architecture reference

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * ⛔ A member is named by a PAIR: `users` is unique on (gradido_id, community_uuid), and
 * every query that asks about one asks about both. The wallet asks about ITSELF too -- its
 * own picture at full size is fetched exactly the way anybody else's is -- so the pair has
 * to arrive at login and stay in the store.
 *
 * With the uuid missing the server reads it as `IS NULL`, which matches nobody who
 * registered normally: no error, no empty answer to notice, just a picture that never
 * arrives. That is how the member's own zoom shipped half-working on 12.09.2026, and this
 * holds the two documents against the rule rather than against a screen.
 */
const here = dirname(fileURLToPath(import.meta.url))
const read = (relativePath) => readFileSync(resolve(here, relativePath), 'utf8')

const documentOf = (source, name) =>
  source.match(new RegExp(`export const ${name} = gql\`([\\s\\S]*?)\``))[1]

describe('what login hands the store about the member themselves', () => {
  it.each([
    ['the login mutation', () => documentOf(read('./mutations.js'), 'login')],
    ['the verifyLogin query', () => documentOf(read('./queries.js'), 'verifyLogin')],
  ])('%s asks for both halves of the pair', (_, load) => {
    const document = load()

    // The search proves itself: this is the document that carries the member.
    expect(document).toContain('alias')
    expect(document).toContain('gradidoID')
    expect(document).toContain('communityUuid')
  })
})
